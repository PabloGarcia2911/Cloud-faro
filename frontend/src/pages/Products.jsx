import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import Notice from "../components/Notice";
const empty = { name: "", description: "", price: "", stock: "0" };
export default function Products({ admin = false }) {
  const [items, setItems] = useState([]),
    [form, setForm] = useState(empty),
    [editing, setEditing] = useState(null),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  async function load() {
    try {
      setItems((await api.get("/products")).data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const body = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };
      if (editing) await api.put(`/products/${editing}`, body);
      else await api.post("/products", body);
      setForm(empty);
      setEditing(null);
      setSuccess("Producto guardado.");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(item) {
    if (!window.confirm(`¿Eliminar ${item.name}?`)) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.delete(`/products/${item.id}`);
      if (editing === item.id) {
        setEditing(null);
        setForm(empty);
      }
      setSuccess("Producto eliminado.");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <p className="eyebrow">{admin ? "ADMINISTRACIÓN" : "CATÁLOGO"}</p>
      <h1>{admin ? "Mantenedor de productos" : "Productos"}</h1>
      <p>
        {admin
          ? "Crea, actualiza y elimina los productos del catálogo."
          : "Consulta los productos disponibles y su stock."}
      </p>
      <Notice error={error} success={success} />
      {admin && (
        <form className="product-form" onSubmit={save}>
          <h2>{editing ? "Editar producto" : "Nuevo producto"}</h2>
          <label>
            Nombre
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Descripción
            <textarea
              maxLength={1000}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <div className="row">
            <label>
              Precio
              <input
                type="number"
                required
                min="0"
                max="999999999.99"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                required
                min="0"
                max="1000000"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </label>
          </div>
          <button disabled={busy}>Guardar producto</button>
          {editing && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
            >
              Cancelar edición
            </button>
          )}
        </form>
      )}
      {loading ? (
        <p role="status">Cargando productos…</p>
      ) : items.length === 0 ? (
        <p className="empty">
          No hay productos. Un administrador puede crear el primero.
        </p>
      ) : (
        <div className="grid">
          {items.map((item) => (
            <article key={item.id}>
              <span className="tag">Stock: {item.stock}</span>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <strong>
                {Number(item.price).toLocaleString("es-CL", {
                  minimumFractionDigits: 2,
                })}
              </strong>
              {admin && (
                <div className="actions">
                  <button
                    disabled={busy}
                    onClick={() => {
                      setEditing(item.id);
                      setForm({
                        name: item.name,
                        description: item.description,
                        price: String(item.price),
                        stock: String(item.stock),
                      });
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() => remove(item)}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
