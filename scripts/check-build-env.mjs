// Runs before `vite build`. VITE_API_BASE_URL is baked into the bundle at
// build time, and src/shared/config/env.js falls back to localhost when it's
// missing: a Vercel build without it deploys an app that silently talks to
// nobody (every request fails in the visitor's browser, not in the build log).
// Locally it only has to exist; on Vercel it must also be a public https URL,
// or "/api" when the API goes through Vercel's proxy (see vercel.json), in
// which case VITE_SOCKET_URL is mandatory: the socket can't go through it.
import { loadEnv } from 'vite'

const env = loadEnv('production', process.cwd(), 'VITE_')
const apiBaseUrl = process.env.VITE_API_BASE_URL ?? env.VITE_API_BASE_URL
const socketUrl = process.env.VITE_SOCKET_URL ?? env.VITE_SOCKET_URL
const isVercel = process.env.VERCEL === '1'

function fail(message) {
  console.error(`\n[check-build-env] ${message}\n`)
  process.exit(1)
}

function checkPublicHttps(name, value) {
  let url
  try {
    url = new URL(value)
  } catch {
    fail(`${name} no es una URL válida: "${value}".`)
  }

  if (isVercel && (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname))) {
    fail(`En Vercel, ${name} tiene que ser la URL pública https del backend, no "${value}".`)
  }

  return url
}

if (!apiBaseUrl) {
  fail(
    'Falta VITE_API_BASE_URL. En Vercel: Settings → Environment Variables. Con el proxy de vercel.json va "/api"; ' +
      'sin proxy, la URL del backend terminada en /api (por ejemplo https://espera-backend.onrender.com/api).',
  )
}

if (apiBaseUrl.startsWith('/')) {
  // Proxied: same-origin requests, so cookies are first-party (the point of the
  // proxy: Safari/iOS drop cookies from a different site).
  if (!/^\/api\/?$/.test(apiBaseUrl)) {
    fail(`Con el proxy, VITE_API_BASE_URL tiene que ser exactamente "/api" (es lo que reenvía vercel.json): "${apiBaseUrl}".`)
  }

  if (!socketUrl) {
    fail(
      'Con VITE_API_BASE_URL="/api" falta VITE_SOCKET_URL: Socket.IO no pasa por el proxy de Vercel y va directo al ' +
        'backend (por ejemplo https://espera-backend.onrender.com, sin /api). Sin ella el tiempo real queda muerto.',
    )
  }

  const socket = checkPublicHttps('VITE_SOCKET_URL', socketUrl)
  console.log(`[check-build-env] API: ${apiBaseUrl} (proxy) · socket: ${socket.origin}`)
} else {
  const url = checkPublicHttps('VITE_API_BASE_URL', apiBaseUrl)

  if (!/\/api\/?$/.test(url.pathname)) {
    // Sin VITE_SOCKET_URL, src/shared/config/env.js deriva la URL del socket sacando el /api final.
    fail(`VITE_API_BASE_URL tiene que terminar en /api (la URL del socket se deriva de ahí): "${apiBaseUrl}".`)
  }

  console.log(`[check-build-env] API: ${url.origin}${url.pathname}`)
}
