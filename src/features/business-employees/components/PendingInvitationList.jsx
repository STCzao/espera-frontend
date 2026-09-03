import { X } from 'lucide-react'

export function PendingInvitationList({ invitations = [], onCancel, cancelingInvitationId }) {
  if (invitations.length === 0) {
    return <p className="text-sm text-espera-text-muted">No hay invitaciones pendientes.</p>
  }

  return (
    <ul className="grid gap-2">
      {invitations.map((invitation) => (
        <li
          className="flex items-center justify-between gap-3 rounded-lg border border-espera-border bg-espera-surface px-4 py-3"
          key={invitation.invitationId}
        >
          <div>
            <p className="text-sm font-semibold text-espera-text">{invitation.email}</p>
            <p className="text-xs text-espera-text-muted">
              Vence el {new Date(invitation.expiresAt).toLocaleDateString('es-AR')}
            </p>
          </div>
          <button
            aria-label={`Cancelar invitación a ${invitation.email}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-espera-border text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-70"
            disabled={cancelingInvitationId === invitation.invitationId}
            onClick={() => onCancel(invitation)}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </li>
      ))}
    </ul>
  )
}
