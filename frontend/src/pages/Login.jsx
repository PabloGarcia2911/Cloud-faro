import { useState } from "react";
import { errorMessage } from "../api";
import Notice from "../components/Notice";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { claimsFromToken } from "../auth/session";
export default function Login() {
  const { login, completeNewPassword, logout, token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  if (claimsFromToken(token)) return <Navigate to="/productos" replace />;
  async function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      if (needsPassword && data.get("password") !== data.get("confirmPassword"))
        throw new Error("Las contraseñas no coinciden.");
      const result = needsPassword
        ? await completeNewPassword(data.get("password"))
        : await login(data.get("username").trim(), data.get("password"));
      if (result?.newPasswordRequired) setNeedsPassword(true);
      else navigate("/productos");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="login">
      <div>
        <p className="eyebrow">BIENVENIDO A FARO</p>
        <h1>
          Encuentra lo que
          <br />
          necesitas.
        </h1>
        <p>Explora nuestro catálogo y escríbenos cuando necesites ayuda.</p>
      </div>
      <form key={needsPassword ? "new-password" : "login"} onSubmit={submit}>
        <h2>
          {needsPassword ? "Define tu contraseña" : "Entra a tu cuenta"}
        </h2>
        {needsPassword ? (
          <p>
            Antes de continuar, cambia tu contraseña temporal por una que solo tú conozcas.
          </p>
        ) : (
          <label>
            Usuario
            <input
              name="username"
              autoComplete="username"
              required
              disabled={busy}
            />
          </label>
        )}
        <label>
          {needsPassword ? "Nueva contraseña" : "Contraseña"}
          <input
            name="password"
            type="password"
            autoComplete={needsPassword ? "new-password" : "current-password"}
            required
            disabled={busy}
          />
        </label>
        {needsPassword && (
          <label>
            Confirmar nueva contraseña
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              disabled={busy}
            />
          </label>
        )}
        <Notice error={error} />
        <button disabled={busy}>
          {busy
            ? "Procesando…"
            : needsPassword
              ? "Guardar e ingresar"
              : "Iniciar sesión"}
        </button>
        {needsPassword && (
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => {
              logout();
              setNeedsPassword(false);
              setError("");
            }}
          >
            Volver
          </button>
        )}
        <small>
          Si recargas la página, tendrás que volver a iniciar sesión.
        </small>
      </form>
    </section>
  );
}
