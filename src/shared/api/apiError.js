export class ApiError extends Error {
  constructor({ message, status, code, details }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function parseApiError(response) {
  try {
    const payload = await response.json()

    return new ApiError({
      message: payload?.message ?? 'La solicitud no pudo completarse.',
      status: response.status,
      code: payload?.code,
      details: payload?.details,
    })
  } catch {
    return new ApiError({
      message: 'La solicitud no pudo completarse.',
      status: response.status,
    })
  }
}
