/// <reference types="cypress" />

describe('HU-2.8 - Aceptar invitación de empleado', () => {
  it('crea el acceso y redirige a login', () => {
    cy.intercept('POST', '**/business/employee-invitations/token-abc/accept', (request) => {
      expect(request.body).to.deep.equal({
        firstName: 'Ana',
        lastName: 'García',
        password: 'Password123',
        confirmPassword: 'Password123',
      })

      request.reply({
        statusCode: 200,
        body: { businessId: 'biz_1', userId: 'user_2', role: 'employee', status: 'active' },
      })
    }).as('accept')

    cy.visit('/business/employee-invitations/token-abc')

    cy.contains('h1', /aceptar invitación/i).should('be.visible')
    cy.get('input[name="firstName"]').type('Ana')
    cy.get('input[name="lastName"]').type('García')
    cy.get('input[name="password"]').type('Password123')
    cy.get('input[name="confirmPassword"]').type('Password123')
    cy.contains('button', /crear acceso/i).click()

    cy.wait('@accept')
    cy.url().should('include', '/login')
  })

  it('valida las contraseñas antes de enviar al backend', () => {
    cy.intercept('POST', '**/business/employee-invitations/**/accept').as('accept')

    cy.visit('/business/employee-invitations/token-abc')

    cy.get('input[name="firstName"]').type('Ana')
    cy.get('input[name="lastName"]').type('García')
    cy.get('input[name="password"]').type('Password123')
    cy.get('input[name="confirmPassword"]').type('OtraPassword123')
    cy.contains('button', /crear acceso/i).click()

    cy.contains(/las contraseñas no coinciden/i).should('be.visible')
    cy.get('@accept.all').should('have.length', 0)
  })

  it('muestra error cuando el token es inválido o venció', () => {
    cy.intercept('POST', '**/business/employee-invitations/token-expirado/accept', {
      statusCode: 410,
      body: { message: 'Invitation has expired.', code: 'INVITATION_EXPIRED' },
    }).as('accept')

    cy.visit('/business/employee-invitations/token-expirado')

    cy.get('input[name="firstName"]').type('Ana')
    cy.get('input[name="lastName"]').type('García')
    cy.get('input[name="password"]').type('Password123')
    cy.get('input[name="confirmPassword"]').type('Password123')
    cy.contains('button', /crear acceso/i).click()

    cy.wait('@accept')
    cy.contains(/invitation has expired/i).should('be.visible')
  })
})
