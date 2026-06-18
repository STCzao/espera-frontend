const ACCESS_TOKEN_KEY = 'espera.accessToken'

let memoryToken = null

export const tokenStorage = {
  getAccessToken() {
    return memoryToken ?? window.localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  setAccessToken(token) {
    memoryToken = token

    if (token) {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
      return
    }

    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
  clear() {
    memoryToken = null
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
}
