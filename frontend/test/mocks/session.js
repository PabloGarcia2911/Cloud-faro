export let logouts = 0;
export let bearer = "access-token";
export async function accessToken() {
  return bearer;
}
export function logout() {
  logouts++;
}
export function resetSession(value = "access-token") {
  bearer = value;
  logouts = 0;
}
