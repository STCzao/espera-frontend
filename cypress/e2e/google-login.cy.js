/// <reference types="cypress" />

describe('HU-1.9 - Callback de login con Google', () => {
  it('completa el login y redirige a /panel cuando el usuario no tiene negocios', () => {
    cy.intercept('POST', '**/auth/login/google', (request) => {
      expect(request.body).to.deep.equal({ code: 'mock-code', state: 'mock-state' })

      request.reply({
        statusCode: 200,
        body: { accessToken: 'access-token-123', refreshToken: 'refresh-token-123' },
      })
    }).as('loginGoogle')

    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'user' } },
    }).as('me')

    cy.intercept('GET', '**/business/me', {
      statusCode: 200,
      body: { businesses: [] },
    }).as('myBusinesses')

    cy.visit('/oauth/google/callback?code=mock-code&state=mock-state')

    cy.contains(/conectando con google/i).should('be.visible')

    cy.wait('@loginGoogle')
    cy.wait('@me')
    cy.wait('@myBusinesses')
    cy.url().should('include', '/panel')
    cy.url().should('not.include', '/panel/business')
  })

  it('redirige al panel del negocio cuando el usuario ya tiene uno asignado', () => {
    cy.intercept('POST', '**/auth/login/google', {
      statusCode: 200,
      body: { accessToken: 'access-token-123', refreshToken: 'refresh-token-123' },
    }).as('loginGoogle')

    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin' } },
    }).as('me')

    cy.intercept('GET', '**/business/me', {
      statusCode: 200,
      body: { businesses: [{ id: 'biz_1', slug: 'cafe-espera', name: 'Cafe Espera', status: 'pending' }] },
    }).as('myBusinesses')

    cy.visit('/oauth/google/callback?code=mock-code&state=mock-state')

    cy.wait('@loginGoogle')
    cy.wait('@me')
    cy.wait('@myBusinesses')
    cy.url().should('include', '/panel/business/cafe-espera')
  })

  it('muestra un mensaje y un link a login cuando el usuario cancela en Google', () => {
    cy.visit('/oauth/google/callback?error=access_denied')

    cy.contains(/cancelaste la conexión con google/i).should('be.visible')
    cy.contains('a', /volver a iniciar sesión/i).should('have.attr', 'href', '/login')
  })

  it('muestra un mensaje cuando el enlace no trae code o state', () => {
    cy.visit('/oauth/google/callback')

    cy.contains(/enlace de google es inválido/i).should('be.visible')
    cy.contains('a', /volver a iniciar sesión/i).should('have.attr', 'href', '/login')
  })

  it('muestra el mensaje correspondiente cuando el email ya está registrado con contraseña', () => {
    cy.intercept('POST', '**/auth/login/google', {
      statusCode: 400,
      body: { message: 'This account must sign in with email and password.', code: 'AUTH_PROVIDER_MISMATCH' },
    }).as('loginGoogle')

    cy.visit('/oauth/google/callback?code=mock-code&state=mock-state')

    cy.wait('@loginGoogle')
    cy.contains(/inicia sesión con email y contraseña/i).should('be.visible')
  })
})
