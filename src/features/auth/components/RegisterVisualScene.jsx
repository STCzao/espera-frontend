import { motion } from 'framer-motion'

export function RegisterVisualScene({ children, reduceMotion }) {
  return (
    <main className="relative isolate h-svh w-full overflow-hidden bg-[#14001f] text-white">
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_20%_12%,rgba(170,84,167,0.42),transparent_24%),radial-gradient(circle_at_78%_70%,rgba(144,58,141,0.22),transparent_26%),linear-gradient(135deg,#500097_0%,#2a073f_52%,#110018_100%)]" />
      <AmbientMotion reduceMotion={reduceMotion} />
      <GhostLogoField reduceMotion={reduceMotion} />

      <HeroStatement reduceMotion={reduceMotion} />

      <div className="absolute bottom-16 left-12 z-0 hidden lg:block xl:left-16">
        <QueueSignal reduceMotion={reduceMotion} />
      </div>

      <section className="relative z-20 grid h-svh min-h-0 place-items-center overflow-y-auto px-5 py-6 sm:px-8 lg:ml-auto lg:w-[46vw] lg:min-w-[560px] lg:px-12 xl:px-16">
        {children}
      </section>
    </main>
  )
}

function HeroStatement({ reduceMotion }) {
  return (
    <motion.section
      animate={reduceMotion ? false : { opacity: 1, x: 0 }}
      className="pointer-events-none absolute left-5 top-[18%] z-10 max-w-[620px] sm:left-8 lg:left-12 xl:left-16"
      initial={reduceMotion ? false : { opacity: 0, x: -18 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className="mt-5 max-w-[10ch] text-[clamp(3.6rem,7.4vw,7.8rem)] font-black uppercase leading-[0.82] tracking-[-0.075em] text-white">
        Tu local, sin espera.
      </h2>
      <p className="mt-7 max-w-[480px] text-lg leading-7 text-white/68">
        Creá tu cuenta y configurá tu negocio: cada ajuste que hagas define
        cuánto esperan tus clientes.
      </p>
    </motion.section>
  )
}

function GhostLogoField({ reduceMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <motion.img
        alt=""
        animate={reduceMotion ? false : { opacity: [0.06, 0.12, 0.06], scale: [1, 1.025, 1] }}
        className="absolute -right-[14%] top-[-2%] w-[62%] rotate-[-13deg] opacity-10 mix-blend-screen blur-[1px]"
        src="/Logo_espera.png"
        transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.img
        alt=""
        animate={reduceMotion ? false : { opacity: [0.04, 0.09, 0.04], x: [-18, 18, -18] }}
        className="absolute bottom-[-26%] left-[-16%] w-[58%] rotate-[16deg] opacity-10 mix-blend-screen blur-sm"
        src="/Logo_espera.png"
        transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity }}
      />
    </div>
  )
}

function AmbientMotion({ reduceMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <motion.div
        animate={reduceMotion ? false : { opacity: [0.12, 0.26, 0.12], x: [-16, 22, -16] }}
        className="absolute left-[-18%] top-[18%] h-[34%] w-[70%] rotate-[-18deg] rounded-full bg-white/10 blur-3xl"
        transition={{ duration: 9, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.div
        animate={reduceMotion ? false : { opacity: [0.1, 0.24, 0.1], y: [18, -22, 18] }}
        className="absolute bottom-[-16%] right-[-12%] h-[44%] w-[56%] rounded-full bg-[#aa54a7]/55 blur-3xl"
        transition={{ duration: 11, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.div
        animate={reduceMotion ? false : { opacity: [0, 0.26, 0], y: ['-18%', '118%'] }}
        className="absolute left-[58%] top-[-20%] h-[34%] w-px bg-white"
        transition={{ duration: 6.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.2 }}
      />
    </div>
  )
}

function QueueSignal({ reduceMotion }) {
  const points = ['Cuenta', 'Negocio', 'Panel']

  return (
    <div className={['queue-steps relative grid grid-cols-3 gap-5 pl-0', reduceMotion ? 'is-static' : ''].join(' ')}>
      <div className="absolute left-4 right-4 top-[7px] h-px bg-white/22" />
      <div className="queue-steps__progress absolute left-4 right-4 top-[7px] h-px origin-left bg-white/80" />

      {points.map((point, index) => (
        <div
          className={`queue-steps__item queue-steps__item--${index + 1} relative min-w-[84px] pt-6`}
          key={point}
        >
          <span className="queue-steps__dot absolute left-0 top-0 h-3.5 w-3.5 rounded-full border border-white/70 bg-white" />
          <span className="queue-steps__meta block text-xs font-semibold uppercase tracking-[0.18em] text-white/52">
            Paso {index + 1}
          </span>
          <span className="queue-steps__label mt-1 block text-xl font-semibold text-white/82">{point}</span>
        </div>
      ))}
    </div>
  )
}
