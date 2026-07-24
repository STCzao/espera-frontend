const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

export const env = {
  apiBaseUrl,
  // Socket.IO attaches to the same HTTP server as the REST API (see
  // espera-back src/app.ts), so the socket origin is the API origin without
  // the /api prefix.
  socketUrl: apiBaseUrl.replace(/\/api\/?$/, ''),
}
