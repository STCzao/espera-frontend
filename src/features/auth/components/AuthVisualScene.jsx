import { motion } from 'framer-motion'
import { Footer } from '../../../shared/ui/Footer.jsx'

export function AuthVisualScene({ children, decoration, description, reduceMotion, title }) {
  return (
    <main className="relative isolate min-h-svh w-full overflow-hidden bg-[#14001f] text-white lg:h-svh">
      <BackgroundGradient />
      <AmbientGlows reduceMotion={reduceMotion} />
      <GhostLogo reduceMotion={reduceMotion} />

      <HeroStatement description={description} reduceMotion={reduceMotion} title={title} />

      {decoration && <div className="absolute bottom-16 left-12 z-0 hidden lg:block xl:left-16">{decoration}</div>}

      {/* Below `lg` this is a normal, page-scrolling block (no internal
          scroll container) — mobile browsers resize their own chrome
          (address bar) against `100svh`/`100dvh` in ways that make a nested
          fixed-height `overflow-y-auto` region unreliable, and it was
          clipping/overlapping the card on real devices even though it
          measured fine in a fixed-size headless viewport. From `lg` up we
          go back to the split-screen behavior: a fixed-height column with
          its own scroll, so the hero on the left can stay put while only
          this column scrolls. The inner `m-auto` wrapper centers the
          [card, footer] group as a unit when it fits, and — unlike
          `justify-center` — cedes to normal top-aligned flow instead of
          clipping once the group is taller than the available height. */}
      <section className="relative z-20 flex min-h-svh flex-col items-center px-5 py-6 sm:px-8 lg:h-svh lg:overflow-y-auto lg:pb-16 lg:ml-auto lg:w-[46vw] lg:min-w-[560px] lg:px-12 xl:px-16">
        <div className="m-auto flex flex-col items-center gap-6">
          {children}
          {/* Below `lg` the footer is a normal flex item, centered within
              this (full-width) section like everything else. From `lg` up
              the section narrows to the right-hand 46vw column, so staying
              in flow here would center the footer against the card instead
              of the screen — `lg:fixed` pulls it out of this box entirely
              and repositions it against the viewport, where `inset-x-0`
              spans the *whole* screen width regardless of where this
              column sits. `lg:pb-16` on the section above keeps the card's
              own scrollable content clear of it once scrolled to the end —
              but the card can still scroll *underneath* the fixed footer
              at any point before that, and white-ish text turns unreadable
              over the card's light background. A flat panel behind the
              footer fixed that but looked like its own separate bar bolted
              onto the screen; a soft gradient — transparent well above the
              text, solid only right at the very bottom edge — keeps the
              legibility without ever reading as a distinct piece of UI. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-28 bg-gradient-to-t from-[#14001f] via-[#14001f]/70 to-transparent lg:fixed lg:z-30 lg:block" />
          <Footer className="lg:fixed lg:inset-x-0 lg:bottom-0 lg:z-30" variant="dark" />
        </div>
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
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      // Below `lg` this sits in normal flow, above the card, at a much
      // smaller size — it used to be `hidden` entirely below `lg`, which
      // read as dead/empty on mobile. From `lg` up it goes back to being an
      // absolutely-positioned decorative block (`pointer-events-none` since
      // it can sit behind/beside the card there): `lg:max-w-[380px]` stays
      // narrow through the lg bracket because the card's `lg:min-w-[560px]`
      // eats most of the width there — the original constant 620px
      // max-width overlapped the card head-on for any viewport under
      // ~1280px. `xl:` widens back out once the card's 46vw share actually
      // leaves room for it.
      className="relative z-10 px-5 pt-8 text-center sm:px-8 lg:pointer-events-none lg:absolute lg:left-12 lg:top-[18%] lg:max-w-[380px] lg:px-0 lg:pt-0 lg:text-left xl:left-16 xl:max-w-[620px]"
      initial={reduceMotion ? false : { opacity: 0, y: -14 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className="text-[clamp(1.9rem,9vw,2.6rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white lg:max-w-[12ch] lg:text-[clamp(2.3rem,4.4vw,3.4rem)] lg:leading-[0.9] lg:tracking-[-0.06em] xl:text-[clamp(3.4rem,7vw,7.6rem)] xl:leading-[0.84] xl:tracking-[-0.07em]">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-[380px] text-sm leading-5 text-white/68 lg:mx-0 lg:mt-7 lg:max-w-[420px] lg:text-base lg:leading-6 xl:max-w-[480px] xl:text-lg xl:leading-7">
        {description}
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
