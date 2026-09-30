const typeLabels = {
  boolean: 'Sí/No',
  number: 'Número',
  select: 'Selección',
  text: 'Texto',
}

export function CategoryAttributeField({ attribute }) {
  return (
    <li>
      <strong>{attribute.label}</strong>
      <span> — {typeLabels[attribute.type] ?? attribute.type}</span>
      {attribute.required && <span> (obligatorio)</span>}
    </li>
  )
}
