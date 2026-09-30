// Runs before `vite build`. VITE_API_BASE_URL is baked into the bundle at
// build time, and src/shared/config/env.js falls back to localhost when it's
// missing: a Vercel build without it deploys an app that silently talks to
// nobody (every request fails in the visitor's browser, not in the build log).
// Locally it only has to exist; on Vercel it must also be a public https URL.
import { loadEnv } from 'vite'

const env = loadEnv('production', process.cwd(), 'VITE_')
const apiBaseUrl = process.env.VITE_API_BASE_URL ?? env.VITE_API_BASE_URL
const isVercel = process.env.VERCEL === '1'

function fail(message) {
  console.error(`\n[check-build-env] ${message}\n`)
  process.exit(1)
}

if (!apiBaseUrl) {
  fail(
    'Falta VITE_API_BASE_URL. En Vercel: Settings → Environment Variables, con la URL del backend terminada en /api ' +
      '(por ejemplo https://espera-backend.onrender.com/api).',
  )
}

let url
try {
  url = new URL(apiBaseUrl)
} catch {
  fail(`VITE_API_BASE_URL no es una URL válida: "${apiBaseUrl}".`)
}

if (isVercel && (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname))) {
  fail(`En Vercel, VITE_API_BASE_URL tiene que ser la URL pública https del backend, no "${apiBaseUrl}".`)
}

if (!/\/api\/?$/.test(url.pathname)) {
  // src/shared/config/env.js deriva la URL del socket sacando el /api final.
  fail(`VITE_API_BASE_URL tiene que terminar en /api (la URL del socket se deriva de ahí): "${apiBaseUrl}".`)
}

console.log(`[check-build-env] API: ${url.origin}${url.pathname}`)
