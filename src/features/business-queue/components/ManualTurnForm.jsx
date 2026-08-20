import { zodResolver } from '@hookform/resolvers/zod'
import { PhoneCall, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { minutesUntil } from '../../../shared/format/duration.js'
import { manualTurnSchema } from '../model/businessQueueSchemas.js'

export function ManualTurnForm({ mutation }) {
  // Remounting via `key` on success (instead of calling reset()) sidesteps a
  // case where RHF's imperative reset() didn't clear the DOM input value in
  // this codebase's React Compiler setup — a fresh mount always starts blank.
  const [formKey, setFormKey] = useState(0)

  return (
    <ManualTurnFormFields
      key={formKey}
      mutation={mutation}
      onSubmitted={() => setFormKey((key) => key + 1)}
    />
  )
}

function ManualTurnFormFields({ mutation, onSubmitted }) {
  const [isPhoneReservation, setIsPhoneReservation] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: { guestName: '', phone: '', arrivalTime: '' },
    resolver: zodResolver(manualTurnSchema),
  })

  async function onSubmit(values) {
    try {
      await mutation.mutateAsync({
        guestName: values.guestName,
        phone: values.phone || undefined,
        source: isPhoneReservation ? 'phone' : 'manual',
        // arrivalTime is meaningless for a walk-in (source "manual") — the
        // backend ignores etaMinutes either way, but not sending it keeps
        // the request honest about what was actually asked.
        etaMinutes: isPhoneReservation ? minutesUntil(values.arrivalTime) : undefined,
      })
      onSubmitted()
    } catch {
      // mutation.isError already drives the error message shown by the page.
    }
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-64">
          <FormField
            error={errors.guestName?.message}
            label="Agregar turno manual"
            placeholder="Nombre de la persona"
            registration={register('guestName')}
          />
        </div>

        <div className="grid gap-2">
          {/* Invisible label-height spacer — mirrors FormField's own
              "label row, then gap-2, then h-12 control" structure so the
              checkbox lines up with the name input next to it instead of
              guessing the offset with padding. */}
          <span aria-hidden="true" className="select-none text-sm font-semibold text-transparent">
            .
          </span>
          <label className="flex h-12 items-center gap-2 text-sm font-medium text-espera-text">
            <input
              checked={isPhoneReservation}
              className="h-4 w-4 rounded border-espera-border text-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
              onChange={(event) => setIsPhoneReservation(event.target.checked)}
              type="checkbox"
            />
            Reserva por teléfono/WhatsApp
          </label>
        </div>
      </div>

      {isPhoneReservation && (
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-espera-border bg-espera-muted/40 p-3">
          <div className="w-52">
            <FormField
              error={errors.phone?.message}
              label="Teléfono (opcional)"
              placeholder="Ej. 381 555-1234"
              registration={register('phone')}
              type="tel"
            />
          </div>
          <div className="w-40">
            <FormField
              error={errors.arrivalTime?.message}
              label="Hora de llegada"
              registration={register('arrivalTime')}
              type="time"
            />
          </div>
        </div>
      )}

      <div className="w-44">
        <FormButton
          icon={isPhoneReservation ? PhoneCall : UserPlus}
          isPending={mutation.isPending}
          pendingLabel="Agregando…"
          variant="outline"
        >
          Agregar
        </FormButton>
      </div>
    </form>
  )
}
