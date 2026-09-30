/// <reference types="cypress" />

describe('Gestión de ventanillas - confirmación al desactivar', () => {
  beforeEach(() => {
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
            status: 'approved',
            activeServiceWindows: 1,
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

    cy.intercept('GET', '**/queue/queue_1/status', {
      statusCode: 200,
      body: {
        queueId: 'queue_1',
        businessId: 'biz_1',
        operationalStatus: 'normal',
        activeServiceWindows: 1,
        waitingCount: 0,
        calledCount: 0,
        attendingCount: 1,
        estimatedTotalWaitMinutes: 0,
        recentCalls: [],
      },
    }).as('status')

    cy.intercept('GET', '**/queue/queue_1/turns', { statusCode: 200, body: { queueId: 'queue_1', items: [] } }).as('list')

    cy.intercept('GET', '**/queue/queue_1/windows', {
      statusCode: 200,
      body: {
        windows: [
          {
            id: 'window_1',
            queueId: 'queue_1',
            name: 'Caja',
            type: 'cashier',
            isActive: true,
            currentTurn: { turnId: 'turn_1', displayNumber: 'A-001', startedAttentionAt: new Date().toISOString() },
          },
        ],
      },
    }).as('windows')

    cy.visit('/panel/business/cafe-espera/queue')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@status')
    cy.wait('@list')
    cy.wait('@windows')
    cy.contains('button', /^ventanillas$/i).click()
  })

  it('pide confirmación antes de desactivar una ventanilla ocupada', () => {
    cy.intercept('PATCH', '**/queue/queue_1/windows/window_1/toggle').as('toggle')

    cy.contains('button', /^activa$/i).click()
    cy.contains('¿Desactivar esta ventanilla?').should('be.visible')
    cy.contains('A-001').should('be.visible')
    cy.get('@toggle.all').should('have.length', 0)
  })

  it('desactiva la ventanilla al confirmar', () => {
    cy.intercept('PATCH', '**/queue/queue_1/windows/window_1/toggle', {
      statusCode: 200,
      body: { id: 'window_1', queueId: 'queue_1', name: 'Caja', type: 'cashier', isActive: false },
    }).as('toggle')

    cy.contains('button', /^activa$/i).click()
    cy.contains('button', /^desactivar$/i).click()

    cy.wait('@toggle')
    cy.contains('¿Desactivar esta ventanilla?').should('not.exist')
  })

  it('no desactiva si se cancela la confirmación', () => {
    cy.intercept('PATCH', '**/queue/queue_1/windows/window_1/toggle').as('toggle')

    cy.contains('button', /^activa$/i).click()
    cy.contains('button', /^cancelar$/i).click()

    cy.contains('¿Desactivar esta ventanilla?').should('not.exist')
    cy.get('@toggle.all').should('have.length', 0)
    cy.contains('button', /^activa$/i).should('exist')
  })
})
