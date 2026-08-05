import { useState } from 'react'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { PendingBusinessesPanel } from '../components/PendingBusinessesPanel.jsx'
import { PendingOrganizationsPanel } from '../components/PendingOrganizationsPanel.jsx'

export function BackofficeApprovalsPage() {
  const [activeTab, setActiveTab] = useState('organizations')

  return (
    <section>
      <PanelPageHeader
        crumb="Aprobaciones"
        description="Organizaciones y negocios pendientes de aprobación comercial."
        title="Aprobaciones"
      />

      <div className="rounded-lg border border-espera-border bg-white">
        <div className="flex gap-1 border-b border-espera-border px-5 pt-2">
          <TabButton active={activeTab === 'organizations'} onClick={() => setActiveTab('organizations')}>
            Organizaciones
          </TabButton>
          <TabButton active={activeTab === 'businesses'} onClick={() => setActiveTab('businesses')}>
            Negocios
          </TabButton>
        </div>

        {activeTab === 'organizations' ? <PendingOrganizationsPanel /> : <PendingBusinessesPanel />}
      </div>
    </section>
  )
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      className={`px-1 pb-3 pt-2.5 text-sm font-semibold transition-colors ${
        active
          ? 'border-b-2 border-espera-purple text-espera-purple'
          : 'border-b-2 border-transparent text-espera-text-muted hover:text-espera-text'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
