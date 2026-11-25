import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { trainingApi } from "./training-api.mjs";

const origin = "https://training.example";
const migration = readFileSync(new URL("../drizzle/0000_shared_training.sql", import.meta.url), "utf8");

function setup() {
  const storage = new DatabaseSync(":memory:");
  storage.exec(migration);
  storage.exec(readFileSync(new URL("../drizzle/0001_staged_dispatch.sql", import.meta.url), "utf8"));
  const db = {
    prepare: (sql) => ({
      bind: (...args) => ({
        first: async () => storage.prepare(sql).get(...args),
        run: async () => ({ meta: storage.prepare(sql).run(...args) }),
      }),
    }),
  };
  async function call(role, action, params = {}, requestOrigin = origin) {
    const method = action ? "POST" : "GET";
    const body = action ? JSON.stringify({ action, ...params }) : undefined;
    const response = await trainingApi(new Request(origin + "/api/training", {
      method, body, headers: { Authorization: "Bearer " + role.repeat(64), Origin: requestOrigin },
    }), db);
    return { status: response.status, ...await response.json() };
  }
  return { call, storage };
}

test("one paired driver advances the Citizen incident with acknowledged stages", async () => {
  const { call, storage } = setup();
  const create = await call("a", "create");
  assert.equal((await call("a", "create")).id, create.id);
  assert.equal((await call("b", "join", { code: create.code })).paired, true);
  assert.equal((await call("c", "join", { code: create.code })).status, 404);
  const request = await call("a", "request", { version: (await call("a")).version });
  assert.equal(request.status, "waiting");
  assert.equal(request.code, null);
  assert.equal((await call("b", "offer", { version: request.version })).status, 409);
  assert.equal((await call("a", "offer", { version: request.version, ready: true })).status, 409);
  const offer = await call("b", "offer", { version: request.version, ready: true });
  const accepts = await Promise.all([
    call("b", "accept", { version: offer.version, ready: true }),
    call("b", "accept", { version: offer.version, ready: true }),
  ]);
  assert.equal(accepts.filter((result) => result.status === "accepted").length, 1);
  assert.equal(accepts.filter((result) => result.status === 409).length, 1);
  for (const [action, status] of [
    ["depart", "enRoute"], ["arrive", "atScene"], ["transport", "transporting"],
    ["hospital", "atHospital"], ["complete", "completed"],
  ]) {
    const current = await call("a");
    assert.equal((await call("b", action, { version: current.version })).status, status);
    assert.equal((await call("a")).status, status);
  }
  assert.equal((await call("a")).events.length, 8);
  storage.close();
});

test("an expired or declined offer returns to waiting only on a Citizen retry", async () => {
  const { call, storage } = setup();
  const create = await call("a", "create");
  const joined = await call("b", "join", { code: create.code });
  const waiting = await call("a", "request", { version: joined.version });
  const offer = await call("b", "offer", { version: waiting.version, ready: true });
  storage.exec("UPDATE training_drill SET offer_until = 0");
  assert.equal((await call("b", "accept", { version: offer.version, ready: true })).status, 409);
  const expired = await call("a");
  assert.equal(expired.status, "expired");
  const retry = await call("a", "retry", { version: expired.version });
  const offeredAgain = await call("b", "offer", { version: retry.version, ready: true });
  assert.equal((await call("b", "decline", { version: offeredAgain.version })).status, "declined");
  assert.equal((await call("a", "retry", { version: offeredAgain.version + 1 }, "https://other.example")).status, 403);
  storage.close();
});

test("staging separates dispatcher authority from the citizen and driver", async () => {
  const { call, storage } = setup();
  const citizen = await call("a", "create", { manualDispatch: true });
  assert.equal(citizen.manualDispatch, true);
  assert.notEqual(citizen.dispatcherCode, citizen.code);
  assert.equal((await call("b", "join", { code: citizen.dispatcherCode })).status, 404);
  const dispatcher = await call("c", "join", { code: citizen.dispatcherCode, role: "dispatcher" });
  assert.equal(dispatcher.dispatcherCode, null);
  const driver = await call("b", "join", { code: citizen.code });
  const waiting = await call("a", "request", { version: driver.version });
  assert.equal((await call("b", "offer", { ready: true, version: waiting.version })).status, 409);
  assert.equal((await call("a", "acknowledge", { version: waiting.version })).status, 409);
  assert.equal((await call("c", "assign", { version: waiting.version })).status, 409);
  const acknowledged = await call("c", "acknowledge", { version: waiting.version });
  assert.equal(acknowledged.status, "acknowledged");
  assert.equal((await call("c", "assign", { version: acknowledged.version })).status, 409);
  assert.equal((await call("b", "availability", { ready: true })).driverReady, true);
  const offer = await call("c", "assign", { version: acknowledged.version });
  assert.equal(offer.status, "offered");
  assert.equal((await call("c", "accept", { version: offer.version, ready: true })).status, 409);
  await call("b", "availability", { ready: false });
  assert.equal((await call("b", "accept", { version: offer.version, ready: true })).status, 409);
  await call("b", "availability", { ready: true });
  const accepted = await call("b", "accept", { version: offer.version, ready: true });
  assert.equal(accepted.status, "accepted");
  assert.deepEqual(accepted.events.map(({ actor }) => actor), ["citizen", "dispatcher", "dispatcher", "driver"]);
  storage.close();
});
