/// <reference types="cypress" />

function mockSuperAdminSession() {
  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: { user: { id: 'admin_1', email: 'admin@espera.com', role: 'super_admin' } },
  }).as('me')
}

function mockCategories() {
  cy.intercept('GET', '**/business/categories', {
    statusCode: 200,
    body: { categories: [{ id: 'cat_1', name: 'Cafetería' }] },
  }).as('categories')
}

function businessesResponse(overrides = {}) {
  return {
    items: [
      {
        businessId: 'biz_1',
        businessName: 'Cafe Espera',
        organizationId: 'org_1',
        status: 'approved',
        categoryId: 'cat_1',
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        createdAt: '2026-01-15T00:00:00.000Z',
      },
    ],
    page: 1,
    pageSize: 20,
    total: 1,
    ...overrides,
  }
}

describe('HU-8.4 - Suspender/reactivar negocio (pantalla Negocios)', () => {
  beforeEach(() => {
    mockSuperAdminSession()
    mockCategories()
  })

  it('lista los negocios con su categoría, plan y estado', () => {
    cy.intercept('GET', '**/business?*', { statusCode: 200, body: businessesResponse() }).as('businesses')

    cy.visit('/backoffice/businesses')
    cy.wait('@me')
    cy.wait('@businesses')

    cy.contains('Cafe Espera').should('be.visible')
    cy.contains('alta 15/01/2026').should('be.visible')
    cy.contains('button', /^suspender$/i).should('be.visible')
  })

  it('suspende un negocio aprobado pidiendo motivo', () => {
    cy.intercept('GET', '**/business?*', { statusCode: 200, body: businessesResponse() }).as('businesses')
    cy.intercept('PATCH', '**/business/biz_1/suspend', (request) => {
      expect(request.body).to.deep.equal({ reason: 'Fraude reportado' })
      request.reply({ statusCode: 200, body: { id: 'biz_1', status: 'suspended' } })
    }).as('suspendBusiness')

    cy.visit('/backoffice/businesses')
    cy.wait('@me')
    cy.wait('@businesses')

    cy.contains('button', /^suspender$/i).click()
    cy.get('[role="alertdialog"]').should('be.visible')
    cy.get('[role="alertdialog"]').contains('button', /suspender negocio/i).should('be.disabled')
    cy.get('#suspend-business-reason').type('Fraude reportado')
    cy.get('[role="alertdialog"]').contains('button', /suspender negocio/i).click()
    cy.wait('@suspendBusiness')
  })

  it('reactiva un negocio suspendido', () => {
    cy.intercept('GET', '**/business?*', {
      statusCode: 200,
      body: businessesResponse({
        items: [
          {
            businessId: 'biz_2',
            businessName: 'Barbería Norte',
            organizationId: 'org_2',
            status: 'suspended',
            categoryId: 'cat_1',
            createdAt: '2026-02-01T00:00:00.000Z',
          },
        ],
      }),
    }).as('businesses')
    cy.intercept('PATCH', '**/business/biz_2/reactivate', {
      statusCode: 200,
      body: { id: 'biz_2', status: 'approved' },
    }).as('reactivateBusiness')

    cy.visit('/backoffice/businesses')
    cy.wait('@me')
    cy.wait('@businesses')

    cy.contains('Barbería Norte').should('be.visible')
    cy.contains('button', /^reactivar$/i).click()
    cy.wait('@reactivateBusiness')
  })

  it('cambiar el filtro de estado dispara una nueva consulta con el filtro aplicado', () => {
    cy.intercept('GET', '**/business?*', { statusCode: 200, body: businessesResponse() }).as('businesses')

    cy.visit('/backoffice/businesses')
    cy.wait('@me')
    cy.wait('@businesses')

    cy.intercept('GET', '**/business?*', (request) => {
      expect(request.query.status).to.equal('suspended')
      request.reply({ statusCode: 200, body: businessesResponse({ items: [], total: 0 }) })
    }).as('filteredBusinesses')

    cy.contains('label', 'Estado').find('select').select('suspended')
    cy.wait('@filteredBusinesses')
    cy.contains('Ningún negocio coincide con estos filtros').should('be.visible')
  })
})
