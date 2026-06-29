/// <reference types="cypress" />

describe('HU-1.6 - Logout', () => {
  function loginAndLand() {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: {
        user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin', businessId: 'biz_1' },
      },
    }).as('me')

    cy.visit('/panel/business/biz_1/profile')
    cy.wait('@me')
    cy.contains('h1', /perfil del negocio/i).should('be.visible')
  }

  function openLogoutConfirm() {
    cy.contains('button', /cerrar sesión/i).click()
    cy.get('[role="alertdialog"]').should('be.visible')
  }

  function confirmLogout() {
    cy.get('[role="alertdialog"]').contains('button', /cerrar sesión/i).click()
  }

  it('pide confirmación y permite cancelar sin cerrar la sesión', () => {
    loginAndLand()

    openLogoutConfirm()
    cy.get('[role="alertdialog"]').contains('button', /cancelar/i).click()

    cy.get('[role="alertdialog"]').should('not.exist')
    cy.url().should('include', '/panel/business/biz_1/profile')
  })

  it('cierra la sesión y redirige a /login cuando el backend responde ok', () => {
    loginAndLand()

    cy.intercept('POST', '**/auth/logout', {
      statusCode: 200,
      body: { message: 'Logged out successfully.' },
    }).as('logout')

    openLogoutConfirm()
    confirmLogout()

    cy.wait('@logout')
    cy.url().should('include', '/login')
  })

  it('cierra la sesión localmente y redirige aunque el backend falle', () => {
    loginAndLand()

    cy.intercept('POST', '**/auth/logout', { forceNetworkError: true }).as('logout')

    openLogoutConfirm()
    confirmLogout()

    cy.wait('@logout')
    cy.url().should('include', '/login')
  })

  it('no permite volver al panel con el back del navegador después de salir', () => {
    loginAndLand()

    cy.intercept('POST', '**/auth/logout', {
      statusCode: 200,
      body: { message: 'Logged out successfully.' },
    }).as('logout')

    openLogoutConfirm()
    confirmLogout()
    cy.wait('@logout')
    cy.url().should('include', '/login')

    cy.intercept('GET', '**/auth/me', {
      statusCode: 401,
      body: { message: 'Missing or invalid bearer token.' },
    })
    cy.intercept('POST', '**/auth/refresh-token', {
      statusCode: 401,
      body: { message: 'Missing refresh token.' },
    })

    cy.go('back')
    cy.url().should('include', '/login')
  })
})
