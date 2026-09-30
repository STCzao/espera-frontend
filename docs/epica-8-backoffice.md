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

- Estado: `completa` — 7/7 historias implementadas.
- Historias implementadas: `HU-8.1` (acceso), `HU-8.2`/`HU-8.3` (listar y
  aprobar/rechazar organizaciones y negocios pendientes), `HU-8.7` (alerta
  de coherencia — integrada en la vista de revisión de `HU-8.3`, no es
  pantalla aparte), `HU-8.4`/`HU-8.5` (suspender/reactivar negocio +
  dashboard de métricas globales — misma rama, pantallas separadas, ver
  nota de alcance en `HU-8.4`/`HU-8.5` más abajo), `HU-8.6` (reportes),
  gestión manual de suscripciones (bugfix, no una HU del backlog — pantalla
  propia "Suscripciones", ver sección dedicada más abajo).
- Sidebar del Backoffice tiene 5 ítems: Inicio, Aprobaciones, Negocios,
  Suscripciones, Reportes.

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
GET   /api/business/platform/metrics?fromDate=&toDate=   (solo stats + topBusinesses/topCategories, ver nota más abajo)
GET   /api/business?organizationId=&categoryId=&status=&subscriptionPlan=&subscriptionStatus=&sortBy=&sortDir=&page=&pageSize=
PATCH /api/business/:businessId/suspend       body: { reason }
PATCH /api/business/:businessId/reactivate
```

### Decisiones de implementación

**Dos endpoints distintos, no uno**: `PlatformStatsHeader` usa
`getPlatformMetrics()` (stats + rubros/negocios con más demanda, siempre
relativos a "hoy" o al rango elegido, nunca depende de filtros de negocio) y
`BusinessMetricsTable` usa `listBusinesses()` contra `GET /business` (el
directorio real, filtrable/ordenable/paginado, sin depender de `Turn`). Ver
"Bugfix — separación del listado de negocios de las métricas" más abajo
para el porqué — originalmente eran un solo endpoint y tenían un defecto de
diseño real, no solo una limitación de fechas.

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
`listBusinesses({ pageSize: 50, sortBy: 'businessName' })` (`GET /business`
— ver "Bugfix — separación del listado de negocios de las métricas" más
abajo) y agrupa las filas en el cliente por `organizationId`
(`groupByOrganization` en `SubscriptionsList.jsx`), mostrando una fila por
Organization con los nombres de sus negocios. Con el directorio real ya no
depende de actividad de turnos ni de un rango de fechas — el único límite
que queda es el máximo de 50 negocios por página, sin paginar todavía en
esta vista (agrupar por organización a través de páginas complicaría la
UI más de lo que vale por ahora).

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

## HU-8.6 - Ver y gestionar reportes

Estado: `implementado`. Última historia de la épica — la cierra.

### Objetivo de experiencia

El equipo Espera entra a "Reportes" (quinto ítem del sidebar) y ve todos
los reportes de usuarios y negocios, filtrables por estado y tipo. Por cada
reporte pendiente puede resolverlo sin más acción, descartarlo (con nota
obligatoria) o suspender directamente a quien fue reportado.

### Pantallas / Rutas

```text
/backoffice/reports   (BackofficeReportsPage)
```

### Contratos backend usados

```text
GET   /api/reports?status=&reportedType=            → Report[] (sin envolver)
PATCH /api/reports/:reportId/resolve   body: { note? }
PATCH /api/reports/:reportId/dismiss   body: { note }   (obligatoria)
PATCH /api/reports/:reportId/suspend   body: { note? }  → delega en SuspendBusinessUseCase o BlockUserUseCase
```

`POST /api/reports` (crear un reporte) es de cara al usuario final, no al
Backoffice — no tiene pantalla en esta épica; el backend ya lo expone para
cuando exista un flujo de "reportar" en el panel de negocio o la app de
clientes.

### Decisiones de implementación

**No hay forma de resolver el nombre de un usuario reportado.** `Report`
solo guarda `reportedId` — para `reportedType: "business"` se resuelve el
nombre reusando `GET /business/:businessId/review` (ya existía, HU-8.7,
sin restricción de estado del negocio) al expandir el detalle de la fila.
Para `reportedType: "user"` **no existe ningún endpoint de lectura de
usuario** en el backend (`auth.routes.ts` no expone ningún `GET`) — se
muestra el `reportedId` crudo con una nota explícita de la limitación en
vez de fingir que se resolvió. Mismo criterio que las limitaciones ya
documentadas en Negocios/Suscripciones: se señala, no se disimula.

**Acciones de revisión solo visibles si `status === "pending"`** — un
reporte ya resuelto/descartado/suspendido muestra su `internalNote` y
`reviewedAt` en modo lectura, sin botones (coincide con la regla del
backend: solo se puede revisar una vez, `409 REPORT_NOT_PENDING` si se
reintenta).

**Un solo `ConfirmDialog` reusado para las tres acciones** (`action` en
estado local: `'resolve' | 'dismiss' | 'suspend'`), con el texto de
nota "(obligatoria)"/"(opcional)" cambiando según la acción y
`confirmDisabled` activo solo para `dismiss` — mismo patrón que ya se usó
en Aprobaciones/Negocios/Suscripciones para no repetir tres modales
casi idénticos.

**El texto del botón "Suspender" indica a quién**, ej. "Suspender negocio"
o "Suspender usuario" — la acción real (`SuspendReportedUseCase`) es
irreversible desde acá y delega en `SuspendBusinessUseCase`/`BlockUserUseCase`
según `reportedType`, así que vale la pena que el botón no sea ambiguo.

**Nuevos códigos de error mapeados**: `REPORT_NOT_FOUND`, `REPORT_NOT_PENDING`,
`USER_NOT_FOUND`, `USER_ALREADY_BLOCKED`.

### Cobertura

- `cypress/e2e/backoffice-reports.cy.js` — listar y expandir el detalle de
  un negocio reportado, resolver, descartar exigiendo nota, suspender el
  negocio reportado, un reporte de usuario muestra el id sin resolver
  nombre, filtrar por estado.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

## Bugfix — Vencimiento de Subscription bloquea operar (2026-08-08, backend)

Rama frontend: `bugfix/subscription-lifecycle-enforcement`.

El backend agregó reconciliación perezosa `trial → expired` (nada mueve el
estado automáticamente sin scheduler — se resuelve al leer) y, con eso
resuelto, bloqueó aprobar un `Business` cuya `Organization` tiene
`Subscription` `cancelled`/`expired` (ver "Bugfix — La Subscription
vencida/cancelada ahora bloquea operar" en
`docs/epica-2-5-cuentas-organizaciones.md` del backend). No agrega ninguna
pantalla nueva ni cambia ninguna forma de respuesta — `subscriptionStatus`
ya se mostraba como texto libre vía `subscriptionStatusLabels` (que ya
incluía `expired`) tanto en "Negocios" como en "Suscripciones", así que
ambas pantallas reflejan el estado reconciliado sin tocar código.

**Único cambio real: mapear el error nuevo.** `ApproveBusinessUseCase`
(usado por la acción "Aprobar" de `HU-8.3`, ya implementada) ahora puede
devolver `409 SUBSCRIPTION_NOT_ACTIVE` — sin mapearlo, un intento de
aprobar un negocio de una cuenta vencida mostraba el mensaje crudo en
inglés del backend en vez de traducido. También se mapeó
`SUBSCRIPTION_INACTIVE` (`403`, bloquea *crear* un negocio nuevo,
`EnsureBusinessCreationAllowedUseCase`) aunque esa pantalla
(`BusinessCreatePage`, Épica 1/2) no forma parte de esta épica — se
incluye acá porque salió del mismo PR de backend y usa el mismo mecanismo
de traducción centralizado (`apiError.js`).

### Cobertura

- `cypress/e2e/backoffice-approvals.cy.js` — caso nuevo: aprobar un negocio
  cuya organización tiene la suscripción vencida muestra el mensaje
  traducido en vez del texto crudo del backend.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

## Bugfix — separación del listado de negocios de las métricas (2026-08-06, backend)

Rama frontend: `bugfix/business-status-guards` (mismo commit que el fix de
`business.status`, ver más abajo — dos bugfixes de backend distintos
resueltos en la misma rama frontend porque llegaron juntos).

Este era exactamente el pedido que le habíamos hecho a backend al construir
`HU-8.4`/`HU-8.5` (ver la limitación de "90 días" que documentaba esta
misma sección antes de este bugfix): `GET /business/platform/metrics`
mezclaba dos responsabilidades — listar/gestionar negocios (no debería
depender de actividad reciente) y métricas agregadas de la plataforma (sí
depende, correctamente, de un rango de fechas). Un negocio sin turnos en el
rango elegido desaparecía del listado sin importar los demás filtros —
justo los negocios que más hace falta encontrar para suspender/reactivar
(nuevo sin actividad, inactivo hace tiempo, suspendido desde hace rato).

### Qué cambió

`GET /business/platform/metrics` volvió a su shape simple: sin filtros de
negocio, `range.topBusinesses` (top 5 fijo por turnos) en vez de
`range.businesses` paginado. `GET /business` (nuevo) es el directorio real
— mismos filtros que tenía el endpoint viejo (`organizationId`,
`categoryId`, `status`, `subscriptionPlan`, `subscriptionStatus`, orden,
paginación), pero consultando `Business` directo, sin pasar por `Turn` —
un negocio aparece tenga o no actividad. `sortBy` cambió de
`turnCount`/`businessName` a `businessName`/`createdAt` (ya no hay
`turnCount` por fila, ese dato es exclusivo de `topBusinesses` ahora).

### Impacto en el frontend

- `backofficeApi.js`: `getPlatformMetrics()` perdió sus params de
  filtro/orden/paginación; `listBusinesses()` (nuevo) pega contra
  `GET /business`.
- `BusinessMetricsTable.jsx` ("Negocios"): pasa a usar `listBusinesses()`.
  Se sacaron los filtros de fecha (`Desde`/`Hasta`, ya no aplican) y la
  columna de turnos por fila se reemplazó por la fecha de alta
  (`business.createdAt`). El resto (filtros de estado/categoría/plan/estado
  de suscripción, suspender/reactivar) sigue igual.
- `PlatformStatsHeader.jsx` ("Inicio"): ahora también muestra "Negocios más
  activos" (`range.topBusinesses`) al lado de "Rubros con más demanda" —
  antes ese dato ni se pedía porque `PlatformStatsHeader` llamaba
  `getPlatformMetrics({ pageSize: 1 })` solo para minimizar el payload del
  shape viejo; con el shape nuevo, `topBusinesses` viaja siempre y es gratis
  mostrarlo.
- `SubscriptionsList.jsx` ("Suscripciones"): pasa a agrupar por
  organización sobre `listBusinesses()` en vez de `getPlatformMetrics()` —
  ver nota en la sección de Suscripciones más arriba.
- Se eliminó `src/features/backoffice/utils/dateRange.js` (`daysAgoISO`) —
  quedó sin usar en ningún lado tras sacar los filtros de fecha de
  "Negocios" y "Suscripciones".

### Cobertura

- `cypress/e2e/backoffice-metrics.cy.js`, `backoffice-businesses.cy.js`,
  `backoffice-subscriptions.cy.js` — actualizados contra el nuevo contrato
  (`GET /business` en vez de `range.businesses`, `topBusinesses` en el
  dashboard).

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.
