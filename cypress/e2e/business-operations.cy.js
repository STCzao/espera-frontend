/// <reference types="cypress" />

describe('HU-2.5 - Estado operativo y colas del negocio', () => {
  function authenticateVisit({
    operationalStatus = 'delayed',
    plan = 'basic',
    queues = [{ id: 'queue_1', businessId: 'biz_1', name: 'Caja principal', prefix: 'A', isActive: true }],
  } = {}) {
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
            operationalStatus,
            plan,
          },
        ],
      },
    }).as('businessMe')

    cy.intercept('GET', '**/business/biz_1/queues', { statusCode: 200, body: queues }).as('queues')

    cy.visit('/panel/business/cafe-espera/operations')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@queues')
  }

  function operationalStatusForm() {
    return cy.get('select[name="operationalStatus"]').closest('form')
  }

  it('precarga el estado operativo actual', () => {
    authenticateVisit()

    cy.get('select[name="operationalStatus"]').should('have.value', 'delayed')
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
    // Plan "pro" (colas ilimitadas) — con "basic" (default, límite 1) el
    // form de crear cola ni se muestra, ya que el negocio ya tiene su única
    // cola permitida (ver test "el plan no permite crear más colas").
    authenticateVisit({ plan: 'pro' })

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

  it('el plan no permite crear más colas: oculta el form y avisa en vez de dejar intentarlo', () => {
    // Plan "basic" (default) permite 1 cola, y el negocio ya la tiene — el
    // form de "Crear cola" no debería mostrarse en absoluto.
    authenticateVisit()

    cy.get('input[name="name"]').should('not.exist')
    cy.contains(/tu plan actual permite 1 cola por negocio, y ya la tenés/i).should('be.visible')
  })

  it('traduce el error si el backend igual rechaza por límite de plan (carrera entre pestañas)', () => {
    // Arranca sin colas (el form se muestra) para simular que otra pestaña
    // ya creó la única cola permitida justo antes de este submit.
    authenticateVisit({ queues: [] })

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

  it('avisa cuando un negocio ya tiene más colas de las que su plan permite', () => {
    authenticateVisit({
      queues: [
        { id: 'queue_1', businessId: 'biz_1', name: 'Caja principal', prefix: 'A', isActive: true },
        { id: 'queue_2', businessId: 'biz_1', name: 'Turnos VIP', prefix: 'B', isActive: true },
      ],
    })

    cy.contains('Tenés 2 colas, pero tu plan permite hasta 1.').should('be.visible')
  })

  it('desactiva una cola que no es la única activa', () => {
    authenticateVisit({
      queues: [
        { id: 'queue_1', businessId: 'biz_1', name: 'Caja principal', prefix: 'A', isActive: true },
        { id: 'queue_2', businessId: 'biz_1', name: 'Turnos VIP', prefix: 'B', isActive: true },
      ],
    })

    cy.intercept('PATCH', '**/business/biz_1/queues/queue_2/toggle', {
      statusCode: 200,
      body: { id: 'queue_2', businessId: 'biz_1', name: 'Turnos VIP', prefix: 'B', isActive: false },
    }).as('toggleQueue')

    cy.contains('button', /desactivar turnos vip/i).click()

    cy.wait('@toggleQueue')
  })

  it('no deja desactivar la única cola activa del negocio', () => {
    authenticateVisit()

    cy.contains('button', /caja principal es la única cola activa/i).should('be.disabled')
  })

  it('traduce el error si el backend igual rechaza por ser la única cola activa (carrera entre pestañas)', () => {
    // Las dos colas figuran activas del lado del cliente (el botón no se
    // deshabilita), pero el backend simula que otra pestaña ya desactivó
    // "Turnos VIP" justo antes de este click.
    authenticateVisit({
      queues: [
        { id: 'queue_1', businessId: 'biz_1', name: 'Caja principal', prefix: 'A', isActive: true },
        { id: 'queue_2', businessId: 'biz_1', name: 'Turnos VIP', prefix: 'B', isActive: true },
      ],
    })

    cy.intercept('PATCH', '**/business/biz_1/queues/queue_1/toggle', {
      statusCode: 409,
      body: { message: 'Cannot deactivate the business only active queue.', code: 'QUEUE_LAST_ACTIVE' },
    }).as('toggleQueue')

    cy.contains('button', /desactivar caja principal/i).click()

    cy.wait('@toggleQueue')
    cy.contains('No podés desactivar la única cola activa del negocio.').should('be.visible')
  })
})
