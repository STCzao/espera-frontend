import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { AuthFormShell } from '../../auth/components/AuthFormShell.jsx'
import { businessOnboardingApi } from '../api/businessOnboardingApi.js'
import { registerBusinessSchema } from '../model/businessOnboardingSchemas.js'

const defaultValues = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  businessName: '',
  businessSlug: '',
  categoryId: '',
  address: '',
}

export function BusinessRegisterPage() {
  const form = useForm({ defaultValues, resolver: zodResolver(registerBusinessSchema) })
  const registerMutation = useMutation({ mutationFn: businessOnboardingApi.registerBusiness })

  if (registerMutation.isSuccess) {
    return (
      <AuthFormShell title="Revisá tu email" description="La cuenta y el negocio se crearon correctamente.">
        <div className="success-list" role="status">
          <p>Te enviamos un email para verificar tu identidad.</p>
          <p>Tu negocio quedó pendiente de revisión comercial.</p>
        </div>
        <div className="button-row">
          <Link className="button" to="/login">Ir a iniciar sesión</Link>
        </div>
      </AuthFormShell>
    )
  }

  return (
    <AuthFormShell title="Registrá tu negocio" description="Creá tu cuenta y cargá los datos iniciales de tu negocio.">
      <form className="form-stack" onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))}>
        {Object.entries({
          firstName: 'Nombre',
          lastName: 'Apellido',
          email: 'Email',
          password: 'Contraseña',
          confirmPassword: 'Confirmar contraseña',
          businessName: 'Nombre del negocio',
          businessSlug: 'Identificador del negocio',
          categoryId: 'ID de categoría',
          address: 'Dirección (opcional)',
        }).map(([name, label]) => (
          <label key={name}>
            {label}
            <input
              {...form.register(name)}
              autoComplete={name === 'email' ? 'email' : undefined}
              type={name.toLowerCase().includes('password') ? 'password' : name === 'email' ? 'email' : 'text'}
            />
            {form.formState.errors[name] && <span className="form-error">{form.formState.errors[name].message}</span>}
          </label>
        ))}
        {registerMutation.isError && <p className="form-error" role="alert">{registerMutation.error.message}</p>}
        <button className="button" disabled={registerMutation.isPending} type="submit">
          {registerMutation.isPending ? 'Creando…' : 'Crear cuenta y negocio'}
        </button>
      </form>
    </AuthFormShell>
  )
}
