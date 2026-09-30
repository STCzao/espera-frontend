import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { sessionQueryKey } from '../../auth/hooks/useSessionBootstrap.js'
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
  const queryClient = useQueryClient()
  const form = useForm({ defaultValues, resolver: zodResolver(createBusinessSchema) })
  const createMutation = useMutation({
    mutationFn: businessOnboardingApi.createBusiness,
    onSuccess: async ({ businessSlug }) => {
      // The backend applies the new role (business_admin, pending approval)
      // on the very next request — no token refresh needed. The cached
      // session user still says role:user though, and the panel gates on
      // role/approvalStatus, so re-read /auth/me before entering it.
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
      navigate(`/panel/business/${businessSlug}`, { replace: true })
    },
  })
  const categoriesQuery = useBusinessCategories()

  function handleSubmit(values) {
    createMutation.mutate(values)
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
