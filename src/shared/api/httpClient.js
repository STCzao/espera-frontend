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
