/// <reference types="cypress" />

describe('HU-1.7 - Recuperación de password', () => {
  describe('/forgot-password', () => {
    beforeEach(() => {
      cy.visit('/forgot-password')
    })

    it('valida el email antes de enviar al backend', () => {
      cy.intercept('POST', '**/auth/forgot-password').as('forgot')

      cy.contains('button', /enviar enlace de recuperación/i).click()

      cy.contains(/ingresá un email válido/i).should('be.visible')
      cy.get('@forgot.all').should('have.length', 0)
    })

    it('muestra confirmación genérica sin importar si el email existe', () => {
      cy.intercept('POST', '**/auth/forgot-password', (request) => {
        expect(request.body).to.deep.equal({ email: 'santi@example.com' })

        request.reply({
          statusCode: 200,
          body: { message: 'If the email is registered, we sent a password recovery link.' },
        })
      }).as('forgot')

      cy.get('input[type="email"]').type('santi@example.com')
      cy.contains('button', /enviar enlace de recuperación/i).click()

      cy.wait('@forgot')
      cy.contains('h1', /revisá tu email/i).should('be.visible')
      cy.contains('a', /volver a iniciar sesión/i).should('have.attr', 'href', '/login')
    })

    it('muestra un mensaje genérico si el backend falla', () => {
      cy.intercept('POST', '**/auth/forgot-password', {
        statusCode: 500,
        body: { message: 'Failed to send password recovery email. Please try again.' },
      }).as('forgot')

      cy.get('input[type="email"]').type('santi@example.com')
      cy.contains('button', /enviar enlace de recuperación/i).click()

      cy.wait('@forgot')
      cy.contains(/no pudimos procesar la solicitud/i).should('be.visible')
    })
  })

  describe('/reset-password', () => {
    it('muestra link inválido cuando no hay token', () => {
      cy.visit('/reset-password')

      cy.contains(/enlace inválido/i).should('be.visible')
      cy.contains('a', /pedir un nuevo enlace/i).should('have.attr', 'href', '/forgot-password')
    })

    it('valida la contraseña y la confirmación antes de enviar al backend', () => {
      cy.intercept('POST', '**/auth/reset-password').as('reset')

      cy.visit('/reset-password?token=valid-token')
      cy.contains('button', /guardar contraseña/i).click()

      cy.contains(/contraseña debe tener al menos 8 caracteres/i).should('be.visible')
      cy.contains(/confirmá tu contraseña/i).should('be.visible')
      cy.get('@reset.all').should('have.length', 0)
    })

    it('valida que la confirmación coincida antes de enviar al backend', () => {
      cy.intercept('POST', '**/auth/reset-password').as('reset')

      cy.visit('/reset-password?token=valid-token')
      cy.get('input[name="password"]').type('Password1')
      cy.get('input[name="confirmPassword"]').type('Password2')
      cy.contains('button', /guardar contraseña/i).click()

      cy.contains(/las contraseñas no coinciden/i).should('be.visible')
      cy.get('@reset.all').should('have.length', 0)
    })

    it('actualiza la contraseña y redirige a login cuando el backend responde ok', () => {
      cy.intercept('POST', '**/auth/reset-password', (request) => {
        expect(request.body).to.deep.equal({
          token: 'valid-token',
          password: 'Password1',
          confirmPassword: 'Password1',
        })

        request.reply({ statusCode: 200, body: { message: 'Password updated successfully.' } })
      }).as('reset')

      cy.visit('/reset-password?token=valid-token')
      cy.get('input[name="password"]').type('Password1')
      cy.get('input[name="confirmPassword"]').type('Password1')
      cy.contains('button', /guardar contraseña/i).click()

      cy.wait('@reset')
      cy.url().should('include', '/login')
    })

    it('muestra el enlace vencido/inválido sin perder el formulario', () => {
      cy.intercept('POST', '**/auth/reset-password', {
        statusCode: 400,
        body: { message: 'Invalid or expired password reset link.' },
      }).as('reset')

      cy.visit('/reset-password?token=expired-token')
      cy.get('input[name="password"]').type('Password1')
      cy.get('input[name="confirmPassword"]').type('Password1')
      cy.contains('button', /guardar contraseña/i).click()

      cy.wait('@reset')
      cy.contains(/el enlace puede ser inválido o haber vencido/i).should('be.visible')
      cy.contains('button', /guardar contraseña/i).should('be.visible')
    })
  })
})
