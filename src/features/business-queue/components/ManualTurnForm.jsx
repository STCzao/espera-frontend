import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
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
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({ defaultValues: { guestName: '' }, resolver: zodResolver(manualTurnSchema) })

  async function onSubmit(values) {
    try {
      await mutation.mutateAsync(values.guestName)
      onSubmitted()
    } catch {
      // mutation.isError already drives the error message shown by the page.
    }
  }

  return (
    <form className="flex flex-wrap items-end gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="w-72">
        <FormField
          error={errors.guestName?.message}
          label="Agregar turno manual"
          placeholder="Nombre de la persona"
          registration={register('guestName')}
        />
      </div>
      <div className="w-44">
        <FormButton icon={UserPlus} isPending={mutation.isPending} pendingLabel="Agregando…" variant="outline">
          Agregar
        </FormButton>
      </div>
    </form>
  )
}
