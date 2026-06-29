import { create } from 'zustand'
import { tokenStorage } from './tokenStorage.js'

export const useSessionStore = create((set) => ({
  accessToken: null,
  user: null,
  // Never starts as anonymous: the accessToken is memory-only, so every load
  // looks empty even when a valid httpOnly refreshToken session exists.
  status: 'unknown',
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
