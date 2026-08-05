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
  pantalla aparte), `HU-8.4`/`HU-8.5` (suspender/reactivar negocio +
  dashboard de métricas globales — misma rama, pantallas separadas, ver
  nota de alcance en `HU-8.4`/`HU-8.5` más abajo), gestión manual de
  suscripciones (bugfix, no una HU del backlog — pantalla propia
  "Suscripciones", ver sección dedicada al final).
- Historias pendientes: `HU-8.6` (reportes).
- Sidebar del Backoffice tiene 4 ítems: Inicio, Aprobaciones, Negocios,
  Suscripciones.

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

## HU-8.4 - Suspender/reactivar un negocio activo / HU-8.5 - Métricas globales de la plataforma

Estado: `implementado`.

Se implementaron juntas, en la misma rama, por una razón de contrato
backend, no de conveniencia: no existe ningún endpoint para listar negocios
que no estén `pending` — la única forma de ver negocios
`approved`/`suspended` (para poder suspenderlos o reactivarlos) es
`GET /business/platform/metrics`, que es el endpoint de `HU-8.5`. Separar
esto en dos ramas hubiera significado construir la tabla de negocios dos
veces. Sí quedaron en **pantallas separadas** dentro del sidebar (ver nota
de alcance más abajo) — la rama es una, la navegación no.

### Objetivo de experiencia

El equipo Espera entra a "Inicio" y ve, de un vistazo, el estado agregado de
la plataforma: negocios activos, usuarios registrados, turnos de
hoy/semana, los rubros con más demanda. Desde "Negocios" (ítem propio del
sidebar) filtra/ordena/pagina la lista completa de negocios y, por fila,
suspende uno operando (con motivo obligatorio) o reactiva uno suspendido.
Desde "Suscripciones" (otro ítem propio, ver sección dedicada más abajo)
gestiona el plan/estado de la suscripción de cada organización.

### Pantallas / Rutas

```text
/backoffice             (BackofficeHomePage — dashboard: stats + rubros con más demanda)
/backoffice/businesses  (BackofficeBusinessesPage — tabla de negocios + suspender/reactivar)
```

**Separadas en dos rutas/ítems del sidebar, no una sola pantalla.** Primera
versión de esta rama metía el dashboard y la tabla (con filtros y
paginación) en la misma página. Separar "Inicio" (solo lectura, liviano) de
"Negocios" (la pantalla de gestión) sigue el mismo patrón que ya usa el
resto del panel — sidebar con ítems por función, no una pantalla que lo
hace todo.

**La gestión de suscripciones NO vive acá** — ver sección propia más abajo
("Gestión manual de suscripciones") y `/backoffice/subscriptions`. Primer
intento la puso como panel expandible dentro de cada fila de "Negocios";
eso mezclaba dos responsabilidades distintas (estado operativo del negocio
vs. estado comercial de la organización) en una sola pantalla ya cargada de
interacción (filtros + paginación + expandibles anidados), con el mismo
riesgo de accesibilidad/responsive que motivó separar "Inicio" de
"Negocios" en primer lugar — así que se corrigió a una cuarta pantalla
dedicada en el sidebar en vez de un panel anidado.

### Contratos backend usados

```text
GET   /api/business/platform/metrics?fromDate=&toDate=&organizationId=&categoryId=&status=&subscriptionPlan=&subscriptionStatus=&sortBy=&sortDir=&page=&pageSize=
PATCH /api/business/:businessId/suspend       body: { reason }
PATCH /api/business/:businessId/reactivate
```

### Decisiones de implementación

**Dos queries independientes contra el mismo endpoint**, no una sola
compartida. `PlatformStatsHeader` pide `getPlatformMetrics({ pageSize: 1 })`
(sin filtros, rango default de 7 días) solo para los 4 números de arriba y
"rubros con más demanda" — esos campos son "siempre relativos a hoy", no al
rango que el admin elija en la tabla (así lo aclara el backend). Separarlas
evita que cambiar un filtro de la tabla haga bailar los números de arriba, y
evita tener que levantar el estado de filtros hasta un padre común.

**Filtro de fecha por defecto: últimos 90 días, no el default del backend
(7 días).** Limitación real y no resuelta del contrato: `GetPlatformMetricsUseCase`
arma la lista de negocios a partir de `getTurnCountsByBusiness(fromDate, toDate)`
— **un negocio con cero turnos en el rango elegido no aparece en la lista,
sin importar los demás filtros.** No hay forma de listar negocios "todos",
solo "negocios con actividad en este rango". 90 días reduce el problema
(cualquier negocio con algo de actividad reciente aparece) pero no lo
elimina — un negocio nuevo sin turnos, o uno inactivo hace meses, simplemente
no se puede suspender/reactivar desde acá todavía. Documentado acá en vez de
resuelto porque el fix real es de backend (un endpoint de listado de
negocios independiente de `Turn`) y está fuera del alcance de esta rama —
candidato a un prompt de backend aparte si se vuelve un problema real de
uso.

**Sin filtro por `organizationId`.** El endpoint lo soporta, pero no hay
ningún selector/autocomplete de organizaciones en el Backoffice todavía (no
hay un `GET /organizations` genérico, solo `/pending`) — un filtro de texto
libre pidiendo un UUID a mano no aporta usabilidad real. Se deja para
cuando exista una pantalla de organizaciones.

**Filas como lista de tarjetas, no tabla ancha.** Con nombre, categoría,
plan, estado de suscripción, turnos, estado y acciones, una tabla real
tendría 7+ columnas — mismo problema de overflow que ya resolvimos en
`QueueHistoryTable` (`HU-6.6`). Se usa el mismo patrón de fila tipo
actividad (nombre + meta line truncada + badge + acciones) en vez de
reintroducirlo.

**Acciones condicionadas al estado real de cada fila**: "Suspender" solo
aparece si `status === "approved"` (coincide con la regla de
`SuspendBusinessUseCase`: solo se puede suspender un negocio operando);
"Reactivar" solo si `status === "suspended"`. Un negocio `pending`/`rejected`
no muestra ninguna de las dos (se gestiona desde "Aprobaciones").

**Nuevos códigos de error mapeados**: `BUSINESS_CANNOT_BE_SUSPENDED`,
`BUSINESS_NOT_SUSPENDED`.

### Cobertura

- `cypress/e2e/backoffice-metrics.cy.js` — dashboard "Inicio": stats + rubros
  con más demanda, links a "Aprobaciones" y "Negocios".
- `cypress/e2e/backoffice-businesses.cy.js` — pantalla "Negocios": listar,
  suspender pidiendo motivo (botón deshabilitado sin texto), reactivar,
  cambiar el filtro de estado dispara una nueva consulta con el query param
  correcto.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

## Gestión manual de suscripciones (bugfix, no una HU del backlog) — pantalla propia "Suscripciones"

Estado: `implementado`.

No estaba en el alcance original de `HU-8.4`/`HU-8.5`, pero el backend
agregó `GET/PATCH /organizations/:organizationId/subscription/*` (sin
pasarela de pago en el MVP — ver "Bugfix — Gestión manual de Subscription"
en `docs/epica-2-5-cuentas-organizaciones.md` del backend) y dejar la tabla
de "Negocios" mostrando plan/estado de suscripción en solo lectura eran
"métricas aisladas" sin forma de accionarlas — exactamente el problema que
motivó el bugfix del lado backend.

**Pantalla propia (`/backoffice/subscriptions`), no un panel dentro de
"Negocios".** Primer intento la enganchó como panel expandible por fila en
la tabla de Negocios; se corrigió a una cuarta pantalla dedicada en el
sidebar — gestionar el estado *comercial* de una Organization (suscripción)
es una responsabilidad distinta de gestionar el estado *operativo* de un
Business (suspender/reactivar), y mezclarlas en la misma pantalla ya
sobrecargada de filtros/paginación repetía el mismo problema de
accesibilidad/responsive que motivó separar "Inicio" de "Negocios".

### Pantallas / Rutas

```text
/backoffice/subscriptions   (BackofficeSubscriptionsPage)
```

### Contratos backend usados

```text
GET   /api/organizations/:organizationId/subscription
PATCH /api/organizations/:organizationId/subscription/activate
PATCH /api/organizations/:organizationId/subscription/cancel    body: { reason }
PATCH /api/organizations/:organizationId/subscription/plan      body: { plan }
```

### Decisiones de implementación

**Sin endpoint de "listar organizaciones", así que se agrupa la misma
fuente que usa "Negocios".** No existe un `GET /organizations` genérico
(solo `/pending`), así que `SubscriptionsList` pide
`getPlatformMetrics({ pageSize: 50, sortBy: 'businessName' })` — la misma
fuente que HU-8.5 — y agrupa las filas (por `businessName`) en el cliente
por `organizationId` (`groupByOrganization` en `SubscriptionsList.jsx`),
mostrando una fila por Organization con los nombres de sus negocios. Hereda
la misma limitación ya documentada en "Negocios": una organización cuyos
negocios no tuvieron turnos en los últimos 90 días, o si hay más de 50
negocios en total, no aparece en esta lista tampoco — mismo candidato a
prompt de backend aparte (un listado de organizaciones independiente de
`Turn`).

**Cada fila expande (lazy) el mismo `SubscriptionPanel`** que ya existía —
no se reescribió, solo se movió de "colgar de una fila de Negocios" a
"colgar de una fila de Suscripciones". Tres acciones dentro del panel:

- **Activar** (`pending`/`trial` → `active`) — visible solo si aplica.
- **Cancelar** (cualquier estado no terminal → `cancelled`, motivo
  obligatorio, mismo patrón de `ConfirmDialog` con `children` que ya
  usamos para rechazos/suspensión) — visible solo si no está ya
  `cancelled`/`expired`.
- **Cambiar plan** — select con los planes distintos al actual + confirmar;
  el backend puede rechazar un downgrade si la Organization tiene más
  negocios de los que el plan nuevo permite (`SUBSCRIPTION_DOWNGRADE_BLOCKED`).

**"Negocios" sigue mostrando plan/estado de suscripción como texto
informativo** en la meta-line de cada fila (sin acción) — da contexto sin
duplicar la gestión.

**Nuevos códigos de error mapeados**: `SUBSCRIPTION_CANNOT_BE_ACTIVATED`,
`SUBSCRIPTION_ALREADY_CANCELLED`, `SUBSCRIPTION_DOWNGRADE_BLOCKED`
(`SUBSCRIPTION_NOT_FOUND` ya existía, mapeado desde antes de esta épica).

### Cobertura

- `cypress/e2e/backoffice-subscriptions.cy.js` — listar agrupado por
  organización, expandir y activar una suscripción en prueba, cancelar
  pidiendo motivo, cambiar de plan.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.
