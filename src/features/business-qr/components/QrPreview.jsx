export function QrPreview({ imageUrl, isLoading }) {
  return (
    <div className="grid h-56 w-56 place-items-center rounded-lg border border-espera-border bg-white p-3">
      {isLoading && <span className="text-sm text-espera-text-muted">Generando…</span>}
      {!isLoading && imageUrl && <img alt="QR del negocio" className="h-full w-full object-contain" src={imageUrl} />}
      {!isLoading && !imageUrl && <span className="text-sm text-espera-text-muted">QR pendiente</span>}
    </div>
  )
}
