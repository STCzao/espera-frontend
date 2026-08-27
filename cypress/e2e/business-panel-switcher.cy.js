/// <reference types="cypress" />

describe('Switcher y alta de sucursal en el panel de negocio', () => {
  function authenticate() {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin' } },
    }).as('me')
  }

  function mockBusinessMe(businesses) {
    cy.intercept('GET', '**/business/me', { statusCode: 200, body: { businesses } }).as('businessMe')
  }

  const oneBusiness = [
    {
      id: 'biz_1',
      slug: 'cafe-espera',
      name: 'Cafe Espera',
      status: 'approved',
      listingStatus: 'draft',
      operationalStatus: 'normal',
      plan: 'basic',
      subscriptionStatus: 'active',
      trialEndsAt: null,
      activeQueueId: 'queue_1',
      queues: [],
    },
  ]

  const twoBusinesses = [
    ...oneBusiness,
    {
      id: 'biz_2',
      slug: 'cafe-espera-sucursal-norte',
      name: 'Cafe Espera Norte',
      status: 'approved',
      listingStatus: 'draft',
      operationalStatus: 'normal',
      plan: 'pro',
      subscriptionStatus: 'active',
      trialEndsAt: null,
      activeQueueId: 'queue_2',
      queues: [],
    },
  ]

  it('no muestra el switcher si el dueño tiene una sola sucursal', () => {
    authenticate()
    mockBusinessMe(oneBusiness)

    cy.visit('/panel/business/cafe-espera')
    cy.wait('@me')
    cy.wait('@businessMe')

    cy.contains('Cafe Espera').should('be.visible')
    cy.get('select[aria-label="Cambiar de sucursal"]').should('not.exist')
  })

  it('muestra el switcher con más de una sucursal y navega al elegir otra', () => {
    authenticate()
    mockBusinessMe(twoBusinesses)

    cy.visit('/panel/business/cafe-espera')
    cy.wait('@me')
    cy.wait('@businessMe')

    cy.get('select[aria-label="Cambiar de sucursal"]').should('have.value', 'cafe-espera')

    cy.get('select[aria-label="Cambiar de sucursal"]').select('cafe-espera-sucursal-norte')

    cy.location('pathname').should('eq', '/panel/business/cafe-espera-sucursal-norte')
    cy.get('select[aria-label="Cambiar de sucursal"]').should('have.value', 'cafe-espera-sucursal-norte')
  })

  it('no ofrece agregar sucursal con plan basic o pro (tope 1 negocio)', () => {
    authenticate()
    mockBusinessMe(oneBusiness) // plan: 'basic'

    cy.visit('/panel/business/cafe-espera')
    cy.wait('@me')
    cy.wait('@businessMe')

    cy.get('a[aria-label="Agregar sucursal"]').should('not.exist')
  })

  it('ofrece agregar sucursal con plan premium', () => {
    authenticate()
    mockBusinessMe([{ ...oneBusiness[0], plan: 'premium' }])

    cy.visit('/panel/business/cafe-espera')
    cy.wait('@me')
    cy.wait('@businessMe')

    cy.get('a[aria-label="Agregar sucursal"]').should('have.attr', 'href', '/business/new')
  })
})
