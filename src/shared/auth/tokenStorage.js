// Kept in memory only (never localStorage/sessionStorage): an XSS payload that
// runs on the page could otherwise read the accessToken straight out of storage.
// A page reload loses it on purpose; useSessionBootstrap restores the session
// through the httpOnly refreshToken cookie instead.
let memoryToken = null

export const tokenStorage = {
  getAccessToken() {
    return memoryToken
  },
  setAccessToken(token) {
    memoryToken = token
  },
  clear() {
    memoryToken = null
  },
}
