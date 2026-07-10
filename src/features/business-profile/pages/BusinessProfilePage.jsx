import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { FormSelect } from '../../../shared/ui/FormSelect.jsx'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { businessOnboardingApi } from '../../business-onboarding/api/businessOnboardingApi.js'
import { useBusinessCategories } from '../../business-onboarding/hooks/useBusinessCategories.js'
import { businessProfileApi } from '../api/businessProfileApi.js'
import { CategoryAttributeField } from '../components/CategoryAttributeField.jsx'
import { useCategoryConfig } from '../hooks/useCategoryConfig.js'
import { businessProfileSchema } from '../model/businessProfileSchemas.js'

const defaultValues = {
  name: '',
  categoryId: '',
  phone: '',
  address: '',
}

export function BusinessProfilePage() {
  const { businessSlug } = useParams()
  const queryClient = useQueryClient()

  const businessesQuery = useQuery({
    queryKey: ['business-me'],
    queryFn: businessOnboardingApi.listMine,
    select: (data) => data.businesses,
  })
  const currentBusiness = businessesQuery.data?.find((business) => business.slug === businessSlug)

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({ defaultValues, resolver: zodResolver(businessProfileSchema) })

  useEffect(() => {
    if (!currentBusiness) {
      return
    }

    reset({
      name: currentBusiness.name ?? '',
      categoryId: currentBusiness.categoryId ?? '',
      phone: currentBusiness.phone ?? '',
      address: currentBusiness.address ?? '',
    })
  }, [currentBusiness, reset])

  const categoriesQuery = useBusinessCategories()
  const selectedCategoryId = useWatch({ control, name: 'categoryId' })
  const categoryConfigQuery = useCategoryConfig(selectedCategoryId)

  const updateMutation = useMutation({
    mutationFn: (values) => businessProfileApi.updateProfile(currentBusiness.id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-me'] }),
  })

  function onSubmit(values) {
    updateMutation.mutate(values)
  }

  if (businessesQuery.isLoading) {
    return <p className="text-espera-text-muted">Cargando…</p>
  }

  return (
    <section>
      <PanelPageHeader
        crumb="Perfil"
        description="Nombre, categoría y dirección visibles para tus clientes."
        title="Perfil del negocio"
      />

      <div className="relative max-w-2xl overflow-hidden rounded-lg border border-espera-border bg-white shadow-[0_18px_34px_-26px_rgba(51,0,95,0.45)]">
        <div className="h-[3px] bg-gradient-to-r from-[#6a1ec2] via-espera-purple to-transparent" />
        <div className="p-6">
          <span className="mb-4 block font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
            Datos generales
          </span>

          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                autoComplete="organization"
                error={errors.name?.message}
                label="Nombre del negocio"
                registration={register('name')}
              />

              <FormSelect
                error={errors.categoryId?.message}
                label="Categoría"
                loading={categoriesQuery.isLoading}
                loadingLabel="Cargando categorías…"
                placeholder="Seleccioná una categoría"
                registration={register('categoryId')}
              >
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            {categoriesQuery.isError && (
              <span className="-mt-3 text-xs font-normal text-espera-danger">No pudimos cargar las categorías.</span>
            )}

            <FormField
              autoComplete="tel"
              error={errors.phone?.message}
              label="Teléfono (opcional)"
              registration={register('phone')}
            />

            <FormField
              autoComplete="street-address"
              error={errors.address?.message}
              label="Dirección"
              registration={register('address')}
            />

            {categoryConfigQuery.data?.length > 0 && (
              <div className="rounded-lg border border-espera-border bg-espera-purple-soft/40 p-4 text-sm text-espera-text">
                <strong>Atributos de esta categoría</strong>
                <p className="mt-1 text-espera-text-muted">
                  Todavía no se pueden cargar valores para estos atributos; por ahora son solo informativos.
                </p>
                <ul className="mt-3 grid gap-1">
                  {categoryConfigQuery.data.map((attribute) => (
                    <CategoryAttributeField attribute={attribute} key={attribute.key} />
                  ))}
                </ul>
              </div>
            )}

            {updateMutation.isError && (
              <p className="text-sm font-normal text-espera-danger" role="alert">
                {updateMutation.error?.message ?? 'No pudimos guardar los cambios. Intentá nuevamente.'}
              </p>
            )}
            {updateMutation.isSuccess && (
              <p className="text-sm font-normal text-espera-text-muted" role="status">
                Cambios guardados.
              </p>
            )}

            <div className="max-w-[220px]">
              <FormButton isPending={updateMutation.isPending} pendingLabel="Guardando…" variant="solid">
                Guardar cambios
              </FormButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
