import { AuthVisualScene } from './AuthVisualScene.jsx'

export function LoginVisualScene({ children, reduceMotion }) {
  return (
    <AuthVisualScene
      description="Iniciá sesión para configurar tu negocio: horarios, equipo y accesos, todo desde un solo lugar."
      reduceMotion={reduceMotion}
      title="Tu negocio, en orden."
    >
      {children}
    </AuthVisualScene>
  )
}
