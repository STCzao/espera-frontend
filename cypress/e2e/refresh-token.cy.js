/// <reference types="cypress" />

describe('HU-1.5 - Refresh Token', () => {
  it('restaura la sesión en una ruta protegida sin accessToken cacheado, vía cookie de refresh', () => {
    let meCallCount = 0

    cy.intercept('GET', '**/auth/me', (request) => {
      meCallCount += 1

      if (meCallCount === 1) {
        request.reply({
          statusCode: 401,
          body: { message: 'Missing or invalid bearer token.' },
        })
        return
      }

      request.reply({
        statusCode: 200,
        body: {
          user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin', businessId: 'biz_1' },
        },
      })
    }).as('me')

    cy.intercept('POST', '**/auth/refresh-token', {
      statusCode: 200,
      body: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
    }).as('refresh')

    cy.visit('/panel/business/biz_1/profile')

    cy.wait('@me')
    cy.wait('@refresh')
    cy.wait('@me')
    cy.contains('h1', /perfil del negocio/i).should('be.visible')
    cy.url().should('include', '/panel/business/biz_1/profile')
  })

  it('redirige a /login cuando no hay sesión ni cookie de refresh válida', () => {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 401,
      body: { message: 'Missing or invalid bearer token.' },
    }).as('me')

    cy.intercept('POST', '**/auth/refresh-token', {
      statusCode: 401,
      body: { message: 'Missing refresh token.' },
    }).as('refresh')

    cy.visit('/panel/business/biz_1/profile')

    cy.wait('@me')
    cy.wait('@refresh')
    cy.url().should('include', '/login')
  })

  it('no persiste el accessToken en localStorage tras un login exitoso', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: { accessToken: 'access-token-123', refreshToken: 'refresh-token-123' },
    }).as('login')

    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'user' } },
    }).as('me')

    cy.visit('/login')
    cy.get('#email').type('santi@example.com')
    cy.get('#password').type('Password1')
    cy.contains('button', /ingresar/i).click()

    cy.wait('@login')
    cy.wait('@me')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('espera.accessToken')).to.be.null
    })
  })
})
