export function QueueSignal({ points = ['Cuenta', 'Negocio', 'Panel'], reduceMotion }) {
  return (
    <div className={['queue-steps relative inline-grid grid-cols-3 gap-5 pl-0', reduceMotion ? 'is-static' : ''].join(' ')}>
      {/* Two segments (dot1↔dot2, dot2↔dot3), each stopping 13px short of
          the dot's own center (7px radius + 6px breathing room) instead of
          one strip running from the first dot's center to the last's —
          otherwise it runs right past every dot in between with no gap.
          Dot centers sit at 7px / 127px / 247px (100px items + 20px gaps in
          this `inline-grid`-shrunk, 340px-wide container), so the segments
          span 20–114px and 140–234px. */}
      <div className="absolute left-[20px] right-[226px] top-[7px] h-px bg-white/22" />
      <div className="absolute left-[140px] right-[106px] top-[7px] h-px bg-white/22" />
      <div className="queue-steps__progress--1 absolute left-[20px] right-[226px] top-[7px] h-px origin-left bg-white/80" />
      <div className="queue-steps__progress--2 absolute left-[140px] right-[106px] top-[7px] h-px origin-left bg-white/80" />

      {points.map((point, index) => (
        <div
          className={`queue-steps__item queue-steps__item--${index + 1} relative w-[100px] pt-6`}
          key={point}
        >
          <span className="queue-steps__dot absolute left-0 top-0 h-3.5 w-3.5 rounded-full bg-white/90" />
          <span className="queue-steps__meta block text-xs font-semibold uppercase tracking-[0.18em] text-white/52">
            Paso {index + 1}
          </span>
          <span className="queue-steps__label mt-1 block text-xl font-semibold text-white/82">{point}</span>
        </div>
      ))}
    </div>
  )
}
