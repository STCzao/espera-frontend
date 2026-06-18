import { useSessionStore } from './sessionStore.js'

export function persistSession(payload) {
  useSessionStore.getState().setAuthenticatedSession(payload)
  return payload
}

export function clearSession() {
  useSessionStore.getState().clearSession()
}
