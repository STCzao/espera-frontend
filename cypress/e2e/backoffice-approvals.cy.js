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

describe('HU-8.2/8.3 - Aprobaciones pendientes (Backoffice)', () => {
  beforeEach(() => {
    mockSuperAdminSession()
  })

  it('lista organizaciones pendientes y las aprueba', () => {
    cy.intercept('GET', '**/organizations/pending', {
      statusCode: 200,
      body: {
        organizations: [
          { id: 'org_1', name: 'Café Espera SRL', legalId: null, status: 'pending', createdAt: '2026-08-01T10:00:00.000Z' },
        ],
      },
    }).as('pendingOrganizations')
    cy.intercept('PATCH', '**/organizations/org_1/approve', {
      statusCode: 200,
      body: { id: 'org_1', name: 'Café Espera SRL', status: 'approved' },
    }).as('approveOrganization')

    cy.visit('/backoffice/approvals')
    cy.wait('@me')
    cy.wait('@pendingOrganizations')

    cy.contains('Café Espera SRL').should('be.visible')
    cy.contains('Sin CUIT cargado').should('be.visible')
    cy.contains('button', /^aprobar$/i).click()
    cy.wait('@approveOrganization')
  })

  it('rechaza una organización pendiente pidiendo motivo', () => {
    cy.intercept('GET', '**/organizations/pending', {
      statusCode: 200,
      body: {
        organizations: [
          { id: 'org_1', name: 'Café Espera SRL', legalId: '30-12345678-9', status: 'pending', createdAt: '2026-08-01T10:00:00.000Z' },
        ],
      },
    }).as('pendingOrganizations')
    cy.intercept('PATCH', '**/organizations/org_1/reject', (request) => {
      expect(request.body).to.deep.equal({ reason: 'Datos inconsistentes' })
      request.reply({ statusCode: 200, body: { id: 'org_1', status: 'rejected' } })
    }).as('rejectOrganization')

    cy.visit('/backoffice/approvals')
    cy.wait('@me')
    cy.wait('@pendingOrganizations')

    cy.contains('button', /^rechazar$/i).click()
    cy.get('[role="alertdialog"]').should('be.visible')
    cy.get('[role="alertdialog"] button').contains(/rechazar organización/i).should('be.disabled')
    cy.get('#reject-organization-reason').type('Datos inconsistentes')
    cy.get('[role="alertdialog"]').contains('button', /rechazar organización/i).click()
    cy.wait('@rejectOrganization')
  })

  it('lista negocios pendientes, muestra alertas de coherencia y exige nota para aprobar', () => {
    mockCategories()
    cy.intercept('GET', '**/business/pending', {
      statusCode: 200,
      body: {
        businesses: [
          { id: 'biz_1', name: 'Cafe Espera', slug: 'cafe-espera', categoryId: 'cat_1', createdAt: '2026-08-01T10:00:00.000Z' },
        ],
      },
    }).as('pendingBusinesses')
    cy.intercept('GET', '**/business/biz_1/review', {
      statusCode: 200,
      body: {
        business: { id: 'biz_1', name: 'Cafe Espera' },
        organization: { id: 'org_1', name: 'Café Espera SRL', legalId: null },
        alerts: ['MISSING_LEGAL_ID'],
      },
    }).as('businessReview')
    cy.intercept('PATCH', '**/business/biz_1/approve', (request) => {
      expect(request.body).to.deep.equal({ note: 'Verificado por teléfono' })
      request.reply({ statusCode: 200, body: { id: 'biz_1', status: 'approved' } })
    }).as('approveBusiness')

    cy.visit('/backoffice/approvals')
    cy.wait('@me')
    cy.contains('button', /negocios/i).click()
    cy.wait('@pendingBusinesses')

    cy.contains('Cafe Espera').should('be.visible')
    cy.contains('Cafetería').should('be.visible')
    cy.contains('button', /revisar/i).click()
    cy.wait('@businessReview')

    cy.contains('Café Espera SRL').should('be.visible')
    cy.contains('no tiene CUIT/legalId cargado').should('be.visible')
    cy.contains(/obligatoria por las alertas/i).should('be.visible')
    cy.contains('button', /^aprobar$/i).should('be.disabled')

    cy.get('textarea[id^="business-approval-note-"]').type('Verificado por teléfono')
    cy.contains('button', /^aprobar$/i).should('be.enabled').click()
    cy.wait('@approveBusiness')
  })

  it('traduce el error cuando la suscripción de la organización está vencida o cancelada', () => {
    mockCategories()
    cy.intercept('GET', '**/business/pending', {
      statusCode: 200,
      body: {
        businesses: [
          { id: 'biz_1', name: 'Cafe Espera', slug: 'cafe-espera', categoryId: 'cat_1', createdAt: '2026-08-01T10:00:00.000Z' },
        ],
      },
    }).as('pendingBusinesses')
    cy.intercept('GET', '**/business/biz_1/review', {
      statusCode: 200,
      body: { business: { id: 'biz_1', name: 'Cafe Espera' }, organization: { id: 'org_1', name: 'Café Espera SRL' }, alerts: [] },
    }).as('businessReview')
    cy.intercept('PATCH', '**/business/biz_1/approve', {
      statusCode: 409,
      body: { message: 'Subscription is not active.', code: 'SUBSCRIPTION_NOT_ACTIVE' },
    }).as('approveBusiness')

    cy.visit('/backoffice/approvals')
    cy.wait('@me')
    cy.contains('button', /negocios/i).click()
    cy.wait('@pendingBusinesses')

    cy.contains('button', /revisar/i).click()
    cy.wait('@businessReview')
    cy.contains('button', /^aprobar$/i).click()
    cy.wait('@approveBusiness')

    cy.contains('vencida o cancelada').should('be.visible')
  })
})
