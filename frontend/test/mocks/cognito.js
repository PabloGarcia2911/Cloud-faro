export const state = {
  challenge: false,
  storage: null,
  refreshes: 0,
  token: "access-token",
};
const session = () => ({
  getAccessToken: () => ({ getJwtToken: () => state.token }),
});
export class AuthenticationDetails {
  constructor(data) {
    this.data = data;
  }
}
export class CognitoUserPool {
  constructor(options) {
    state.storage = options.Storage;
  }
}
export class CognitoUser {
  constructor(options) {
    this.options = options;
  }
  authenticateUser(_details, cb) {
    if (state.challenge) cb.newPasswordRequired({}, []);
    else cb.onSuccess(session());
  }
  completeNewPasswordChallenge(password, _attrs, cb) {
    if (password === "bad") cb.onFailure(new Error("Password policy"));
    else cb.onSuccess(session());
  }
  getSession(cb) {
    state.refreshes++;
    cb(null, session());
  }
  signOut() {}
}
