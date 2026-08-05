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
- Historias implementadas: `HU-8.1` (acceso), `HU-8.2`/`HU-8.3` (listar y
  aprobar/rechazar organizaciones y negocios pendientes), `HU-8.7` (alerta
  de coherencia — integrada en la vista de revisión de `HU-8.3`, no es
  pantalla aparte).
- Historias pendientes: `HU-8.4` (suspender/reactivar negocio), `HU-8.5`
  (métricas globales), `HU-8.6` (reportes).

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

## HU-8.2 - Ver organizaciones y negocios pendientes / HU-8.3 - Aprobar o rechazar

Estado: `implementado`.

### Objetivo de experiencia

El equipo Espera entra a "Aprobaciones" y ve dos listas separadas —
organizaciones y negocios pendientes— porque son dos niveles de aprobación
independientes (ver `docs/epica-2-5-cuentas-organizaciones.md` del backend,
sección "Refinamiento — Aprobación comercial en dos niveles": aprobar una
`Organization` no aprueba ningún `Business` bajo ella). Puede aprobar o
rechazar cada una; rechazar exige escribir un motivo.

### Pantallas / Rutas

```text
/backoffice/approvals   (BackofficeApprovalsPage, tabs "Organizaciones" / "Negocios")
```

### Contratos backend usados

```text
GET   /api/organizations/pending
PATCH /api/organizations/:organizationId/approve
PATCH /api/organizations/:organizationId/reject   body: { reason }
GET   /api/business/pending
GET   /api/business/:businessId/review             → { business, organization, alerts } (HU-8.7)
PATCH /api/business/:businessId/approve             body: { note? }
PATCH /api/business/:businessId/reject              body: { reason }
```

### Decisiones de implementación

**HU-8.7 se integró acá en vez de en una pantalla aparte.** El backend ya
tenía `GET /business/:businessId/review` (alertas `CATEGORY_MISMATCH` /
`MISSING_LEGAL_ID`) y `ApproveBusinessUseCase` ya exige `note` cuando hay
alertas (`400 APPROVAL_NOTE_REQUIRED`) — construir la fila de "Negocios
pendientes" sin esto hubiera significado un approve que falla sin
explicación la primera vez que hay una alerta real. Cada fila de negocio
tiene un botón "Revisar" que expande un panel inline (fetch lazy de
`/review`, solo al expandir — no N+1 en la carga inicial de la lista) con
el nombre/CUIT de la Organization y las alertas. El campo de nota queda
opcional salvo que haya alertas, en cuyo caso el botón "Aprobar" queda
deshabilitado hasta que se escribe algo (`requiresNote` en
`BusinessReviewPanel`, `PendingBusinessesPanel.jsx`).

**Organizaciones no tienen ese mismo paso de revisión** — no hay alertas de
coherencia a nivel Organization (HU-8.7 es específica de la revisión de
`Business`), así que su fila es más simple: nombre, CUIT (o "Sin CUIT
cargado") y los dos botones directo, sin expandir nada.

**`ConfirmDialog` ganó `children` y `confirmDisabled`** (antes solo
título/descripción/botones) — se reusa para el flujo de rechazo de ambas
listas en vez de construir un modal nuevo: `children` renderiza el
`<textarea>` del motivo, y `confirmDisabled` bloquea "Rechazar" hasta que
haya texto. Cambio retrocompatible — el resto de los usos existentes de
`ConfirmDialog` (cancelar turno, desactivar/eliminar ventanilla, revocar
empleado) no pasan estas props y siguen igual.

**Categoría del negocio se resuelve con el hook ya existente**
(`useBusinessCategories`, mismo que usa el alta de negocio) — no se agregó
un endpoint nuevo para esto.

**Nuevos códigos de error mapeados** en `apiError.js`:
`ORGANIZATION_NOT_FOUND/ALREADY_APPROVED/NOT_PENDING/NOT_APPROVED`,
`ORGANIZATION_OWNERSHIP_REQUIRED`, `BUSINESS_ALREADY_APPROVED`,
`BUSINESS_NOT_PENDING`, `APPROVAL_NOTE_REQUIRED`.

### Cobertura

- `cypress/e2e/backoffice-approvals.cy.js` — listar y aprobar una
  organización, rechazar pidiendo motivo (botón deshabilitado sin texto),
  listar negocios con categoría resuelta, expandir revisión y ver la
  alerta de `MISSING_LEGAL_ID`, aprobar bloqueado hasta cargar la nota.

No pude correr la suite en este entorno (mismo bloqueo de Cypress que
`HU-8.1` — el binario de Electron no arranca acá); verificado por lint +
build + lectura de código.
