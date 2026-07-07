import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthField } from '../../auth/components/AuthField.jsx'

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

  const isBusy = createMutation.isPending

  return (
    <motion.section
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      className="w-full max-w-[610px] rounded-lg border border-white/18 bg-[#fdf9ff] p-7 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)] sm:p-8"
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
        <AuthField
          autoComplete="organization"
          error={errors.name?.message}
          label="Nombre del negocio"
          registration={register('name')}
        />

        <label className="grid gap-2 text-sm font-semibold text-espera-text" htmlFor="categoryId">
          Categoría
          <select
            aria-invalid={Boolean(errors.categoryId)}
            className="min-h-12 rounded-lg border border-espera-border bg-white px-4 text-base font-normal text-espera-text outline-none transition focus:border-espera-purple focus:ring-4 focus:ring-espera-purple-soft"
            defaultValue=""
            disabled={categoriesQuery.isLoading}
            id="categoryId"
            {...register('categoryId')}
          >
            <option disabled value="">
              {categoriesQuery.isLoading ? 'Cargando categorías…' : 'Seleccioná una categoría'}
            </option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categoriesQuery.isError && (
            <span className="text-xs font-normal text-espera-danger">No pudimos cargar las categorías.</span>
          )}
          {errors.categoryId && (
            <span className="text-xs font-normal text-espera-danger">{errors.categoryId.message}</span>
          )}
        </label>

        <AuthField
          autoComplete="street-address"
          error={errors.address?.message}
          label="Dirección"
          registration={register('address')}
        />

        {createMutation.isError && (
          <FormError>
            {createMutation.error?.message ?? 'No pudimos crear el negocio. Intentá nuevamente.'}
          </FormError>
        )}

        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-espera-border bg-white px-4 font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft focus:outline-none focus:ring-4 focus:ring-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isBusy}
          type="submit"
        >
          {isBusy ? (
            <>
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
              Creando…
            </>
          ) : (
            <>
              Crear negocio
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </motion.section>
  )
}

function FormError({ children }) {
  return (
    <div className="rounded-lg border border-[#f3b7ce] bg-[#fff3f7] px-4 py-3 text-sm text-espera-danger" role="alert">
      {children}
    </div>
  )
}
