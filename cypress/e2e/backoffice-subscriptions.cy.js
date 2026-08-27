/// <reference types="cypress" />

function mockSuperAdminSession() {
  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: { user: { id: 'admin_1', email: 'admin@espera.com', role: 'super_admin' } },
  }).as('me')
}

function businessesResponse() {
  return {
    items: [
      {
        businessId: 'biz_1',
        businessName: 'Cafe Espera',
        organizationId: 'org_1',
        status: 'approved',
        categoryId: 'cat_1',
        subscriptionPlan: 'basic',
        subscriptionStatus: 'trial',
        createdAt: '2026-01-15T00:00:00.000Z',
      },
    ],
    page: 1,
    pageSize: 50,
    total: 1,
  }
}

describe('HU-8.4/8.5 (bugfix) - Gestión manual de suscripciones (pantalla propia)', () => {
  beforeEach(() => {
    mockSuperAdminSession()
    cy.intercept('GET', '**/business?*', { statusCode: 200, body: businessesResponse() }).as('businesses')
  })

  it('lista organizaciones agrupadas por negocio y expande su suscripción', () => {
    cy.intercept('GET', '**/organizations/org_1/subscription', {
      statusCode: 200,
      body: { id: 'sub_1', organizationId: 'org_1', plan: 'basic', status: 'trial', trialEndsAt: '2026-09-01T00:00:00.000Z' },
    }).as('getSubscription')

    cy.visit('/backoffice/subscriptions')
    cy.wait('@me')
    cy.wait('@businesses')

    cy.contains('Cafe Espera').should('be.visible')
    cy.contains('Basic · Prueba').should('be.visible')
    cy.contains('button', /gestionar/i).click()
    cy.wait('@getSubscription')
    cy.contains('prueba hasta').should('be.visible')
  })

  it('activa una suscripción en prueba', () => {
    cy.intercept('GET', '**/organizations/org_1/subscription', {
      statusCode: 200,
      body: { id: 'sub_1', organizationId: 'org_1', plan: 'basic', status: 'trial', trialEndsAt: '2026-09-01T00:00:00.000Z' },
    }).as('getSubscription')
    cy.intercept('PATCH', '**/organizations/org_1/subscription/activate', {
      statusCode: 200,
      body: { id: 'sub_1', organizationId: 'org_1', plan: 'basic', status: 'active' },
    }).as('activateSubscription')

    cy.visit('/backoffice/subscriptions')
    cy.wait('@me')
    cy.wait('@businesses')
    cy.contains('button', /gestionar/i).click()
    cy.wait('@getSubscription')

    cy.contains('button', /^activar$/i).click()
    cy.wait('@activateSubscription')
  })

  it('reactiva una suscripción cancelada (bugfix 2026-08-20)', () => {
    cy.intercept('GET', '**/organizations/org_1/subscription', {
      statusCode: 200,
      body: { id: 'sub_1', organizationId: 'org_1', plan: 'pro', status: 'cancelled', cancellationReason: 'No pagó' },
    }).as('getSubscription')
    cy.intercept('PATCH', '**/organizations/org_1/subscription/activate', {
      statusCode: 200,
      body: { id: 'sub_1', organizationId: 'org_1', plan: 'pro', status: 'active' },
    }).as('activateSubscription')

    cy.visit('/backoffice/subscriptions')
    cy.wait('@me')
    cy.wait('@businesses')
    cy.contains('button', /gestionar/i).click()
    cy.wait('@getSubscription')

    cy.contains('motivo: No pagó').should('be.visible')
    cy.contains('button', /^activar$/i).click()
    cy.wait('@activateSubscription')
  })

  it('traduce el error cuando el downgrade queda bloqueado por colas o ventanillas activas', () => {
    cy.intercept('GET', '**/organizations/org_1/subscription', {
      statusCode: 200,
      body: { id: 'sub_1', organizationId: 'org_1', plan: 'premium', status: 'active' },
    }).as('getSubscription')
    cy.intercept('PATCH', '**/organizations/org_1/subscription/plan', {
      statusCode: 409,
      body: {
        message: 'Cannot downgrade to basic: a queue has more active service windows than the new plan allows.',
        code: 'SUBSCRIPTION_DOWNGRADE_BLOCKED_WINDOWS',
      },
    }).as('changePlan')

    cy.visit('/backoffice/subscriptions')
    cy.wait('@me')
    cy.wait('@businesses')
    cy.contains('button', /gestionar/i).click()
    cy.wait('@getSubscription')

    cy.contains('option', 'Cambiar plan a…').parent('select').select('basic')
    cy.contains('button', /confirmar cambio de plan/i).click()
    cy.wait('@changePlan')

    cy.contains('una cola tiene más ventanillas activas de las que permite').should('be.visible')
  })

  it('cancela una suscripción pidiendo motivo', () => {
    cy.intercept('GET', '**/organizations/org_1/subscription', {
      statusCode: 200,
      body: { id: 'sub_1', organizationId: 'org_1', plan: 'pro', status: 'active' },
    }).as('getSubscription')
    cy.intercept('PATCH', '**/organizations/org_1/subscription/cancel', (request) => {
      expect(request.body).to.deep.equal({ reason: 'Cliente pidió baja' })
      request.reply({ statusCode: 200, body: { id: 'sub_1', organizationId: 'org_1', plan: 'pro', status: 'cancelled' } })
    }).as('cancelSubscription')

    cy.visit('/backoffice/subscriptions')
    cy.wait('@me')
    cy.wait('@businesses')
    cy.contains('button', /gestionar/i).click()
    cy.wait('@getSubscription')

    cy.contains('button', /cancelar suscripción/i).click()
    cy.get('[role="alertdialog"]').contains('button', /cancelar suscripción/i).should('be.disabled')
    cy.get('[role="alertdialog"] textarea').type('Cliente pidió baja')
    cy.get('[role="alertdialog"]').contains('button', /cancelar suscripción/i).click()
    cy.wait('@cancelSubscription')
  })

  it('cambia el plan de una suscripción', () => {
    cy.intercept('GET', '**/organizations/org_1/subscription', {
      statusCode: 200,
      body: { id: 'sub_1', organizationId: 'org_1', plan: 'basic', status: 'active' },
    }).as('getSubscription')
    cy.intercept('PATCH', '**/organizations/org_1/subscription/plan', (request) => {
      expect(request.body).to.deep.equal({ plan: 'premium' })
      request.reply({ statusCode: 200, body: { id: 'sub_1', organizationId: 'org_1', plan: 'premium', status: 'active' } })
    }).as('changePlan')

    cy.visit('/backoffice/subscriptions')
    cy.wait('@me')
    cy.wait('@businesses')
    cy.contains('button', /gestionar/i).click()
    cy.wait('@getSubscription')

    cy.contains('button', /confirmar cambio de plan/i).should('be.disabled')
    cy.contains('option', 'Cambiar plan a…').parent('select').select('premium')
    cy.contains('button', /confirmar cambio de plan/i).should('be.enabled').click()
    cy.wait('@changePlan')
  })
})
