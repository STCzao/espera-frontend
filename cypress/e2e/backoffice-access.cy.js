/// <reference types="cypress" />

function mockSession(role) {
  cy.intercept('GET', '**/auth/me', { statusCode: 200, body: { user: { id: 'user_1', email: 'user@example.com', role } } }).as('me')
}

describe('Backoffice - acceso restringido a super_admin', () => {
  it('un super_admin ve el shell del Backoffice', () => {
    mockSession('super_admin')
    cy.visit('/backoffice')
    cy.wait('@me')

    cy.contains('Backoffice Espera').should('be.visible')
    cy.contains('h1', /backoffice/i).should('be.visible')
    cy.contains('user@example.com').should('be.visible')
  })

  it('un business_admin es redirigido a /panel', () => {
    mockSession('business_admin')
    cy.visit('/backoffice')
    cy.wait('@me')

    cy.url().should('include', '/panel')
    cy.url().should('not.include', '/backoffice')
  })

  it('un empleado es redirigido a /panel', () => {
    mockSession('employee')
    cy.visit('/backoffice')
    cy.wait('@me')

    cy.url().should('include', '/panel')
    cy.url().should('not.include', '/backoffice')
  })
})
