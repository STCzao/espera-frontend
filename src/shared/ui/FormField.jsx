export function FormField({ description, error, label, registration, type = 'text', ...props }) {
  const inputId = registration.name
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <label className="grid gap-2 text-sm font-semibold text-espera-text" htmlFor={inputId}>
      {label}
      <input
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={Boolean(error)}
        className="min-h-12 rounded-lg border border-espera-border bg-espera-surface px-4 text-base font-normal text-espera-text outline-none transition placeholder:text-espera-text-muted/70 focus:border-espera-purple focus:ring-4 focus:ring-espera-purple-soft"
        id={inputId}
        type={type}
        {...props}
        {...registration}
      />
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
    </label>
  )
}
