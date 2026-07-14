/// <reference types="cypress" />

describe('HU-2.1 / HU-2.6 - Perfil del negocio', () => {
  function authenticateVisit() {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin' } },
    }).as('me')

    cy.intercept('GET', '**/business/me', {
      statusCode: 200,
      body: {
        businesses: [
          { id: 'biz_1', slug: 'cafe-espera', name: 'Cafe Espera', status: 'pending', phone: '+54 11 4000-1234', listingStatus: 'draft', operationalStatus: 'normal' },
        ],
      },
    }).as('businessMe')

    cy.intercept('GET', '**/business/categories', {
      statusCode: 200,
      body: {
        categories: [
          { id: 'cat-uuid-123', name: 'Gastronomía' },
          { id: 'cat-uuid-456', name: 'Salud' },
        ],
      },
    }).as('categories')

    cy.visit('/panel/business/cafe-espera/profile')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@categories')
  }

  it('muestra el formulario con el nombre precargado', () => {
    authenticateVisit()

    cy.contains('h1', /perfil del negocio/i).should('be.visible')
    cy.get('input[name="name"]').should('have.value', 'Cafe Espera')
    cy.get('input[name="phone"]').should('have.value', '+54 11 4000-1234')
    cy.get('select[name="categoryId"]').should('be.visible')
    cy.get('input[name="address"]').should('be.visible')
  })

  it('valida campos requeridos antes de enviar al backend', () => {
    authenticateVisit()

    cy.get('input[name="name"]').clear()
    cy.intercept('PATCH', '**/business/*/profile').as('update')

    cy.contains('button', /guardar cambios/i).click()

    cy.contains(/ingresá el nombre del negocio/i).should('be.visible')
    cy.contains(/ingresá la dirección/i).should('be.visible')
    cy.get('@update.all').should('have.length', 0)
  })

  it('muestra los atributos informativos al elegir una categoría', () => {
    authenticateVisit()

    cy.intercept('GET', '**/business/categories/cat-uuid-123/config', {
      statusCode: 200,
      body: {
        categoryId: 'cat-uuid-123',
        attributes: [{ key: 'averageServiceMinutes', label: 'Tiempo promedio por atencion', type: 'number', required: true }],
      },
    }).as('categoryConfig')

    cy.get('select[name="categoryId"]').select('cat-uuid-123')

    cy.wait('@categoryConfig')
    cy.contains('Tiempo promedio por atencion').should('be.visible')
    cy.contains(/todavía no se pueden cargar valores/i).should('be.visible')
  })

  it('guarda los cambios y muestra confirmación', () => {
    authenticateVisit()

    cy.intercept('GET', '**/business/categories/cat-uuid-123/config', {
      statusCode: 200,
      body: { categoryId: 'cat-uuid-123', attributes: [] },
    })

    cy.intercept('PATCH', '**/business/biz_1/profile', (request) => {
      expect(request.body).to.deep.equal({
        name: 'Cafe Espera Renovado',
        categoryId: 'cat-uuid-123',
        phone: '+54 11 5000-9999',
        address: 'Av. Corrientes 1234',
      })

      request.reply({
        statusCode: 200,
        body: {
          businessId: 'biz_1',
          name: 'Cafe Espera Renovado',
          categoryId: 'cat-uuid-123',
          phone: '+54 11 5000-9999',
          address: 'Av. Corrientes 1234',
          listingStatus: 'draft',
        },
      })
    }).as('update')

    cy.get('input[name="name"]').clear().type('Cafe Espera Renovado')
    cy.get('select[name="categoryId"]').select('cat-uuid-123')
    cy.get('input[name="phone"]').clear().type('+54 11 5000-9999')
    cy.get('input[name="address"]').clear().type('Av. Corrientes 1234')
    cy.contains('button', /guardar cambios/i).click()

    cy.wait('@update')
    cy.contains(/cambios guardados/i).should('be.visible')
  })

  it('muestra el error de backend sin perder el formulario', () => {
    authenticateVisit()

    cy.intercept('GET', '**/business/categories/cat-uuid-123/config', {
      statusCode: 200,
      body: { categoryId: 'cat-uuid-123', attributes: [] },
    }).as('categoryConfig')

    cy.get('select[name="categoryId"]').select('cat-uuid-123')
    cy.wait('@categoryConfig')
    cy.get('input[name="address"]').clear().type('Av. Corrientes 1234')

    cy.intercept('PATCH', '**/business/biz_1/profile', {
      statusCode: 500,
      body: { message: 'Internal server error.' },
    }).as('update')

    cy.contains('button', /guardar cambios/i).click()

    cy.wait('@update')
    cy.contains(/internal server error/i).should('be.visible')
    cy.get('input[name="name"]').should('have.value', 'Cafe Espera')
  })
})
