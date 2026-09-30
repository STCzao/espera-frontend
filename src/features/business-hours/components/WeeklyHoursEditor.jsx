import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'

const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const inputClassName =
  'min-h-12 rounded-lg border border-espera-border bg-espera-surface px-4 text-base font-normal text-espera-text outline-none transition focus:border-espera-purple focus:ring-4 focus:ring-espera-purple-soft'

export function WeeklyHoursEditor({ control, errors, register }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'weeklyHours' })
  // zodResolver puts array-level refine() errors under `.root`, not `.message`
  // directly, when the field is registered via useFieldArray.
  const arrayError = errors?.weeklyHours?.root?.message ?? errors?.weeklyHours?.message ?? null

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
          Horario semanal
        </span>
        <button
          className="inline-flex items-center gap-1 text-sm font-semibold text-espera-purple hover:underline"
          onClick={() => append({ dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00' })}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Agregar rango
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-espera-text-muted">Todavía no cargaste ningún horario de atención.</p>
      )}

      <div className="grid gap-3">
        {fields.map((field, index) => (
          <div
            className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_140px_140px_auto]"
            key={field.id}
          >
            <label className="grid gap-2 text-sm font-semibold text-espera-text">
              Día
              <select className={inputClassName} {...register(`weeklyHours.${index}.dayOfWeek`, { valueAsNumber: true })}>
                {dayLabels.map((label, day) => (
                  <option key={label} value={day}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-espera-text">
              Abre
              <input className={inputClassName} type="time" {...register(`weeklyHours.${index}.opensAt`)} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-espera-text">
              Cierra
              <input className={inputClassName} type="time" {...register(`weeklyHours.${index}.closesAt`)} />
            </label>
            <button
              aria-label="Quitar rango"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-espera-border text-espera-danger transition-colors hover:bg-espera-purple-soft"
              onClick={() => remove(index)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
        ))}
      </div>

      {arrayError && <span className="text-xs font-normal text-espera-danger">{arrayError}</span>}
    </div>
  )
}
