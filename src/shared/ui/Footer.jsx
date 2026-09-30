const toneClasses = {
  dark: 'text-white/50',
  light: 'text-espera-text-muted',
}

const linkToneClasses = {
  dark: 'text-white/70 hover:text-white',
  light: 'text-espera-text hover:text-espera-purple',
}

export function Footer({ className = '', variant = 'light' }) {
  const year = new Date().getFullYear()

  return (
    <footer
      className={`flex flex-col items-center gap-1 py-3 text-center text-xs sm:flex-row sm:justify-center sm:gap-1.5 ${toneClasses[variant]} ${className}`}
    >
      <span>© {year} Espera. Todos los derechos reservados.</span>
      <span className="hidden sm:inline">·</span>
      <a
        className={`font-semibold underline-offset-2 hover:underline ${linkToneClasses[variant]}`}
        href="https://www.instagram.com/gentechman.soft"
        rel="noopener noreferrer"
        target="_blank"
      >
        Powered by GentechMan
      </a>
    </footer>
  )
}
