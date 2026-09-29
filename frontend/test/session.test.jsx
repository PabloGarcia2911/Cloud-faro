import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { state } from "./mocks/cognito";
import {
  login,
  logout,
  currentToken,
  completeNewPassword,
  accessToken,
} from "../src/auth/session";
beforeEach(() => {
  logout();
  state.challenge = false;
  state.refreshes = 0;
  state.token = "access-token";
});
test("SDK guarda credenciales en memoria y logout las limpia", async () => {
  await login("student", "password");
  assert.equal(currentToken(), "access-token");
  state.storage.setItem("test", "value");
  assert.equal(window.localStorage.length, 0);
  logout();
  assert.equal(state.storage.getItem("test"), null);
  assert.equal(currentToken(), null);
});
test("NEW_PASSWORD_REQUIRED se completa antes de autenticar", async () => {
  state.challenge = true;
  assert.deepEqual(await login("student", "temporary"), {
    newPasswordRequired: true,
  });
  assert.equal(currentToken(), null);
  await assert.rejects(completeNewPassword("bad"), /Password policy/);
  await completeNewPassword("valid");
  assert.equal(currentToken(), "access-token");
});
test("sin sesión pendiente no se permite cambiar contraseña", async () => {
  await assert.rejects(completeNewPassword("valid"), /Inicia sesión/);
});
test("renovación concurrente comparte una consulta al SDK", async () => {
  await login("student", "password");
  const values = await Promise.all([accessToken(), accessToken()]);
  assert.deepEqual(values, ["access-token", "access-token"]);
  assert.equal(state.refreshes, 1);
});
