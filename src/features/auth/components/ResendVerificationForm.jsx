import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authApi } from '../api/authApi.js'
import { resendVerificationSchema } from '../model/authSchemas.js'

// Backend errors here (already verified, rate limited, send failure) don't carry
// a functional code, so a single generic message covers all of them.
const genericErrorMessage = 'No pudimos reenviar el email. Probá de nuevo en unos minutos.'

export function ResendVerificationForm() {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({ defaultValues: { email: '' }, resolver: zodResolver(resendVerificationSchema) })

  const resendMutation = useMutation({ mutationFn: authApi.resendVerification })

  if (resendMutation.isSuccess) {
    return <p role="status">Te enviamos un nuevo enlace de verificación.</p>
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit((values) => resendMutation.mutate(values))} noValidate>
      <label>
        Email
        <input {...register('email')} autoComplete="email" type="email" />
        {errors.email && <span className="form-error">{errors.email.message}</span>}
      </label>
      {resendMutation.isError && (
        <p className="form-error" role="alert">
          {genericErrorMessage}
        </p>
      )}
      <button className="button" disabled={resendMutation.isPending} type="submit">
        {resendMutation.isPending ? 'Enviando…' : 'Reenviar verificación'}
      </button>
    </form>
  )
}
