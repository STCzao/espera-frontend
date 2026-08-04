import { Trash2 } from 'lucide-react'

export function EmployeeList({ employees = [], onRevoke, revokingUserId }) {
  if (employees.length === 0) {
    return <p className="text-sm text-espera-text-muted">Todavía no invitaste a ningún empleado.</p>
  }

  return (
    <ul className="grid gap-2">
      {employees.map((employee) => (
        <li
          className="flex items-center justify-between gap-3 rounded-lg border border-espera-border bg-white px-4 py-3"
          key={employee.userId}
        >
          <div>
            <p className="text-sm font-semibold text-espera-text">
              {employee.firstName} {employee.lastName}
            </p>
            <p className="text-xs text-espera-text-muted">{employee.email}</p>
          </div>
          <button
            aria-label={`Revocar acceso de ${employee.email}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-espera-border text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-70"
            disabled={revokingUserId === employee.userId}
            onClick={() => onRevoke(employee)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
          </button>
        </li>
      ))}
    </ul>
  )
}
