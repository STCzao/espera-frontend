import { Loader2 } from 'lucide-react'
import { GoogleIcon } from './GoogleIcon.jsx'

export function GoogleAuthButton({ googleMutation, onClick }) {
  return (
    <>
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-espera-text-muted">
        <span className="h-px flex-1 bg-espera-border" />
        o
        <span className="h-px flex-1 bg-espera-border" />
      </div>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-espera-border bg-white px-4 font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft focus:outline-none focus:ring-4 focus:ring-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-70"
        disabled={googleMutation.isPending}
        onClick={onClick}
        type="button"
      >
        {googleMutation.isPending ? (
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        Continuar con Google
      </button>

      {googleMutation.isError && (
        <div className="rounded-lg border border-[#f3b7ce] bg-[#fff3f7] px-4 py-3 text-sm text-espera-danger" role="alert">
          No pudimos conectar con Google. Intentá nuevamente.
        </div>
      )}
    </>
  )
}
