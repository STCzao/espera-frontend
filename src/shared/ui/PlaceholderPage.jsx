import { CheckCircle2 } from 'lucide-react'

export function PlaceholderPage({ title, description, items = [] }) {
  return (
    <article className="placeholder">
      <h1>{title}</h1>
      <p>{description}</p>
      {items.length > 0 && (
        <ul className="status-list">
          {items.map((item) => (
            <li key={item}>
              <CheckCircle2 size={18} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
