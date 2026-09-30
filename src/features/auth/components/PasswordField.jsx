import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function PasswordField({
  description,
  error,
  label,
  registration,
  toggleLabelHidden = 'Mostrar contraseña',
  toggleLabelVisible = 'Ocultar contraseña',
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false)
  const inputId = registration.name
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const toggleLabel = isVisible ? toggleLabelVisible : toggleLabelHidden

  return (
    <div className="grid gap-2 text-sm font-semibold text-espera-text">
      <label htmlFor={inputId}>{label}</label>
      <div className="relative">
        <input
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={Boolean(error)}
          className="min-h-12 w-full rounded-lg border border-espera-border bg-espera-surface px-4 pr-12 text-base font-normal text-espera-text outline-none transition placeholder:text-espera-text-muted/70 focus:border-espera-purple focus:ring-4 focus:ring-espera-purple-soft"
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          {...props}
          {...registration}
        />
        <button
          aria-label={toggleLabel}
          className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-espera-text-muted transition hover:bg-espera-purple-soft hover:text-espera-purple focus:outline-none focus:ring-4 focus:ring-espera-purple-soft"
          onClick={() => setIsVisible((current) => !current)}
          title={toggleLabel}
          type="button"
        >
          {isVisible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
      {description && !error && (
        <span className="text-xs font-normal text-espera-text-muted" id={descriptionId}>
          {description}
        </span>
      )}
      {error && (
        <span className="text-xs font-normal text-espera-danger" id={errorId}>
          {error}
        </span>
      )}
    </div>
  )
}
