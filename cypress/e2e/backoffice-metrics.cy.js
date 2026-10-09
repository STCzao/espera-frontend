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

  it('muestra los totales del período y la tasa de cancelación, aclarando sobre qué se calcula', () => {
    mockSuperAdminSession()
    cy.intercept('GET', '**/business/platform/metrics*', { statusCode: 200, body: metricsResponse() }).as('metrics')

    cy.visit('/backoffice')
    cy.wait('@metrics')

    cy.contains('Turnos del período').parent().contains('401')
    cy.contains('Turnos cancelados').parent().contains('37')
    cy.contains('Tasa de cancelación').parent().should('contain.text', '12,4 %')
    // 37 de 401 no es 12,4 %: la tasa es sobre los resueltos, y la pantalla lo dice.
    cy.contains('completados + cancelados').should('be.visible')
  })

  it('avisa cuando el período no tuvo turnos en vez de dejar los rankings vacíos', () => {
    mockSuperAdminSession()
    cy.intercept('GET', '**/business/platform/metrics*', {
      statusCode: 200,
      body: metricsResponse({ totalTurns: 0, cancelledTurns: 0, cancellationRate: 0, topBusinesses: [], topCategories: [] }),
    }).as('metrics')

    cy.visit('/backoffice')
    cy.wait('@metrics')

    cy.contains('Tasa de cancelación').parent().should('contain.text', '0 %')
    cy.get('main').find('p').filter(':contains("Sin turnos en este período.")').should('have.length', 2)
  })

  describe('rango de fechas', () => {
    function mockRangeMetrics() {
      mockSuperAdminSession()
      // Hoy fijado (12:00 en Argentina): los presets dan fechas determinísticas.
      cy.clock(new Date('2026-10-09T15:00:00Z'), ['Date'])
      cy.intercept(
        { method: 'GET', pathname: '/api/business/platform/metrics' },
        (request) => {
          const { fromDate, toDate } = request.query
          request.reply({
            statusCode: 200,
            body: metricsResponse({ fromDate: fromDate ?? '2026-10-03', toDate: toDate ?? '2026-10-09' }),
          })
        },
      ).as('metrics')
    }

    it('un preset pide el rango al backend y los inputs lo reflejan', () => {
      mockRangeMetrics()

      cy.visit('/backoffice')
      cy.wait('@metrics')
      cy.get('input[type="date"]').first().should('have.value', '2026-10-03')

      cy.contains('button', 'Últimos 30 días').click()

      // "Últimos N días" incluye hoy, igual que el default de 7 días del backend.
      cy.wait('@metrics').its('request.query').should('deep.equal', { fromDate: '2026-09-10', toDate: '2026-10-09' })
      cy.get('input[type="date"]').first().should('have.value', '2026-09-10')
      cy.get('input[type="date"]').last().should('have.value', '2026-10-09')
    })

    it('un rango invertido se explica y no se pide al backend', () => {
      mockRangeMetrics()

      cy.visit('/backoffice')
      cy.wait('@metrics')

      cy.get('input[type="date"]').last().type('2026-10-01')

      cy.contains('"Desde" no puede ser posterior a "Hasta".').should('be.visible')
      cy.get('@metrics.all').should('have.length', 1)

      // Corregido el orden, recién ahí se pide.
      cy.get('input[type="date"]').first().type('2026-09-25')
      cy.contains('"Desde" no puede ser posterior a "Hasta".').should('not.exist')
      cy.wait('@metrics').its('request.query').should('deep.equal', { fromDate: '2026-09-25', toDate: '2026-10-01' })
    })

    it('un rango de más de un año no se pide: el backend no lo limita', () => {
      mockRangeMetrics()

      cy.visit('/backoffice')
      cy.wait('@metrics')

      cy.get('input[type="date"]').first().type('2025-01-01')

      cy.contains('El rango no puede superar 366 días.').should('be.visible')
      cy.get('@metrics.all').should('have.length', 1)

      // El siguiente pedido al backend es el válido, no uno del rango excesivo.
      cy.get('input[type="date"]').first().type('2026-09-25')
      cy.contains('El rango no puede superar 366 días.').should('not.exist')
      cy.wait('@metrics').its('request.query').should('deep.equal', { fromDate: '2026-09-25', toDate: '2026-10-09' })
    })
  })
})
