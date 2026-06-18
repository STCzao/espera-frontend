export function AuthFormShell({ title, description, children }) {
  return (
    <section className="auth-card">
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </section>
  )
}
