import { createContext, useContext, useEffect, useState } from "react";
import * as session from "./session";
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(session.currentToken());
  useEffect(() => session.subscribe(setToken), []);
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      session.accessToken().catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [token]);
  return (
    <Context.Provider
      value={{
        token,
        roles: session.rolesFromToken(token),
        login: session.login,
        completeNewPassword: session.completeNewPassword,
        logout: session.logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
