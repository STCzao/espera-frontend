/// <reference types="cypress" />

const ADMIN_ID = 'admin_1'

function mockSuperAdminSession() {
  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: { user: { id: ADMIN_ID, email: 'admin@espera.com', role: 'super_admin' } },
  }).as('me')
}

// Fechas a mediodía UTC: en cualquier huso horario caen en el mismo día.
function user(overrides = {}) {
  return {
    userId: 'user_1',
    firstName: 'Ana',
    lastName: 'Gómez',
    email: 'ana@example.com',
    role: 'user',
    approvalStatus: 'approved',
    isBlocked: false,
    createdAt: '2026-03-10T15:00:00.000Z',
    ...overrides,
  }
}

function usersResponse(items, overrides = {}) {
  return { items, page: 1, pageSize: 20, total: items.length, ...overrides }
}

const usersRoute = { method: 'GET', pathname: '/api/auth/users' }

function visitUsers(items = [user()]) {
  mockSuperAdminSession()
  cy.intercept(usersRoute, { statusCode: 200, body: usersResponse(items) }).as('users')
  cy.visit('/backoffice/users')
  cy.wait('@me')
  cy.wait('@users')
}

function filter(label) {
  return cy.contains('label', label)
}

describe('Backoffice - directorio de usuarios', () => {
  it('lista los usuarios con rol, aprobación, bloqueo y fecha de alta', () => {
    visitUsers([
      user(),
      user({ userId: 'user_2', firstName: 'Bruno', lastName: 'Díaz', email: 'bruno@example.com', role: 'business_admin', approvalStatus: 'pending', createdAt: '2026-04-02T15:00:00.000Z' }),
      user({ userId: 'user_3', firstName: 'Carla', lastName: 'Ruiz', email: 'carla@example.com', role: 'employee', isBlocked: true }),
    ])

    cy.contains('h1', 'Usuarios').should('be.visible')

    cy.contains('li', 'Ana Gómez')
      .should('contain.text', 'ana@example.com')
      .and('contain.text', 'Usuario')
      .and('contain.text', 'alta 10/03/2026')
      .and('contain.text', 'Aprobado')
      .and('not.contain.text', 'Bloqueado')
    cy.contains('li', 'Bruno Díaz')
      .should('contain.text', 'Admin de negocio')
      .and('contain.text', 'Pendiente')
      .and('contain.text', 'alta 02/04/2026')
    cy.contains('li', 'Carla Ruiz').should('contain.text', 'Empleado').and('contain.text', 'Bloqueado')
  })

  it('muestra un mensaje cuando ningún usuario coincide con los filtros', () => {
    visitUsers([])

    cy.contains('Ningún usuario coincide con estos filtros.').should('be.visible')
  })

  it('cada filtro viaja al backend, se acumulan con los anteriores y vuelven a la página 1', () => {
    visitUsers()

    filter('Rol').find('select').select('Empleado')
    cy.wait('@users').its('request.query').should('deep.include', { role: 'employee', page: '1' })

    filter('Acceso').find('select').select('Bloqueados')
    cy.wait('@users').its('request.query').should('deep.include', { role: 'employee', isBlocked: 'true' })

    filter('Aprobación').find('select').select('Pendiente')
    cy.wait('@users')
      .its('request.query')
      .should('deep.include', { role: 'employee', isBlocked: 'true', approvalStatus: 'pending', page: '1' })

    filter('Acceso').find('select').select('Activos')
    cy.wait('@users').its('request.query').should('deep.include', { isBlocked: 'false' })
  })

  it('cambia el orden y la dirección', () => {
    visitUsers()

    cy.wait(0)
    filter('Orden').find('select').select('Nombre')
    cy.wait('@users').its('request.query').should('deep.include', { sortBy: 'name', sortDir: 'desc' })

    cy.contains('button', '↓ Descendente').click()
    cy.wait('@users').its('request.query').should('deep.include', { sortBy: 'name', sortDir: 'asc' })
    cy.contains('button', '↑ Ascendente').should('be.visible')
  })

  describe('búsqueda por texto', () => {
    it('espera a que se deje de tipear: un solo pedido, con el texto recortado', () => {
      visitUsers()

      cy.get('input[type="search"]').type('  ana ')

      cy.wait('@users').its('request.query').should('deep.include', { search: 'ana', page: '1' })
      // Inicial + uno: tipear cinco caracteres no son cinco pedidos.
      cy.get('@users.all').should('have.length', 2)
    })

    it('un texto de solo espacios no se envía (el backend lo rechaza con 400)', () => {
      visitUsers()

      cy.get('input[type="search"]').type('   ')
      cy.wait(600)

      cy.get('@users.all').should('have.length', 1)
    })

    it('al borrar el texto vuelve a pedir la lista sin filtro de búsqueda', () => {
      visitUsers()

      cy.get('input[type="search"]').type('ana')
      cy.wait('@users').its('request.query').should('have.property', 'search', 'ana')

      cy.get('input[type="search"]').clear()
      cy.wait('@users').its('request.query').should('not.have.property', 'search')
    })
  })

  describe('bloquear', () => {
    it('exige un motivo, bloquea y la fila pasa a Bloqueado con la opción de desbloquear', () => {
      let blocked = false
      mockSuperAdminSession()
      cy.intercept(usersRoute, (request) => {
        request.reply({ statusCode: 200, body: usersResponse([user({ isBlocked: blocked })]) })
      }).as('users')
      cy.intercept('PATCH', '**/auth/users/user_1/block', (request) => {
        expect(request.body).to.deep.equal({ reason: 'Spam reiterado' })
        blocked = true
        request.reply({
          statusCode: 200,
          body: { userId: 'user_1', isBlocked: true, blockedByUserId: ADMIN_ID, blockedAt: '2026-10-09T15:00:00.000Z', blockReason: 'Spam reiterado' },
        })
      }).as('block')

      cy.visit('/backoffice/users')
      cy.wait('@users')

      cy.contains('li', 'Ana Gómez').contains('button', /^bloquear$/i).click()
      cy.get('[role="alertdialog"]').should('contain.text', 'ana@example.com')

      // Sin motivo, o con solo espacios, no se puede confirmar.
      cy.get('[role="alertdialog"]').contains('button', /bloquear usuario/i).should('be.disabled')
      cy.get('#block-user-reason').type('   ')
      cy.get('[role="alertdialog"]').contains('button', /bloquear usuario/i).should('be.disabled')

      cy.get('#block-user-reason').clear().type('Spam reiterado')
      cy.get('[role="alertdialog"]').contains('button', /bloquear usuario/i).should('be.enabled').click()

      cy.wait('@block')
      cy.get('[role="alertdialog"]').should('not.exist')
      cy.contains('li', 'Ana Gómez').should('contain.text', 'Bloqueado')
      cy.contains('li', 'Ana Gómez').contains('button', /^desbloquear$/i).should('be.visible')
      cy.contains('li', 'Ana Gómez').contains('button', /^bloquear$/i).should('not.exist')
    })

    it('cancelar el diálogo no bloquea ni conserva el motivo escrito', () => {
      visitUsers()
      cy.intercept('PATCH', '**/auth/users/*/block').as('block')

      cy.contains('li', 'Ana Gómez').contains('button', /^bloquear$/i).click()
      cy.get('#block-user-reason').type('Me arrepentí')
      cy.get('[role="alertdialog"]').contains('button', /^cancelar$/i).click()

      cy.get('[role="alertdialog"]').should('not.exist')
      cy.contains('li', 'Ana Gómez').contains('button', /^bloquear$/i).click()
      cy.get('#block-user-reason').should('have.value', '')
      cy.get('@block.all').should('have.length', 0)
    })

    it('no deja bloquear la propia cuenta', () => {
      visitUsers([user({ userId: ADMIN_ID, firstName: 'Admin', lastName: 'Espera', email: 'admin@espera.com', role: 'super_admin' }), user()])

      cy.contains('li', 'Admin Espera')
        .should('contain.text', '(vos)')
        .contains('button', /^bloquear$/i)
        .should('be.disabled')
        .and('have.attr', 'title', 'No podés bloquear tu propia cuenta.')
      cy.contains('li', 'Ana Gómez').contains('button', /^bloquear$/i).should('be.enabled')
    })

    it('si el usuario ya estaba bloqueado (409), lo explica y recarga la lista', () => {
      visitUsers()
      cy.intercept('PATCH', '**/auth/users/user_1/block', {
        statusCode: 409,
        body: { message: 'User is already blocked.', code: 'USER_ALREADY_BLOCKED' },
      }).as('block')

      cy.contains('li', 'Ana Gómez').contains('button', /^bloquear$/i).click()
      cy.get('#block-user-reason').type('Spam')
      cy.get('[role="alertdialog"]').contains('button', /bloquear usuario/i).click()

      cy.wait('@block')
      cy.contains('Ese usuario ya está bloqueado.').should('be.visible')
      // El diálogo se cierra para que el error no quede tapado, y se vuelve a pedir la lista.
      cy.get('[role="alertdialog"]').should('not.exist')
      cy.wait('@users')
    })
  })

  describe('desbloquear', () => {
    it('desbloquea directo, sin confirmación', () => {
      let blocked = true
      mockSuperAdminSession()
      cy.intercept(usersRoute, (request) => {
        request.reply({
          statusCode: 200,
          body: usersResponse([user({ userId: 'user_3', firstName: 'Carla', lastName: 'Ruiz', isBlocked: blocked })]),
        })
      }).as('users')
      cy.intercept('PATCH', '**/auth/users/user_3/unblock', (request) => {
        blocked = false
        request.reply({
          statusCode: 200,
          body: { userId: 'user_3', isBlocked: false, unblockedByUserId: ADMIN_ID, unblockedAt: '2026-10-09T15:00:00.000Z' },
        })
      }).as('unblock')

      cy.visit('/backoffice/users')
      cy.wait('@users')

      cy.contains('li', 'Carla Ruiz').should('contain.text', 'Bloqueado')
      cy.contains('li', 'Carla Ruiz').contains('button', /^desbloquear$/i).click()

      cy.get('[role="alertdialog"]').should('not.exist')
      cy.wait('@unblock')
      cy.contains('li', 'Carla Ruiz').should('not.contain.text', 'Bloqueado')
      cy.contains('li', 'Carla Ruiz').contains('button', /^bloquear$/i).should('be.visible')
    })

    it('si el usuario no estaba bloqueado (409), lo explica en español', () => {
      visitUsers([user({ isBlocked: true })])
      cy.intercept('PATCH', '**/auth/users/user_1/unblock', {
        statusCode: 409,
        body: { message: 'User is not blocked.', code: 'USER_NOT_BLOCKED' },
      }).as('unblock')

      cy.contains('li', 'Ana Gómez').contains('button', /^desbloquear$/i).click()

      cy.wait('@unblock')
      cy.contains('Ese usuario no está bloqueado.').should('be.visible')
    })
  })

  it('pagina el directorio', () => {
    mockSuperAdminSession()
    cy.intercept(usersRoute, (request) => {
      const page = Number(request.query.page ?? 1)
      request.reply({
        statusCode: 200,
        body: usersResponse([user({ userId: `user_p${page}`, firstName: `Persona${page}` })], { page, total: 45 }),
      })
    }).as('users')

    cy.visit('/backoffice/users')
    cy.wait('@users')

    cy.contains('Página 1 de 3 · 45 usuarios').should('be.visible')
    cy.contains('button', 'Anterior').should('be.disabled')

    cy.contains('button', 'Siguiente').click()
    cy.wait('@users').its('request.query').should('deep.include', { page: '2' })
    cy.contains('Página 2 de 3 · 45 usuarios').should('be.visible')
    cy.contains('Persona2').should('be.visible')
    cy.contains('button', 'Anterior').should('be.enabled')
  })

  it('si la lista no carga, la pantalla sigue en pie y lo avisa', () => {
    mockSuperAdminSession()
    cy.intercept(usersRoute, { statusCode: 500, body: { message: 'Internal server error.' } }).as('users')

    cy.visit('/backoffice/users')
    cy.wait('@me')
    cy.wait('@users')

    cy.contains('No pudimos cargar los usuarios.').should('be.visible')
    cy.contains('h1', 'Usuarios').should('be.visible')
    cy.contains('label', 'Buscar').should('be.visible')
    cy.contains('a', 'Negocios').should('be.visible')
  })

  it('el menú del Backoffice tiene la entrada Usuarios', () => {
    visitUsers()

    cy.contains('a', 'Usuarios').should('have.attr', 'href', '/backoffice/users')
  })
})
