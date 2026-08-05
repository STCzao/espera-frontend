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

function metricsResponse(overrides = {}) {
  return {
    totalActiveBusinesses: 12,
    totalRegisteredUsers: 340,
    turnsToday: 58,
    turnsThisWeek: 401,
    range: {
      fromDate: '2026-05-08',
      toDate: '2026-08-06',
      totalTurns: 401,
      cancelledTurns: 37,
      cancellationRate: 12.4,
      businesses: {
        items: [
          {
            businessId: 'biz_1',
            businessName: 'Cafe Espera',
            organizationId: 'org_1',
            status: 'approved',
            categoryId: 'cat_1',
            subscriptionPlan: 'pro',
            subscriptionStatus: 'active',
            turnCount: 80,
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
      },
      topCategories: [{ categoryId: 'cat_1', categoryName: 'Cafetería', turnCount: 210 }],
      ...overrides,
    },
  }
}

describe('HU-8.4 - Suspender/reactivar negocio (pantalla Negocios)', () => {
  beforeEach(() => {
    mockSuperAdminSession()
    mockCategories()
  })

  it('lista los negocios con su categoría, plan y estado', () => {
    cy.intercept('GET', '**/business/platform/metrics*', { statusCode: 200, body: metricsResponse() }).as('metrics')

    cy.visit('/backoffice/businesses')
    cy.wait('@me')
    cy.wait('@metrics')

    cy.contains('Cafe Espera').should('be.visible')
    cy.contains('80 turnos en el rango').should('be.visible')
    cy.contains('button', /^suspender$/i).should('be.visible')
  })

  it('suspende un negocio aprobado pidiendo motivo', () => {
    cy.intercept('GET', '**/business/platform/metrics*', { statusCode: 200, body: metricsResponse() }).as('metrics')
    cy.intercept('PATCH', '**/business/biz_1/suspend', (request) => {
      expect(request.body).to.deep.equal({ reason: 'Fraude reportado' })
      request.reply({ statusCode: 200, body: { id: 'biz_1', status: 'suspended' } })
    }).as('suspendBusiness')

    cy.visit('/backoffice/businesses')
    cy.wait('@me')
    cy.wait('@metrics')

    cy.contains('button', /^suspender$/i).click()
    cy.get('[role="alertdialog"]').should('be.visible')
    cy.get('[role="alertdialog"]').contains('button', /suspender negocio/i).should('be.disabled')
    cy.get('#suspend-business-reason').type('Fraude reportado')
    cy.get('[role="alertdialog"]').contains('button', /suspender negocio/i).click()
    cy.wait('@suspendBusiness')
  })

  it('reactiva un negocio suspendido', () => {
    cy.intercept('GET', '**/business/platform/metrics*', {
      statusCode: 200,
      body: metricsResponse({
        businesses: {
          items: [
            {
              businessId: 'biz_2',
              businessName: 'Barbería Norte',
              organizationId: 'org_2',
              status: 'suspended',
              categoryId: 'cat_1',
              turnCount: 3,
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
        },
      }),
    }).as('metrics')
    cy.intercept('PATCH', '**/business/biz_2/reactivate', {
      statusCode: 200,
      body: { id: 'biz_2', status: 'approved' },
    }).as('reactivateBusiness')

    cy.visit('/backoffice/businesses')
    cy.wait('@me')
    cy.wait('@metrics')

    cy.contains('Barbería Norte').should('be.visible')
    cy.contains('button', /^reactivar$/i).click()
    cy.wait('@reactivateBusiness')
  })

  it('cambiar el filtro de estado dispara una nueva consulta con el filtro aplicado', () => {
    cy.intercept('GET', '**/business/platform/metrics*', { statusCode: 200, body: metricsResponse() }).as('metrics')

    cy.visit('/backoffice/businesses')
    cy.wait('@me')
    cy.wait('@metrics')

    cy.intercept('GET', '**/business/platform/metrics*', (request) => {
      expect(request.query.status).to.equal('suspended')
      request.reply({ statusCode: 200, body: metricsResponse({ businesses: { items: [], page: 1, pageSize: 10, total: 0 } }) })
    }).as('filteredMetrics')

    cy.contains('label', 'Estado').find('select').select('suspended')
    cy.wait('@filteredMetrics')
    cy.contains('Ningún negocio coincide con estos filtros').should('be.visible')
  })
})
