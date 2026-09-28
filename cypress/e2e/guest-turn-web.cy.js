/// <reference types="cypress" />

describe('HU-4.2 - Sacar turno sin la app (web ligera)', () => {
  function mockResolveQr(overrides = {}) {
    cy.intercept('GET', '**/qr/token-abc123', {
      statusCode: 200,
      body: {
        token: 'token-abc123',
        qrUrl: 'https://espera.app/q/token-abc123',
        qrStatus: 'active',
        action: 'OPEN_BUSINESS_TURN_FLOW',
        appPath: '/business/biz_1/turns/new',
        business: {
          id: 'biz_1',
          name: 'Cafe Espera',
          slug: 'cafe-espera',
          categoryId: 'cat_1',
          address: 'Av. Corrientes 1234',
          listingStatus: 'published',
          activeServiceWindows: 2,
          operationalStatus: 'normal',
          ...overrides,
        },
      },
    }).as('resolveQr')
  }

  it('muestra el negocio y saca un turno de invitado', () => {
    mockResolveQr()
    cy.intercept('POST', '**/queue/guest-turns', (request) => {
      expect(request.body).to.deep.equal({ businessId: 'biz_1', guestName: 'Juan Pérez' })
      request.reply({ statusCode: 201, body: { turnId: 'turn_1', queueId: 'queue_1', displayNumber: 'A-007', position: 3 } })
    }).as('createGuestTurn')
    cy.intercept('GET', '**/queue/guest-turns/turn_1', {
      statusCode: 200,
      body: {
        turnId: 'turn_1',
        queueId: 'queue_1',
        displayNumber: 'A-007',
        status: 'waiting',
        position: 3,
        estimatedWaitMinutes: 12,
        serviceWindowId: null,
      },
    }).as('turnStatus')

    cy.visit('/q/token-abc123')
    cy.wait('@resolveQr')

    cy.contains('h1', 'Cafe Espera').should('be.visible')
    cy.contains('Av. Corrientes 1234').should('be.visible')

    cy.get('input[name="guestName"]').type('Juan Pérez')
    cy.contains('button', /sacar turno/i).click()

    cy.wait('@createGuestTurn')
    cy.url().should('include', '/q/turn/turn_1')
    cy.wait('@turnStatus')

    cy.contains('A-007').should('be.visible')
    cy.contains('Posición en la fila:').should('contain.text', '3')
    cy.contains('Tiempo estimado de espera: 12 min.').should('be.visible')
  })

  it('no deja sacar turno si el negocio está pausado', () => {
    mockResolveQr({ operationalStatus: 'paused' })

    cy.visit('/q/token-abc123')
    cy.wait('@resolveQr')

    cy.contains('está pausado y no está aceptando turnos').should('be.visible')
    cy.get('input[name="guestName"]').should('not.exist')
  })

  it('muestra un error cuando el QR es inválido o venció', () => {
    cy.intercept('GET', '**/qr/token-viejo', {
      statusCode: 404,
      body: { message: 'QR code not found or expired.', code: 'QR_CODE_NOT_FOUND' },
    }).as('resolveQr')

    cy.visit('/q/token-viejo')
    cy.wait('@resolveQr')

    cy.contains('El código QR no existe o venció.').should('be.visible')
  })

  it('muestra "¡Es tu turno!" cuando lo llaman', () => {
    cy.intercept('GET', '**/queue/guest-turns/turn_2', {
      statusCode: 200,
      body: {
        turnId: 'turn_2',
        queueId: 'queue_1',
        displayNumber: 'A-008',
        status: 'called',
        position: 0,
        estimatedWaitMinutes: 0,
        serviceWindowId: 'window_1',
      },
    }).as('turnStatus')

    cy.visit('/q/turn/turn_2')
    cy.wait('@turnStatus')

    cy.contains('¡Es tu turno!').should('be.visible')
  })

  it('muestra el estado final cuando el turno ya fue atendido', () => {
    cy.intercept('GET', '**/queue/guest-turns/turn_3', {
      statusCode: 200,
      body: {
        turnId: 'turn_3',
        queueId: 'queue_1',
        displayNumber: 'A-009',
        status: 'completed',
        position: 0,
        estimatedWaitMinutes: null,
        serviceWindowId: 'window_1',
      },
    }).as('turnStatus')

    cy.visit('/q/turn/turn_3')
    cy.wait('@turnStatus')

    cy.contains('Tu turno ya fue atendido').should('be.visible')
  })

  function mockWaitingTurn(overrides = {}) {
    return {
      turnId: 'turn_4',
      queueId: 'queue_1',
      displayNumber: 'A-010',
      status: 'waiting',
      position: 2,
      estimatedWaitMinutes: 8,
      serviceWindowId: null,
      ...overrides,
    }
  }

  // El estado cambia recién cuando se manda la cancelación, no según cuántas
  // veces se consultó: la página también refresca al conectar el socket (y
  // con un backend corriendo en :3000 el socket conecta de verdad), así que
  // contar requests hacía que el estado nuevo llegara antes del click.
  it('deja salir de la fila con confirmación y muestra el turno cancelado', () => {
    let cancelRequested = false
    cy.intercept('GET', '**/queue/guest-turns/turn_4', (request) => {
      request.reply({
        statusCode: 200,
        body: cancelRequested ? mockWaitingTurn({ status: 'cancelled', position: 0 }) : mockWaitingTurn(),
      })
    }).as('turnStatus')
    cy.intercept('POST', '**/queue/guest-turns/turn_4/cancel', (request) => {
      cancelRequested = true
      request.reply({ statusCode: 200, body: { cancelled: true, turnId: 'turn_4' } })
    }).as('cancelGuestTurn')

    cy.visit('/q/turn/turn_4')
    cy.wait('@turnStatus')

    cy.contains('button', /salir de la fila/i).click()
    cy.contains('¿Salir de la fila?').should('be.visible')
    cy.contains('button', /seguir en la fila/i).click()
    cy.get('@cancelGuestTurn.all').should('have.length', 0)

    cy.contains('button', /salir de la fila/i).click()
    cy.get('[role="alertdialog"]').contains('button', /salir de la fila/i).click()

    cy.wait('@cancelGuestTurn')
    cy.contains('Este turno fue cancelado.').should('be.visible')
    cy.contains('button', /salir de la fila/i).should('not.exist')
  })

  it('si lo llamaron justo antes de cancelar, muestra el error y el estado nuevo', () => {
    let cancelRequested = false
    cy.intercept('GET', '**/queue/guest-turns/turn_4', (request) => {
      request.reply({
        statusCode: 200,
        body: cancelRequested ? mockWaitingTurn({ status: 'called', position: 0 }) : mockWaitingTurn(),
      })
    }).as('turnStatus')
    cy.intercept('POST', '**/queue/guest-turns/turn_4/cancel', (request) => {
      cancelRequested = true
      request.reply({
        statusCode: 409,
        body: { message: 'Turn cannot be cancelled.', code: 'TURN_NOT_CANCELLABLE' },
      })
    }).as('cancelGuestTurn')

    cy.visit('/q/turn/turn_4')
    cy.wait('@turnStatus')

    cy.contains('button', /salir de la fila/i).click()
    cy.get('[role="alertdialog"]').contains('button', /salir de la fila/i).click()

    cy.wait('@cancelGuestTurn')
    cy.contains('¡Es tu turno!').should('be.visible')
  })

  it('muestra un estado propio cuando el turno quedó ausente (no_show)', () => {
    cy.intercept('GET', '**/queue/guest-turns/turn_4', {
      statusCode: 200,
      body: mockWaitingTurn({ status: 'no_show', position: 0 }),
    }).as('turnStatus')

    cy.visit('/q/turn/turn_4')
    cy.wait('@turnStatus')

    cy.contains('Te llamamos y no te encontramos').should('be.visible')
    cy.contains('Ya estás en la fila.').should('not.exist')
  })

  it('avisa que la fila online está completa (409 GUEST_TURN_LIMIT_REACHED)', () => {
    mockResolveQr()
    cy.intercept('POST', '**/queue/guest-turns', {
      statusCode: 409,
      body: { message: 'Guest turn limit reached.', code: 'GUEST_TURN_LIMIT_REACHED' },
    }).as('createGuestTurn')

    cy.visit('/q/token-abc123')
    cy.wait('@resolveQr')
    cy.get('input[name="guestName"]').type('Juan Pérez')
    cy.contains('button', /sacar turno/i).click()

    cy.wait('@createGuestTurn')
    cy.contains('Acercate al mostrador').should('be.visible')
  })

  it('muestra un error cuando el turno no existe', () => {
    cy.intercept('GET', '**/queue/guest-turns/turn-inexistente', {
      statusCode: 404,
      body: { message: 'Turn not found.', code: 'TURN_NOT_FOUND' },
    }).as('turnStatus')

    cy.visit('/q/turn/turn-inexistente')
    cy.wait('@turnStatus')

    cy.contains('El turno no existe.').should('be.visible')
  })
})
