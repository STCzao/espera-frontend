/// <reference types="cypress" />

function mockSuperAdminSession() {
  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: { user: { id: 'admin_1', email: 'admin@espera.com', role: 'super_admin' } },
  }).as('me')
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
      topBusinesses: [{ businessId: 'biz_1', businessName: 'Cafe Espera', turnCount: 80 }],
      topCategories: [{ categoryId: 'cat_1', categoryName: 'Cafetería', turnCount: 210 }],
      ...overrides,
    },
  }
}

describe('HU-8.5 - Dashboard de métricas globales', () => {
  it('muestra las estadísticas agregadas de la plataforma, los negocios más activos y los rubros con más demanda', () => {
    mockSuperAdminSession()
    cy.intercept('GET', '**/business/platform/metrics*', { statusCode: 200, body: metricsResponse() }).as('metrics')

    cy.visit('/backoffice')
    cy.wait('@me')
    cy.wait('@metrics')

    cy.contains('Negocios activos').parent().contains('12')
    cy.contains('Usuarios registrados').parent().contains('340')
    cy.contains('Turnos hoy').parent().contains('58')
    cy.contains('Turnos esta semana').parent().contains('401')
    cy.contains('Cafe Espera · 80 turnos').should('be.visible')
    cy.contains('Cafetería · 210 turnos').should('be.visible')
  })

  it('linkea a Aprobaciones y a Negocios', () => {
    mockSuperAdminSession()
    cy.intercept('GET', '**/business/platform/metrics*', { statusCode: 200, body: metricsResponse() }).as('metrics')

    cy.visit('/backoffice')
    cy.wait('@me')
    cy.wait('@metrics')

    cy.get('p').contains('a', /^aprobaciones$/i).should('have.attr', 'href', '/backoffice/approvals')
    cy.get('p').contains('a', /^negocios$/i).should('have.attr', 'href', '/backoffice/businesses')
  })
})
