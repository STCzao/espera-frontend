import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../auth/api/authApi.js'
import { businessOnboardingApi } from '../api/businessOnboardingApi.js'
import { BusinessCreateFormPanel } from '../components/BusinessCreateFormPanel.jsx'
import { BusinessCreateVisualScene } from '../components/BusinessCreateVisualScene.jsx'
import { useBusinessCategories } from '../hooks/useBusinessCategories.js'
import { createBusinessSchema } from '../model/businessOnboardingSchemas.js'

const defaultValues = {
  name: '',
  categoryId: '',
  phone: '',
  address: '',
  legalId: '',
}

export function BusinessCreatePage() {
  const shouldReduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const form = useForm({ defaultValues, resolver: zodResolver(createBusinessSchema) })
  const createMutation = useMutation({
    mutationFn: businessOnboardingApi.createBusiness,
    onSuccess: async ({ businessSlug }) => {
      // The JWT still says role:user at this point; refresh it now so it
      // reflects business_admin without waiting for the user's next login.
      await authApi.refreshToken()
      navigate(`/panel/business/${businessSlug}`, { replace: true })
    },
  })
  const categoriesQuery = useBusinessCategories()

  function handleSubmit(values) {
    // The backend rejects an empty (but present) legalId outright — "Legal
    // id cannot be empty." — since it only treats the field as optional
    // when it's missing entirely. Blank stays blank on screen; it just
    // doesn't get sent as `""`.
    createMutation.mutate({ ...values, legalId: values.legalId?.trim() || undefined })
  }

  return (
    <BusinessCreateVisualScene reduceMotion={shouldReduceMotion}>
      <BusinessCreateFormPanel
        categoriesQuery={categoriesQuery}
        createMutation={createMutation}
        form={form}
        onSubmit={handleSubmit}
        reduceMotion={shouldReduceMotion}
      />
    </BusinessCreateVisualScene>
  )
}
