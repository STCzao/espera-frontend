export function PlanLimitExceededNotice({ count, label, limit }) {
  return (
    <div className="business-alert business-alert--warning" role="status">
      Tenés {count} {label}, pero tu plan permite hasta {limit}. Las que ya tenés siguen funcionando, pero no vas a
      poder crear otra hasta reducir la cantidad o cambiar de plan.
    </div>
  )
}
