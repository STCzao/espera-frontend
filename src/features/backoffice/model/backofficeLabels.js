// Etiquetas y formatos compartidos por las pantallas del Backoffice. Antes cada
// componente tenía su propia copia de planLabels, los estados y formatDate.

export const businessStatusLabels = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  suspended: 'Suspendido',
}

export const businessStatusTagClass = {
  pending: 'bg-espera-muted text-espera-text-muted',
  approved: 'bg-espera-success-soft text-espera-success',
  rejected: 'bg-espera-danger-soft text-espera-danger',
  suspended: 'bg-espera-warning-soft text-espera-warning',
}

export const planLabels = { basic: 'Basic', pro: 'Pro', premium: 'Premium' }

export const subscriptionStatusLabels = {
  pending: 'Pendiente',
  trial: 'Prueba',
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}

// Mirrors CommercialState (espera-backend, organization/domain/CommercialState.ts)
// — plan + subscriptionStatus combined into the one label an operator
// actually needs ("is this real revenue?") instead of cross-referencing
// two enums, same reasoning as the backend's own computeCommercialState.
export const commercialStateLabels = {
  pending_approval: 'Pendiente de aprobación',
  trialing_basic: 'Prueba Basic',
  trialing_pro: 'Prueba Pro',
  trialing_premium: 'Prueba Premium',
  paying_basic: 'Pagando Basic',
  paying_pro: 'Pagando Pro',
  paying_premium: 'Pagando Premium',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}

// Mirrors CoherenceAlert (espera-backend, business/application/businessCoherence.ts).
export const coherenceAlertLabels = {
  CATEGORY_MISMATCH: 'La categoría del negocio no coincide con el rubro declarado de la organización.',
  MISSING_LEGAL_ID: 'La organización no tiene CUIT/legalId cargado.',
}

export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(isoDate) {
  return new Date(isoDate).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// El backend identifica a quien hizo cada acción solo por id (no hay un
// endpoint para resolver nombres): se muestra abreviado, el id completo queda
// en el tooltip para poder buscarlo.
export function shortId(id) {
  return id ? id.slice(0, 8) : null
}
