/// <reference types="cypress" />

describe('HU-3.9 / HU-3.10 / HU-3.11 - Acciones sobre turnos', () => {
  function authenticateVisit(listItems) {
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
        waitingCount: 1,
        calledCount: 1,
        attendingCount: 0,
        estimatedTotalWaitMinutes: 5,
      },
    }).as('status')

    cy.intercept('GET', '**/queue/queue_1/turns', {
      statusCode: 200,
      body: {
        queueId: 'queue_1',
        items: listItems ?? [
          {
            turnId: 'turn_waiting',
            displayNumber: 'A-001',
            customerName: null,
            guestName: 'Cliente Esperando',
            priority: 'physical',
            status: 'waiting',
            waitingMinutes: 2,
            estimatedWaitMinutes: 5,
          },
          {
            turnId: 'turn_called',
            displayNumber: 'A-002',
            customerName: null,
            guestName: 'Cliente Llamado',
            priority: 'physical',
            status: 'called',
            waitingMinutes: 6,
            estimatedWaitMinutes: null,
          },
        ],
      },
    }).as('list')

    cy.intercept('GET', '**/queue/queue_1/windows', {
      statusCode: 200,
      body: {
        windows: [{ id: 'window_1', queueId: 'queue_1', name: 'Ventanilla 1', type: 'cashier', isActive: true }],
      },
    }).as('windows')

    cy.visit('/panel/business/cafe-espera/queue')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@status')
    cy.wait('@list')
    cy.wait('@windows')
  }

  it('valida el nombre antes de agregar un turno manual', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/queue_1/turns/manual').as('manual')
    cy.get('input[name="guestName"]').parents('form').contains('button', /^agregar$/i).click()

    cy.contains(/ingresá un nombre/i).should('be.visible')
    cy.get('@manual.all').should('have.length', 0)
  })

  it('agrega un turno manual y limpia el formulario', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/queue_1/turns/manual', (request) => {
      expect(request.body).to.deep.equal({ guestName: 'Nuevo Cliente' })
      request.reply({
        statusCode: 201,
        body: { turnId: 'turn_new', queueId: 'queue_1', displayNumber: 'A-003', guestName: 'Nuevo Cliente', position: 3 },
      })
    }).as('manual')

    cy.get('input[name="guestName"]').type('Nuevo Cliente')
    cy.get('input[name="guestName"]').parents('form').contains('button', /^agregar$/i).click()

    cy.wait('@manual')
    cy.get('input[name="guestName"]').should('have.value', '')
  })

  it('muestra error de backend al agregar un turno manual', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/queue_1/turns/manual', {
      statusCode: 409,
      body: { message: 'This business is not currently accepting customers.' },
    }).as('manual')

    cy.get('input[name="guestName"]').type('Nuevo Cliente')
    cy.get('input[name="guestName"]').parents('form').contains('button', /^agregar$/i).click()

    cy.wait('@manual')
    cy.contains(/this business is not currently accepting customers/i).should('be.visible')
  })

  it('solo muestra el botón de iniciar atención en el turno llamado', () => {
    authenticateVisit()

    cy.get('button[aria-label="Iniciar atención a A-002"]').should('exist')
    cy.get('button[aria-label="Iniciar atención a A-001"]').should('not.exist')
    cy.get('button[aria-label="Finalizar atención a A-002"]').should('not.exist')
    cy.get('button[aria-label="Cancelar turno A-001"]').should('exist')
    cy.get('button[aria-label="Cancelar turno A-002"]').should('exist')
  })

  it('pide confirmación antes de cancelar y no cancela si se descarta', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/queue_1/turns/turn_waiting/cancel').as('cancel')

    cy.get('button[aria-label="Cancelar turno A-001"]').click()
    cy.contains('¿Cancelar este turno?').should('be.visible')
    cy.get('[role="alertdialog"]').contains('button', /^cancelar$/i).click()

    cy.contains('¿Cancelar este turno?').should('not.exist')
    cy.get('@cancel.all').should('have.length', 0)
    cy.contains('Cliente Esperando').should('be.visible')
  })

  it('cancela un turno en espera y lo saca de la lista', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/queue_1/turns/turn_waiting/cancel', {
      statusCode: 200,
      body: { cancelled: true, turnId: 'turn_waiting' },
    }).as('cancel')

    cy.intercept('GET', '**/queue/queue_1/turns', {
      statusCode: 200,
      body: {
        queueId: 'queue_1',
        items: [
          {
            turnId: 'turn_called',
            displayNumber: 'A-002',
            customerName: null,
            guestName: 'Cliente Llamado',
            priority: 'physical',
            status: 'called',
            waitingMinutes: 6,
          },
        ],
      },
    })

    cy.get('button[aria-label="Cancelar turno A-001"]').click()
    cy.contains('button', /^cancelar turno$/i).click()

    cy.wait('@cancel')
    cy.contains('Cliente Esperando').should('not.exist')
  })

  it('muestra error de backend al cancelar un turno', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/queue_1/turns/turn_waiting/cancel', {
      statusCode: 409,
      body: { message: 'This turn cannot be cancelled.' },
    }).as('cancel')

    cy.get('button[aria-label="Cancelar turno A-001"]').click()
    cy.contains('button', /^cancelar turno$/i).click()

    cy.wait('@cancel')
    cy.contains(/this turn cannot be cancelled/i).should('be.visible')
  })

  it('inicia la atención de un turno llamado, con ventanilla seleccionada', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/queue_1/turns/turn_called/attend', (request) => {
      expect(request.body).to.deep.equal({ serviceWindowId: 'window_1' })
      request.reply({
        statusCode: 200,
        body: { turnId: 'turn_called', status: 'attending', startedAttentionAt: '2026-07-29T21:23:25.151Z' },
      })
    }).as('attend')

    cy.intercept('GET', '**/queue/queue_1/turns', {
      statusCode: 200,
      body: {
        queueId: 'queue_1',
        items: [
          {
            turnId: 'turn_waiting',
            displayNumber: 'A-001',
            customerName: null,
            guestName: 'Cliente Esperando',
            priority: 'physical',
            status: 'waiting',
            waitingMinutes: 2,
          },
          {
            turnId: 'turn_called',
            displayNumber: 'A-002',
            customerName: null,
            guestName: 'Cliente Llamado',
            priority: 'physical',
            status: 'attending',
            waitingMinutes: 6,
          },
        ],
      },
    })

    cy.get('select[aria-label="Ventanilla para A-002"]').select('window_1')
    cy.get('button[aria-label="Iniciar atención a A-002"]').click()

    cy.wait('@attend')
    cy.contains(/^atendiendo$/i).should('be.visible')
    cy.get('button[aria-label="Finalizar atención a A-002"]').should('exist')
  })

  it('muestra error de backend al iniciar atención', () => {
    authenticateVisit()

    cy.intercept('POST', '**/queue/queue_1/turns/turn_called/attend', {
      statusCode: 409,
      body: { message: 'Only a called turn can start attention.' },
    }).as('attend')

    cy.get('button[aria-label="Iniciar atención a A-002"]').click()

    cy.wait('@attend')
    cy.contains(/only a called turn can start attention/i).should('be.visible')
  })

  it('finaliza la atención de un turno y lo saca de la lista', () => {
    authenticateVisit([
      {
        turnId: 'turn_attending',
        displayNumber: 'A-002',
        customerName: null,
        guestName: 'Cliente Atendiendo',
        priority: 'physical',
        status: 'attending',
        waitingMinutes: 9,
        estimatedWaitMinutes: null,
      },
    ])

    cy.intercept('POST', '**/queue/queue_1/turns/turn_attending/attend', (request) => {
      expect(request.body).to.be.oneOf([undefined, null, '', {}])
      request.reply({
        statusCode: 200,
        body: { turnId: 'turn_attending', status: 'completed', attendedAt: '2026-07-29T21:30:00.000Z' },
      })
    }).as('attend')

    cy.intercept('GET', '**/queue/queue_1/turns', { statusCode: 200, body: { queueId: 'queue_1', items: [] } })

    cy.get('button[aria-label="Finalizar atención a A-002"]').click()

    cy.wait('@attend')
    cy.contains('Cliente Atendiendo').should('not.exist')
  })

  it('muestra error de backend al finalizar atención', () => {
    authenticateVisit([
      {
        turnId: 'turn_attending',
        displayNumber: 'A-002',
        customerName: null,
        guestName: 'Cliente Atendiendo',
        priority: 'physical',
        status: 'attending',
        waitingMinutes: 9,
        estimatedWaitMinutes: null,
      },
    ])

    cy.intercept('POST', '**/queue/queue_1/turns/turn_attending/attend', {
      statusCode: 409,
      body: { message: 'Only an attending turn can be completed.' },
    }).as('attend')

    cy.get('button[aria-label="Finalizar atención a A-002"]').click()

    cy.wait('@attend')
    cy.contains(/only an attending turn can be completed/i).should('be.visible')
  })
})
