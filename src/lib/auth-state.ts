export const AUTH_STATE_CHANGE_EVENT = "freshcart-auth-state-change";

export function notifyAuthStateChange() {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
}
