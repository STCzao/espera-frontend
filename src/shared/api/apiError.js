// Backend functional error codes → Spanish text. Covers `queue` and
// `business` module AppErrors (see docs/epica-3-cola.md in espera-back).
// Unmapped/missing codes fall back to the raw backend message.
const ERROR_CODE_MESSAGES = {
  QUEUE_NOT_FOUND: 'La cola no existe.',
  QUEUE_NOT_ACTIVE: 'La cola está inactiva.',
  QUEUE_EMPTY: 'No hay turnos en espera.',
  QUEUE_NOT_ACCEPTING_TURNS: 'La cola no está aceptando turnos nuevos.',
  BUSINESS_NOT_FOUND: 'El negocio no existe.',
  BUSINESS_NOT_ACCEPTING_CUSTOMERS: 'El negocio todavía no está aprobado.',
  BUSINESS_OPERATIONAL_STATUS_BLOCKED: 'El negocio está pausado o cerrado.',
  CUSTOMER_HAS_ACTIVE_TURN: 'Ya tenés un turno activo en otro negocio.',
  TURN_NOT_FOUND: 'El turno no existe.',
  TURN_NOT_OWNED: 'Ese turno no te pertenece.',
  TURN_NOT_CANCELLABLE: 'Este turno ya no se puede cancelar.',
  TURN_INVALID_STATUS_FOR_ATTEND: 'El turno no está en un estado válido para esta acción.',
  SERVICE_WINDOW_NOT_FOUND: 'La ventanilla no existe.',
  SERVICE_WINDOW_OCCUPIED: 'Esa ventanilla ya está atendiendo a otra persona.',
  SERVICE_WINDOW_IN_USE: 'La ventanilla está atendiendo a alguien ahora mismo.',
  REDIRECT_SAME_WINDOW: 'El turno ya está en esa ventanilla.',
  // Resto de `business`, encontrados al auditar el backend (no vinieron en
  // el contrato original, pero ya existen y usan el mismo mecanismo).
  INVALID_CATEGORY: 'La categoría seleccionada no es válida.',
  OWNER_NOT_FOUND: 'El usuario no existe.',
  QR_CODE_NOT_FOUND: 'El código QR no existe o venció.',
  EMPLOYEE_NOT_FOUND: 'El empleado no existe.',
  SUBSCRIPTION_NOT_FOUND: 'La suscripción no existe.',
  // Backoffice — aprobación en dos niveles (Épica 8, HU-8.2/8.3/8.7).
  ORGANIZATION_NOT_FOUND: 'La organización no existe.',
  ORGANIZATION_ALREADY_APPROVED: 'Esa organización ya estaba aprobada.',
  ORGANIZATION_NOT_PENDING: 'Esa organización ya no está pendiente.',
  ORGANIZATION_NOT_APPROVED: 'La organización de este negocio todavía no está aprobada.',
  ORGANIZATION_OWNERSHIP_REQUIRED: 'No tenés permisos sobre esa organización.',
  BUSINESS_ALREADY_APPROVED: 'Ese negocio ya estaba aprobado.',
  BUSINESS_NOT_PENDING: 'Ese negocio ya no está pendiente.',
  APPROVAL_NOTE_REQUIRED: 'Hay alertas de coherencia sin resolver — agregá una nota para aprobar de todas formas.',
  BUSINESS_CANNOT_BE_SUSPENDED: 'Solo se pueden suspender negocios aprobados.',
  BUSINESS_NOT_SUSPENDED: 'Ese negocio no está suspendido.',
  SUBSCRIPTION_CANNOT_BE_ACTIVATED: 'Solo se puede activar una suscripción pendiente o en prueba.',
  SUBSCRIPTION_ALREADY_CANCELLED: 'Esa suscripción ya está cancelada o vencida.',
  SUBSCRIPTION_DOWNGRADE_BLOCKED: 'No se puede bajar a ese plan: la organización tiene más negocios de los que permite.',
  // Backoffice — reportes (HU-8.6).
  REPORT_NOT_FOUND: 'El reporte no existe.',
  REPORT_NOT_PENDING: 'Ese reporte ya fue revisado.',
  USER_NOT_FOUND: 'El usuario no existe.',
  USER_ALREADY_BLOCKED: 'Ese usuario ya está bloqueado.',
  // Bugfix — una Subscription vencida/cancelada bloquea operar (reconciliación
  // perezosa trial→expired). Afecta pantallas ya implementadas: "Aprobar" en
  // HU-8.3 (Backoffice) y el alta de negocio (business-onboarding).
  SUBSCRIPTION_NOT_ACTIVE: 'La suscripción de esa organización está vencida o cancelada.',
  SUBSCRIPTION_INACTIVE: 'Tu suscripción está vencida o cancelada — no podés crear un negocio nuevo.',
  // Colas adicionales por plan.
  BUSINESS_OWNERSHIP_REQUIRED: 'No tenés permisos sobre este negocio.',
  PLAN_QUEUE_LIMIT_REACHED: 'Tu plan no permite crear más colas para este negocio.',
  QUEUE_PREFIX_ALREADY_IN_USE: 'Ese prefijo ya lo usa otra cola de este negocio.',
}

export class ApiError extends Error {
  constructor({ message, status, code, details }) {
    super(ERROR_CODE_MESSAGES[code] ?? message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    // The original backend text, kept around in case something needs it
    // (logging, etc.) — everything user-facing should keep reading `.message`.
    this.rawMessage = message
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
