import { AuthVisualScene } from '../../auth/components/AuthVisualScene.jsx'

export function BusinessCreateVisualScene({ children, reduceMotion }) {
  return (
    <AuthVisualScene
      description="Cargá los datos iniciales de tu negocio. Quedará pendiente de revisión hasta que lo aprobemos."
      reduceMotion={reduceMotion}
      title="Sumá tu negocio."
    >
      {children}
    </AuthVisualScene>
  )
}
