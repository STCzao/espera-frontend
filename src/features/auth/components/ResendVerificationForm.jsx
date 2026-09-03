import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
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
    return (
      <p className="mt-8 text-sm text-espera-text-muted" role="status">
        Te enviamos un nuevo enlace de verificación.
      </p>
    )
  }

  return (
    <form className="mt-8 grid gap-5" noValidate onSubmit={handleSubmit((values) => resendMutation.mutate(values))}>
      <FormField
        autoComplete="email"
        error={errors.email?.message}
        label="Email"
        registration={register('email')}
        type="email"
      />

      {resendMutation.isError && <FormError>{genericErrorMessage}</FormError>}

      <FormButton isPending={resendMutation.isPending} pendingLabel="Enviando…">
        Reenviar verificación
      </FormButton>
    </form>
  )
}
