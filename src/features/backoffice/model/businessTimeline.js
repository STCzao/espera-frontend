// Arma el historial de un negocio a partir de los campos de auditoría de
// GET /business/:id/review: el backend guarda quién, cuándo y por qué de cada
// decisión, pero no un registro de eventos, así que se reconstruye acá.
//
// Cada evento sale solo si su fecha existe. Límites que vienen del modelo del
// backend, no de acá:
// - Aprobar borra el rechazo anterior (ApproveBusinessUseCase limpia
//   rejectedAt/rejectedReason): un negocio rechazado y luego aprobado muestra
//   únicamente la aprobación.
// - Se guarda solo la última suspensión y la última reactivación: si un negocio
//   se suspendió y reactivó varias veces, los ciclos anteriores no se ven.
//   Reactivar no borra la suspensión, así que ambas aparecen, en orden.
// Un registro de auditoría completo requiere un cambio de backend.
export function buildBusinessTimeline(business) {
  const events = [{ key: 'created', at: business.createdAt, title: 'Alta del negocio' }]

  if (business.approvedAt) {
    events.push({
      key: 'approved',
      at: business.approvedAt,
      title: 'Aprobado',
      actorId: business.approvedByUserId,
      note: business.approvalNote,
      alerts: business.approvalAlertsSnapshot ?? [],
    })
  }

  if (business.rejectedAt) {
    events.push({ key: 'rejected', at: business.rejectedAt, title: 'Rechazado', reason: business.rejectedReason })
  }

  if (business.suspendedAt) {
    events.push({
      key: 'suspended',
      at: business.suspendedAt,
      title: 'Suspendido',
      actorId: business.suspendedByUserId,
      reason: business.suspensionReason,
    })
  }

  if (business.reactivatedAt) {
    events.push({
      key: 'reactivated',
      at: business.reactivatedAt,
      title: 'Reactivado',
      actorId: business.reactivatedByUserId,
    })
  }

  return events.sort((a, b) => new Date(a.at) - new Date(b.at))
}
