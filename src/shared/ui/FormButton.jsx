import { Loader2 } from 'lucide-react'

const variantClasses = {
  // Matches the auth screens (login/register/business-new): white ground, purple label.
  outline: 'border border-espera-border bg-white text-espera-purple hover:bg-espera-purple-soft',
  // Panel primary actions: flat purple fill, no gradient or glow.
  solid: 'border border-espera-purple bg-espera-purple text-white hover:bg-[#3d0074]',
  // Companion to `solid` in a two-button row: tinted fill, no border.
  secondary: 'border border-transparent bg-espera-purple-soft text-espera-purple hover:brightness-95',
}

// `lg` meets the 64px minimum touch target for primary actions on mobile
// (HU-6.6) — use it for a screen's single most important action, not every
// button, or it stops meaning anything.
const sizeClasses = {
  default: 'min-h-12',
  lg: 'min-h-16',
}

export function FormButton({
  children,
  icon: Icon,
  isPending,
  pendingLabel,
  size = 'default',
  type = 'submit',
  variant = 'outline',
  ...props
}) {
  return (
    <button
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-70 ${sizeClasses[size]} ${variantClasses[variant]}`}
      disabled={isPending}
      type={type}
      {...props}
    >
      {isPending ? (
        <>
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        <>
          {children}
          {Icon && <Icon size={18} aria-hidden="true" />}
        </>
      )}
    </button>
  )
}
