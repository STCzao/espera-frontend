/// <reference types="cypress" />

describe('Verificación de email', () => {
  it('muestra link inválido y permite reenviar cuando no hay token', () => {
    cy.visit('/verify-email')

    cy.contains('h1', /link inválido/i).should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
  })

  it('verifica el email y ofrece ir a login cuando el token es válido', () => {
    cy.intercept('GET', '**/auth/verify-email*', {
      statusCode: 200,
      body: { message: 'Email verified successfully.' },
    }).as('verify')

    cy.visit('/verify-email?token=valid-token-123')

    cy.wait('@verify').its('request.url').should('include', 'token=valid-token-123')
    cy.contains('h1', /email verificado/i).should('be.visible')
    cy.contains('a', /ir a iniciar sesión/i).should('have.attr', 'href', '/login')
  })

  it('muestra error y permite reenviar cuando el token es inválido o venció', () => {
    cy.intercept('GET', '**/auth/verify-email*', {
      statusCode: 400,
      body: { message: 'Verification token has expired. Please request a new one.' },
    }).as('verify')

    cy.visit('/verify-email?token=expired-token')

    cy.wait('@verify')
    cy.contains('h1', /no pudimos verificar tu email/i).should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
  })

  it('reenvía la verificación cuando el usuario la solicita', () => {
    cy.intercept('GET', '**/auth/verify-email*', {
      statusCode: 400,
      body: { message: 'Invalid verification token.' },
    }).as('verify')

    cy.intercept('POST', '**/auth/resend-verification', {
      statusCode: 200,
      body: { message: 'Verification email resent.' },
    }).as('resend')

    cy.visit('/verify-email?token=bad-token')
    cy.wait('@verify')

    cy.get('input[type="email"]').type('santi@example.com')
    cy.contains('button', /reenviar verificación/i).click()

    cy.wait('@resend').its('request.body').should('deep.equal', { email: 'santi@example.com' })
    cy.contains(/te enviamos un nuevo enlace/i).should('be.visible')
  })

  it('muestra un mensaje genérico si el reenvío falla', () => {
    cy.visit('/verify-email')

    cy.intercept('POST', '**/auth/resend-verification', {
      statusCode: 429,
      body: { message: 'Please wait 5 minutes before requesting another email.' },
    }).as('resend')

    cy.get('input[type="email"]').type('santi@example.com')
    cy.contains('button', /reenviar verificación/i).click()

    cy.wait('@resend')
    cy.contains(/no pudimos reenviar el email/i).should('be.visible')
  })
})
