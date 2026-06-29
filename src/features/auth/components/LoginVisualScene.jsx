import { motion } from 'framer-motion'

export function LoginVisualScene({ children, reduceMotion }) {
  return (
    <main className="relative isolate h-svh w-full overflow-hidden bg-[#14001f] text-white">
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_22%_18%,rgba(170,84,167,0.4),transparent_24%),radial-gradient(circle_at_80%_76%,rgba(144,58,141,0.2),transparent_26%),linear-gradient(135deg,#500097_0%,#2a073f_52%,#110018_100%)]" />
      <AmbientMotion reduceMotion={reduceMotion} />
      <GhostLogo reduceMotion={reduceMotion} />

      <HeroStatement reduceMotion={reduceMotion} />

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
      className="pointer-events-none absolute left-5 top-[20%] z-10 max-w-[620px] sm:left-8 lg:left-12 xl:left-16"
      initial={reduceMotion ? false : { opacity: 0, x: -18 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className="mt-5 max-w-[11ch] text-[clamp(3.4rem,6.8vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.07em] text-white">
        Tu negocio, en orden.
      </h2>
      <p className="mt-7 max-w-[460px] text-lg leading-7 text-white/68">
        Iniciá sesión para configurar tu negocio: horarios, equipo y accesos,
        todo desde un solo lugar.
      </p>
    </motion.section>
  )
}

function GhostLogo({ reduceMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <motion.img
        alt=""
        animate={reduceMotion ? false : { opacity: [0.06, 0.12, 0.06], scale: [1, 1.025, 1] }}
        className="absolute -right-[14%] top-[-2%] w-[62%] rotate-[-13deg] opacity-10 mix-blend-screen blur-[1px]"
        src="/Logo_espera.png"
        transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
      />
    </div>
  )
}

function AmbientMotion({ reduceMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <AmbientGlow
        animate={reduceMotion ? false : { opacity: [0.12, 0.26, 0.12], x: [-16, 22, -16] }}
        className="absolute left-[-18%] top-[18%] h-[34%] w-[70%] rotate-[-18deg] rounded-full bg-white/10 blur-3xl"
        duration={9}
      />
      <AmbientGlow
        animate={reduceMotion ? false : { opacity: [0.1, 0.24, 0.1], y: [18, -22, 18] }}
        className="absolute bottom-[-16%] right-[-12%] h-[44%] w-[56%] rounded-full bg-[#aa54a7]/55 blur-3xl"
        duration={11}
      />
    </div>
  )
}

function AmbientGlow({ animate, className, duration }) {
  return (
    <motion.div animate={animate} className={className} transition={{ duration, ease: 'easeInOut', repeat: Infinity }} />
  )
}
