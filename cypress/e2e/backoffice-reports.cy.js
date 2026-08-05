/// <reference types="cypress" />

function mockSuperAdminSession() {
  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: { user: { id: 'admin_1', email: 'admin@espera.com', role: 'super_admin' } },
  }).as('me')
}

function businessReport(overrides = {}) {
  return {
    id: 'report_1',
    reportedType: 'business',
    reportedId: 'biz_1',
    reason: 'Cobra por turnos que no existen',
    reportedByUserId: 'user_9',
    status: 'pending',
    createdAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('HU-8.6 - Gestión de reportes', () => {
  beforeEach(() => {
    mockSuperAdminSession()
  })

  it('lista reportes y resuelve el detalle de un negocio reportado', () => {
    cy.intercept('GET', '**/reports*', { statusCode: 200, body: [businessReport()] }).as('reports')
    cy.intercept('GET', '**/business/biz_1/review', {
      statusCode: 200,
      body: {
        business: { id: 'biz_1', name: 'Cafe Espera', status: 'approved' },
        organization: { id: 'org_1', name: 'Café Espera SRL' },
        alerts: [],
      },
    }).as('businessReview')

    cy.visit('/backoffice/reports')
    cy.wait('@me')
    cy.wait('@reports')

    cy.contains('Cobra por turnos que no existen').should('be.visible')
    cy.contains('button', /^detalle$/i).click()
    cy.wait('@businessReview')
    cy.contains('Cafe Espera (approved)').should('be.visible')
  })

  it('resuelve un reporte sin suspender a nadie', () => {
    cy.intercept('GET', '**/reports*', { statusCode: 200, body: [businessReport()] }).as('reports')
    cy.intercept('GET', '**/business/biz_1/review', {
      statusCode: 200,
      body: { business: { id: 'biz_1', name: 'Cafe Espera', status: 'approved' }, organization: {}, alerts: [] },
    }).as('businessReview')
    cy.intercept('PATCH', '**/reports/report_1/resolve', {
      statusCode: 200,
      body: businessReport({ status: 'resolved' }),
    }).as('resolveReport')

    cy.visit('/backoffice/reports')
    cy.wait('@me')
    cy.wait('@reports')
    cy.contains('button', /^detalle$/i).click()
    cy.wait('@businessReview')

    cy.contains('button', /^resolver$/i).click()
    cy.get('[role="alertdialog"]').contains('button', /^resolver$/i).click()
    cy.wait('@resolveReport')
  })

  it('descartar un reporte exige una nota', () => {
    cy.intercept('GET', '**/reports*', { statusCode: 200, body: [businessReport()] }).as('reports')
    cy.intercept('GET', '**/business/biz_1/review', {
      statusCode: 200,
      body: { business: { id: 'biz_1', name: 'Cafe Espera', status: 'approved' }, organization: {}, alerts: [] },
    }).as('businessReview')
    cy.intercept('PATCH', '**/reports/report_1/dismiss', (request) => {
      expect(request.body).to.deep.equal({ note: 'Sin evidencia' })
      request.reply({ statusCode: 200, body: businessReport({ status: 'dismissed' }) })
    }).as('dismissReport')

    cy.visit('/backoffice/reports')
    cy.wait('@me')
    cy.wait('@reports')
    cy.contains('button', /^detalle$/i).click()
    cy.wait('@businessReview')

    cy.contains('button', /^descartar$/i).click()
    cy.get('[role="alertdialog"]').contains('button', /^descartar$/i).should('be.disabled')
    cy.get('[role="alertdialog"] textarea').type('Sin evidencia')
    cy.get('[role="alertdialog"]').contains('button', /^descartar$/i).click()
    cy.wait('@dismissReport')
  })

  it('suspende el negocio reportado', () => {
    cy.intercept('GET', '**/reports*', { statusCode: 200, body: [businessReport()] }).as('reports')
    cy.intercept('GET', '**/business/biz_1/review', {
      statusCode: 200,
      body: { business: { id: 'biz_1', name: 'Cafe Espera', status: 'approved' }, organization: {}, alerts: [] },
    }).as('businessReview')
    cy.intercept('PATCH', '**/reports/report_1/suspend', {
      statusCode: 200,
      body: businessReport({ status: 'suspended' }),
    }).as('suspendReport')

    cy.visit('/backoffice/reports')
    cy.wait('@me')
    cy.wait('@reports')
    cy.contains('button', /^detalle$/i).click()
    cy.wait('@businessReview')

    cy.contains('button', /suspender negocio/i).click()
    cy.get('[role="alertdialog"]').contains('button', /^suspender$/i).click()
    cy.wait('@suspendReport')
  })

  it('un reporte de usuario muestra el id sin poder resolver el nombre', () => {
    cy.intercept('GET', '**/reports*', {
      statusCode: 200,
      body: [businessReport({ id: 'report_2', reportedType: 'user', reportedId: 'user_5', reason: 'Insultó a un empleado' })],
    }).as('reports')

    cy.visit('/backoffice/reports')
    cy.wait('@me')
    cy.wait('@reports')

    cy.contains('button', /^detalle$/i).click()
    cy.contains('user_5').should('be.visible')
    cy.contains('no hay endpoint para resolver su nombre').should('be.visible')
  })

  it('filtra por estado', () => {
    cy.intercept('GET', '**/reports*', { statusCode: 200, body: [businessReport()] }).as('reports')

    cy.visit('/backoffice/reports')
    cy.wait('@me')
    cy.wait('@reports')

    cy.intercept('GET', '**/reports*', (request) => {
      expect(request.query.status).to.equal('resolved')
      request.reply({ statusCode: 200, body: [] })
    }).as('filteredReports')

    cy.contains('label', 'Estado').find('select').select('resolved')
    cy.wait('@filteredReports')
    cy.contains('Ningún reporte coincide con estos filtros').should('be.visible')
  })
})
