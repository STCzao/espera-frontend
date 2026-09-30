import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi.js'
import { sessionQueryKey } from '../hooks/useSessionBootstrap.js'
import { clearSession } from '../../../shared/auth/session.js'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'

export function LogoutButton({ className }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    // Clears local session and leaves the panel even on a network error:
    // authApi.logout() only clears it after a successful response, but the
    // user's intent to log out shouldn't get stuck on the backend call.
    onSettled: () => {
      clearSession()
      queryClient.removeQueries({ queryKey: sessionQueryKey })
      navigate('/login', { replace: true })
    },
  })

  return (
    <>
      <button className={className} onClick={() => setIsConfirmOpen(true)} type="button">
        <LogOut size={16} aria-hidden="true" />
        <span className="panel-layout__logout-label">Cerrar sesión</span>
      </button>
      <ConfirmDialog
        confirmLabel="Cerrar sesión"
        description="Vas a tener que volver a iniciar sesión para acceder al panel."
        isConfirming={logoutMutation.isPending}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={() => logoutMutation.mutate()}
        open={isConfirmOpen}
        title="¿Cerrar sesión?"
      />
    </>
  )
}
