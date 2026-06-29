/// <reference types="cypress" />

describe('HU-1.3 - Login con email y password', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('muestra la pantalla de login', () => {
    cy.contains('h1', /iniciá sesión/i).should('be.visible')
    cy.contains('button', /ingresar/i).should('be.visible')
    cy.get('#email').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.contains('a', /olvidaste tu contraseña/i).should('have.attr', 'href', '/forgot-password')
    cy.contains('a', /creá tu cuenta/i).should('have.attr', 'href', '/register')
  })

  it('valida campos requeridos antes de enviar al backend', () => {
    cy.intercept('POST', '**/auth/login').as('login')

    cy.contains('button', /ingresar/i).click()

    cy.contains(/ingresá un email válido/i).should('be.visible')
    cy.contains(/ingresá tu contraseña/i).should('be.visible')
    cy.get('@login.all').should('have.length', 0)
  })

  it('envía datos normalizados y redirige cuando el login responde ok', () => {
    cy.intercept('POST', '**/auth/login', (request) => {
      expect(request.body).to.deep.equal({
        email: 'santi@example.com',
        password: 'Password1',
      })

      request.reply({
        statusCode: 200,
        body: { accessToken: 'access-token-123', refreshToken: 'refresh-token-123' },
      })
    }).as('login')

    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'user' } },
    }).as('me')

    cy.get('#email').type(' SANTI@EXAMPLE.COM ')
    cy.get('#password').type('Password1')
    cy.contains('button', /ingresar/i).click()

    cy.wait('@login')
    cy.wait('@me')
    cy.url().should('include', '/business/register')
  })

  it('redirige al panel del negocio cuando el usuario ya tiene uno asignado', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: { accessToken: 'access-token-123', refreshToken: 'refresh-token-123' },
    }).as('login')

    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: {
        user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin', businessId: 'biz_1' },
      },
    }).as('me')

    cy.get('#email').type('santi@example.com')
    cy.get('#password').type('Password1')
    cy.contains('button', /ingresar/i).click()

    cy.wait('@login')
    cy.wait('@me')
    cy.url().should('include', '/panel/business/biz_1')
  })

  it('muestra el mensaje de email no verificado sin perder el formulario', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 403,
      body: { message: 'You must verify your email before logging in.', code: 'EMAIL_NOT_VERIFIED' },
    }).as('login')

    cy.get('#email').type('santi@example.com')
    cy.get('#password').type('Password1')
    cy.contains('button', /ingresar/i).click()

    cy.wait('@login')
    cy.contains(/todavía no verificaste tu email/i).should('be.visible')
    cy.contains('button', /ingresar/i).should('be.visible')
  })

  it('muestra el mensaje de cuenta de negocio pendiente de revisión', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 403,
      body: { message: 'Your account is still under review.', code: 'ACCOUNT_PENDING_REVIEW' },
    }).as('login')

    cy.get('#email').type('santi@example.com')
    cy.get('#password').type('Password1')
    cy.contains('button', /ingresar/i).click()

    cy.wait('@login')
    cy.contains(/cuenta de negocio está en revisión/i).should('be.visible')
  })

  it('muestra el mensaje de bloqueo temporal por intentos fallidos', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 429,
      body: {
        message: 'Too many failed login attempts. Please try again in 5 minutes.',
        code: 'LOGIN_TEMPORARILY_BLOCKED',
      },
    }).as('login')

    cy.get('#email').type('santi@example.com')
    cy.get('#password').type('Password1')
    cy.contains('button', /ingresar/i).click()

    cy.wait('@login')
    cy.contains(/demasiados intentos fallidos/i).should('be.visible')
  })

  it('muestra credenciales incorrectas cuando el backend no devuelve código funcional', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials.' },
    }).as('login')

    cy.get('#email').type('santi@example.com')
    cy.get('#password').type('Password1')
    cy.contains('button', /ingresar/i).click()

    cy.wait('@login')
    cy.contains(/email o contraseña incorrectos/i).should('be.visible')
  })
})
