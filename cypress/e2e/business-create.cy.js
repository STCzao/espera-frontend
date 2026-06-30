/// <reference types="cypress" />

describe('BusinessCreatePage - Crear negocio con cuenta existente', () => {
  function authenticateVisit() {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'user' } },
    }).as('me')

    cy.visit('/business/new')
    cy.wait('@me')
  }

  it('muestra el formulario solo con campos de negocio', () => {
    authenticateVisit()

    cy.contains('h1', /registrá tu negocio/i).should('be.visible')
    cy.contains('label', /nombre del negocio/i).should('be.visible')
    cy.contains('label', /identificador/i).should('be.visible')
    cy.contains('label', /categoría/i).should('be.visible')
    cy.contains('label', /dirección/i).should('be.visible')
    cy.contains('label', /email/i).should('not.exist')
    cy.contains('label', /contraseña/i).should('not.exist')
  })

  it('valida campos requeridos antes de enviar al backend', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business').as('create')

    cy.contains('button', /crear negocio/i).click()

    cy.contains(/ingresá el nombre del negocio/i).should('be.visible')
    cy.contains(/ingresá el identificador/i).should('be.visible')
    cy.contains(/seleccioná una categoría/i).should('be.visible')
    cy.contains(/ingresá la dirección/i).should('be.visible')
    cy.get('@create.all').should('have.length', 0)
  })

  it('crea el negocio y redirige al panel cuando el backend responde ok', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business', (request) => {
      expect(request.body).to.deep.equal({
        name: 'Cafe Espera',
        slug: 'cafe-espera',
        categoryId: 'cat-uuid-123',
        address: 'Av. Corrientes 1234',
      })

      request.reply({ statusCode: 201, body: { businessId: 'biz_new_1' } })
    }).as('create')

    cy.get('input[name="name"]').type('Cafe Espera')
    cy.get('input[name="slug"]').type('cafe-espera')
    cy.get('input[name="categoryId"]').type('cat-uuid-123')
    cy.get('input[name="address"]').type('Av. Corrientes 1234')
    cy.contains('button', /crear negocio/i).click()

    cy.wait('@create')
    cy.url().should('include', '/panel/business/biz_new_1')
  })

  it('muestra error del backend sin perder el formulario', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business', {
      statusCode: 409,
      body: { message: 'Business slug already in use.', code: 'BUSINESS_SLUG_IN_USE' },
    }).as('create')

    cy.get('input[name="name"]').type('Cafe Espera')
    cy.get('input[name="slug"]').type('cafe-espera')
    cy.get('input[name="categoryId"]').type('cat-uuid-123')
    cy.get('input[name="address"]').type('Av. Corrientes 1234')
    cy.contains('button', /crear negocio/i).click()

    cy.wait('@create')
    cy.contains(/business slug already in use/i).should('be.visible')
    cy.contains('button', /crear negocio/i).should('be.visible')
  })

  it('redirige a /login si el usuario no está autenticado', () => {
    cy.intercept('GET', '**/auth/me', { statusCode: 401, body: { message: 'Unauthorized.' } }).as('me')
    cy.intercept('POST', '**/auth/refresh-token', { statusCode: 401, body: { message: 'Missing refresh token.' } })

    cy.visit('/business/new')
    cy.wait('@me')

    cy.url().should('include', '/login')
  })
})
