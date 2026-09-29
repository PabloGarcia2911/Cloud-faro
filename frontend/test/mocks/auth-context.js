export let auth;
export function setAuth(value) {
  auth = value;
}
export function useAuth() {
  return auth;
}
