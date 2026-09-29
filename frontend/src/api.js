import axios from "axios";
import { accessToken, logout } from "./auth/session";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api",
  timeout: 15000,
});
api.interceptors.request.use(async (config) => {
  const token = await accessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) logout();
    return Promise.reject(error);
  },
);
export function errorMessage(error) {
  if (error.response?.status === 403)
    return "Tu rol no tiene permiso para esta acción.";
  if (error.response?.status === 401)
    return "La sesión terminó. Inicia sesión nuevamente.";
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === "ERR_NETWORK")
    return "No se pudo conectar con la API. Revisa el backend y CORS.";
  return error.message || "No se pudo completar la operación.";
}
