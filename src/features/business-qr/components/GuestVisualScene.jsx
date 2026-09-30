import { AuthVisualScene } from '../../auth/components/AuthVisualScene.jsx'
import { QueueSignal } from '../../auth/components/QueueSignal.jsx'

const points = ['Escaneás', 'Sacás turno', 'Te llamamos']

export function GuestVisualScene({ children, description, reduceMotion, title }) {
  return (
    <AuthVisualScene
      decoration={<QueueSignal points={points} reduceMotion={reduceMotion} />}
      description={description}
      reduceMotion={reduceMotion}
      title={title}
    >
      {children}
    </AuthVisualScene>
  )
}
