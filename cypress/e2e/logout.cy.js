/// <reference types="cypress" />

describe('HU-1.6 - Logout', () => {
  function loginAndLand() {
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

    cy.intercept('GET', '**/business/categories', {
      statusCode: 200,
      body: { categories: [{ id: 'cat-uuid-123', name: 'Cafetería' }] },
    }).as('categories')

    cy.visit('/panel/business/cafe-espera/profile')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@categories')
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
    cy.url().should('include', '/panel/business/cafe-espera/profile')
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
