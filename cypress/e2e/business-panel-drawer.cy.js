/// <reference types="cypress" />

// Menú lateral del panel en celular (cajón off-canvas). Regresión: al abrirlo y
// arrastrar para hacer scroll, se movía la pantalla de atrás.
describe('Panel de negocio — cajón del menú en celular', () => {
  function visitPanel() {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { user: { id: 'user_1', email: 'santi@example.com', role: 'business_admin', approvalStatus: 'approved' } },
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
            listingStatus: 'draft',
            operationalStatus: 'normal',
            plan: 'basic',
            subscriptionStatus: 'active',
            trialEndsAt: null,
            activeQueueId: 'queue_1',
            queues: [],
          },
        ],
      },
    }).as('businessMe')

    cy.visit('/panel/business/cafe-espera')
    cy.wait('@me')
    cy.wait('@businessMe')
  }

  it('el cajón scrollea por sí mismo cuando el menú no entra en la pantalla', () => {
    // Celular chico/apaisado: el menú es más alto que la pantalla.
    cy.viewport(360, 380)
    visitPanel()

    cy.get('button[aria-label="Abrir menú"]').click()
    cy.get('.panel-layout__sidebar').then(($sidebar) => {
      const sidebar = $sidebar[0]
      // Sin overflow-y el cajón no tenía scroll propio y el gesto caía sobre el documento.
      expect(sidebar.scrollHeight, 'el menú es más alto que la pantalla').to.be.greaterThan(sidebar.clientHeight)
    })

    cy.get('.panel-layout__sidebar')
      .scrollTo('bottom', { ensureScrollable: false })
      .should(($sidebar) => {
        expect($sidebar[0].scrollTop, 'el cajón scrolleó').to.be.greaterThan(0)
      })
    cy.window().its('scrollY').should('eq', 0)
  })

  it('traba el scroll de la página mientras el menú está abierto y lo libera al cerrarlo', () => {
    cy.viewport(390, 700)
    visitPanel()

    cy.get('html').should('not.have.css', 'overflow-y', 'hidden')

    cy.get('button[aria-label="Abrir menú"]').click()
    // iOS Safari ignora body{overflow:hidden} para el scroll táctil: hay que trabar también <html>.
    cy.get('html').should('have.css', 'overflow-y', 'hidden')
    cy.get('body').should('have.css', 'overflow-y', 'hidden')
    // El gesto no encadena al fondo, ni desde el cajón ni desde el fondo oscuro.
    cy.get('.panel-layout__sidebar').should('have.css', 'overscroll-behavior-y', 'contain')
    cy.get('.panel-layout__backdrop')
      .should('have.css', 'touch-action', 'none')
      .and('have.css', 'overscroll-behavior-y', 'contain')

    cy.get('.panel-layout__backdrop').click({ force: true })
    cy.get('.panel-layout__backdrop').should('not.exist')
    cy.get('html').should('not.have.css', 'overflow-y', 'hidden')
    cy.get('body').should('not.have.css', 'overflow-y', 'hidden')
  })
})
