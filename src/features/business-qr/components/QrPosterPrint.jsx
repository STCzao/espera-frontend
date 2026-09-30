// Rendered off-screen and only shown via the `@media print` rules in
// index.css (`.qr-poster-print`) — this is the sheet that actually comes out
// of the printer when the user clicks "Imprimir cartel", not something meant
// to be visible in the normal page flow.
export function QrPosterPrint({ businessName, imageUrl }) {
  return (
    <div aria-hidden="true" className="qr-poster-print">
      <img alt="Espera" className="qr-poster-print__logo" src="/Logo_espera.png" />
      <h1 className="qr-poster-print__title">
        Escaneá
        <br />y sacá tu turno
      </h1>
      {businessName && <p className="qr-poster-print__business">{businessName}</p>}

      <div className="qr-poster-print__qr-card">
        {imageUrl && <img alt="QR para sacar turno" src={imageUrl} />}
      </div>

      <p className="qr-poster-print__hint">Abrí la cámara de tu celular y apuntá al código</p>
    </div>
  )
}
