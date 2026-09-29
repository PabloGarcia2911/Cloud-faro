import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api";
import { logouts, resetSession } from "./mocks/session";
beforeEach(() => resetSession());
test("Axios adjunta access token Bearer", async () => {
  const response = await api.get("/products", {
    adapter: async (config) => ({
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: config.headers.Authorization,
    }),
  });
  assert.equal(response.data, "Bearer access-token");
});
test("sin sesión no envía Authorization", async () => {
  resetSession(null);
  const response = await api.get("/public/info", {
    adapter: async (config) => ({
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: config.headers.Authorization,
    }),
  });
  assert.equal(response.data, undefined);
});
test("401 cierra sesión, 403 la conserva", async () => {
  await assert.rejects(
    api.get("/products", {
      adapter: async () => {
        throw { response: { status: 403 } };
      },
    }),
  );
  assert.equal(logouts, 0);
  await assert.rejects(
    api.get("/products", {
      adapter: async () => {
        throw { response: { status: 401 } };
      },
    }),
  );
  assert.equal(logouts, 1);
});
