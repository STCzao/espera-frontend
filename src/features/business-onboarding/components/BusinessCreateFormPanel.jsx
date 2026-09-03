import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { FormSelect } from '../../../shared/ui/FormSelect.jsx'

export function BusinessCreateFormPanel({
  categoriesQuery,
  createMutation,
  form,
  onSubmit,
  reduceMotion,
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = form

  return (
    <motion.section
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      className="w-full max-w-[610px] rounded-lg border border-white/18 bg-espera-card p-7 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)] sm:p-8"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Link
        className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-espera-text-muted transition-colors hover:text-espera-text"
        to="/panel"
      >
        Volver al panel
      </Link>

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="m-0 max-w-[13ch] text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-espera-text">
            Registrá tu negocio
          </h1>
          <p className="mt-4 max-w-[390px] text-espera-text-muted">
            Ya tenés cuenta; solo nos faltan los datos de tu negocio.
          </p>
        </div>
        <img
          alt=""
          className="mt-1 h-14 w-14 shrink-0 rounded-xl border border-espera-border"
          src="/Logo_espera.png"
        />
      </div>

      <form className="mt-8 grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
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

        <FormField
          description="Se pide para aprobar tu negocio en el backoffice. Podés completarlo más tarde, pero cargarlo ahora evita demoras."
          error={errors.legalId?.message}
          label="CUIT/CUIL (opcional)"
          placeholder="Ej: 30-12345678-9"
          registration={register('legalId')}
        />

        {createMutation.isError && (
          <FormError>
            {createMutation.error?.message ?? 'No pudimos crear el negocio. Intentá nuevamente.'}
          </FormError>
        )}

        <FormButton icon={ArrowRight} isPending={createMutation.isPending} pendingLabel="Creando…">
          Crear negocio
        </FormButton>
      </form>
    </motion.section>
  )
}
