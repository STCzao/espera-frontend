import { create } from 'zustand'
import { tokenStorage } from './tokenStorage.js'

const initialAccessToken = tokenStorage.getAccessToken()

export const useSessionStore = create((set) => ({
  accessToken: initialAccessToken,
  user: null,
  status: initialAccessToken ? 'unknown' : 'anonymous',
  setAccessToken(accessToken) {
    tokenStorage.setAccessToken(accessToken)
    set({ accessToken })
  },
  setAuthenticatedSession({ accessToken, user = null }) {
    tokenStorage.setAccessToken(accessToken)
    set({
      accessToken,
      user,
      status: 'authenticated',
    })
  },
  setUser(user) {
    set({
      user,
      status: user ? 'authenticated' : 'anonymous',
    })
  },
  clearSession() {
    tokenStorage.clear()
    set({
      accessToken: null,
      user: null,
      status: 'anonymous',
    })
  },
}))
