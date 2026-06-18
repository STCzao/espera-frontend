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
    throw await parseApiError(response)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

async function refreshSession() {
  refreshPromise ??= request('/auth/refresh-token', { method: 'POST' }, true)
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
