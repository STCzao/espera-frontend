/// <reference types="cypress" />

describe('HU-2.2 - Horarios de atención', () => {
  function authenticateVisit(hoursResponse) {
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
          },
        ],
      },
    }).as('businessMe')

    cy.intercept('GET', '**/business/biz_1/hours', {
      statusCode: 200,
      body: hoursResponse ?? { businessId: 'biz_1', weeklyHours: [], nonWorkingDays: [] },
    }).as('hours')

    cy.visit('/panel/business/cafe-espera/hours')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@hours')
  }

  it('muestra los estados vacíos cuando no hay horarios ni días no laborables', () => {
    authenticateVisit()

    cy.contains('h1', /horarios de atención/i).should('be.visible')
    cy.contains(/todavía no cargaste ningún horario de atención/i).should('be.visible')
    cy.contains(/no tenés días no laborables cargados/i).should('be.visible')
  })

  it('valida que se cargue al menos un rango de atención', () => {
    authenticateVisit()

    cy.intercept('PUT', '**/business/biz_1/hours').as('update')
    cy.contains('button', /guardar cambios/i).click()

    cy.contains(/agregá al menos un rango de atención/i).should('be.visible')
    cy.get('@update.all').should('have.length', 0)
  })

  it('agrega un rango con los valores por defecto, lo guarda y muestra confirmación', () => {
    authenticateVisit()

    cy.intercept('PUT', '**/business/biz_1/hours', (request) => {
      expect(request.body).to.deep.equal({
        weeklyHours: [{ dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00' }],
        nonWorkingDays: [],
      })

      request.reply({
        statusCode: 200,
        body: {
          businessId: 'biz_1',
          weeklyHours: [{ dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00' }],
          nonWorkingDays: [],
        },
      })
    }).as('update')

    cy.contains('button', /agregar rango/i).click()
    cy.contains('button', /guardar cambios/i).click()

    cy.wait('@update')
    cy.contains(/horarios guardados/i).should('be.visible')
  })

  it('valida que el horario de apertura sea anterior al de cierre', () => {
    authenticateVisit()

    cy.intercept('PUT', '**/business/biz_1/hours').as('update')

    cy.contains('button', /agregar rango/i).click()
    cy.get('input[name="weeklyHours.0.opensAt"]').clear().type('20:00')
    cy.get('input[name="weeklyHours.0.closesAt"]').clear().type('09:00')
    cy.contains('button', /guardar cambios/i).click()

    cy.contains(/el horario de apertura debe ser anterior al de cierre/i).should('be.visible')
    cy.get('@update.all').should('have.length', 0)
  })

  it('agrega un día no laborable y lo guarda junto con los horarios', () => {
    authenticateVisit()

    cy.intercept('PUT', '**/business/biz_1/hours', (request) => {
      expect(request.body).to.deep.equal({
        weeklyHours: [{ dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00' }],
        nonWorkingDays: [{ date: '2026-12-25', reason: 'Feriado' }],
      })

      request.reply({ statusCode: 200, body: { businessId: 'biz_1', ...request.body } })
    }).as('update')

    cy.contains('button', /agregar rango/i).click()
    cy.contains('button', /agregar día/i).click()
    cy.get('input[name="nonWorkingDays.0.date"]').type('2026-12-25')
    cy.get('input[name="nonWorkingDays.0.reason"]').type('Feriado')
    cy.contains('button', /guardar cambios/i).click()

    cy.wait('@update')
    cy.contains(/horarios guardados/i).should('be.visible')
  })

  it('muestra error de backend sin perder los datos cargados', () => {
    authenticateVisit()

    cy.intercept('PUT', '**/business/biz_1/hours', {
      statusCode: 500,
      body: { message: 'Internal server error.' },
    }).as('update')

    cy.contains('button', /agregar rango/i).click()
    cy.contains('button', /guardar cambios/i).click()

    cy.wait('@update')
    cy.contains(/internal server error/i).should('be.visible')
    cy.get('input[name="weeklyHours.0.opensAt"]').should('have.value', '09:00')
  })
})
