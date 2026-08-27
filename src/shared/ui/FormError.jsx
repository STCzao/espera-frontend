// The one place a form-level error is shown — reuses .business-alert so an
// error looks the same everywhere (auth screens, guest QR flow, the panel)
// instead of each form re-implementing its own box. `!mb-0` kills the
// class's own margin-bottom, which would double up with the `gap-*` these
// forms already use for spacing between fields.
export function FormError({ children }) {
  return (
    <div className="business-alert business-alert--danger !mb-0" role="alert">
      {children}
    </div>
  )
}
