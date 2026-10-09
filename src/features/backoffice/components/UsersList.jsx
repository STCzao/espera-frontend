import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSessionStore } from '../../../shared/auth/sessionStore.js'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'

const roleLabels = {
  user: 'Usuario',
  employee: 'Empleado',
  business_admin: 'Admin de negocio',
  super_admin: 'Super admin',
}

const approvalLabels = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const approvalTagClass = {
  pending: 'bg-espera-muted text-espera-text-muted',
  approved: 'bg-espera-success-soft text-espera-success',
  rejected: 'bg-espera-danger-soft text-espera-danger',
}

const blockedFilterOptions = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Bloqueados' },
  { value: 'false', label: 'Activos' },
]

const emptyFilters = {
  role: '',
  approvalStatus: '',
  isBlocked: '',
  search: '',
}

// Cuánto se espera sin tipear antes de pegarle al backend: sin esto cada letra
// del buscador sería un pedido.
const SEARCH_DEBOUNCE_MS = 300

// USER_ALREADY_BLOCKED ya está traducido en shared/api/apiError.js; este no.
const errorMessagesByCode = {
  USER_NOT_BLOCKED: 'Ese usuario no está bloqueado.',
}

function errorMessage(error, fallback) {
  return errorMessagesByCode[error?.code] ?? error?.message ?? fallback
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const selectClassName =
  'h-9 rounded-lg border border-espera-border bg-espera-surface px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft'

export function UsersList() {
  const currentUserId = useSessionStore((state) => state.user?.id)

  const [filters, setFilters] = useState(emptyFilters)
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [userToBlock, setUserToBlock] = useState(null)
  const [blockReason, setBlockReason] = useState('')

  const queryClient = useQueryClient()

  const queryParams = { ...filters, sortBy, sortDir, page, pageSize: 20 }

  const usersQuery = useQuery({
    queryKey: ['backoffice-users', queryParams],
    queryFn: () => backofficeApi.listUsers(queryParams),
  })

  function updateFilter(key, value) {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  // Debounce en el manejador (no en un efecto): las reglas de React Hooks del
  // repo desaconsejan actualizar estado dentro de un efecto. El texto se recorta
  // antes de enviarlo porque el backend rechaza (400) un `search` de solo espacios.
  const searchTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(searchTimerRef.current), [])

  function handleSearchChange(value) {
    setSearchInput(value)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => updateFilter('search', value.trim()), SEARCH_DEBOUNCE_MS)
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['backoffice-users'] })
  }

  function closeBlockDialog() {
    setUserToBlock(null)
    setBlockReason('')
  }

  const unblockMutation = useMutation({
    mutationFn: (userId) => backofficeApi.unblockUser(userId),
    onSettled: invalidate,
  })

  // Se cierra el diálogo también si falla: el error se muestra debajo de la
  // lista y con el diálogo abierto quedaría tapado. Y se recarga igual, porque
  // un 409 significa que la lista estaba desactualizada.
  const blockMutation = useMutation({
    mutationFn: ({ userId, reason }) => backofficeApi.blockUser(userId, reason),
    onSettled: () => {
      invalidate()
      closeBlockDialog()
    },
  })

  const users = usersQuery.data
  const totalPages = users ? Math.max(1, Math.ceil(users.total / users.pageSize)) : 1

  return (
    <div className="rounded-lg border border-espera-border bg-espera-surface">
      <div className="flex flex-wrap items-end gap-3 border-b border-espera-border p-4">
        <FilterField label="Buscar">
          <input
            className="h-9 w-56 rounded-lg border border-espera-border bg-espera-surface px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Nombre, apellido o email"
            type="search"
            value={searchInput}
          />
        </FilterField>
        <FilterField label="Rol">
          <select
            className={selectClassName}
            onChange={(event) => updateFilter('role', event.target.value)}
            value={filters.role}
          >
            <option value="">Todos</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Aprobación">
          <select
            className={selectClassName}
            onChange={(event) => updateFilter('approvalStatus', event.target.value)}
            value={filters.approvalStatus}
          >
            <option value="">Todas</option>
            {Object.entries(approvalLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Acceso">
          <select
            className={selectClassName}
            onChange={(event) => updateFilter('isBlocked', event.target.value)}
            value={filters.isBlocked}
          >
            {blockedFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Orden">
          <select
            className={selectClassName}
            onChange={(event) => {
              setPage(1)
              setSortBy(event.target.value)
            }}
            value={sortBy}
          >
            <option value="createdAt">Fecha de alta</option>
            <option value="name">Nombre</option>
          </select>
        </FilterField>
        <button
          className="rounded-md border border-espera-border bg-espera-surface px-3 py-2 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft"
          onClick={() => {
            setPage(1)
            setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'))
          }}
          type="button"
        >
          {sortDir === 'desc' ? '↓ Descendente' : '↑ Ascendente'}
        </button>
      </div>

      {usersQuery.isLoading && (
        <ul>
          {[0, 1, 2].map((index) => (
            <li className="flex items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0" key={index}>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-1.5 h-3 w-56" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {usersQuery.isError && (
        <div className="p-5">
          <FormError>No pudimos cargar los usuarios.</FormError>
        </div>
      )}

      {users && users.items.length === 0 && (
        <p className="px-5 py-6 text-sm text-espera-text-muted">Ningún usuario coincide con estos filtros.</p>
      )}

      {users && users.items.length > 0 && (
        <ul>
          {users.items.map((user) => {
            const isSelf = user.userId === currentUserId
            const isUnblocking = unblockMutation.isPending && unblockMutation.variables === user.userId
            const isBlocking = blockMutation.isPending && blockMutation.variables?.userId === user.userId

            return (
              <li
                className="flex flex-wrap items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0"
                key={user.userId}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-espera-text">
                    {user.firstName} {user.lastName}
                    {isSelf && <span className="ml-2 text-xs font-normal text-espera-text-muted">(vos)</span>}
                  </p>
                  <p className="truncate text-xs text-espera-text-muted">
                    {user.email} · {roleLabels[user.role] ?? user.role} · alta {formatDate(user.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
                    approvalTagClass[user.approvalStatus] ?? approvalTagClass.pending
                  }`}
                >
                  {approvalLabels[user.approvalStatus] ?? user.approvalStatus}
                </span>
                {user.isBlocked && (
                  <span className="shrink-0 rounded-md bg-espera-danger-soft px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-espera-danger">
                    Bloqueado
                  </span>
                )}
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  {user.isBlocked ? (
                    <FormButton
                      isPending={isUnblocking}
                      onClick={() => unblockMutation.mutate(user.userId)}
                      pendingLabel="Desbloqueando…"
                      type="button"
                      variant="solid"
                    >
                      Desbloquear
                    </FormButton>
                  ) : (
                    // El backend no impide que un super admin se bloquee a sí
                    // mismo (BlockUserUseCase no lo controla): bloquear la propia
                    // cuenta revoca las sesiones y deja al admin afuera.
                    <button
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isBlocking || isSelf}
                      onClick={() => setUserToBlock(user)}
                      title={isSelf ? 'No podés bloquear tu propia cuenta.' : undefined}
                      type="button"
                    >
                      Bloquear
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {unblockMutation.isError && (
        <div className="border-t border-espera-border p-4">
          <FormError>{errorMessage(unblockMutation.error, 'No pudimos desbloquear al usuario.')}</FormError>
        </div>
      )}

      {blockMutation.isError && (
        <div className="border-t border-espera-border p-4">
          <FormError>{errorMessage(blockMutation.error, 'No pudimos bloquear al usuario.')}</FormError>
        </div>
      )}

      {users && users.total > users.pageSize && (
        <div className="flex items-center justify-between border-t border-espera-border px-5 py-3 text-sm text-espera-text-muted">
          <span>
            Página {page} de {totalPages} · {users.total} usuarios
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-espera-border bg-espera-surface px-3 py-1.5 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              className="rounded-md border border-espera-border bg-espera-surface px-3 py-1.5 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        confirmDisabled={blockReason.trim().length === 0}
        confirmLabel="Bloquear usuario"
        description={
          userToBlock
            ? `${userToBlock.firstName} ${userToBlock.lastName} (${userToBlock.email}) pierde el acceso de inmediato: se cierran todas sus sesiones y no va a poder volver a ingresar hasta que lo desbloquees.`
            : ''
        }
        isConfirming={blockMutation.isPending}
        onCancel={closeBlockDialog}
        onConfirm={() =>
          userToBlock && blockMutation.mutate({ userId: userToBlock.userId, reason: blockReason.trim() })
        }
        open={Boolean(userToBlock)}
        title="¿Bloquear a este usuario?"
      >
        <label className="block text-sm font-medium text-espera-text" htmlFor="block-user-reason">
          Motivo del bloqueo
        </label>
        <textarea
          className="mt-1.5 w-full rounded-lg border border-espera-border bg-espera-surface px-3 py-2 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          id="block-user-reason"
          maxLength={500}
          onChange={(event) => setBlockReason(event.target.value)}
          rows={3}
          value={blockReason}
        />
      </ConfirmDialog>
    </div>
  )
}

function FilterField({ children, label }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-espera-text-muted">
      {label}
      {children}
    </label>
  )
}
