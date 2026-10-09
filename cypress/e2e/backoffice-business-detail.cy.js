/// <reference types="cypress" />

const ADMIN_ID = 'a1b2c3d4-0000-4000-8000-000000000001'
const OWNER_ID = 'f0e1d2c3-0000-4000-8000-000000000002'

function mockSuperAdminSession() {
  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: { user: { id: 'admin_1', email: 'admin@espera.com', role: 'super_admin' } },
  }).as('me')
}

function mockCategories() {
  cy.intercept('GET', '**/business/categories', {
    statusCode: 200,
    body: { categories: [{ id: 'cat_1', name: 'Cafetería' }, { id: 'cat_2', name: 'Farmacia' }] },
  }).as('categories')
}

// Fechas a mediodía UTC: en cualquier huso horario caen en el mismo día.
function reviewResponse({ business = {}, organization = {}, alerts = [] } = {}) {
  return {
    business: {
      id: 'biz_1',
      name: 'Cafe Espera',
      slug: 'cafe-espera',
      categoryId: 'cat_1',
      status: 'approved',
      phone: '+54 11 4000-1234',
      address: 'Av. Corrientes 1234',
      latitude: -34.6037,
      longitude: -58.3816,
      listingStatus: 'published',
      operationalStatus: 'delayed',
      ownerUserId: OWNER_ID,
      organizationId: 'org_1',
      approvedByUserId: ADMIN_ID,
      approvedAt: '2026-01-16T15:00:00.000Z',
      approvalNote: 'Documentación verificada por teléfono',
      approvalAlertsSnapshot: ['MISSING_LEGAL_ID'],
      createdAt: '2026-01-15T15:00:00.000Z',
      updatedAt: '2026-02-01T15:00:00.000Z',
      ...business,
    },
    organization: {
      id: 'org_1',
      name: 'Cafe Espera SRL',
      legalId: '30-71234567-1',
      categoryId: 'cat_1',
      ...organization,
    },
    alerts,
  }
}

function subscriptionResponse(overrides = {}) {
  return {
    id: 'sub_1',
    organizationId: 'org_1',
    plan: 'pro',
    status: 'active',
    trialEndsAt: null,
    activatedByUserId: ADMIN_ID,
    activatedAt: '2026-01-20T15:00:00.000Z',
    cancelledByUserId: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: '2026-01-15T15:00:00.000Z',
    updatedAt: '2026-01-20T15:00:00.000Z',
    ...overrides,
  }
}

function mockDetail({ review = reviewResponse(), subscription = subscriptionResponse() } = {}) {
  cy.intercept('GET', '**/business/biz_1/review', { statusCode: 200, body: review }).as('review')
  cy.intercept('GET', '**/organizations/org_1/subscription', { statusCode: 200, body: subscription }).as('subscription')
}

describe('Backoffice - detalle de negocio', () => {
  beforeEach(() => {
    mockSuperAdminSession()
    mockCategories()
  })

  it('se llega desde el listado de Negocios con "Ver detalle"', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/business' },
      {
        statusCode: 200,
        body: {
          items: [
            {
              businessId: 'biz_1',
              businessName: 'Cafe Espera',
              organizationId: 'org_1',
              status: 'approved',
              categoryId: 'cat_1',
              createdAt: '2026-01-15T15:00:00.000Z',
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        },
      },
    ).as('businesses')
    mockDetail()

    cy.visit('/backoffice/businesses')
    cy.wait('@businesses')
    cy.get('a[aria-label="Ver detalle de Cafe Espera"]').should('have.text', 'Ver detalle').click()

    cy.location('pathname').should('eq', '/backoffice/businesses/biz_1')
    cy.wait('@review')
    cy.contains('h1', 'Cafe Espera').should('be.visible')
  })

  it('muestra los datos del negocio, la organización y la suscripción', () => {
    mockDetail()

    cy.visit('/backoffice/businesses/biz_1')
    cy.wait('@review')
    cy.wait('@subscription')

    cy.contains('h1', 'Cafe Espera').should('be.visible')
    cy.contains('Aprobado').should('be.visible')

    // Datos del negocio
    cy.contains('dt', 'Categoría').next('dd').should('have.text', 'Cafetería')
    cy.contains('dt', 'Dirección').next('dd').should('have.text', 'Av. Corrientes 1234')
    cy.contains('dt', 'Teléfono').next('dd').should('have.text', '+54 11 4000-1234')
    cy.contains('dt', 'Publicación').next('dd').should('have.text', 'Publicado')
    cy.contains('dt', 'Estado operativo').next('dd').should('have.text', 'Con demora')
    cy.contains('dt', 'Dueño (id)').next('dd').should('have.text', OWNER_ID)
    cy.contains('a', /ver en el mapa/i)
      .should('have.attr', 'href', 'https://www.google.com/maps?q=-34.6037,-58.3816')
      .and('have.attr', 'target', '_blank')

    // Organización
    cy.contains('dt', 'Razón social').next('dd').should('have.text', 'Cafe Espera SRL')
    cy.contains('dt', 'CUIT').next('dd').should('have.text', '30-71234567-1')
    cy.contains('dt', 'Rubro declarado').next('dd').should('have.text', 'Cafetería')
    cy.contains('Sin alertas.').should('be.visible')

    // Suscripción: plan, estado y quién/cuándo la activó
    cy.contains('Plan Pro · Activa').should('be.visible')
    cy.contains('dt', 'Activada:').next('dd').should('contain.text', '20/01/2026')
    cy.contains('dt', 'Activada:').next('dd').should('contain.text', ADMIN_ID.slice(0, 8))
  })

  it('arma el historial con quién, cuándo y por qué de cada decisión', () => {
    mockDetail({
      review: reviewResponse({
        business: {
          status: 'suspended',
          suspendedByUserId: ADMIN_ID,
          suspendedAt: '2026-02-10T15:00:00.000Z',
          suspensionReason: 'Fraude reportado',
          reactivatedByUserId: ADMIN_ID,
          reactivatedAt: '2026-01-25T15:00:00.000Z',
        },
      }),
    })

    cy.visit('/backoffice/businesses/biz_1')
    cy.wait('@review')

    // Orden cronológico: alta, aprobado, reactivado, suspendido.
    cy.get('ol > li').then(($items) => {
      const titles = [...$items].map((item) => item.querySelector('p').textContent)
      expect(titles).to.deep.equal(['Alta del negocio', 'Aprobado', 'Reactivado', 'Suspendido'])
    })
    cy.contains('li', 'Alta del negocio').should('contain.text', '15/01/2026')
    cy.contains('li', 'Aprobado')
      .should('contain.text', '16/01/2026')
      .and('contain.text', 'Nota: Documentación verificada por teléfono')
      .and('contain.text', 'Se aprobó con alertas: La organización no tiene CUIT/legalId cargado.')
    cy.contains('li', 'Suspendido')
      .should('contain.text', '10/02/2026')
      .and('contain.text', 'Motivo: Fraude reportado')
      .and('contain.text', ADMIN_ID.slice(0, 8))
  })

  it('avisa cuando la organización no tiene CUIT y muestra la alerta de coherencia', () => {
    mockDetail({
      review: reviewResponse({
        organization: { legalId: undefined, categoryId: 'cat_2' },
        alerts: ['MISSING_LEGAL_ID', 'CATEGORY_MISMATCH'],
      }),
    })

    cy.visit('/backoffice/businesses/biz_1')
    cy.wait('@review')

    cy.contains('dt', 'CUIT').next('dd').should('have.text', 'Sin CUIT cargado')
    cy.contains('dt', 'Rubro declarado').next('dd').should('have.text', 'Farmacia')
    cy.contains('La organización no tiene CUIT/legalId cargado.').should('be.visible')
    cy.contains('La categoría del negocio no coincide con el rubro declarado de la organización.').should('be.visible')
  })

  it('muestra "—" en lo que el negocio no tiene cargado, sin ocultar la fila', () => {
    mockDetail({ review: reviewResponse({ business: { phone: undefined, latitude: undefined, longitude: undefined } }) })

    cy.visit('/backoffice/businesses/biz_1')
    cy.wait('@review')

    cy.contains('dt', 'Teléfono').next('dd').should('have.text', '—')
    cy.contains('dt', 'Ubicación').next('dd').should('have.text', '—')
  })

  it('suspende el negocio desde el detalle y la vista se actualiza', () => {
    let suspended = false
    cy.intercept('GET', '**/business/biz_1/review', (request) => {
      request.reply({
        statusCode: 200,
        body: suspended
          ? reviewResponse({
              business: {
                status: 'suspended',
                suspendedByUserId: ADMIN_ID,
                suspendedAt: '2026-02-10T15:00:00.000Z',
                suspensionReason: 'Fraude reportado',
              },
            })
          : reviewResponse(),
      })
    }).as('review')
    cy.intercept('GET', '**/organizations/org_1/subscription', { statusCode: 200, body: subscriptionResponse() })
    cy.intercept('PATCH', '**/business/biz_1/suspend', (request) => {
      expect(request.body).to.deep.equal({ reason: 'Fraude reportado' })
      suspended = true
      request.reply({ statusCode: 200, body: { id: 'biz_1', status: 'suspended' } })
    }).as('suspend')

    cy.visit('/backoffice/businesses/biz_1')
    cy.wait('@review')

    cy.contains('button', /^suspender$/i).click()
    cy.get('[role="alertdialog"]').contains('button', /suspender negocio/i).should('be.disabled')
    cy.get('textarea').type('Fraude reportado')
    cy.get('[role="alertdialog"]').contains('button', /suspender negocio/i).click()

    cy.wait('@suspend')
    cy.contains('button', /^reactivar$/i).should('be.visible')
    cy.contains('li', 'Suspendido').should('contain.text', 'Motivo: Fraude reportado')
  })

  it('muestra el error del backend y un link para volver si el negocio no existe', () => {
    cy.intercept('GET', '**/business/biz_inexistente/review', {
      statusCode: 404,
      body: { message: 'Business not found.', code: 'BUSINESS_NOT_FOUND' },
    }).as('review')

    cy.visit('/backoffice/businesses/biz_inexistente')
    cy.wait('@review')

    cy.contains('El negocio no existe.').should('be.visible')
    cy.contains('a', /volver a negocios/i).should('have.attr', 'href', '/backoffice/businesses')
  })
})
