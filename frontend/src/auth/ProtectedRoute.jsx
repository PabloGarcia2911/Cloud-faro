import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { claimsFromToken } from "./session";
export default function ProtectedRoute({ role }) {
  const { token, roles } = useAuth();
  const location = useLocation();
  if (!claimsFromToken(token))
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.length || (role && !roles.includes(role)))
    return (
      <section>
        <h1>Acceso denegado</h1>
        <p>Tu rol no permite abrir esta vista.</p>
      </section>
    );
  return <Outlet />;
}
