/// <reference types="cypress" />

describe('HU-6.4 / HU-6.5 - Historial y métricas de la cola', () => {
  function authenticateVisit({ metricsOverrides, historyItems } = {}) {
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

    cy.intercept('GET', '**/queue/queue_1/metrics*', {
      statusCode: 200,
      body: {
        date: '2026-07-29',
        today: {
          completedCount: 12,
          cancelledCount: 3,
          totalCount: 15,
          cancellationRate: 20,
          avgServiceMinutes: 6,
          peakHour: 14,
          ...metricsOverrides?.today,
        },
        yesterday: {
          completedCount: 9,
          cancelledCount: 1,
          totalCount: 10,
          cancellationRate: 10,
          avgServiceMinutes: 5,
          peakHour: 11,
          ...metricsOverrides?.yesterday,
        },
      },
    }).as('metrics')

    cy.intercept('GET', '**/queue/queue_1/turns/history*', {
      statusCode: 200,
      body: historyItems ?? [
        {
          turnId: 'turn_1',
          displayNumber: 'A-001',
          customerName: 'Juan García',
          guestName: null,
          source: 'app',
          priority: 'registered',
          createdAt: '2026-07-29T10:00:00.000Z',
          calledAt: '2026-07-29T10:05:00.000Z',
          attendedAt: '2026-07-29T10:12:00.000Z',
          waitMinutes: 5,
        },
        {
          turnId: 'turn_2',
          displayNumber: 'A-002',
          customerName: null,
          guestName: 'Cliente sin app',
          source: 'manual',
          priority: 'in-transit',
          createdAt: '2026-07-29T10:10:00.000Z',
          calledAt: '2026-07-29T10:20:00.000Z',
          attendedAt: '2026-07-29T10:25:00.000Z',
          waitMinutes: 10,
        },
      ],
    }).as('history')

    cy.visit('/panel/business/cafe-espera/queue/history')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@metrics')
    cy.wait('@history')
  }

  it('muestra la comparativa de métricas y la tabla de turnos completados', () => {
    authenticateVisit()

    cy.contains('h1', /^historial$/i).should('be.visible')

    cy.contains('Completados').should('be.visible')
    cy.contains('12').should('be.visible')
    cy.contains('9').should('be.visible')
    cy.contains('20%').should('be.visible')
    cy.contains('14:00 hs').should('be.visible')

    cy.contains('Juan García').should('be.visible')
    cy.contains('Registrado').should('be.visible')
    cy.contains('Cliente sin app').should('be.visible')
    cy.contains('En camino').should('be.visible')
    cy.contains('10 min').should('be.visible')
  })

  it('cambia la fecha y vuelve a pedir métricas e historial', () => {
    authenticateVisit()

    cy.intercept('GET', '**/queue/queue_1/metrics*date=2026-07-28*', {
      statusCode: 200,
      body: {
        date: '2026-07-28',
        today: { completedCount: 4, cancelledCount: 0, totalCount: 4, cancellationRate: 0, avgServiceMinutes: 3, peakHour: 9 },
        yesterday: { completedCount: 2, cancelledCount: 0, totalCount: 2, cancellationRate: 0, avgServiceMinutes: 4, peakHour: 10 },
      },
    }).as('metricsPrevDay')
    cy.intercept('GET', '**/queue/queue_1/turns/history*date=2026-07-28*', {
      statusCode: 200,
      body: [],
    }).as('historyPrevDay')

    cy.get('#history-date').clear().type('2026-07-28')

    cy.wait('@metricsPrevDay')
    cy.wait('@historyPrevDay')
    cy.contains('No hubo turnos completados este día.').should('be.visible')
  })

  it('muestra error de backend si no puede cargar métricas o historial', () => {
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
    cy.intercept('GET', '**/queue/queue_1/metrics*', { statusCode: 500, body: { message: 'Internal server error.' } }).as('metrics')
    cy.intercept('GET', '**/queue/queue_1/turns/history*', { statusCode: 500, body: { message: 'Internal server error.' } }).as('history')

    cy.visit('/panel/business/cafe-espera/queue/history')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@metrics')
    cy.wait('@history')

    cy.contains(/no pudimos cargar las métricas/i).should('be.visible')
    cy.contains(/no pudimos cargar el historial/i).should('be.visible')
  })
})
