# Épica 3 - Cola (alcance panel)

## Resumen

El backend de Épica 3 (Cola) está `completo` — 12 historias, con tiempo real
vía Socket.IO. Este documento cubre únicamente la porción que le corresponde
al panel web de negocio (`espera-front`): las acciones que hace el
empleado/dueño sobre la cola. El resto de las historias de Épica 3
(HU-3.1, HU-3.3, HU-3.4, HU-3.5, HU-3.6) son del lado cliente final —
corresponden a mobile o a la entrada QR pública (`ResolveQrPage`), no a este
repo.

De Épica 6 (Panel del Negocio) también se cubre acá la parte que depende de
la cola: HU-6.1 (dashboard), HU-6.4 (historial) y HU-6.5 (métricas). HU-6.2
y HU-6.3 ya estaban cerradas en Épica 2 (`HU-2.5` y `HU-2.3`).

## Estado general

- Estado: `parcial`.
- Historias implementadas: `HU-6.1` (dashboard + llamar siguiente),
  `HU-3.8` (lista de turnos en tiempo real).
- Historias pendientes: `HU-3.9` (turno manual), `HU-3.10` (cancelar desde
  panel), `HU-3.11` (marcar atendido), `HU-6.4` (historial), `HU-6.5`
  (métricas).
- `HU-3.12` (jerarquía de prioridad) es puramente backend — el orden que
  devuelve `GET /queue/:queueId/turns` ya lo respeta, no requiere UI propia.

## Superficies involucradas

- Panel de negocios — única superficie de esta épica en este repo.

## Contratos principales de la épica (alcance panel)

```text
GET  /api/queue/:queueId/status         queue:read
GET  /api/queue/:queueId/turns          queue:read
POST /api/queue/turns/call-next         queue:call_next
POST /api/queue/:queueId/turns/manual   turn:create_manual   (pendiente de UI)
POST /api/queue/:queueId/turns/:turnId/cancel  turn:cancel_any  (pendiente de UI)
POST /api/queue/:queueId/turns/:turnId/attend  turn:attend      (pendiente de UI)
GET  /api/queue/:queueId/turns/history  queue:read            (pendiente de UI)
GET  /api/queue/:queueId/metrics        queue:read            (pendiente de UI)
```

Nota de contrato: la doc de backend (`epica-3-cola.md` en `espera-back`)
documentó originalmente estas rutas como `/api/queues/...` (plural); el
mount real en `app.ts` es `/api/queue` (singular), ya corregido en su doc.

## Infraestructura de tiempo real

Todas las acciones que modifican una cola emiten `queue:update` al room
`queue:{queueId}` vía Socket.IO. El frontend se conecta con
`useQueueRoom(queueId, onUpdate)` (`shared/queue/useQueueRoom.js`): abre un
socket a `env.socketUrl` (mismo origen que la API, sin el prefijo `/api`),
hace `socket.emit('queue:join', { queueId })` al conectar, y ejecuta
`onUpdate` en cada `queue:update` — sin interpretar el payload del evento
(varía por acción), simplemente invalida las queries de React Query
relevantes y deja que el próximo `GET` traiga el estado real.

No hay autenticación en el handshake del socket (`io.on('connection', ...)`
en el backend no valida JWT) — cualquiera que conozca un `queueId` puede
unirse a su room y recibir las actualizaciones. Riesgo de exposición menor
(solo se emiten contadores/turnos, no datos sensibles), documentado como
deuda conocida, no bloqueante para el alcance actual.

## HU-6.1 - Dashboard con estado de la cola en tiempo real

Story points: `5` (Épica 6).

Estado: `implementado`.

### Objetivo de experiencia

El empleado ve, apenas entra a "Cola", el estado operativo del negocio,
cuánta gente espera, cuántos turnos están llamados, cuántas ventanillas
activas y el tiempo estimado total — y puede llamar al siguiente turno sin
salir de la pantalla.

### Pantallas / Rutas

```text
/panel/business/:businessSlug/queue
```

### Estados de UI

- `empty` (sin cola): negocio sin `activeQueueId` — mensaje explícito de que
  se crea automáticamente al aprobarse el negocio.
- `loading` / `error` (status): mientras resuelve o si falla `GET .../status`.
- `success`: grilla de 4 métricas + tiempo estimado.
- botón "Siguiente" deshabilitado y renombrado a "Cola vacía" cuando
  `waitingCount === 0` (criterio explícito de `HU-3.7`).
- `error` / `success` (llamar siguiente): mensaje inline con el resultado de
  la mutación.

### Integración frontend

- `activeQueueId` se lee de `useCurrentBusinessStore` (alimentado por
  `GET /business/me`, campo agregado en un bugfix de backend específico
  para esto — ver `Decisiones de producto / alcance`).
- `useQueueRoom` invalida `['queue-status', activeQueueId]` en cada
  `queue:update`, así el dashboard se actualiza sin que el empleado dispare
  ninguna acción.
- `estimatedTotalWaitMinutes` puede ser `0` con `waitingCount = 0` (cola
  vacía, espera cero) — distinto de `null`, que representa "sin atención
  disponible" (`activeServiceWindows = 0`). El texto que se muestra depende
  de esa distinción, no de si es cero.

### Contratos consumidos

```text
GET  /api/queue/:queueId/status
POST /api/queue/turns/call-next
```

### Datos esperados

```ts
type QueueStatusResponse = {
  queueId: string;
  businessId: string;
  operationalStatus: 'normal' | 'delayed' | 'paused' | 'closed';
  activeServiceWindows: number;
  waitingCount: number;
  calledCount: number;
  estimatedTotalWaitMinutes: number | null;
};
```

### Decisiones de producto / alcance

Se detectó y resolvió, antes de esta HU, que no había ninguna forma de que
el frontend supiera el `queueId` de un negocio: ni `GET /business/me` lo
exponía, ni existía ningún flujo de creación de `Queue`. Se pidió al
backend (a) crear la cola automáticamente al aprobar el negocio
(`ApproveBusinessAccountUseCase`) y (b) exponer `activeQueueId` en
`GET /business/me`. Además, los negocios que ya estaban aprobados antes de
ese fix se quedaron sin cola — se pidió y se corrió un backfill
(`src/scripts/backfill-queues.ts` en `espera-back`) para crearles la cola
default retroactivamente.

### Bug de backend encontrado durante la validación (no bloquea esta HU)

Verificando que `queue:update` dispara el refetch en un navegador real (no
solo contra requests REST mockeadas), se confirmó con un cliente
`socket.io-client` en Node puro — sin frontend de por medio — que **crear un
turno no emite ningún evento**: `CreateTurnUseCase` y
`CreateManualTurnUseCase` ni siquiera aceptan un `emitter` en su
constructor, a diferencia de `CallNextUseCase`/`CancelTurnUseCase`/
`ConfirmTurnStatusUseCase`/`CancelTurnByEmployeeUseCase`/`AttendTurnUseCase`,
que sí lo reciben y emiten correctamente. Confirmado que "Siguiente" (que sí
usa `CallNextUseCase`) actualiza la pantalla sin recargar; un turno nuevo,
no. Reportado al equipo de backend (`prompt-backend-missing-emit-on-create-
turn.md`), sin resolver todavía. No bloquea esta HU porque el dashboard
igual se actualiza correctamente ante `call-next`/`cancel`/`attend`; el
único caso roto es específicamente la creación de un turno.

### Diferidos

- Ninguno del lado frontend — la integración está completa contra el
  contrato documentado. El bug de arriba es 100% backend.

### Validación

- Validado manualmente contra el backend real: negocio recién aprobado →
  cola creada automáticamente → `GET .../status` con contadores en cero →
  turno manual → `waitingCount: 1` → "Siguiente" → `waitingCount: 0`,
  `calledCount: 1`.
- Verificación de tiempo real con socket.io-client puro (sin React): confirma
  que el mecanismo (`queue:join` + escuchar `queue:update`) funciona para
  `call-next`, y no funciona para alta de turno (bug de backend arriba).
- Cypress: `cypress/e2e/business-queue.cy.js`, mismo spec cubre `HU-3.8`.

## HU-3.8 - Ver lista de turnos activos en tiempo real

Story points: `3`.

Estado: `implementado`.

### Objetivo de experiencia

El empleado ve, debajo del dashboard, la lista completa de turnos activos
(esperando y llamados) con nombre, prioridad y tiempo de espera — sin tener
que refrescar la página cuando cambia algo.

### Pantallas / Rutas

Misma ruta que `HU-6.1` (`/panel/business/:businessSlug/queue`), segunda
tarjeta de la misma pantalla.

### Estados de UI

- `empty`: "No hay turnos activos en este momento."
- `loading` / `error`: mismos estados que el resto de la pantalla.
- cada fila tiene un badge de estado distinto según `waiting`/`called`
  (violeta sólido para `called`, violeta suave para `waiting`).
- lista con scroll interno (`max-h-[420px]`) para no romper el layout de la
  página con muchos turnos.

### Integración frontend

- `QueueTurnList` (`features/business-queue/components/QueueTurnList.jsx`)
  es un componente puramente presentacional — recibe `items` y no sabe nada
  de la query ni del socket.
- El nombre a mostrar es `customerName ?? guestName ?? 'Sin nombre'`: un
  turno nunca tiene los dos a la vez (`customerName` viene del usuario
  logueado en la app, `guestName` de un turno manual cargado por el
  empleado), pero cubrir el caso `null`/`null` evita una fila vacía si
  alguna vez pasa.
- Comparte la misma suscripción `useQueueRoom` que `HU-6.1`: un solo socket
  por pantalla, invalida tanto `queue-status` como `queue-list` en cada
  evento.

### Contratos consumidos

```text
GET /api/queue/:queueId/turns
```

### Datos esperados

```ts
type QueueListResponse = {
  queueId: string;
  items: Array<{
    turnId: string;
    displayNumber: string;
    customerName: string | null;
    guestName: string | null;
    priority: 'arrived' | 'physical' | 'in_transit' | 'registered';
    status: 'waiting' | 'called';
    waitingMinutes: number;
  }>;
};
```

### Reglas de presentación

- El orden de la lista lo define el backend (prioridad + FIFO); el
  frontend no reordena ni reinterpreta `items`.

### Diferidos

- Acciones sobre cada turno (cancelar, marcar atendido) — `HU-3.10`/`HU-3.11`,
  siguientes historias.
- Agregar turno manual desde esta pantalla — `HU-3.9`.

### Validación

- Validado manualmente contra el backend real: dos turnos manuales cargados,
  lista los muestra en orden con `waitingMinutes: 0`; tras "Siguiente", el
  primero pasa a `status: called` en la misma consulta.
- Cypress: `cypress/e2e/business-queue.cy.js`. Ver también el bug de backend
  documentado en `HU-6.1` — la lista no se refresca sola cuando se agrega un
  turno nuevo, por la misma causa (falta el `emitter` en
  `CreateManualTurnUseCase`), aunque sí lo hace ante cualquier otra acción.
