import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { AuthFormShell } from '../../auth/components/AuthFormShell.jsx'
import { businessOnboardingApi } from '../api/businessOnboardingApi.js'
import { createBusinessSchema } from '../model/businessOnboardingSchemas.js'

const defaultValues = {
  name: '',
  slug: '',
  categoryId: '',
  address: '',
}

const fieldLabels = {
  name: 'Nombre del negocio',
  slug: 'Identificador del negocio',
  categoryId: 'ID de categoría',
  address: 'Dirección',
}

export function BusinessCreatePage() {
  const navigate = useNavigate()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({ defaultValues, resolver: zodResolver(createBusinessSchema) })
  const createMutation = useMutation({
    mutationFn: businessOnboardingApi.createBusiness,
    onSuccess: ({ businessId }) => navigate(`/panel/business/${businessId}`, { replace: true }),
  })

  return (
    <AuthFormShell
      title="Registrá tu negocio"
      description="Ya tenés cuenta; solo nos faltan los datos de tu negocio."
    >
      <form className="form-stack" onSubmit={handleSubmit((values) => createMutation.mutate(values))} noValidate>
        {Object.entries(fieldLabels).map(([name, label]) => (
          <label key={name}>
            {label}
            <input {...register(name)} type="text" />
            {errors[name] && <span className="form-error">{errors[name].message}</span>}
          </label>
        ))}
        {createMutation.isError && (
          <p className="form-error" role="alert">
            {createMutation.error.message}
          </p>
        )}
        <button className="button" disabled={createMutation.isPending} type="submit">
          {createMutation.isPending ? 'Creando…' : 'Crear negocio'}
        </button>
      </form>
    </AuthFormShell>
  )
}
