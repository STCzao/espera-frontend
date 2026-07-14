import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { businessEmployeesApi } from '../api/businessEmployeesApi.js'
import { EmployeeList } from '../components/EmployeeList.jsx'
import { inviteEmployeeSchema } from '../model/businessEmployeesSchemas.js'

export function BusinessEmployeesPage() {
  const businessId = useCurrentBusinessStore((state) => state.businessId)
  const queryClient = useQueryClient()

  const employeesQuery = useQuery({
    queryKey: ['business-employees', businessId],
    queryFn: () => businessEmployeesApi.list(businessId),
    enabled: Boolean(businessId),
  })

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({ defaultValues: { email: '' }, resolver: zodResolver(inviteEmployeeSchema) })

  const inviteMutation = useMutation({
    mutationFn: (values) => businessEmployeesApi.invite(businessId, values),
    onSuccess: () => reset({ email: '' }),
  })

  const revokeMutation = useMutation({
    mutationFn: (userId) => businessEmployeesApi.revoke(businessId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-employees', businessId] }),
  })

  function onSubmit(values) {
    inviteMutation.mutate(values)
  }

  if (!businessId) {
    return <p className="text-espera-text-muted">Cargando…</p>
  }

  return (
    <section>
      <PanelPageHeader
        crumb="Empleados"
        description="Invitá a tu equipo a operar el panel con vos."
        title="Empleados"
      />

      <div className="grid gap-6">
        <div className="relative max-w-2xl overflow-hidden rounded-lg border border-espera-border bg-white shadow-[0_18px_34px_-26px_rgba(51,0,95,0.45)]">
          <div className="h-[3px] bg-gradient-to-r from-[#6a1ec2] via-espera-purple to-transparent" />
          <div className="p-6">
            <span className="mb-4 block font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
              Invitar empleado
            </span>

            <form className="flex flex-wrap items-end gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className="w-72">
                <FormField
                  autoComplete="email"
                  error={errors.email?.message}
                  label="Email"
                  registration={register('email')}
                  type="email"
                />
              </div>
              <div className="w-44">
                <FormButton isPending={inviteMutation.isPending} pendingLabel="Enviando…" variant="solid">
                  Invitar
                </FormButton>
              </div>
            </form>

            {inviteMutation.isError && (
              <p className="mt-3 text-sm font-normal text-espera-danger" role="alert">
                {inviteMutation.error?.message ?? 'No pudimos enviar la invitación. Intentá nuevamente.'}
              </p>
            )}
            {inviteMutation.isSuccess && (
              <p className="mt-3 text-sm font-normal text-espera-text-muted" role="status">
                Invitación enviada a {inviteMutation.data.email}. Vence el{' '}
                {new Date(inviteMutation.data.expiresAt).toLocaleDateString('es-AR')}.
              </p>
            )}
          </div>
        </div>

        <div className="relative max-w-2xl overflow-hidden rounded-lg border border-espera-border bg-white shadow-[0_18px_34px_-26px_rgba(51,0,95,0.45)]">
          <div className="h-[3px] bg-gradient-to-r from-[#6a1ec2] via-espera-purple to-transparent" />
          <div className="p-6">
            <span className="mb-4 block font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
              Empleados activos
            </span>

            {employeesQuery.isError && (
              <p className="text-sm font-normal text-espera-danger" role="alert">
                No pudimos cargar los empleados.
              </p>
            )}
            {employeesQuery.data && (
              <EmployeeList
                employees={employeesQuery.data.employees}
                onRevoke={(userId) => revokeMutation.mutate(userId)}
                revokingUserId={revokeMutation.isPending ? revokeMutation.variables : null}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
