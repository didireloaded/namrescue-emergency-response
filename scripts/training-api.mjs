const minute = 60_000;
const readyDuration = 15_000;
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

const pairingCode = () => hex(crypto.getRandomValues(new Uint8Array(6))).toUpperCase();

function snapshot(row, role) {
  const now = Date.now();
  const share = role === "citizen" && row.invite_until > now;
  return reply({
    id: row.id,
    code: share && !row.driver_key ? row.code : null,
    dispatcherCode: share && !row.dispatcher_key ? row.dispatcher_code : null,
    manualDispatch: Boolean(row.dispatcher_code),
    dispatcherPaired: Boolean(row.dispatcher_key),
    driverReady: Boolean(row.driver_ready_until > now),
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
    const dispatcherCode = command.manualDispatch === true ? pairingCode() : null;
    await db.prepare(`INSERT INTO training_drill (id, citizen_key, code, invite_until, expires_at, dispatcher_code)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM training_drill WHERE driver_key = ? OR dispatcher_key = ?)
      ON CONFLICT(citizen_key) DO NOTHING`)
      .bind(crypto.randomUUID(), key, pairingCode(), now + 15 * minute, now + 4 * 60 * minute,
        dispatcherCode, key, key).run();
  }

  if (command?.action === "join") {
    if (typeof command.code !== "string" || !/^[A-F0-9]{12}$/.test(command.code))
      return error("Enter the 12-character pairing code.", 400);
    const dispatcher = command.role === "dispatcher";
    const keyColumn = dispatcher ? "dispatcher_key" : "driver_key";
    const codeColumn = dispatcher ? "dispatcher_code" : "code";
    await db.prepare(`UPDATE training_drill SET ${keyColumn} = ?, version = version + 1
      WHERE ${codeColumn} = ? AND ${keyColumn} IS NULL AND invite_until > ? AND expires_at > ?
      AND NOT EXISTS (SELECT 1 FROM training_drill
        WHERE driver_key = ? OR citizen_key = ? OR dispatcher_key = ?)`)
      .bind(key, command.code, now, now, key, key, key).run();
  }

  const find = () => db.prepare(`SELECT * FROM training_drill
    WHERE (citizen_key = ? OR driver_key = ? OR dispatcher_key = ?) AND expires_at > ?`)
    .bind(key, key, key, now).first();
  let row = await find();
  if (!row) return error("The session or pairing code is invalid or expired.", 404);
  const role = row.citizen_key === key ? "citizen" : row.driver_key === key ? "driver" : "dispatcher";
  if (command?.action === "join") {
    const joinRole = command.role === "dispatcher" ? "dispatcher" : "driver";
    if (role !== joinRole || (role === "dispatcher" ? row.dispatcher_code : row.code) !== command.code)
      return error("This browser is paired to a different role or drill.", 409);
  }
  if (command?.action === "create" && role !== "citizen")
    return error("This browser is already paired to a drill.", 409);

  if (row.status === "offered" && row.offer_until <= now) {
    await update(db, row, "expired", now, null, "system");
    row = await find();
  }
  const action = command?.action;
  if (!action || action === "create" || action === "join") return snapshot(row, role);
  const manual = Boolean(row.dispatcher_code);
  if (action === "availability" && role === "driver" && manual) {
    await db.prepare("UPDATE training_drill SET driver_ready_until = ? WHERE id = ?")
      .bind(command.ready === true ? now + readyDuration : null, row.id).run();
    return snapshot(await find(), role);
  }

  let next;
  if (action === "request" && role === "citizen" && row.status === "setup") next = "waiting";
  if (action === "retry" && !manual && role === "citizen" && ["declined", "expired"].includes(row.status)) next = "waiting";
  if (action === "acknowledge" && role === "dispatcher" && row.status === "waiting") next = "acknowledged";
  if (action === "assign" && role === "dispatcher" &&
      ["acknowledged", "declined", "expired"].includes(row.status)) next = "offered";
  if (action === "offer" && !manual && role === "driver" && row.status === "waiting" && command.ready === true)
    next = "offered";
  if (role === "driver" && Object.hasOwn(transitions, action)) {
    const [from, to] = transitions[action];
    if (row.status === from && (action !== "accept" || command.ready === true)) next = to;
  }
  if (!next || row.version !== command.version)
    return error("This action is unavailable. Refresh the training status and try again.", 409);
  const needsReadyUnit = manual && ["assign", "accept"].includes(action);
  const changed = await update(db, row, next, now, next === "offered" ? now + offerDuration : null,
    role, needsReadyUnit);
  if (!changed.meta.changes)
    return error(needsReadyUnit ? "The unit is unavailable or the incident changed." : "The status changed. Try again.", 409);
  return snapshot(await find(), role);
}

function update(db, row, status, at, offerUntil, actor, checkReady = false) {
  return db.prepare(`UPDATE training_drill SET status = ?, offer_until = ?, version = version + 1,
    events = json_insert(events, '$[#]', json(?)) WHERE id = ? AND version = ?
    AND (? = 0 OR driver_ready_until > ?)`)
    .bind(status, offerUntil, JSON.stringify({ status, at, actor }), row.id, row.version, Number(checkReady), at).run();
}
