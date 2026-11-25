const minute = 60_000;
const offerDuration = 2 * minute;
const transitions = {
  accept: ["offered", "accepted"],
  decline: ["offered", "declined"],
  depart: ["accepted", "enRoute"],
  arrive: ["enRoute", "atScene"],
  transport: ["atScene", "transporting"],
  hospital: ["transporting", "atHospital"],
  complete: ["atHospital", "completed"],
};

const reply = (data, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const error = (message, status) => reply({ error: message }, status);
const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const digest = async (key) =>
  hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key))));

function snapshot(row, citizen) {
  return reply({
    id: row.id,
    code: citizen && !row.driver_key && row.invite_until > Date.now() ? row.code : null,
    paired: Boolean(row.driver_key),
    status: row.status,
    version: row.version,
    events: JSON.parse(row.events),
  });
}

export async function trainingApi(request, db) {
  if (!db) return error("Shared training storage is unavailable.", 503);
  if (!["GET", "POST"].includes(request.method)) return error("Unsupported method.", 405);
  const token = request.headers.get("Authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return error("A training session key is required.", 401);

  const now = Date.now();
  const key = await digest(token);
  let command;
  if (request.method === "POST") {
    if (request.headers.get("Origin") !== new URL(request.url).origin)
      return error("This request must come from CareNear.", 403);
    const body = await request.text();
    if (body.length > 512) return error("Invalid training command.", 400);
    try { command = JSON.parse(body); } catch { return error("Invalid training command.", 400); }
    if (!command || typeof command.action !== "string") return error("Invalid training command.", 400);
  }

  if (command?.action === "create") {
    // Bound retention. The session is fictional and expires independently of cleanup.
    await db.prepare(`DELETE FROM training_drill WHERE id IN
      (SELECT id FROM training_drill WHERE expires_at < ? LIMIT 50)`).bind(now).run();
    const code = hex(crypto.getRandomValues(new Uint8Array(6))).toUpperCase();
    await db.prepare(`INSERT INTO training_drill (id, citizen_key, code, invite_until, expires_at)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(citizen_key) DO NOTHING`)
      .bind(crypto.randomUUID(), key, code, now + 15 * minute, now + 4 * 60 * minute).run();

  }

  if (command?.action === "join") {
    if (typeof command.code !== "string" || !/^[A-F0-9]{12}$/.test(command.code))
      return error("Enter the 12-character pairing code.", 400);
    await db.prepare(`UPDATE training_drill SET driver_key = ?, version = version + 1
      WHERE code = ? AND driver_key IS NULL AND citizen_key <> ? AND invite_until > ?
      AND NOT EXISTS (SELECT 1 FROM training_drill WHERE driver_key = ? OR citizen_key = ?)`)
      .bind(key, command.code, key, now, key, key).run();
  }

  const find = () => db.prepare(`SELECT * FROM training_drill
    WHERE (citizen_key = ? OR driver_key = ?) AND expires_at > ?`).bind(key, key, now).first();
  let row = await find();
  if (!row) return error("The training session or pairing code is invalid or expired.", 404);
  const citizen = row.citizen_key === key;
  if (command?.action === "join" && (citizen || row.code !== command.code))
    return error("This browser is paired to a different training drill.", 409);

  if (row.status === "offered" && row.offer_until <= now) {
    await update(db, row, "expired", now, null);
    row = await find();
  }
  const action = command?.action;
  if (!action || action === "create" || action === "join") return snapshot(row, citizen);

  let next;
  if (action === "request" && citizen && row.status === "setup") next = "waiting";
  if (action === "retry" && citizen && ["declined", "expired"].includes(row.status)) next = "waiting";
  if (action === "offer" && !citizen && row.status === "waiting" && command.ready === true) next = "offered";
  if (!citizen && Object.hasOwn(transitions, action)) {
    const [from, to] = transitions[action];
    if (row.status === from && (action !== "accept" || command.ready === true)) next = to;
  }
  if (!next || row.version !== command.version)
    return error("This action is unavailable. Refresh the training status and try again.", 409);
  const changed = await update(db, row, next, now, next === "offered" ? now + offerDuration : null);
  if (!changed.meta.changes) return error("The training status changed. Try again.", 409);
  return snapshot(await find(), citizen);
}

function update(db, row, status, at, offerUntil) {
  return db.prepare(`UPDATE training_drill SET status = ?, offer_until = ?, version = version + 1,
    events = json_insert(events, '$[#]', json(?)) WHERE id = ? AND version = ?`)
    .bind(status, offerUntil, JSON.stringify({ status, at }), row.id, row.version).run();
}
