# Épica 8 - Backoffice

## Resumen

Panel interno para que el equipo Espera gestione la plataforma: aprobación
comercial de organizaciones y negocios, suspensión, métricas globales y
gestión de reportes. Vive en este mismo repo (`espera-front`), bajo
`/backoffice`, como una superficie separada del panel de negocio — acceso
exclusivo para cuentas `super_admin`, que se crean por script en el backend
(`npm run create:super-admin`), no por registro público.

Contrato y reglas de negocio completos del lado backend:
`docs/epica-8-backoffice.md` en el repo de `espera-back`.

## Estado general

- Estado: `en progreso`.
- Historias implementadas: ninguna todavía completa — esta rama
  (`feature/h-8.1-backoffice-access`) cubre la base de acceso (login
  reusado + redirección por rol + layout/ruta protegida) que el resto de la
  épica necesita.
- Historias pendientes: `HU-8.2`/`HU-8.3` (aprobar/rechazar organizaciones y
  negocios pendientes), `HU-8.4` (suspender/reactivar negocio), `HU-8.5`
  (métricas globales), `HU-8.6` (reportes), `HU-8.7` (alerta de coherencia,
  integrada en la vista de revisión de `HU-8.3`).

## Superficies involucradas

- backoffice (`/backoffice/*`) — nueva.

## HU-8.1 - Acceso al Backoffice (login reusado + redirección por rol)

Estado: `implementado`.

### Objetivo de experiencia

El equipo Espera entra por la misma pantalla de login que cualquier otro
usuario (`/login`) — no hay una pantalla de login separada para Backoffice,
ni registro público de cuentas `super_admin`. Al loguearse con una cuenta
`super_admin`, cae directo en `/backoffice` en vez del panel de negocio.

### Pantallas / Rutas

```text
/backoffice   (BackofficePanelLayout, protegida por rol)
```

### Decisión de implementación

**Sin pantalla de login propia.** `LoginPage` y `POST /api/auth/login` no
cambian — coherente con la decisión del backend de reusar el mismo sistema
de auth para `super_admin` (ver `epica-8-backoffice.md` del backend,
`HU-8.1`). El único cambio es dónde redirige después:

- `resolvePostLoginPath(businesses, user)` (`src/features/auth/model/resolvePostLoginPath.js`)
  ahora también recibe el `user` y, si `user.role === 'super_admin'`, devuelve
  `/backoffice` antes de mirar los negocios propios (una cuenta `super_admin`
  nunca es dueña de un negocio).
- `usePostLoginRedirect` pasa el `user` ya resuelto (mismo `fetchQuery` que
  ya compartía con `AuthLayout`, sin pedir `/auth/me` una segunda vez).

**Guarda de acceso en el layout, no en el router.** `BackofficePanelLayout`
lee `user.role` de `useSessionStore` y redirige a `/panel` si no es
`super_admin` — mismo patrón que ya usa el resto de la app (guardas dentro
del layout, `AuthLayout` solo valida "autenticado", no rol). Cubre tanto el
caso de login como el de entrar por URL directa/bookmark con una cuenta sin
permiso.

**`BackofficePanelLayout` reusa las clases `.panel-layout*` existentes**
(sidebar, topbar, drawer mobile) en vez de crear una hoja de estilos nueva —
mismo lenguaje visual sobrio que el panel de negocio, sin nada específico de
un negocio (no hay selector de negocio, ni banners de aprobación pendiente).
El nav arranca con un solo ítem ("Inicio") y se va a ir completando a medida
que se implementen `HU-8.2` a `HU-8.6`.

### Cobertura

- `cypress/e2e/login.cy.js` — caso "redirige al Backoffice cuando el usuario
  es super_admin".
- `cypress/e2e/backoffice-access.cy.js` — shell visible para `super_admin`,
  redirección a `/panel` para `business_admin`/`employee`.

No pude correr la suite en este entorno (Cypress no levanta su binario de
Electron acá — `bad option: --smoke-test` incluso tras reinstalar el cache,
en Bash y PowerShell, con y sin sandbox); verificado por lint + build +
lectura de código.
