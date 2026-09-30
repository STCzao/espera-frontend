/// <reference types="cypress" />

describe('BusinessCreatePage - Crear negocio con cuenta existente', () => {
  function authenticateVisit() {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'user' } },
    }).as('me')

    cy.intercept('GET', '**/business/categories', {
      statusCode: 200,
      body: { categories: [{ id: '3f2b8c1e-5a4d-4c6b-9e7f-1a2b3c4d5e6f', name: 'Cafetería' }] },
    }).as('categories')

    cy.visit('/business/new')
    cy.wait('@me')
    cy.wait('@categories')
  }

  it('muestra el formulario solo con campos de negocio', () => {
    authenticateVisit()

    cy.contains('h1', /registrá tu negocio/i).should('be.visible')
    cy.contains('label', /nombre del negocio/i).should('be.visible')
    cy.contains('label', /categoría/i).should('be.visible')
    cy.contains('label', /dirección/i).should('be.visible')
    cy.contains('label', /email/i).should('not.exist')
    cy.contains('label', /contraseña/i).should('not.exist')
  })

  it('valida campos requeridos antes de enviar al backend', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business').as('create')

    cy.contains('button', /crear negocio/i).click()

    cy.contains(/el nombre debe tener al menos 2 caracteres/i).should('be.visible')
    cy.contains(/seleccioná una categoría/i).should('be.visible')
    cy.contains(/ingresá la dirección/i).should('be.visible')
    cy.contains(/ingresá el cuit/i).should('be.visible')
    cy.get('@create.all').should('have.length', 0)
  })

  it('crea el negocio, relee la sesión (sin refresh de token) y redirige al panel', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business', (request) => {
      expect(request.body).to.deep.equal({
        name: 'Cafe Espera',
        categoryId: '3f2b8c1e-5a4d-4c6b-9e7f-1a2b3c4d5e6f',
        phone: '',
        address: 'Av. Corrientes 1234',
        legalId: '20-12345678-6',
      })

      request.reply({ statusCode: 201, body: { businessSlug: 'cafe-espera', status: 'pending' } })
    }).as('create')

    cy.intercept('POST', '**/auth/refresh-token').as('refresh')

    cy.get('input[name="name"]').type('Cafe Espera')
    cy.get('select[name="categoryId"]').select('3f2b8c1e-5a4d-4c6b-9e7f-1a2b3c4d5e6f')
    cy.get('input[name="address"]').type('Av. Corrientes 1234')
    cy.get('input[name="legalId"]').type('20-12345678-6')

    // Después del alta, /auth/me ya devuelve el rol nuevo leído de la base.
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: {
        user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin', approvalStatus: 'pending' },
      },
    }).as('meAfterCreate')

    cy.contains('button', /crear negocio/i).click()

    cy.wait('@create')
    cy.wait('@meAfterCreate')
    cy.url().should('include', '/panel/business/cafe-espera')
    cy.get('@refresh.all').should('have.length', 0)
  })

  it('muestra error del backend sin perder el formulario', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business', {
      statusCode: 409,
      body: { message: 'Business name already in use.', code: 'BUSINESS_NAME_IN_USE' },
    }).as('create')

    cy.get('input[name="name"]').type('Cafe Espera')
    cy.get('select[name="categoryId"]').select('3f2b8c1e-5a4d-4c6b-9e7f-1a2b3c4d5e6f')
    cy.get('input[name="address"]').type('Av. Corrientes 1234')
    cy.get('input[name="legalId"]').type('20-12345678-6')
    cy.contains('button', /crear negocio/i).click()

    cy.wait('@create')
    cy.contains(/business name already in use/i).should('be.visible')
    cy.contains('button', /crear negocio/i).should('be.visible')
  })

  it('"Volver al panel" con una cuenta que ya tiene un negocio no la manda a la pantalla vacía (bugfix)', () => {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin' } },
    }).as('me')
    cy.intercept('GET', '**/business/categories', {
      statusCode: 200,
      body: { categories: [{ id: '3f2b8c1e-5a4d-4c6b-9e7f-1a2b3c4d5e6f', name: 'Cafetería' }] },
    }).as('categories')
    cy.intercept('GET', '**/business/me', {
      statusCode: 200,
      body: {
        businesses: [
          {
            id: 'biz_1',
            slug: 'cafe-espera',
            name: 'Cafe Espera',
            status: 'approved',
            listingStatus: 'draft',
            operationalStatus: 'normal',
            plan: 'premium',
            subscriptionStatus: 'active',
            trialEndsAt: null,
            activeQueueId: 'queue_1',
            queues: [],
          },
        ],
      },
    }).as('businessMe')

    cy.visit('/business/new')
    cy.wait('@me')
    cy.wait('@categories')

    cy.contains('a', /volver al panel/i).click()
    cy.wait('@businessMe')

    cy.url().should('include', '/panel/business/cafe-espera')
    cy.contains(/todavía no registraste tu negocio/i).should('not.exist')
  })

  it('/panel sin negocios sigue mostrando la pantalla vacía', () => {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'user' } },
    }).as('me')
    cy.intercept('GET', '**/business/me', { statusCode: 200, body: { businesses: [] } }).as('businessMe')

    cy.visit('/panel')
    cy.wait('@me')
    cy.wait('@businessMe')

    cy.contains(/todavía no registraste tu negocio/i).should('be.visible')
  })

  it('redirige a /login si el usuario no está autenticado', () => {
    cy.intercept('GET', '**/auth/me', { statusCode: 401, body: { message: 'Unauthorized.' } }).as('me')
    cy.intercept('POST', '**/auth/refresh-token', { statusCode: 401, body: { message: 'Missing refresh token.' } })

    cy.visit('/business/new')
    cy.wait('@me')

    cy.url().should('include', '/login')
  })
})
