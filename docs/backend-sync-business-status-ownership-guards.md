# Sync con backend — Guards de `business.status` y ownership en `ServiceWindow`

Fecha: 2026-08-10. Dos bugfixes en `espera-back` (ramas `bugfix/service-window-ownership-check` y `bugfix/business-status-guards`, ambas mergeadas a `develop`). Este doc explica qué cambió, por qué, y qué necesita el panel para no romperse ni confundir al usuario.

## Cómo llegamos a esto

No arrancó como una auditoría de seguridad — arrancó como una pregunta puntual: *"¿revisás la creación automática de la cola al aprobar el negocio?"* (`ApproveBusinessUseCase`). Al mirar esa única función encontramos que su guard (`business.status === "approved"` bloquea solo lo ya aprobado) dejaba pasar un caso raro: re-aprobar un negocio **suspendido**, saltando el flujo real de reactivación.

Eso llevó a preguntar lo mismo de todos los use cases vecinos: *¿qué más confía solo en "sos el dueño" sin preguntar si el negocio puede operar?* La respuesta fue: casi todo el panel. Y en el camino apareció algo peor y de otra naturaleza en `ServiceWindow` — ni siquiera había chequeo de ownership, no solo de estado.

## Qué cambió — dos fixes distintos

### 1. Ownership en `ServiceWindow` (agujero de seguridad real)

Antes: `POST/PATCH/PATCH.../DELETE /api/queue/:queueId/windows*` solo estaban protegidas por el permiso de rol genérico `queue:configure` — **cualquier `business_admin` autenticado podía mutar ventanillas de un negocio que no era el suyo**, con solo saber o adivinar un `queueId`/`windowId` ajeno. No había ningún cross-check contra el negocio del usuario.

Ahora: los 4 endpoints devuelven `403 BUSINESS_OWNERSHIP_REQUIRED` si el `queueId`/`windowId` no pertenece a un negocio del usuario autenticado. El contrato de request/response no cambió — nada que ajustar salvo manejar ese código de error si no se manejaba ya genéricamente.

### 2. `business.status` faltante en casi todo el panel

Antes: salvo sacar un turno, **ninguna otra acción del panel verificaba si el negocio podía operar** — solo si el usuario era el dueño. Un negocio `pending` (nunca revisado), `rejected`, o `suspended` podía seguir invitando empleados, generando QR, configurando horarios/ventanillas, cambiando su estado operativo, y creando colas nuevas, sin ningún aviso.

Ahora, estos endpoints devuelven `409 BUSINESS_NOT_OPERATING` si `business.status !== "approved"`:

```text
POST   /api/business/:businessId/employees/invitations
POST   /api/business/employee-invitations/:token/accept   (re-chequea en el momento de aceptar, no solo al invitar)
GET    /api/business/:businessId/qr
POST   /api/business/:businessId/qr/regenerate
PUT    /api/business/:businessId/hours
PUT    /api/business/:businessId/service-windows
PATCH  /api/business/:businessId/operational-status
POST   /api/business/:businessId/queues
```

`GET /api/qr/:token` (el resolver público que corre al escanear el QR físico, sin login) es distinto — usa `409 BUSINESS_NOT_ACCEPTING_CUSTOMERS` en vez de `BUSINESS_NOT_OPERATING`, porque es cliente-facing, no panel-facing.

`PATCH /api/business/:businessId/approve` (Backoffice) ahora también puede devolver `409 BUSINESS_SUSPENDED_USE_REACTIVATE` si se intenta aprobar un negocio suspendido — el flujo correcto es `PATCH /:businessId/reactivate`.

## Qué quedó deliberadamente afuera (no son bugs)

- `DELETE /api/business/:businessId/employees/:userId` (revocar) — sigue funcionando siempre, incluso con el negocio suspendido/rechazado. Revocar acceso es una acción que siempre debería poder hacerse.
- `PATCH /api/business/:businessId/profile` — sigue editable en estado `rejected`, a propósito: el dueño necesita poder corregir los datos que motivaron el rechazo antes de volver a pedir aprobación.

## Qué necesita el panel

1. **Manejar `409 BUSINESS_NOT_OPERATING`** en las pantallas de: invitar empleados, QR (ver/regenerar), horarios, ventanillas, estado operativo, crear cola. Mensaje sugerido: algo como *"Este negocio no está operando actualmente"* — no es un error de validación de formulario, es de estado de cuenta.
2. **Manejar `409 BUSINESS_NOT_ACCEPTING_CUSTOMERS`** en la web liviana / resolución de QR público — hoy ese flujo podía llegar hasta el final (elegir turno) y recién ahí fallar; ahora corta antes, con oportunidad de mostrar un mensaje más claro al cliente en vez de un error genérico de creación de turno.
3. Lo más importante en términos de UX: **si el panel ya oculta o deshabilita estas acciones cuando el negocio no está `approved`** (por ejemplo, mostrando el negocio en modo "solo lectura" mientras está `pending`/`suspended`), es probable que esto no cambie nada visible — el backend ahora simplemente refuerza en el servidor una regla que quizás el panel ya aplicaba de forma optimista en el cliente. Si el panel **no** hacía ese chequeo del lado cliente, ahora es el momento de agregarlo, porque el usuario va a empezar a ver estos `409` donde antes la acción "funcionaba" (aunque no debiera).
4. No hay cambios de contrato en las respuestas exitosas — solo se agregan nuevos casos de error a rutas que ya existían.

## Referencia técnica completa

Detalle línea por línea de cada use case tocado, tests y decisiones de diseño: `espera-back/docs/epica-2-gestion-negocios.md` (sección *"Bugfix - business.status faltante en flujos del panel"*) y `espera-back/docs/epica-3-cola.md` (sección *"Refinamiento — Ownership en CRUD de ventanillas"*).
