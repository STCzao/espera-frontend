export function QrPreview({ qrUrl }) {
  return qrUrl ? <img src={qrUrl} alt="QR del negocio" /> : <div>QR pendiente</div>
}
