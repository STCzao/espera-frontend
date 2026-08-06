import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { BusinessNotOperatingNotice } from '../../../shared/ui/BusinessNotOperatingNotice.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { useBusinessCanOperate } from '../../../shared/business/useBusinessCanOperate.js'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { businessQrApi } from '../api/businessQrApi.js'
import { QrPreview } from '../components/QrPreview.jsx'

const statusLabels = {
  active: 'Activo',
  retiring: 'En transición (vence en 24hs)',
}

export function BusinessQrPage() {
  const businessId = useCurrentBusinessStore((state) => state.businessId)
  const businessStatus = useCurrentBusinessStore((state) => state.status)
  const canOperate = useBusinessCanOperate()
  const queryClient = useQueryClient()

  const qrQuery = useQuery({
    queryKey: ['business-qr', businessId],
    queryFn: () => businessQrApi.getQr(businessId),
    enabled: Boolean(businessId) && canOperate,
  })

  const pngQuery = useQuery({
    queryKey: ['business-qr-png', businessId, qrQuery.data?.token],
    queryFn: () => businessQrApi.getQrPng(businessId),
    enabled: Boolean(businessId) && Boolean(qrQuery.data),
  })

  const imageUrl = useMemo(() => (pngQuery.data ? URL.createObjectURL(pngQuery.data) : null), [pngQuery.data])

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  const regenerateMutation = useMutation({
    mutationFn: () => businessQrApi.regenerateQr(businessId),
    onSuccess: (data) => queryClient.setQueryData(['business-qr', businessId], data),
  })

  function handleDownload() {
    if (!imageUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `qr-${businessId}.png`
    link.click()
  }

  if (!businessId || (canOperate && qrQuery.isLoading)) {
    return <p className="text-espera-text-muted">Cargando…</p>
  }

  return (
    <section>
      <PanelPageHeader
        crumb="QR"
        description="Descargá o regenerá el QR de entrada para pegarlo en tu local."
        title="QR del negocio"
      />

      <div className="max-w-2xl rounded-lg border border-espera-border bg-white">
        <div className="grid gap-5 p-6">
          {!canOperate && <BusinessNotOperatingNotice status={businessStatus} />}

          {canOperate && qrQuery.isError && (
            <p className="text-sm font-normal text-espera-danger" role="alert">
              No pudimos cargar el QR de tu negocio.
            </p>
          )}

          {canOperate && qrQuery.data && (
            <>
              <div className="flex flex-wrap items-start gap-6">
                <QrPreview imageUrl={imageUrl} isLoading={pngQuery.isLoading} />

                <div className="grid gap-3">
                  <div>
                    <span className="block font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
                      Estado
                    </span>
                    <p className="mt-1 text-sm text-espera-text">
                      {statusLabels[qrQuery.data.status] ?? qrQuery.data.status}
                    </p>
                  </div>

                  <div>
                    <span className="block font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
                      Enlace
                    </span>
                    <a
                      className="mt-1 block max-w-[280px] break-all text-sm text-espera-purple hover:underline"
                      href={qrQuery.data.qrUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {qrQuery.data.qrUrl}
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="w-44">
                      <FormButton icon={Download} onClick={handleDownload} type="button" variant="outline">
                        Descargar PNG
                      </FormButton>
                    </div>
                    <div className="w-44">
                      <FormButton
                        icon={RefreshCw}
                        isPending={regenerateMutation.isPending}
                        onClick={() => regenerateMutation.mutate()}
                        pendingLabel="Regenerando…"
                        type="button"
                        variant="solid"
                      >
                        Regenerar QR
                      </FormButton>
                    </div>
                  </div>
                </div>
              </div>

              {regenerateMutation.isError && (
                <p className="text-sm font-normal text-espera-danger" role="alert">
                  {regenerateMutation.error?.message ?? 'No pudimos regenerar el QR. Intentá nuevamente.'}
                </p>
              )}
              {regenerateMutation.isSuccess && (
                <p className="text-sm font-normal text-espera-text-muted" role="status">
                  QR regenerado. El anterior sigue funcionando hasta{' '}
                  {new Date(regenerateMutation.data.previousQrValidUntil).toLocaleString('es-AR')}.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
