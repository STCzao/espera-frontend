const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

export const env = {
  apiBaseUrl,
  // Socket.IO attaches to the same HTTP server as the REST API (see
  // espera-back src/app.ts), so by default the socket origin is the API origin
  // without the /api prefix.
  //
  // Con la API detrás del proxy de Vercel, VITE_API_BASE_URL es un "/api"
  // relativo (mismo origen, cookies de primera parte) y de ahí no se puede
  // derivar nada: Vercel no reenvía WebSocket, así que el socket sigue yendo
  // directo al backend y su URL va en VITE_SOCKET_URL. No usa cookies: se
  // autentica con el access token del handshake.
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? apiBaseUrl.replace(/\/api\/?$/, ''),
}
