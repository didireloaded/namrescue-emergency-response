const fields = "id, latitude, longitude, status, requested_at, assigned_at, departed_at, arrived_at";
const reply = (data, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const reject = (error, status) => reply({ error }, status);
const commands = {
  assign: ["requested", "assigned", "assigned_at"],
  depart: ["assigned", "en_route", "departed_at"],
  arrive: ["en_route", "arrived", "arrived_at"],
};

export async function controlCenterApi(request, db) {
  if (!db) return reject("The control center is temporarily unavailable.", 503);
  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  if (!["citizen", "driver", "control"].includes(view)) return reject("Unknown workspace.", 400);

  // The owner-private Sites gate protects the workspace. The views are for
  // exercising all three roles under that account, not staff authorization.
  let key;
  if (view === "citizen") {
    const token = request.headers.get("Authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!token) return reject("Request access is missing.", 401);
    const bytes = new TextEncoder().encode(token);
    key = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  const mine = () => db.prepare(`SELECT ${fields} FROM ambulance_request WHERE citizen_key = ?`).bind(key).first();

  if (request.method === "GET") {
    if (view === "citizen") return reply({ requests: [await mine()].filter(Boolean) });
    const query = view === "driver"
      ? `SELECT ${fields} FROM ambulance_request WHERE status IN ('assigned', 'en_route') LIMIT 1`
      : `SELECT ${fields} FROM ambulance_request
        ORDER BY CASE status WHEN 'en_route' THEN 0 WHEN 'assigned' THEN 1 WHEN 'requested' THEN 2 ELSE 3 END,
          CASE WHEN status <> 'arrived' THEN requested_at END,
          requested_at DESC LIMIT 100`;
    return reply({ requests: (await db.prepare(query).all()).results });
  }
  if (request.method !== "POST") return reject("Unsupported method.", 405);
  if (request.headers.get("Origin") !== url.origin) return reject("Open CareNear to send this request.", 403);
  const raw = await request.text();
  if (raw.length > 512) return reject("Invalid request.", 400);
  let body;
  try { body = JSON.parse(raw); } catch { return reject("Invalid request.", 400); }
  if (!body || typeof body.action !== "string") return reject("Invalid request.", 400);

  if (view === "citizen" && body.action === "request") {
    const { latitude, longitude } = body;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180)
      return reject("Choose a pickup location.", 400);
    await db.prepare(`INSERT INTO ambulance_request
      (id, citizen_key, latitude, longitude, status, requested_at) VALUES (?, ?, ?, ?, 'requested', ?)
      ON CONFLICT(citizen_key) DO NOTHING`)
      .bind(crypto.randomUUID(), key, latitude, longitude, Date.now()).run();
    return reply({ requests: [await mine()] });
  }
  if (!Object.hasOwn(commands, body.action) ||
    (body.action === "assign" ? view !== "control" : view !== "driver"))
    return reject("This action is unavailable in this workspace.", 403);
  if (typeof body.id !== "string" || !/^[a-f0-9-]{36}$/.test(body.id))
    return reject("Invalid request reference.", 400);
  const [before, after, timestamp] = commands[body.action];
  const vacancy = body.action === "assign"
    ? "AND NOT EXISTS (SELECT 1 FROM ambulance_request WHERE status IN ('assigned', 'en_route'))"
    : "";
  const result = await db.prepare(`UPDATE ambulance_request SET status = ?, ${timestamp} = ?
    WHERE id = ? AND status = ? ${vacancy} RETURNING ${fields}`)
    .bind(after, Date.now(), body.id, before).first();
  if (result) return reply({ request: result });
  const current = await db.prepare(`SELECT ${fields} FROM ambulance_request WHERE id = ?`).bind(body.id).first();
  if (current && current.status === after) return reply({ request: current });
  return reject("The request or unit status changed. Check the queue and try again.", 409);
}
