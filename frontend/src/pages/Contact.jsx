import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import Notice from "../components/Notice";
import { useAuth } from "../auth/AuthContext";
export default function Contact() {
  const { roles } = useAuth();
  const canRead = roles.some((r) => ["ADMIN", "EDITOR"].includes(r));
  const [messages, setMessages] = useState([]),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setMessages((await api.get("/contact")).data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  useEffect(() => {
    if (canRead) load();
  }, [canRead]);
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/contact", {
        subject: data.get("subject"),
        message: data.get("message"),
      });
      form.reset();
      setSuccess("Mensaje enviado.");
      if (canRead) await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <p className="eyebrow">CONTACTO</p>
      <h1>Conversemos</h1>
      <p>Envía un mensaje al equipo administrador.</p>
      <Notice error={error} success={success} />
      <form onSubmit={submit}>
        <label>
          Asunto
          <input name="subject" required maxLength={150} />
        </label>
        <label>
          Mensaje
          <textarea name="message" required maxLength={4000} rows={5} />
        </label>
        <button disabled={busy}>{busy ? "Enviando…" : "Enviar mensaje"}</button>
      </form>
      {canRead && (
        <>
          <h2>Bandeja de mensajes</h2>
          {messages.length === 0 ? (
            <p className="empty">Aún no hay mensajes.</p>
          ) : (
            messages.map((m) => (
              <article key={m.id}>
                <h3>{m.subject}</h3>
                <p className="message">{m.message}</p>
                <small>
                  {new Date(m.createdAt).toLocaleString()} · {m.senderId}
                </small>
              </article>
            ))
          )}
        </>
      )}
    </section>
  );
}
