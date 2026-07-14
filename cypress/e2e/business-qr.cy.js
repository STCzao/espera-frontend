/// <reference types="cypress" />

describe('HU-2.4 - QR del negocio', () => {
  function authenticateVisit(qrResponse) {
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

    cy.intercept('GET', '**/business/biz_1/qr', {
      statusCode: 200,
      body: qrResponse ?? {
        businessId: 'biz_1',
        token: 'token-abc',
        qrUrl: 'https://espera.app/q/token-abc',
        downloadUrl: '/api/business/biz_1/qr.png',
        status: 'active',
      },
    }).as('qr')

    cy.intercept('GET', '**/business/biz_1/qr.png', { fixture: 'qr.png' }).as('qrPng')

    cy.visit('/panel/business/cafe-espera/qr')
    cy.wait('@me')
    cy.wait('@businessMe')
    cy.wait('@qr')
    cy.wait('@qrPng')
  }

  it('muestra el QR activo con su enlace de destino', () => {
    authenticateVisit()

    cy.contains('h1', /qr del negocio/i).should('be.visible')
    cy.contains(/^activo$/i).should('be.visible')
    cy.get('img[alt="QR del negocio"]').should('have.attr', 'src').and('match', /^blob:/)
    cy.contains('a', 'https://espera.app/q/token-abc').should(
      'have.attr',
      'href',
      'https://espera.app/q/token-abc',
    )
  })

  it('muestra el estado "en transición" cuando el QR está por vencer', () => {
    authenticateVisit({
      businessId: 'biz_1',
      token: 'token-old',
      qrUrl: 'https://espera.app/q/token-old',
      downloadUrl: '/api/business/biz_1/qr.png',
      status: 'retiring',
    })

    cy.contains(/en transición \(vence en 24hs\)/i).should('be.visible')
  })

  it('permite descargar el PNG sin errores', () => {
    authenticateVisit()

    cy.contains('button', /descargar png/i).click()
    cy.contains('button', /descargar png/i).should('be.visible')
  })

  it('regenera el QR y avisa hasta cuándo sigue funcionando el anterior', () => {
    authenticateVisit()

    const previousQrValidUntil = '2026-07-15T12:00:00.000Z'

    cy.intercept('POST', '**/business/biz_1/qr/regenerate', {
      statusCode: 200,
      body: {
        businessId: 'biz_1',
        token: 'token-new',
        qrUrl: 'https://espera.app/q/token-new',
        downloadUrl: '/api/business/biz_1/qr.png',
        status: 'active',
        previousQrValidUntil,
      },
    }).as('regenerate')

    cy.contains('button', /regenerar qr/i).click()

    cy.wait('@regenerate')
    cy.wait('@qrPng')
    cy.contains(/qr regenerado/i).should('be.visible')
    cy.contains('a', 'https://espera.app/q/token-new').should('be.visible')
  })

  it('muestra error de backend al regenerar sin perder el QR actual', () => {
    authenticateVisit()

    cy.intercept('POST', '**/business/biz_1/qr/regenerate', {
      statusCode: 500,
      body: { message: 'Internal server error.' },
    }).as('regenerate')

    cy.contains('button', /regenerar qr/i).click()

    cy.wait('@regenerate')
    cy.contains(/internal server error/i).should('be.visible')
    cy.contains('a', 'https://espera.app/q/token-abc').should('be.visible')
  })
})
