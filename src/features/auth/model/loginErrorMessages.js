const messagesByCode = {
  EMAIL_NOT_VERIFIED: 'Todavía no verificaste tu email. Revisá tu casilla para activar la cuenta.',
  ACCOUNT_REJECTED: 'La solicitud de tu negocio fue rechazada. Contactanos si creés que es un error.',
  LOGIN_TEMPORARILY_BLOCKED: 'Hubo demasiados intentos fallidos. Probá de nuevo en unos minutos.',
  GOOGLE_OAUTH_STATE_MISMATCH: 'Hubo un problema de seguridad al conectar con Google. Intentá de nuevo.',
  GOOGLE_EMAIL_NOT_VERIFIED: 'Tu cuenta de Google no tiene el email verificado.',
  AUTH_PROVIDER_MISMATCH: 'Esta cuenta inicia sesión con email y contraseña, no con Google.',
  GOOGLE_ACCOUNT_MISMATCH: 'Esta cuenta de Google no coincide con la que tenías registrada.',
}

const invalidCredentialsMessage = 'Email o contraseña incorrectos.'
const genericMessage = 'No pudimos iniciar sesión. Intentá nuevamente.'

export function getLoginErrorMessage(error) {
  if (error?.code in messagesByCode) {
    return messagesByCode[error.code]
  }

  if (error?.status === 401) {
    return invalidCredentialsMessage
  }

  return genericMessage
}
