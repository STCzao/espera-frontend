import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

export function ConfirmDialog({
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  description,
  isConfirming = false,
  onCancel,
  onConfirm,
  open,
  title,
}) {
  const confirmButtonRef = useRef(null)

  useEffect(() => {
    if (open) {
      confirmButtonRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div
        aria-describedby="confirm-dialog-description"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-lg border border-espera-border bg-white p-6 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.25)]"
        role="alertdialog"
      >
        <h2 className="m-0 text-lg font-bold" id="confirm-dialog-title">
          {title}
        </h2>
        <p className="mt-2 text-sm text-espera-text-muted" id="confirm-dialog-description">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-espera-border bg-white px-4 text-sm font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isConfirming}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-espera-danger px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isConfirming}
            onClick={onConfirm}
            ref={confirmButtonRef}
            type="button"
          >
            {isConfirming && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
