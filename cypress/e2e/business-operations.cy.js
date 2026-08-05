/// <reference types="cypress" />

describe('HU-2.3 / HU-2.5 - Ventanillas activas y estado operativo', () => {
  function authenticateVisit({ activeServiceWindows = 3, operationalStatus = 'delayed' } = {}) {
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
            activeServiceWindows,
            listingStatus: 'draft',
            operationalStatus,
          },
        ],
      },
    }).as('businessMe')

    cy.intercept('GET', '**/business/biz_1/queues', {
      statusCode: 200,
      body: [{ id: 'queue_1', businessId: 'biz_1', name: 'Caja principal', prefix: 'A', isActive: true }],
    }).as('queues')

    cy.visit('/panel/business/cafe-espera/operations')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@queues')
  }

  function serviceWindowsForm() {
    return cy.get('input[name="activeServiceWindows"]').closest('form')
  }

  function operationalStatusForm() {
    return cy.get('select[name="operationalStatus"]').closest('form')
  }

  it('precarga la cantidad de ventanillas y el estado operativo actuales', () => {
    authenticateVisit()

    cy.get('input[name="activeServiceWindows"]').should('have.value', '3')
    cy.get('select[name="operationalStatus"]').should('have.value', 'delayed')
  })

  it('valida que las ventanillas no superen 50', () => {
    authenticateVisit()

    cy.intercept('PUT', '**/business/biz_1/service-windows').as('updateWindows')

    cy.get('input[name="activeServiceWindows"]').clear().type('51')
    serviceWindowsForm().contains('button', /guardar/i).click()

    cy.contains(/no puede superar 50/i).should('be.visible')
    cy.get('@updateWindows.all').should('have.length', 0)
  })

  it('guarda 0 ventanillas y avisa que el negocio queda sin atención disponible', () => {
    authenticateVisit()

    cy.intercept('PUT', '**/business/biz_1/service-windows', (request) => {
      expect(request.body).to.deep.equal({ activeServiceWindows: 0 })
      request.reply({
        statusCode: 200,
        body: { businessId: 'biz_1', activeServiceWindows: 0, attentionAvailable: false },
      })
    }).as('updateWindows')

    cy.get('input[name="activeServiceWindows"]').clear().type('0')
    serviceWindowsForm().contains('button', /guardar/i).click()

    cy.wait('@updateWindows')
    cy.contains(/sin atención disponible/i).should('be.visible')
  })

  it('guarda una cantidad mayor a 0 y avisa que el negocio queda disponible', () => {
    authenticateVisit()

    cy.intercept('PUT', '**/business/biz_1/service-windows', (request) => {
      expect(request.body).to.deep.equal({ activeServiceWindows: 5 })
      request.reply({
        statusCode: 200,
        body: { businessId: 'biz_1', activeServiceWindows: 5, attentionAvailable: true },
      })
    }).as('updateWindows')

    cy.get('input[name="activeServiceWindows"]').clear().type('5')
    serviceWindowsForm().contains('button', /guardar/i).click()

    cy.wait('@updateWindows')
    cy.contains(/disponible para recibir turnos/i).should('be.visible')
  })

  it('cambia el estado operativo y muestra el mensaje que devuelve el backend', () => {
    authenticateVisit()

    cy.intercept('PATCH', '**/business/biz_1/operational-status', (request) => {
      expect(request.body).to.deep.equal({ operationalStatus: 'paused', reason: 'Corte de luz' })
      request.reply({
        statusCode: 200,
        body: {
          businessId: 'biz_1',
          operationalStatus: 'paused',
          acceptsNewTurns: false,
          indicator: 'gray',
          customerMessage: 'Atencion pausada temporalmente.',
        },
      })
    }).as('updateStatus')

    cy.get('select[name="operationalStatus"]').select('paused')
    cy.get('input[name="reason"]').type('Corte de luz')
    operationalStatusForm().contains('button', /guardar/i).click()

    cy.wait('@updateStatus')
    cy.contains(/atencion pausada temporalmente/i).should('be.visible')
  })

  it('muestra error de backend al cambiar el estado operativo', () => {
    authenticateVisit()

    cy.intercept('PATCH', '**/business/biz_1/operational-status', {
      statusCode: 500,
      body: { message: 'Internal server error.' },
    }).as('updateStatus')

    cy.get('select[name="operationalStatus"]').select('closed')
    operationalStatusForm().contains('button', /guardar/i).click()

    cy.wait('@updateStatus')
    cy.contains(/internal server error/i).should('be.visible')
  })

  it('lista las colas del negocio y crea una adicional', () => {
    authenticateVisit()

    cy.contains('Caja principal').should('be.visible')
    cy.contains('Prefijo A').should('be.visible')

    cy.intercept('POST', '**/business/biz_1/queues', (request) => {
      expect(request.body).to.deep.equal({ name: 'Turnos VIP', prefix: 'B' })
      request.reply({
        statusCode: 201,
        body: { id: 'queue_2', businessId: 'biz_1', name: 'Turnos VIP', prefix: 'B', isActive: true },
      })
    }).as('createQueue')

    cy.get('input[name="name"]').type('Turnos VIP')
    cy.get('input[name="prefix"]').type('b')
    cy.contains('button', /crear cola/i).click()

    cy.wait('@createQueue')
    cy.contains('Cola creada.').should('be.visible')
  })

  it('traduce el error cuando se alcanza el límite de colas del plan', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business/biz_1/queues', {
      statusCode: 403,
      body: { message: 'Your plan allows up to 1 queue(s) per business.', code: 'PLAN_QUEUE_LIMIT_REACHED' },
    }).as('createQueue')

    cy.get('input[name="name"]').type('Turnos VIP')
    cy.get('input[name="prefix"]').type('B')
    cy.contains('button', /crear cola/i).click()

    cy.wait('@createQueue')
    cy.contains('Tu plan no permite crear más colas para este negocio.').should('be.visible')
  })
})
