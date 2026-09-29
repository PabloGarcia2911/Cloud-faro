import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { jwtDecode } from "jwt-decode";
// Access, ID and refresh tokens stay in memory. Reloading requires a new login.
const values = new Map();
const storage = {
  setItem: (k, v) => values.set(k, v),
  getItem: (k) => values.get(k) ?? null,
  removeItem: (k) => values.delete(k),
  clear: () => values.clear(),
};
let user = null;
let pendingUser = null;
let token = null;
let refreshing = null;
let generation = 0;
const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  listeners.forEach((fn) => fn(token));
}
export function currentToken() {
  return token;
}
export function claimsFromToken(value) {
  try {
    const claims = jwtDecode(value);
    return claims.exp * 1000 > Date.now() ? claims : null;
  } catch {
    return null;
  }
}
export function rolesFromToken(value) {
  const groups = claimsFromToken(value)?.["cognito:groups"];
  return Array.isArray(groups)
    ? groups.filter((x) => ["ADMIN", "EDITOR", "USER"].includes(x))
    : [];
}
export function logout() {
  generation++;
  user?.signOut();
  user = null;
  pendingUser = null;
  token = null;
  refreshing = null;
  values.clear();
  emit();
}
function callbacks(candidate, attempt, resolve, reject) {
  return {
    onSuccess: (session) => {
      if (attempt !== generation)
        return reject(new Error("Inicio de sesión cancelado"));
      pendingUser = null;
      user = candidate;
      token = session.getAccessToken().getJwtToken();
      emit();
      resolve({ authenticated: true });
    },
    onFailure: reject,
    newPasswordRequired: (_attributes, requiredAttributes) => {
      if (attempt !== generation)
        return reject(new Error("Inicio de sesión cancelado"));
      if (requiredAttributes?.length)
        return reject(
          new Error(
            "Completa los atributos obligatorios del usuario en Cognito antes de ingresar.",
          ),
        );
      pendingUser = candidate;
      resolve({ newPasswordRequired: true });
    },
    mfaRequired: () =>
      reject(
        new Error(
          "Este MVP requiere usuarios de demostración sin desafío MFA.",
        ),
      ),
    totpRequired: () =>
      reject(new Error("Este MVP no implementa el desafío TOTP.")),
    selectMFAType: () =>
      reject(new Error("Completa la configuración MFA fuera de esta demo.")),
    mfaSetup: () =>
      reject(new Error("Completa la configuración MFA fuera de esta demo.")),
  };
}
export function completeNewPassword(password) {
  if (!pendingUser)
    return Promise.reject(
      new Error("Inicia sesión nuevamente con la contraseña temporal."),
    );
  const candidate = pendingUser;
  return new Promise((resolve, reject) =>
    candidate.completeNewPasswordChallenge(
      password,
      {},
      callbacks(candidate, generation, resolve, reject),
    ),
  );
}
export async function login(username, password) {
  logout();
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  if (
    !userPoolId ||
    !clientId ||
    userPoolId.includes("REPLACE_ME") ||
    clientId.includes("REPLACE_ME")
  )
    throw new Error(
      "Configura el User Pool y App Client en frontend/.env antes de iniciar sesión.",
    );
  const pool = new CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId,
    Storage: storage,
  });
  const candidate = new CognitoUser({
    Username: username,
    Pool: pool,
    Storage: storage,
  });
  const attempt = generation;
  return new Promise((resolve, reject) =>
    candidate.authenticateUser(
      new AuthenticationDetails({ Username: username, Password: password }),
      callbacks(candidate, attempt, resolve, reject),
    ),
  );
}
export async function accessToken() {
  if (!user) return null;
  if (claimsFromToken(token)?.exp * 1000 > Date.now() + 60000) return token;
  if (!refreshing) {
    const active = user;
    const attempt = generation;
    refreshing = new Promise((resolve, reject) =>
      active.getSession((err, session) => {
        if (attempt !== generation)
          return reject(new Error("La sesión cambió"));
        if (err) {
          logout();
          reject(err);
          return;
        }
        token = session.getAccessToken().getJwtToken();
        emit();
        resolve(token);
      }),
    ).finally(() => {
      if (attempt === generation) refreshing = null;
    });
  }
  return refreshing;
}
