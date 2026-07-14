/// <reference types="cypress" />

describe('HU-2.8 - Invitar y gestionar empleados', () => {
  function authenticateVisit(employeesResponse) {
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

    cy.intercept('GET', '**/business/biz_1/employees', {
      statusCode: 200,
      body: employeesResponse ?? { businessId: 'biz_1', employees: [] },
    }).as('employees')

    cy.visit('/panel/business/cafe-espera/employees')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@employees')
  }

  it('muestra el estado vacío cuando no hay empleados activos', () => {
    authenticateVisit()

    cy.contains('h1', /empleados/i).should('be.visible')
    cy.contains(/todavía no invitaste a ningún empleado/i).should('be.visible')
  })

  it('lista los empleados activos', () => {
    authenticateVisit({
      businessId: 'biz_1',
      employees: [
        { userId: 'emp_1', email: 'ana@local.com', firstName: 'Ana', lastName: 'García', status: 'active' },
      ],
    })

    cy.contains('Ana García').should('be.visible')
    cy.contains('ana@local.com').should('be.visible')
  })

  it('valida el email antes de enviar la invitación', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business/biz_1/employees/invitations').as('invite')

    cy.get('input[name="email"]').type('no-es-un-email')
    cy.contains('button', /^invitar$/i).click()

    cy.contains(/ingresá un email válido/i).should('be.visible')
    cy.get('@invite.all').should('have.length', 0)
  })

  it('invita a un empleado y muestra la fecha de vencimiento', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business/biz_1/employees/invitations', (request) => {
      expect(request.body).to.deep.equal({ email: 'nuevo@local.com' })
      request.reply({
        statusCode: 201,
        body: {
          invitationId: 'inv_1',
          businessId: 'biz_1',
          email: 'nuevo@local.com',
          status: 'pending',
          expiresAt: '2026-07-21T00:00:00.000Z',
        },
      })
    }).as('invite')

    cy.get('input[name="email"]').type('nuevo@local.com')
    cy.contains('button', /^invitar$/i).click()

    cy.wait('@invite')
    cy.contains(/invitación enviada a nuevo@local.com/i).should('be.visible')
  })

  it('muestra error de backend al invitar', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business/biz_1/employees/invitations', {
      statusCode: 409,
      body: { message: 'Ya existe una invitación pendiente para este email.', code: 'INVITATION_ALREADY_PENDING' },
    }).as('invite')

    cy.get('input[name="email"]').type('nuevo@local.com')
    cy.contains('button', /^invitar$/i).click()

    cy.wait('@invite')
    cy.contains(/ya existe una invitación pendiente/i).should('be.visible')
  })

  it('revoca un empleado y lo saca de la lista', () => {
    authenticateVisit({
      businessId: 'biz_1',
      employees: [
        { userId: 'emp_1', email: 'ana@local.com', firstName: 'Ana', lastName: 'García', status: 'active' },
      ],
    })

    cy.intercept('DELETE', '**/business/biz_1/employees/emp_1', {
      statusCode: 200,
      body: { businessId: 'biz_1', userId: 'emp_1', revoked: true },
    }).as('revoke')

    cy.intercept('GET', '**/business/biz_1/employees', {
      statusCode: 200,
      body: { businessId: 'biz_1', employees: [] },
    }).as('employeesAfterRevoke')

    cy.get('button[aria-label="Revocar acceso de ana@local.com"]').click()

    cy.wait('@revoke')
    cy.wait('@employeesAfterRevoke')
    cy.contains(/todavía no invitaste a ningún empleado/i).should('be.visible')
  })
})
