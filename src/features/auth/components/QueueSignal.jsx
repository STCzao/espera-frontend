export function QueueSignal({ points = ['Cuenta', 'Negocio', 'Panel'], reduceMotion }) {
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
