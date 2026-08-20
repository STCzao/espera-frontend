export function FormSelect({ children, error, label, loading, loadingLabel, placeholder, registration, ...props }) {
  const inputId = registration.name
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <label className="grid gap-2 text-sm font-semibold text-espera-text" htmlFor={inputId}>
      {label}
      <select
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        className="min-h-12 rounded-lg border border-espera-border bg-espera-surface px-4 text-base font-normal text-espera-text outline-none transition focus:border-espera-purple focus:ring-4 focus:ring-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-70"
        defaultValue=""
        disabled={loading}
        id={inputId}
        {...props}
        {...registration}
      >
        <option disabled value="">
          {loading ? loadingLabel : placeholder}
        </option>
        {children}
      </select>
      {error && (
        <span className="text-xs font-normal text-espera-danger" id={errorId}>
          {error}
        </span>
      )}
    </label>
  )
}
