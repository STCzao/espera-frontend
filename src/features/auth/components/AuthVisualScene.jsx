import { motion } from 'framer-motion'

export function AuthVisualScene({ children, decoration, description, reduceMotion, title }) {
  return (
    <main className="relative isolate h-svh w-full overflow-hidden bg-[#14001f] text-white">
      <BackgroundGradient />
      <AmbientGlows reduceMotion={reduceMotion} />
      <GhostLogo reduceMotion={reduceMotion} />

      <HeroStatement description={description} reduceMotion={reduceMotion} title={title} />

      {decoration && <div className="absolute bottom-16 left-12 z-0 hidden lg:block xl:left-16">{decoration}</div>}

      <section className="relative z-20 grid h-svh min-h-0 place-items-center overflow-y-auto px-5 py-6 sm:px-8 lg:ml-auto lg:w-[46vw] lg:min-w-[560px] lg:px-12 xl:px-16">
        {children}
      </section>
    </main>
  )
}

function BackgroundGradient() {
  return (
    <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_20%_12%,rgba(170,84,167,0.42),transparent_24%),radial-gradient(circle_at_78%_70%,rgba(144,58,141,0.22),transparent_26%),linear-gradient(135deg,#500097_0%,#2a073f_52%,#110018_100%)]" />
  )
}

function HeroStatement({ description, reduceMotion, title }) {
  return (
    <motion.section
      animate={reduceMotion ? false : { opacity: 1, x: 0 }}
      className="pointer-events-none absolute left-5 top-[18%] z-10 max-w-[620px] sm:left-8 lg:left-12 xl:left-16"
      initial={reduceMotion ? false : { opacity: 0, x: -18 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className="mt-5 max-w-[12ch] text-[clamp(3.4rem,7vw,7.6rem)] font-black uppercase leading-[0.84] tracking-[-0.07em] text-white">
        {title}
      </h2>
      <p className="mt-7 max-w-[480px] text-lg leading-7 text-white/68">{description}</p>
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

function AmbientGlows({ reduceMotion }) {
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
      <AmbientGlow
        animate={reduceMotion ? false : { opacity: [0, 0.26, 0], y: ['-18%', '118%'] }}
        className="absolute left-[58%] top-[-20%] h-[34%] w-px bg-white"
        duration={6.5}
        repeatDelay={1.2}
      />
    </div>
  )
}

function AmbientGlow({ animate, className, duration, repeatDelay }) {
  return (
    <motion.div
      animate={animate}
      className={className}
      transition={{ duration, ease: 'easeInOut', repeat: Infinity, repeatDelay }}
    />
  )
}
