/// <reference types="cypress" />

describe('CRUD de ventanillas y traducción de códigos de error', () => {
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
        redirectedCount: 0,
        estimatedTotalWaitMinutes: 0,
        recentCalls: [],
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
            customerName: 'Prueba 1',
            guestName: null,
            priority: 'registered',
            status: 'attending',
            waitingMinutes: 4,
            estimatedWaitMinutes: null,
            serviceWindowId: 'window_1',
            serviceWindowName: 'Caja',
          },
        ],
      },
    }).as('list')

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
          { id: 'window_2', queueId: 'queue_1', name: 'Atención al cliente', type: 'customer_service', isActive: true, currentTurn: null },
        ],
      },
    }).as('windows')

    cy.visit('/panel/business/cafe-espera/queue')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@status')
    cy.wait('@list')
    cy.wait('@windows')
  })

  it('deriva un turno atendido a otra ventanilla', () => {
    cy.intercept('POST', '**/queue/queue_1/turns/turn_1/redirect', (request) => {
      expect(request.body).to.deep.equal({ targetServiceWindowId: 'window_2' })
      request.reply({ statusCode: 200, body: { turnId: 'turn_1', status: 'redirected', serviceWindowId: 'window_2' } })
    }).as('redirect')

    cy.intercept('GET', '**/queue/queue_1/turns', {
      statusCode: 200,
      body: {
        queueId: 'queue_1',
        items: [
          {
            turnId: 'turn_1',
            displayNumber: 'A-001',
            customerName: 'Prueba 1',
            guestName: null,
            priority: 'registered',
            status: 'redirected',
            waitingMinutes: 5,
            estimatedWaitMinutes: null,
            serviceWindowId: 'window_2',
            serviceWindowName: 'Atención al cliente',
          },
        ],
      },
    })

    cy.get('select[aria-label="Derivar a A-001 a otra ventanilla"]').select('window_2')
    cy.get('button[aria-label="Confirmar derivación de A-001"]').click()

    cy.wait('@redirect')
    cy.contains('Derivado').should('be.visible')
    cy.contains('En camino a Atención al cliente').should('be.visible')
    cy.get('button[aria-label="Atender a A-001"]').should('exist')
  })

  it('muestra el texto en español cuando el backend rechaza la derivación con un code conocido', () => {
    cy.intercept('POST', '**/queue/queue_1/turns/turn_1/redirect', {
      statusCode: 400,
      body: { message: 'The turn is already at that service window.', code: 'REDIRECT_SAME_WINDOW' },
    }).as('redirect')

    cy.get('select[aria-label="Derivar a A-001 a otra ventanilla"]').select('window_2')
    cy.get('button[aria-label="Confirmar derivación de A-001"]').click()

    cy.wait('@redirect')
    cy.contains('El turno ya está en esa ventanilla.').should('be.visible')
    cy.contains('The turn is already at that service window.').should('not.exist')
  })

  it('edita el nombre y tipo de una ventanilla', () => {
    cy.contains('button', /^ventanillas$/i).click()

    cy.intercept('PATCH', '**/queue/queue_1/windows/window_1', (request) => {
      expect(request.body).to.deep.equal({ name: 'Caja principal', type: 'cashier' })
      request.reply({ statusCode: 200, body: { id: 'window_1', queueId: 'queue_1', name: 'Caja principal', type: 'cashier', isActive: true } })
    }).as('edit')

    cy.get('button[aria-label="Editar Caja"]').click()
    cy.contains('button', /^guardar$/i)
      .closest('form')
      .find('input[name="name"]')
      .clear()
      .type('Caja principal')
    cy.contains('button', /^guardar$/i).click()

    cy.wait('@edit')
  })

  it('elimina una ventanilla libre', () => {
    cy.contains('button', /^ventanillas$/i).click()

    cy.intercept('DELETE', '**/queue/queue_1/windows/window_2', {
      statusCode: 200,
      body: { deleted: true, windowId: 'window_2' },
    }).as('delete')

    cy.get('button[aria-label="Eliminar Atención al cliente"]').click()
    cy.get('[role="alertdialog"]').contains('button', /^eliminar$/i).click()

    cy.wait('@delete')
  })

  it('muestra el texto en español cuando no se puede eliminar una ventanilla ocupada', () => {
    cy.contains('button', /^ventanillas$/i).click()

    cy.intercept('DELETE', '**/queue/queue_1/windows/window_1', {
      statusCode: 409,
      body: { message: 'The service window is currently attending a turn.', code: 'SERVICE_WINDOW_IN_USE' },
    }).as('delete')

    cy.get('button[aria-label="Eliminar Caja"]').click()
    cy.get('[role="alertdialog"]').contains('button', /^eliminar$/i).click()

    cy.wait('@delete')
    cy.contains('La ventanilla está atendiendo a alguien ahora mismo.').should('be.visible')
  })

  it('muestra el texto en español cuando se alcanza el límite de ventanillas del plan', () => {
    cy.contains('button', /^ventanillas$/i).click()

    cy.intercept('POST', '**/queue/queue_1/windows', {
      statusCode: 403,
      body: { message: 'Your plan allows up to 1 service window(s) per queue.', code: 'PLAN_SERVICE_WINDOW_LIMIT_REACHED' },
    }).as('createWindow')

    cy.get('input[name="name"]').type('Ventanilla extra')
    cy.contains('button', /agregar ventanilla/i).click()

    cy.wait('@createWindow')
    cy.contains('Tu plan no permite crear más ventanillas en esta cola.').should('be.visible')
  })

  it('avisa cuando la cola ya tiene más ventanillas de las que el plan permite', () => {
    // El fixture base (plan basic, 2 ventanillas) ya está por encima del
    // límite (1) — mismo caso real encontrado en la base de datos local.
    cy.contains('button', /^ventanillas$/i).click()

    cy.contains('Tenés 2 ventanillas en esta cola, pero tu plan permite hasta 1.').should('be.visible')
  })
})
