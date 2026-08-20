// Backend functional error codes → Spanish text. Covers `queue` and
// `business` module AppErrors (see docs/epica-3-cola.md in espera-back).
// Unmapped/missing codes fall back to the raw backend message.
const ERROR_CODE_MESSAGES = {
  QUEUE_NOT_FOUND: 'La cola no existe.',
  QUEUE_NOT_ACTIVE: 'La cola está inactiva.',
  QUEUE_EMPTY: 'No hay turnos en espera.',
  QUEUE_NOT_ACCEPTING_TURNS: 'La cola no está aceptando turnos nuevos.',
  // Bugfix — restricciones de cola y planes (2026-08-20).
  QUEUE_NO_TURN_READY: 'Hay una reserva telefónica que todavía no llegó a su horario estimado.',
  // Bugfix — activar/desactivar cola (2026-08-20). QueuesControl ya no deja
  // tocar el toggle de la única cola activa, pero se mapea igual como
  // resguardo (ej. otra pestaña desactivó otra cola justo antes).
  QUEUE_LAST_ACTIVE: 'No podés desactivar la única cola activa del negocio.',
  // Bugfix — no_show como acción explícita (2026-08-20). "Llamar siguiente"
  // ahora bloquea directo mientras haya un turno `called` sin resolver — ya
  // no auto-marca no_show ni chequea disponibilidad de ventanilla, así que
  // el QUEUE_NO_WINDOW_AVAILABLE que se había mapeado acá quedó muerto
  // (nunca se dispara) y se reemplaza por este.
  TURN_STILL_CALLED: 'Hay un turno llamado sin resolver — atendelo o marcalo ausente antes de llamar al siguiente.',
  // Se dispara si se intenta marcar ausente a un turno que no está en
  // "llamado" (ej. dos clicks, o ya se le dio "Iniciar" desde otra pestaña).
  TURN_NOT_CALLED: 'Ese turno ya no está en estado "llamado".',
  BUSINESS_NOT_FOUND: 'El negocio no existe.',
  BUSINESS_NOT_ACCEPTING_CUSTOMERS: 'El negocio todavía no está aprobado.',
  BUSINESS_OPERATIONAL_STATUS_BLOCKED: 'El negocio está pausado o cerrado.',
  // Bugfix — restricciones de cola y planes (2026-08-20). Pública (HU-4.2,
  // sacar turno por QR/web ligera) — no dispara para el turno manual del
  // panel (CreateManualTurnUseCase no la chequea a propósito).
  BUSINESS_OUTSIDE_OPERATING_HOURS: 'El negocio está fuera de su horario de atención en este momento.',
  CUSTOMER_HAS_ACTIVE_TURN: 'Ya tenés un turno activo en otro negocio.',
  TURN_NOT_FOUND: 'El turno no existe.',
  TURN_NOT_OWNED: 'Ese turno no te pertenece.',
  TURN_NOT_CANCELLABLE: 'Este turno ya no se puede cancelar.',
  TURN_INVALID_STATUS_FOR_ATTEND: 'El turno no está en un estado válido para esta acción.',
  SERVICE_WINDOW_NOT_FOUND: 'La ventanilla no existe.',
  SERVICE_WINDOW_OCCUPIED: 'Esa ventanilla ya está atendiendo a otra persona.',
  SERVICE_WINDOW_IN_USE: 'La ventanilla está atendiendo a alguien ahora mismo.',
  // Bugfix — restricciones de cola y planes (2026-08-20). En la práctica no
  // debería mostrarse: QueueTurnList ya exige elegir ventanilla en ese caso.
  SERVICE_WINDOW_REQUIRED: 'Esta cola tiene ventanillas activas — elegí una para atender.',
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
  // Genérico a propósito: además de crear un negocio, ahora también lo tiran
  // crear una cola o una ventanilla (bugfix 2026-08-20,
  // EnsureQueueCreationAllowedUseCase / EnsureServiceWindowCreationAllowedUseCase)
  // — un texto que mencionara "negocio" específicamente quedaría mal en esos casos.
  SUBSCRIPTION_INACTIVE: 'Tu suscripción está vencida o cancelada.',
  // Colas adicionales por plan.
  BUSINESS_OWNERSHIP_REQUIRED: 'No tenés permisos sobre este negocio.',
  PLAN_QUEUE_LIMIT_REACHED: 'Tu plan no permite crear más colas para este negocio.',
  QUEUE_PREFIX_ALREADY_IN_USE: 'Ese prefijo ya lo usa otra cola de este negocio.',
  // Bugfix — business.status faltante en flujos del panel. La UI ya evita
  // disparar estas acciones cuando el negocio no está approved (ver
  // useBusinessCanOperate), pero se mapean igual como resguardo.
  BUSINESS_NOT_OPERATING: 'Este negocio no está operando actualmente.',
  BUSINESS_SUSPENDED_USE_REACTIVATE: 'Este negocio está suspendido — hay que reactivarlo, no volver a aprobarlo.',
  // Bugfix — límite de ventanillas por fila según el plan (Basic 1, Pro 3,
  // Premium 20). Aplica tanto al CRUD real (ServiceWindowManager) como al
  // contador legado (ServiceWindowsControl) — antes ese segundo camino
  // esquivaba el límite del primero.
  PLAN_SERVICE_WINDOW_LIMIT_REACHED: 'Tu plan no permite crear más ventanillas en esta cola.',
  // HU-4.2 — sacar turno sin la app (web ligera, pública).
  RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Probá de nuevo en unos minutos.',
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
