/// <reference types="cypress" />

describe('HU-6.1 / HU-3.8 - Dashboard y lista de la cola', () => {
  function mockWindows() {
    cy.intercept('GET', '**/queue/queue_1/windows', {
      statusCode: 200,
      body: {
        windows: [{ id: 'w1', queueId: 'queue_1', name: 'Ventanilla 1', type: 'cashier', isActive: true }],
      },
    }).as('windows')
  }

  function authenticateVisit({ statusOverrides, listOverrides, businessOverrides } = {}) {
    mockWindows()
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
            phone: '+54 11 4000-1234',
            address: 'Av. Corrientes 1234',
            activeServiceWindows: 1,
            listingStatus: 'draft',
            operationalStatus: 'normal',
            plan: 'basic',
            subscriptionStatus: 'active',
            trialEndsAt: null,
            activeQueueId: 'queue_1',
            ...businessOverrides,
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
        waitingCount: 2,
        calledCount: 0,
        attendingCount: 0,
        estimatedTotalWaitMinutes: 10,
        ...statusOverrides,
      },
    }).as('status')

    cy.intercept('GET', '**/queue/queue_1/turns', {
      statusCode: 200,
      body: {
        queueId: 'queue_1',
        items: [
          {
            turnId: 'turn_1',
            displayNumber: 'A-001',
            customerName: 'Juan García',
            guestName: null,
            priority: 'registered',
            status: 'waiting',
            waitingMinutes: 5,
            estimatedWaitMinutes: 5,
          },
          {
            turnId: 'turn_2',
            displayNumber: 'A-002',
            customerName: null,
            guestName: 'Cliente sin app',
            priority: 'physical',
            status: 'waiting',
            waitingMinutes: 1,
            estimatedWaitMinutes: 10,
          },
        ],
        ...listOverrides,
      },
    }).as('list')

    cy.visit('/panel/business/cafe-espera/queue')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@status')
    cy.wait('@list')
  }

  it('muestra el mensaje de cola pendiente cuando el negocio todavía no tiene una', () => {
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
            status: 'pending',
            activeServiceWindows: 1,
            listingStatus: 'draft',
            operationalStatus: 'normal',
            plan: 'basic',
            subscriptionStatus: 'pending',
            trialEndsAt: null,
            activeQueueId: null,
          },
        ],
      },
    }).as('businessMe')

    cy.visit('/panel/business/cafe-espera/queue')
    cy.wait('@me')
    cy.wait('@businessMe')

    cy.contains(/todavía no tenés una cola activa/i).should('be.visible')
  })

  it('muestra las métricas del dashboard y la lista de turnos activos', () => {
    authenticateVisit()

    cy.contains('h1', /^cola$/i).should('be.visible')
    cy.contains('Normal').should('be.visible')
    cy.contains(/tiempo estimado de espera: 10 min/i).should('be.visible')

    cy.contains('Juan García').should('be.visible')
    cy.contains('Cliente sin app').should('be.visible')
    cy.contains(/esperando hace 5 min · faltan ~5 min/i).should('be.visible')
    cy.contains(/esperando hace 1 min · faltan ~10 min/i).should('be.visible')
  })

  it('deshabilita "Siguiente" y muestra "Cola vacía" cuando no hay nadie esperando', () => {
    authenticateVisit({ statusOverrides: { waitingCount: 0, estimatedTotalWaitMinutes: 0 }, listOverrides: { items: [] } })

    cy.contains('button', /cola vacía/i).should('be.disabled')
    cy.contains(/no hay turnos activos en este momento/i).should('be.visible')
  })

  it('llama al siguiente turno y actualiza el dashboard y la lista', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/turns/call-next', (request) => {
      expect(request.body).to.deep.equal({ queueId: 'queue_1' })
      request.reply({ statusCode: 200, body: { turnId: 'turn_1', queueId: 'queue_1', displayNumber: 'A-001' } })
    }).as('callNext')

    cy.intercept('GET', '**/queue/queue_1/status', {
      statusCode: 200,
      body: {
        queueId: 'queue_1',
        businessId: 'biz_1',
        operationalStatus: 'normal',
        activeServiceWindows: 1,
        waitingCount: 1,
        calledCount: 1,
        estimatedTotalWaitMinutes: 5,
      },
    })

    cy.contains('button', /^llamar siguiente$/i).click()

    cy.wait('@callNext')
    cy.contains(/llamando al turno a-001/i).should('be.visible')
    cy.contains(/tiempo estimado de espera: 5 min/i).should('be.visible')
  })

  it('muestra error de backend al llamar al siguiente turno', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/turns/call-next', {
      statusCode: 409,
      body: { message: 'The queue is empty.' },
    }).as('callNext')

    cy.contains('button', /^llamar siguiente$/i).click()

    cy.wait('@callNext')
    cy.contains(/the queue is empty/i).should('be.visible')
  })

  it('muestra error si no puede cargar el estado o la lista', () => {
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
    cy.intercept('GET', '**/queue/queue_1/status', { statusCode: 500, body: { message: 'Internal server error.' } }).as('status')
    cy.intercept('GET', '**/queue/queue_1/turns', { statusCode: 500, body: { message: 'Internal server error.' } }).as('list')
    mockWindows()

    cy.visit('/panel/business/cafe-espera/queue')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@status')
    cy.wait('@list')

    cy.contains(/no pudimos cargar el estado de la cola/i).should('be.visible')
    cy.contains(/no pudimos cargar la lista de turnos/i).should('be.visible')
  })
})
