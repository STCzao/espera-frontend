import { tokenStorage } from '../auth/tokenStorage.js'
import { useSessionStore } from '../auth/sessionStore.js'
import { env } from '../config/env.js'
import { parseApiError } from './apiError.js'

let refreshPromise = null

async function request(path, options = {}, retrying = false) {
  const headers = new Headers(options.headers)
  const accessToken = tokenStorage.getAccessToken()

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && !retrying && path !== '/auth/refresh-token') {
    const refreshed = await refreshSession()

    if (refreshed) {
      return request(path, options, true)
    }
  }

  if (!response.ok) {
    const error = await parseApiError(response)

    // The backend re-reads the blocked flag on every authenticated request,
    // so a block applied mid-session surfaces here, on whatever request came
    // next — not only at login. Ending the session sends AuthLayout back to
    // /login instead of leaving the panel up with every action failing.
    if (error.code === 'ACCOUNT_BLOCKED' && path !== '/auth/login' && path !== '/auth/login/google') {
      useSessionStore.getState().clearSession()
    }

    throw error
  }

  if (response.status === 204) {
    return null
  }

  return options.responseType === 'blob' ? response.blob() : response.json()
}

// Refresh tokens rotate on every use. When another tab rotated the shared
// cookie a moment earlier, the backend answers 409 REFRESH_TOKEN_ROTATED
// instead of 401: the browser already holds the new cookie, so retrying once
// succeeds. Treating that 409 as a failed refresh would log this tab out.
async function postRefreshToken() {
  try {
    return await request('/auth/refresh-token', { method: 'POST' }, true)
  } catch (error) {
    if (error.code === 'REFRESH_TOKEN_ROTATED') {
      return request('/auth/refresh-token', { method: 'POST' }, true)
    }
    throw error
  }
}

async function refreshSession() {
  refreshPromise ??= postRefreshToken()
    .then((payload) => {
      useSessionStore.getState().setAccessToken(payload.accessToken)
      return true
    })
    .catch(() => {
      useSessionStore.getState().clearSession()
      return false
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// Seconds of margin before `exp`: a token that expires mid-handshake would
// still leave the socket anonymous.
const ACCESS_TOKEN_EXPIRY_MARGIN_SECONDS = 30

// Only reads `exp` to decide whether to refresh first; the signature is the
// backend's job. A token it can't read is sent as-is rather than refreshed:
// a failed refresh ends the session, too high a price for a guess.
function isAccessTokenExpiring(token) {
  try {
    const payloadSegment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payloadSegment))
    return typeof exp === 'number' && exp - ACCESS_TOKEN_EXPIRY_MARGIN_SECONDS <= Date.now() / 1000
  } catch {
    return false
  }
}

// For callers that authenticate outside `request()` (the Socket.IO
// handshake), where a stale token can't fall back on the 401 → refresh retry.
// No token means no session (e.g. the anonymous guest page): returns null
// without calling refresh, which would only 401 and hit a rate-limited endpoint.
export async function getFreshAccessToken() {
  const accessToken = tokenStorage.getAccessToken()

  if (!accessToken || !isAccessTokenExpiring(accessToken)) {
    return accessToken
  }

  await refreshSession()
  return tokenStorage.getAccessToken()
}

export const httpClient = {
  get(path) {
    return request(path)
  },
  getBlob(path) {
    return request(path, { responseType: 'blob' })
  },
  post(path, body) {
    return request(path, {
      method: 'POST',
      body: body == null ? undefined : JSON.stringify(body),
    })
  },
  patch(path, body) {
    return request(path, {
      method: 'PATCH',
      body: body == null ? undefined : JSON.stringify(body),
    })
  },
  put(path, body) {
    return request(path, {
      method: 'PUT',
      body: body == null ? undefined : JSON.stringify(body),
    })
  },
  delete(path) {
    return request(path, { method: 'DELETE' })
  },
}
