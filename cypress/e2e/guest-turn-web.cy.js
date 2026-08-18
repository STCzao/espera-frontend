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
