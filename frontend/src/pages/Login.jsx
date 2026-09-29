import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import Notice from "../components/Notice";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { claimsFromToken } from "../auth/session";
export default function Login() {
  const { login, completeNewPassword, logout, token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  useEffect(() => {
    api
      .get("/public/info")
      .then((r) => setInfo(r.data.description))
      .catch(() => setInfo("API pendiente de conexión."));
  }, []);
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
        <p className="eyebrow">ACTIVIDAD SUMATIVA Nº1</p>
        <h1>
          Un catálogo.
          <br />
          Tres roles.
          <br />
          Acceso seguro.
        </h1>
        <p>{info}</p>
        <p>Inicia sesión con tu cuenta académica de Cognito.</p>
      </div>
      <form key={needsPassword ? "new-password" : "login"} onSubmit={submit}>
        <h2>
          {needsPassword ? "Define tu contraseña" : "Bienvenido a Cloud-faro"}
        </h2>
        {needsPassword ? (
          <p>
            Tu cuenta usa una contraseña temporal. Elige una nueva que cumpla la
            política del User Pool.
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
          La sesión se mantiene en memoria y termina al recargar la página.
        </small>
      </form>
    </section>
  );
}
