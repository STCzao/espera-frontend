/// <reference types="cypress" />

describe('HU-1.1 - Registro con email y password', () => {
  beforeEach(() => {
    cy.visit('/register')
  })

  it('muestra la pantalla de registro local sin acciones OAuth activas', () => {
    cy.contains('h1', /creá tu cuenta/i).should('be.visible')
    cy.contains('button', /crear cuenta/i).should('be.visible')
    cy.get('#firstName').should('be.visible')
    cy.get('#lastName').should('be.visible')
    cy.get('#email').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.get('#confirmPassword').should('be.visible')
    cy.contains(/continuar con google/i).should('not.exist')
  })

  it('permite mostrar y ocultar la contraseña', () => {
    cy.get('#password').should('have.attr', 'type', 'password')
    cy.get('button[aria-label="Mostrar contraseña"]').click()
    cy.get('#password').should('have.attr', 'type', 'text')
    cy.get('button[aria-label="Ocultar contraseña"]').click()
    cy.get('#password').should('have.attr', 'type', 'password')
  })

  it('valida campos requeridos antes de enviar al backend', () => {
    cy.intercept('POST', '**/auth/register').as('register')

    cy.contains('button', /crear cuenta/i).click()

    cy.contains(/nombre debe tener al menos 2 caracteres/i).should('be.visible')
    cy.contains(/apellido debe tener al menos 2 caracteres/i).should('be.visible')
    cy.contains(/ingresá un email válido/i).should('be.visible')
    cy.contains(/contraseña debe tener al menos 8 caracteres/i).should('be.visible')
    cy.contains(/confirmá tu contraseña/i).should('be.visible')
    cy.get('@register.all').should('have.length', 0)
  })

  it('valida que la confirmación coincida antes de enviar al backend', () => {
    cy.intercept('POST', '**/auth/register').as('register')

    cy.get('#firstName').type('Santiago')
    cy.get('#lastName').type('Pereyra')
    cy.get('#email').type('santi@example.com')
    cy.get('#password').type('Password1')
    cy.get('#confirmPassword').type('Password2')
    cy.contains('button', /crear cuenta/i).click()

    cy.contains(/las contraseñas no coinciden/i).should('be.visible')
    cy.get('@register.all').should('have.length', 0)
  })

  it('envía datos normalizados y muestra éxito cuando el registro responde ok', () => {
    cy.intercept('POST', '**/auth/register', (request) => {
      expect(request.body).to.deep.equal({
        confirmPassword: 'Password1',
        firstName: 'Santiago',
        lastName: 'Pereyra',
        email: 'santi@example.com',
        password: 'Password1',
      })

      request.reply({
        statusCode: 201,
        body: { userId: 'user_123' },
      })
    }).as('register')

    cy.get('#firstName').type(' Santiago ')
    cy.get('#lastName').type(' Pereyra ')
    cy.get('#email').type(' SANTI@EXAMPLE.COM ')
    cy.get('#password').type('Password1')
    cy.get('#confirmPassword').type('Password1')
    cy.contains('button', /crear cuenta/i).click()

    cy.wait('@register')
    cy.contains('h1', /revisá tu email/i).should('be.visible')
    cy.contains('a', /ir a iniciar sesión/i).should('have.attr', 'href', '/login')
  })

  it('muestra el error de backend sin perder el formulario', () => {
    cy.intercept('POST', '**/auth/register', {
      statusCode: 409,
      body: { message: 'El email ya está registrado.' },
    }).as('register')

    cy.get('#firstName').type('Santiago')
    cy.get('#lastName').type('Pereyra')
    cy.get('#email').type('santi@example.com')
    cy.get('#password').type('Password1')
    cy.get('#confirmPassword').type('Password1')
    cy.contains('button', /crear cuenta/i).click()

    cy.wait('@register')
    cy.contains(/el email ya está registrado/i).should('be.visible')
    cy.contains('button', /crear cuenta/i).should('be.visible')
  })
})
