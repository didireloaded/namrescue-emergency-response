import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { controlCenterApi } from "./control-center-api.mjs";

test("the queue assigns one unit and publishes confirmed response stages", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../drizzle/0002_control_center.sql", import.meta.url), "utf8"));
  const statement = (sql, args) => ({
    first: async () => sqlite.prepare(sql).get(...args),
    run: async () => sqlite.prepare(sql).run(...args),
    all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
  });
  const db = { prepare: (sql) => ({ ...statement(sql, []), bind: (...args) => statement(sql, args) }) };
  const origin = "https://carenear.example";
  async function call(view, action, payload = {}, token = "a", from = origin) {
    const response = await controlCenterApi(new Request(origin + "/api/control-center?view=" + view, {
      method: action ? "POST" : "GET",
      ...(action ? { body: JSON.stringify({ action, ...payload }) } : {}),
      headers: { Origin: from, Authorization: "Bearer " + token.repeat(64) },
    }), db);
    return { code: response.status, ...await response.json() };
  }
  const point = { latitude: -22.56, longitude: 17.06 };
  assert.equal((await call("citizen", "request", { ...point, latitude: 100 })).code, 400);
  const a = (await call("citizen", "request", point)).requests[0];
  const b = (await call("citizen", "request", point, "b")).requests[0];
  assert.equal((await call("citizen", "request", point)).requests[0].id, a.id);
  assert.deepEqual((await call("citizen", null, {}, "c")).requests, []);
  assert.equal((await call("control")).requests.length, 2);
  assert.equal((await call("driver", "assign", { id: a.id })).code, 403);
  assert.equal((await call("control", "assign", { id: a.id }, "a", "https://other.example")).code, 403);
  const assignments = await Promise.all([call("control", "assign", { id: a.id }), call("control", "assign", { id: b.id })]);
  const assigned = assignments.find(({ code }) => code === 200).request;
  assert.equal(assignments.filter(({ code }) => code === 409).length, 1);
  const id = assigned.id;
  assert.equal((await call("driver")).requests[0].id, id);
  assert.equal((await call("driver", "arrive", { id })).code, 409);
  assert.equal((await call("driver", "depart", { id })).request.status, "en_route");
  assert.equal((await call("citizen", null, {}, id === a.id ? "a" : "b")).requests[0].status, "en_route");
  assert.equal((await call("driver", "arrive", { id })).request.status, "arrived");
  assert.deepEqual((await call("driver")).requests, []);
  assert.equal((await call("control", "assign", { id: id === a.id ? b.id : a.id })).code, 200);
  sqlite.close();
});
