import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Contact from "./pages/Contact";
export default function App() {
  const { token, roles, logout } = useAuth();
  return (
    <>
      <header>
        <NavLink className="brand" to="/productos">
          ◈ Cloud-faro
        </NavLink>
        <span className="tag">Laboratorio académico</span>
        <nav>
          {token ? (
            <>
              <NavLink to="/productos">Productos</NavLink>
              {roles.includes("ADMIN") && (
                <NavLink to="/admin/productos">Administrar</NavLink>
              )}
              <NavLink to="/contacto">Contacto</NavLink>
              <button className="secondary" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <NavLink to="/login">Ingresar</NavLink>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/productos" element={<Products key="catalog" />} />
            <Route path="/contacto" element={<Contact />} />
          </Route>
          <Route element={<ProtectedRoute role="ADMIN" />}>
            <Route
              path="/admin/productos"
              element={<Products key="admin" admin />}
            />
          </Route>
          <Route
            path="*"
            element={<Navigate to={token ? "/productos" : "/login"} replace />}
          />
        </Routes>
      </main>
      <footer>
        Cloud-faro · Spring Boot + React + SQLite · Identidad con Amazon Cognito
      </footer>
    </>
  );
}
