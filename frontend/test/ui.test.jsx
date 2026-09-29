import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import App from "../src/App";
import ProtectedRoute from "../src/auth/ProtectedRoute";
import { rolesFromToken } from "../src/auth/session";
import { setAuth } from "./mocks/auth-context";
import { api, calls, resetApi } from "./mocks/api";
const jwt = (groups, exp = Date.now() / 1000 + 3600) =>
  `e30.${btoa(JSON.stringify({ "cognito:groups": groups, exp }))}.signature`;
function role(value) {
  setAuth({ token: jwt([value]), roles: [value], logout: () => {} });
}
function show(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
beforeEach(() => {
  resetApi();
  role("ADMIN");
});
afterEach(cleanup);
test("USER no puede abrir el mantenedor por URL", () => {
  role("USER");
  show("/admin/productos");
  assert.ok(screen.getByText("Acceso denegado"));
  assert.equal(screen.queryByText("Guardar producto"), null);
});
test("JWT vencido redirige a login", () => {
  setAuth({ token: jwt(["ADMIN"], 1), roles: [] });
  render(
    <MemoryRouter initialEntries={["/admin/productos"]}>
      <Routes>
        <Route path="/login" element={<p>Login requerido</p>} />
        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route path="/admin/productos" element={<p>Privado</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  assert.ok(screen.getByText("Login requerido"));
});
test("claims inválidos o desconocidos no conceden roles", () => {
  assert.deepEqual(rolesFromToken("bad"), []);
  assert.deepEqual(rolesFromToken(jwt(["OTHER", "EDITOR"])), ["EDITOR"]);
});
test("la aplicación permite volver a ingresar con un token vencido sin bucle de redirección", async () => {
  setAuth({ token: jwt(["ADMIN"], 1), roles: [], logout: () => {} });
  show("/productos");
  await screen.findByText("Entra a tu cuenta");
  assert.ok(screen.getByText("Iniciar sesión"));
});
test("ADMIN crea, edita y elimina usando los contratos reales del backend", async () => {
  show("/admin/productos");
  await screen.findByText(
    "No hay productos. Un administrador puede crear el primero.",
  );
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Cuaderno" },
  });
  fireEvent.change(screen.getByLabelText("Descripción"), {
    target: { value: "Académico" },
  });
  fireEvent.change(screen.getByLabelText("Precio"), {
    target: { value: "1990.50" },
  });
  fireEvent.change(screen.getByLabelText("Stock"), { target: { value: "4" } });
  fireEvent.click(screen.getByText("Guardar producto"));
  await screen.findByRole("heading", { name: "Cuaderno" });
  assert.deepEqual(
    calls.find((c) => c[0] === "POST"),
    [
      "POST",
      "/products",
      { name: "Cuaderno", description: "Académico", price: 1990.5, stock: 4 },
    ],
  );
  fireEvent.click(screen.getByText("Editar"));
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Libro" },
  });
  fireEvent.click(screen.getByText("Guardar producto"));
  await screen.findByRole("heading", { name: "Libro" });
  assert.equal(calls.find((c) => c[0] === "PUT")[1], "/products/1");
  window.confirm = () => true;
  fireEvent.click(screen.getByText("Eliminar"));
  await screen.findByText("Producto eliminado.");
  assert.ok(calls.some((c) => c[0] === "DELETE" && c[1] === "/products/1"));
});
test("USER envía contacto sin pedir la bandeja restringida", async () => {
  role("USER");
  show("/contacto");
  fireEvent.change(screen.getByLabelText("Asunto"), {
    target: { value: "Consulta" },
  });
  fireEvent.change(screen.getByLabelText("Mensaje"), {
    target: { value: "Hola" },
  });
  fireEvent.click(screen.getByText("Enviar mensaje"));
  await screen.findByText("Mensaje enviado.");
  assert.deepEqual(
    calls.find((c) => c[0] === "POST"),
    ["POST", "/contact", { subject: "Consulta", message: "Hola" }],
  );
  assert.equal(
    calls.some((c) => c[0] === "GET" && c[1] === "/contact"),
    false,
  );
});
test("EDITOR ve los mensajes recibidos", async () => {
  await api.post("/contact", { subject: "Consulta", message: "Hola" });
  role("EDITOR");
  show("/contacto");
  await screen.findByText("Consulta");
  assert.ok(screen.getByText("Bandeja de mensajes"));
});
test("login muestra desafío de contraseña temporal y comprueba confirmación", async () => {
  let completed = 0;
  setAuth({
    token: null,
    roles: [],
    login: async () => ({ newPasswordRequired: true }),
    completeNewPassword: async () => {
      completed++;
      throw new Error("Respuesta de prueba");
    },
    logout: () => {},
  });
  show("/login");
  fireEvent.change(screen.getByLabelText("Usuario"), {
    target: { value: "admin-demo" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "Temporal1!" },
  });
  fireEvent.click(screen.getByText("Iniciar sesión"));
  await screen.findByText("Define tu contraseña");
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
    target: { value: "Nueva1!" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
    target: { value: "Otra1!" },
  });
  fireEvent.click(screen.getByText("Guardar e ingresar"));
  await screen.findByText("Las contraseñas no coinciden.");
  assert.equal(completed, 0);
  fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
    target: { value: "Nueva1!" },
  });
  fireEvent.click(screen.getByText("Guardar e ingresar"));
  await waitFor(() => assert.equal(completed, 1));
  await screen.findByText("Respuesta de prueba");
});
