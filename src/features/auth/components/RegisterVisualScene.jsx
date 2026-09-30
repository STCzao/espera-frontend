import { AuthVisualScene } from './AuthVisualScene.jsx'
import { QueueSignal } from './QueueSignal.jsx'

export function RegisterVisualScene({ children, reduceMotion }) {
  return (
    <AuthVisualScene
      decoration={<QueueSignal reduceMotion={reduceMotion} />}
      description="Creá tu cuenta y configurá tu negocio: cada ajuste que hagas define cuánto esperan tus clientes."
      reduceMotion={reduceMotion}
      title="Tu local, sin espera."
    >
      {children}
    </AuthVisualScene>
  )
}
