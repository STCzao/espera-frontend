/// <reference types="cypress" />

function mockSession(businessStatus) {
  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: { user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin' } },
  }).as('me')

  cy.intercept('GET', '**/business/me', {
    statusCode: 200,
    body: {
      businesses: [
        {
          id: 'biz_1',
          slug: 'cafe-espera',
          name: 'Cafe Espera',
          status: businessStatus,
          activeServiceWindows: 2,
          listingStatus: 'draft',
          operationalStatus: 'normal',
          plan: 'basic',
          subscriptionStatus: 'active',
          trialEndsAt: null,
          activeQueueId: 'queue_1',
        },
      ],
    },
  }).as('businessMe')
}

describe('Bugfix business-status-guards — el panel avisa cuando el negocio no puede operar', () => {
  it('un negocio suspendido muestra el banner correspondiente en el layout', () => {
    mockSession('suspended')
    cy.visit('/panel/business/cafe-espera')
    cy.wait('@me')
    cy.wait('@businessMe')

    cy.contains('Este negocio está suspendido.').should('be.visible')
  })

  it('un negocio pendiente muestra el banner explicando qué queda bloqueado', () => {
    mockSession('pending')
    cy.visit('/panel/business/cafe-espera')
    cy.wait('@me')
    cy.wait('@businessMe')

    cy.contains('Tu negocio está pendiente de revisión.').should('be.visible')
    cy.contains('invitar empleados, el QR, horarios, ventanillas').should('be.visible')
  })

  it('Empleados: oculta el formulario de invitar en un negocio suspendido', () => {
    mockSession('suspended')
    cy.intercept('GET', '**/business/biz_1/employees', { statusCode: 200, body: { employees: [] } }).as('employees')
    cy.visit('/panel/business/cafe-espera/employees')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@employees')

    cy.contains('button', /^invitar$/i).should('not.exist')
    cy.contains('esta acción no está disponible hasta que se reactive').should('be.visible')
  })

  it('QR: no intenta cargar el QR de un negocio pendiente', () => {
    mockSession('pending')
    cy.intercept('GET', '**/business/biz_1/qr').as('getQr')
    cy.visit('/panel/business/cafe-espera/qr')
    cy.wait('@me')
    cy.wait('@businessMe')

    cy.contains('se habilita cuando se apruebe').should('be.visible')
    cy.get('@getQr.all').should('have.length', 0)
  })

  it('Horarios: sigue mostrando los horarios guardados pero oculta "Guardar cambios" en un negocio rechazado', () => {
    mockSession('rejected')
    cy.intercept('GET', '**/business/biz_1/hours', {
      statusCode: 200,
      body: { businessId: 'biz_1', weeklyHours: [], nonWorkingDays: [] },
    }).as('hours')
    cy.visit('/panel/business/cafe-espera/hours')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@hours')

    cy.contains('button', /guardar cambios/i).should('not.exist')
    cy.contains('esta acción no está disponible').should('be.visible')
  })

  it('Operación: oculta guardar ventanillas, estado operativo y crear cola en un negocio suspendido', () => {
    mockSession('suspended')
    cy.intercept('GET', '**/business/biz_1/queues', {
      statusCode: 200,
      body: [{ id: 'queue_1', businessId: 'biz_1', name: 'Caja principal', prefix: 'A', isActive: true }],
    }).as('queues')
    cy.visit('/panel/business/cafe-espera/operations')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@queues')

    cy.get('input[name="activeServiceWindows"]').should('not.exist')
    cy.get('select[name="operationalStatus"]').should('not.exist')
    cy.contains('button', /crear cola/i).should('not.exist')
    cy.contains('Caja principal').should('be.visible')
  })
})
