const messagesByStatus = {
  pending: 'Tu negocio todavía está pendiente de revisión — esta acción se habilita cuando se apruebe.',
  rejected: 'La solicitud de este negocio fue rechazada — esta acción no está disponible.',
  suspended: 'Este negocio está suspendido — esta acción no está disponible hasta que se reactive.',
}

export function BusinessNotOperatingNotice({ status }) {
  return (
    <div className="business-alert business-alert--warning" role="status">
      <span className="business-alert__led" aria-hidden="true" />
      {messagesByStatus[status] ?? 'Este negocio no está operando actualmente.'}
    </div>
  )
}
