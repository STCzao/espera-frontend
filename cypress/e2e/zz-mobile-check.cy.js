/// <reference types="cypress" />

function mockSession() {
  cy.intercept('GET', '**/auth/me', { statusCode: 200, body: { user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin' } } }).as('me')
  cy.intercept('GET', '**/business/me', {
    statusCode: 200,
    body: {
      businesses: [
        { id: 'biz_1', slug: 'cafe-espera', name: 'Cafe Espera', status: 'approved', activeServiceWindows: 2, listingStatus: 'draft', operationalStatus: 'normal', plan: 'basic', subscriptionStatus: 'active', trialEndsAt: null, activeQueueId: 'queue_1' },
      ],
    },
  }).as('businessMe')
  cy.intercept('GET', '**/queue/queue_1/status', {
    statusCode: 200,
    body: {
      queueId: 'queue_1', businessId: 'biz_1', operationalStatus: 'normal', activeServiceWindows: 2,
      waitingCount: 3, calledCount: 1, attendingCount: 1, redirectedCount: 0, estimatedTotalWaitMinutes: 18,
      recentCalls: [{ turnId: 't9', displayNumber: 'A-011', serviceWindowId: 'w1', serviceWindowName: 'Caja', calledAt: new Date(Date.now() - 4 * 60000).toISOString() }],
    },
  }).as('status')
  cy.intercept('GET', '**/queue/queue_1/turns', {
    statusCode: 200,
    body: {
      queueId: 'queue_1',
      items: [
        { turnId: 't1', displayNumber: 'A-010', customerName: null, guestName: 'Cliente sin app', priority: 'physical', status: 'called', waitingMinutes: 6, estimatedWaitMinutes: null },
        { turnId: 't2', displayNumber: 'A-012', customerName: null, guestName: 'Prueba 4', priority: 'physical', status: 'waiting', waitingMinutes: 3, estimatedWaitMinutes: 6 },
        { turnId: 't3', displayNumber: 'A-011', customerName: 'Prueba 3', guestName: null, priority: 'registered', status: 'attending', waitingMinutes: 4, estimatedWaitMinutes: null, serviceWindowName: 'Caja' },
      ],
    },
  }).as('list')
  cy.intercept('GET', '**/queue/queue_1/windows', {
    statusCode: 200,
    body: {
      windows: [
        { id: 'w1', queueId: 'queue_1', name: 'Caja', type: 'cashier', isActive: true, currentTurn: { turnId: 't3', displayNumber: 'A-011', startedAttentionAt: new Date().toISOString() } },
        { id: 'w2', queueId: 'queue_1', name: 'Atención al cliente', type: 'customer_service', isActive: true, currentTurn: null },
      ],
    },
  }).as('windows')
}

describe('mobile check', () => {
  it('portrait 375x812: sin scroll horizontal, boton grande', () => {
    cy.viewport(375, 812)
    mockSession()
    cy.visit('/panel/business/cafe-espera/queue')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@status')
    cy.wait('@list')
    cy.wait('@windows')
    cy.contains('Prueba 3').should('be.visible')

    cy.document().then((doc) => {
      const overflow = doc.documentElement.scrollWidth - doc.documentElement.clientWidth
      cy.wrap(overflow).should('be.lte', 1)
    })

    cy.contains('button', /llamar siguiente/i).then(($btn) => {
      expect($btn[0].getBoundingClientRect().height).to.be.at.least(64)
    })

    cy.screenshot('mobile-portrait', { capture: 'fullPage' })
  })

  it('landscape 812x375: cola y boton visibles', () => {
    cy.viewport(812, 375)
    mockSession()
    cy.visit('/panel/business/cafe-espera/queue')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@status')
    cy.wait('@list')
    cy.wait('@windows')
    cy.contains('Prueba 3').should('be.visible')

    cy.document().then((doc) => {
      const overflow = doc.documentElement.scrollWidth - doc.documentElement.clientWidth
      cy.wrap(overflow).should('be.lte', 1)
    })

    cy.screenshot('mobile-landscape', { capture: 'fullPage' })
  })
})
