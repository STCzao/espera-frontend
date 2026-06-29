import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { authApi } from '../api/authApi.js'
import { RegisterFormPanel } from '../components/RegisterFormPanel.jsx'
import { RegisterSuccessPanel } from '../components/RegisterSuccessPanel.jsx'
import { RegisterVisualScene } from '../components/RegisterVisualScene.jsx'
import { registerSchema } from '../model/authSchemas.js'

const defaultValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function RegisterPage() {
  const shouldReduceMotion = useReducedMotion()
  const form = useForm({
    defaultValues,
    resolver: zodResolver(registerSchema),
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
  })

  function handleSubmit(values) {
    const registerPayload = {
      confirmPassword: values.confirmPassword,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      password: values.password,
    }

    registerMutation.mutate(registerPayload)
  }

  return (
    <RegisterVisualScene reduceMotion={shouldReduceMotion}>
      {registerMutation.isSuccess ? (
        <RegisterSuccessPanel reduceMotion={shouldReduceMotion} />
      ) : (
        <RegisterFormPanel
          form={form}
          onSubmit={handleSubmit}
          reduceMotion={shouldReduceMotion}
          registerMutation={registerMutation}
        />
      )}
    </RegisterVisualScene>
  )
}
