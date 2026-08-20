# Épica 3 - Cola (alcance panel)

## Resumen

El backend de Épica 3 (Cola) está `completo` — 12 historias, con tiempo real
vía Socket.IO. Este documento cubre únicamente la porción que le corresponde
al panel web de negocio (`espera-front`): las acciones que hace el
empleado/dueño sobre la cola. El resto de las historias de Épica 3
(HU-3.1, HU-3.3, HU-3.4, HU-3.5, HU-3.6) son del lado cliente final —
corresponden a mobile o a la entrada QR pública (`ResolveQrPage`), no a este
repo.

Tres historias de Épica 6 (Panel del Negocio) comparten pantalla con la cola
y su detalle técnico completo vive acá: `HU-6.1` (dashboard), `HU-6.4`
(historial) y `HU-6.5` (métricas). El resumen de Épica 6 como unidad —las 6
historias, incluida `HU-6.6`, UX mobile del panel— está en
`docs/epica-6-panel-del-negocio.md`.

## Estado general

- Estado: `completo` (alcance panel).
- Historias implementadas: `HU-6.1` (dashboard + llamar siguiente),
  `HU-3.8` (lista de turnos en tiempo real), `HU-3.9` (agregar turno
  manual), `HU-3.10` (cancelar desde panel), `HU-3.11` (iniciar/finalizar
  atención en dos etapas + gestión de ventanillas de servicio), `HU-6.4`
  (historial de turnos completados por día), `HU-6.5` (métricas
  comparativas día vs. día anterior).
- `HU-3.12` (jerarquía de prioridad) es puramente backend — el orden que
  devuelve `GET /queue/:queueId/turns` ya lo respeta, no requiere UI propia.

## Superficies involucradas

- Panel de negocios — única superficie de esta épica en este repo.

## Contratos principales de la épica (alcance panel)

```text
GET  /api/queue/:queueId/status         queue:read
GET  /api/queue/:queueId/turns          queue:read
POST /api/queue/turns/call-next         queue:call_next
POST /api/queue/:queueId/turns/manual   turn:create_manual
POST /api/queue/:queueId/turns/:turnId/cancel  turn:cancel_any
POST /api/queue/:queueId/turns/:turnId/attend  turn:attend  (called→attending→completed, ver HU-3.11)
GET  /api/queue/:queueId/windows        queue:read
POST /api/queue/:queueId/windows        queue:configure
PATCH /api/queue/:queueId/windows/:windowId/toggle  queue:configure
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
    estimatedWaitMinutes: number | null;
  }>;
};
```

`estimatedWaitMinutes` se agregó en un refinamiento posterior a la
implementación inicial de esta HU: la lista solo mostraba cuánto llevaba
esperando cada turno (`waitingMinutes`), no cuánto le faltaba. El backend
lo calcula por posición dentro de los `waiting` (respetando el orden de
prioridad ya aplicado a `items`), reusando `QueueWaitEstimateService` — el
mismo servicio que ya alimentaba el estimado agregado del dashboard
(`HU-6.1`). Es `null` para turnos `called` (ya en curso) y cuando no hay
ventanillas activas.

### Reglas de presentación

- El orden de la lista lo define el backend (prioridad + FIFO); el
  frontend no reordena ni reinterpreta `items`.

### Diferidos

- Ninguno — `HU-3.9`/`HU-3.10`/`HU-3.11` (agregar, cancelar, atender) ya
  están implementadas, ver más abajo.

### Validación

- Validado manualmente contra el backend real: dos turnos manuales cargados,
  lista los muestra en orden con `waitingMinutes: 0`; tras "Siguiente", el
  primero pasa a `status: called` en la misma consulta.
- Cypress: `cypress/e2e/business-queue.cy.js`. Ver también el bug de backend
  documentado en `HU-6.1` — la lista no se refresca sola cuando se agrega un
  turno nuevo, por la misma causa (falta el `emitter` en
  `CreateManualTurnUseCase`), aunque sí lo hace ante cualquier otra acción.

## HU-3.9 - Agregar turno manualmente

Story points: `3`.

Estado: `implementado`.

### Objetivo de experiencia

El empleado carga un turno para alguien sin la app (walk-in) escribiendo
solo un nombre, sin salir de la pantalla de cola.

### Pantallas / Rutas

Misma ruta que `HU-6.1`/`HU-3.8`, formulario arriba de la lista de turnos.

### Estados de UI

- `error` (validación cliente): nombre vacío.
- `error` (backend): por ejemplo negocio pausado/cerrado o no aprobado — el
  backend rechaza turnos manuales en esos casos.
- éxito: el formulario se limpia solo.

### Integración frontend

- `ManualTurnForm` remonta su propio subárbol vía un `key` incremental
  después de un submit exitoso, en vez de llamar `reset()` de
  react-hook-form. Se detectó en esta sesión que `reset()` no limpiaba el
  valor del input en este proyecto (build con React Compiler vía
  `reactCompilerPreset` en `vite.config.js`) — el mecanismo imperativo de
  RHF para inputs no controlados no estaba actualizando el DOM de forma
  confiable. Forzar un remount es más robusto porque no depende de esa
  imperatividad: un componente nuevo arranca con `defaultValues` limpio
  siempre.
- Usa `mutateAsync` + `try/catch` en vez de los callbacks `onSuccess`/`onError`
  de `mutate()`, para poder hacer `await` y decidir si limpiar el form solo
  cuando la mutación efectivamente resolvió bien.

### Contratos consumidos

```text
POST /api/queue/:queueId/turns/manual
```

### Datos enviados

```ts
type CreateManualTurnRequest = { guestName: string };
```

### Datos esperados

```ts
type CreateManualTurnResponse = {
  turnId: string;
  queueId: string;
  displayNumber: string;
  guestName: string;
  position: number;
};
```

### Diferidos

- El turno nuevo no aparece solo en la lista de otras pestañas/dispositivos
  mirando la misma cola — mismo bug de backend documentado en `HU-6.1`
  (`CreateManualTurnUseCase` no emite `queue:update`). En la pestaña que
  hizo el alta sí se ve, porque se invalida la query local al recibir la
  respuesta del `POST`.

### Validación

- Validado manualmente contra el backend real: alta de turno manual,
  aparece en `GET .../turns` con `priority: physical`, `status: waiting`.
- Cypress: `cypress/e2e/business-queue-turn-actions.cy.js` — validación de
  nombre vacío, alta exitosa con limpieza de formulario, error de backend.

## HU-3.10 - Cancelar turno desde el panel

Story points: `2`.

Estado: `implementado`.

### Objetivo de experiencia

El empleado cancela cualquier turno activo (esperando o ya llamado) desde
la lista, sin tener que preguntarle nada al cliente.

### Estados de UI

- botón de cancelar visible en toda fila, se deshabilita solo para esa fila
  mientras la cancelación está en curso (no bloquea el resto de la lista).
- `error`: mensaje inline con el motivo del backend (ej. turno que ya no
  se puede cancelar porque cambió de estado entre que se cargó la lista y
  se hizo click).

### Integración frontend

- `QueueTurnList` recibe `onCancel`/`onAttend`/`pendingTurnId` desde la
  página — sigue siendo un componente presentacional, no sabe nada de
  mutaciones ni de la API.
- `pendingTurnId` se calcula combinando `cancelTurnMutation` y
  `attendTurnMutation` (`variables` de la que esté `isPending`), para
  deshabilitar el botón correcto sin necesitar estado local extra en la
  lista.

### Contratos consumidos

```text
POST /api/queue/:queueId/turns/:turnId/cancel
```

### Datos esperados

```ts
type CancelTurnByEmployeeResponse = { cancelled: true; turnId: string };
```

### Validación

- Validado manualmente contra el backend real: turno en `waiting`
  cancelado, desaparece de `GET .../turns`.
- Cypress: `cypress/e2e/business-queue-turn-actions.cy.js`.

## HU-3.11 - Marcar turno como atendido

Story points: `1`.

Estado: `implementado` (refinado — ver más abajo).

### Objetivo de experiencia

El empleado cierra el ciclo de un turno ya llamado, marcándolo atendido
para que salga de la cola activa.

### Refinamiento: estado intermedio `attending` + ventanillas de servicio

El flujo original (`called` → `completed` en un solo paso) no distinguía
"lo llamé" de "lo estoy atendiendo ahora mismo", lo que hacía imposible
medir la duración real de atención o saber desde qué ventanilla se atendió
a alguien. A pedido del negocio se amplió a un flujo de dos etapas:

```
waiting → called → attending → completed
                              ↘ cancelled (en cualquier punto previo a completed)
```

El mismo endpoint `POST /api/queue/:queueId/turns/:turnId/attend` maneja
ambas transiciones según el estado actual del turno:

- `called → attending`: primera llamada, body opcional `{ serviceWindowId? }`.
- `attending → completed`: segunda llamada, sin body.

```ts
type AttendTurnResponse = {
  turnId: string;
  status: "attending" | "completed";
  startedAttentionAt?: string; // presente cuando status === "attending"
  attendedAt?: string;         // presente cuando status === "completed"
};
```

`GetQueueStatusUseCase` ahora también devuelve `attendingCount` junto a
`waitingCount`/`calledCount`. El promedio de servicio usado para estimar
tiempos de espera (`getAverageServiceMinutes`) se calcula con
`attendedAt - startedAttentionAt` (duración real de atención, sin el
tiempo de reacción del cliente) sobre una ventana móvil de 7 días.

Además se agregó la entidad `ServiceWindow` (ventanilla de atención),
para poder identificar desde qué puesto se atiende a cada turno y
diferenciar tipos de ventanilla:

```ts
type ServiceWindowType = "cashier" | "customer_service" | "information" | "admin" | "technical";

interface ServiceWindow {
  id: string;
  queueId: string;
  name: string;
  type: ServiceWindowType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

```text
GET  /api/queue/:queueId/windows
POST /api/queue/:queueId/windows            body: { name, type? } (default "cashier")
PATCH /api/queue/:queueId/windows/:windowId/toggle
```

Frontend: `ServiceWindowManager.jsx` (crear + activar/desactivar
ventanillas) vive en la misma página de cola, a la derecha del listado de
turnos. Al iniciar atención de un turno `called`, `QueueTurnList.jsx`
ofrece un `<select>` con las ventanillas activas (opcional — se puede
iniciar sin asignar ventanilla).

> Nota histórica: el tipo de ventanilla se definió primero como
> `"standard" | "priority" | "specialized"` y luego se corrigió a los
> valores reales de uso (`cashier`/`customer_service`/`information`/
> `admin`/`technical`) — si ves referencias a los valores viejos en
> commits anteriores, están obsoletas.

### Bug de backend encontrado durante la validación

La migración `20260729000000_attending_state` creó la columna nueva como
`started_attention_at` (snake_case) en SQL crudo, pero el campo en
`schema.prisma` es `startedAttentionAt` sin `@map(...)` (Prisma espera la
columna literalmente `"startedAttentionAt"`, igual que `calledAt`/
`attendedAt`/`cancelledAt` en el mismo modelo). Esto rompía con 500 tanto
`GET /queue/:queueId/status` como `GET /queue/:queueId/turns` en cuanto
tocaban el modelo `Turn`. Se reportó y se corrigió con una migración que
renombra la columna. Confirmado resuelto en local.

### Estados de UI

- Turnos `called` muestran un control "Iniciar atención" con `<select>`
  opcional de ventanilla activa.
- Turnos `attending` muestran un botón "Finalizar atención" (sin
  selector).
- El botón de cancelar (`X`) sigue disponible en cualquier estado previo a
  `completed`.
- Mismo patrón de `pendingTurnId` y error inline que `HU-3.10`.

### Contratos consumidos

```text
POST /api/queue/:queueId/turns/:turnId/attend
GET  /api/queue/:queueId/windows
POST /api/queue/:queueId/windows
PATCH /api/queue/:queueId/windows/:windowId/toggle
```

### Validación

- Validado manualmente contra el backend real: ciclo completo turno manual
  → cancelar uno → `call-next` sobre el otro → iniciar atención → finalizar
  atención → lista queda vacía.
- Cypress: `cypress/e2e/business-queue-turn-actions.cy.js` — cubre que el
  botón de iniciar atención solo aparece en `called`, que el de finalizar
  solo aparece en `attending`, selección de ventanilla, y errores de
  backend en ambas transiciones.

## Refinamiento: CRUD de ventanillas, ocupación y derivación entre ventanillas

Estado: `implementado`.

Ampliación del backend sobre `ServiceWindow` y el flujo de atención, sin HU
propia en el backlog — documentado acá por ser una extensión directa de
`HU-3.11`.

### Qué cambió

- **CRUD completo de ventanillas**: además de crear/activar/desactivar, ahora
  se puede **editar** (`PATCH /:windowId`, nombre/tipo, no toca `isActive`) y
  **eliminar** (`DELETE /:windowId`) una ventanilla desde la tab
  "Ventanillas" (`ServiceWindowManager.jsx`).
- **Ocupación validada**: antes se podía asignar dos turnos a la misma
  ventanilla sin aviso. Ahora:
  - Iniciar atención (`attend`) en una ventanilla ya ocupada → `409
    SERVICE_WINDOW_OCCUPIED`. El `<select>` de ventanilla en `called`
    (`StartAttentionControl`) marca como `disabled` las opciones ocupadas
    (con sufijo " (ocupada)"), usando `currentTurn` de `GET
    /:queueId/windows`.
  - Desactivar o eliminar una ventanilla ocupada → `409
    SERVICE_WINDOW_IN_USE`. El diálogo de confirmación ya avisa si la
    ventanilla tiene alguien `currentTurn` antes de intentarlo.
- **Derivar un turno a otra ventanilla** (flujo nuevo): en `attending`, junto
  a "Finalizar" aparece un control "Derivar" (`RedirectControl` en
  `QueueTurnList.jsx`) con `<select>` de ventanillas activas (excluyendo la
  actual) + botón de confirmación. Llama a `POST
  /:queueId/turns/:turnId/redirect` con `{ targetServiceWindowId }`. A
  diferencia de `attend`, **no valida ocupación del destino** — el turno
  queda `redirected` ("En camino a {ventanilla}") hasta que el empleado
  destino lo retoma con el mismo botón "Atender" que usa `called` (ahí sí se
  valida ocupación).
- **Nuevo estado `redirected`**: se suma a `TurnStatus` en todos los mapas de
  labels/colores (`QueueTurnList`). Badge celeste (`bg-sky-50 text-sky-700`),
  distinto de los usados por `waiting`/`called`/`attending`.
- **`redirectedCount`** sumado a la fila de mini-stats de la tab "En vivo"
  (quedó en 5 columnas: en espera, llamados, atendiendo, derivados,
  ventanillas).
- **`activeServiceWindows` corregido**: ya no usa el contador legado del
  negocio (`HU-2.3`), refleja la cuenta real de `service_windows` activas —
  si el número mostrado en el dashboard cambió, es el fix esperado, no un
  bug.

### Traducción de errores del backend (código → español)

El backend ahora manda `code` en **todos** los `AppError` funcionales de
`queue`/`business` (antes solo `auth` lo hacía). En vez de tocar cada
pantalla que muestra `error.message`, el mapeo vive en un solo lugar:
`src/shared/api/apiError.js` — `ApiError` resuelve `.message` al texto en
español si conoce el `code`, y cae al mensaje crudo del backend si no lo
conoce. Ningún componente necesitó cambios para beneficiarse de esto; todos
ya leían `error?.message ?? 'fallback'`.

```js
// src/shared/api/apiError.js
const ERROR_CODE_MESSAGES = {
  QUEUE_NOT_FOUND: 'La cola no existe.',
  // ...resto de los códigos, ver el archivo
}
```

### Contratos consumidos (nuevos/ampliados)

```text
PATCH  /api/queue/:queueId/windows/:windowId          queue:configure
DELETE /api/queue/:queueId/windows/:windowId          queue:configure
POST   /api/queue/:queueId/turns/:turnId/redirect     turn:attend
```

### Diferidos

- `GET /:queueId/turns/my-turn` (estado propio del cliente final) no aplica
  a este repo — es de mobile/QR pública, no del panel de negocio.

### Validación

- Cypress: `cypress/e2e/business-queue-window-crud.cy.js` — derivar un turno
  (éxito + error `REDIRECT_SAME_WINDOW` traducido), editar ventanilla,
  eliminar ventanilla libre, error `SERVICE_WINDOW_IN_USE` traducido al
  eliminar una ocupada.
- No validado todavía contra el backend real (solo mocks) — pendiente correr
  el flujo completo con datos reales antes de cerrar esta refinamiento.

## HU-6.4 - Historial de turnos / HU-6.5 - Métricas de la cola

Story points: `2` + `2`.

Estado: `implementado`.

### Objetivo de experiencia

El dueño/empleado consulta, por día, qué turnos se completaron y cómo
rindió la cola (cuántos se cancelaron, tiempo promedio de atención, hora
pico), comparado contra el día anterior.

### Pantallas / Rutas

- `/panel/business/:businessSlug/queue/history` — nueva pantalla
  "Historial", con nav item propio en el panel (después de "Cola") y acceso
  rápido en Inicio.
- Selector de fecha (`<input type="date">`, tope en el día de hoy) que
  dispara ambas queries (métricas + historial) para la fecha elegida.

### Integración frontend

- `businessQueueApi.getMetrics(queueId, date)` → `GET /queue/:queueId/metrics?date=YYYY-MM-DD`.
- `businessQueueApi.getTurnHistory(queueId, date)` → `GET /queue/:queueId/turns/history?date=YYYY-MM-DD`.
- `date` es opcional en el backend (default: hoy UTC), pero el frontend
  siempre lo manda explícito para que quede consistente con lo que el
  selector muestra.
- `QueueMetricsSummary.jsx`: tabla comparativa fecha seleccionada vs. día
  anterior (completados, cancelados, total, tasa de cancelación, promedio
  de atención, hora pico).
- `QueueHistoryTable.jsx`: tabla de turnos `completed` de ese día (turno,
  persona, origen, hora de llamado, hora de atendido, minutos de espera).

### Contratos consumidos

```text
GET /api/queue/:queueId/metrics?date=YYYY-MM-DD
GET /api/queue/:queueId/turns/history?date=YYYY-MM-DD
```

### Datos esperados

```ts
interface DayMetrics {
  completedCount: number;
  cancelledCount: number;
  totalCount: number;
  cancellationRate: number; // porcentaje, ej. 20 = 20%
  avgServiceMinutes: number | null;
  peakHour: number | null; // hora UTC 0-23
}

interface GetQueueMetricsResponse {
  date: string; // YYYY-MM-DD
  today: DayMetrics;    // corresponde al `date` pedido, no necesariamente "hoy" real
  yesterday: DayMetrics; // `date` - 1 día
}

type TurnHistoryItem = {
  turnId: string;
  displayNumber: string;
  customerName: string | null;
  guestName: string | null;
  source: "app" | "manual" | "qr" | "web";
  priority: string; // ver nota de bug abajo
  createdAt: string;
  calledAt: string;
  attendedAt: string;
  waitMinutes: number; // createdAt → calledAt, no hasta attendedAt
};
```

El historial solo incluye turnos con `status: completed` de ese día — los
cancelados no aparecen en la tabla (sí se cuentan en las métricas, vía
`cancelledCount`).

### Bug de backend encontrado (no bloqueante, manejado defensivamente)

`GetTurnHistoryUseCase`/`PostgresTurnRepo.findHistoryByQueue` normaliza
`priority` con `.toLowerCase().replace("_", "-")`, convirtiendo
`IN_TRANSIT` → `"in-transit"` (guion), mientras que el resto del backend
(dominio `TurnPriority`, `GetQueueListUseCase`, etc.) usa `"in_transit"`
(guion bajo). El frontend normaliza el guion a guion bajo antes de buscar
la etiqueta (`QueueHistoryTable.jsx`, función `priorityLabel`), así que no
rompe nada, pero sería bueno que el backend lo alinee al resto del dominio.

### Validación

- Cypress: `cypress/e2e/business-queue-history.cy.js` — cubre la
  comparativa de métricas, la tabla de historial, cambio de fecha (vuelve a
  pedir ambos endpoints), estado vacío ("no hubo turnos completados este
  día") y errores de backend en ambos endpoints.
- No validado todavía contra el backend real con datos de un día completo
  (pendiente: correr el ciclo completo de turnos y confirmar métricas /
  historial con datos reales, no solo mocks).

## Refinamiento — Colas adicionales por plan (bugfix backend, 2026-08-08)

Rama: `feature/additional-queue-creation`.

El backend conectó `EnsureQueueCreationAllowedUseCase` (existía desde
Épica 2.5 pero nunca se llamaba desde ningún lado) a un endpoint real —
hasta ahora no había forma de crear una segunda `Queue` para un `Business`,
aunque la grilla de planes (`PLAN_LIMITS`) prometía varias desde el plan
Pro. Ver "Refinamiento — Crear colas adicionales" en
`docs/epica-3-cola.md` del backend.

### Pantalla / Ubicación

No es una pantalla nueva — se sumó como una tercera card en
`/panel/business/:businessSlug/operations` (`QueuesControl.jsx`), junto a
"Ventanillas activas" y "Estado operativo", que ya eran configuración de
negocio de baja frecuencia de uso. No justifica su propia entrada de
sidebar.

### Contrato backend usado

```text
GET  /api/business/:businessId/queues                  queue:read
POST /api/business/:businessId/queues   body: { name, prefix }   queue:configure
```

### Decisiones de implementación

**Alcance deliberadamente acotado a "crear/listar", no a "operar
multi-cola".** El panel de Cola/Historial (`useCurrentBusinessStore.activeQueueId`,
`BusinessQueuePage`, `businessQueueApi`) sigue asumiendo una sola cola por
negocio — cambiar eso es un cambio de arquitectura bastante más grande
(selector de cola activa, historial por cola, etc.) que el propio bugfix
del backend no pedía: solo conectó la creación al límite del plan. Crear
una segunda cola hoy la deja creada y lista en la base, pero el panel de
Cola/Historial va a seguir operando la primera (`activeQueueId`) hasta que
se aborde esa migración como su propio trabajo.

**`prefix` se normaliza a mayúsculas en el frontend antes de enviarlo** —
el backend igual lo normaliza, pero mandar ya en mayúsculas evita el viaje
de ida y vuelta si el usuario escribe en minúscula.

**Nuevos códigos de error mapeados**: `BUSINESS_OWNERSHIP_REQUIRED`,
`PLAN_QUEUE_LIMIT_REACHED`, `QUEUE_PREFIX_ALREADY_IN_USE`.

### Cobertura

- `cypress/e2e/business-operations.cy.js` — casos nuevos: listar colas
  existentes, crear una adicional, traducir el error de límite de plan.

No pude correr la suite en este entorno (Cypress no levanta su binario de
Electron acá); verificado por lint + build + lectura de código.

## Bugfix — límite de ventanillas por fila según el plan (2026-08-07, backend)

Rama frontend: `bugfix/service-window-plan-limit`.

El backend sumó un tercer eje a `PLAN_LIMITS` — ventanillas por `Queue`
(Basic 1, Pro 3, Premium 20, tope duro incluso en el plan "sin límite" real
por las dudas). Nuevo `403 PLAN_SERVICE_WINDOW_LIMIT_REACHED`, en dos
lugares: el CRUD real de ventanillas (`POST /queue/:queueId/windows` →
`ServiceWindowManager.jsx`, tab "Ventanillas" de Cola) y el contador legado
(`PUT /business/:businessId/service-windows` → `ServiceWindowsControl.jsx`,
en "Operación") — el backend cerró ahí un bypass real: antes ese segundo
camino no tenía límite relacionado al plan y podía esquivar el del CRUD
real.

**Único cambio: mapear el código nuevo.** Ambas pantallas ya mostraban
`mutation.error?.message` genéricamente, así que no hizo falta tocar UI —
alcanzó con agregar `PLAN_SERVICE_WINDOW_LIMIT_REACHED` a `apiError.js`.

### Cobertura

- `cypress/e2e/business-queue-window-crud.cy.js` — caso nuevo: crear una
  ventanilla cuando se alcanzó el límite del plan muestra el mensaje
  traducido.
- `cypress/e2e/business-operations.cy.js` — caso nuevo: mismo error desde
  el contador legado de "Operación".

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

### Aviso cuando un negocio ya está por encima del límite de su plan

Verificando este bugfix contra datos reales de la base local (consulta de
solo lectura, sin tocar `espera-back`) encontré un negocio (plan `basic`,
límite 1 ventanilla por cola) con **3 ventanillas activas** en una sola
cola — por diseño, el límite solo se aplica hacia adelante (al crear), no
hay nada retroactivo que toque filas ya existentes, así que ese negocio
sigue operando normal, solo no puede agregar una 4ª. El problema es que
**nada en el panel avisaba esto** — el dueño se enteraría recién al
intentar crear una ventanilla nueva y chocar con el 409.

**`PLAN_LIMITS` se duplicó en el frontend** (`src/shared/business/planLimits.js`,
`getPlanLimit(plan)`) — no existe ningún endpoint que exponga la grilla de
planes, así que es un espejo manual del `PlanLimits.ts` del backend,
documentado como tal (hay que mantenerlo sincronizado a mano si cambia el
grid). Se usa **solo para avisar en la UI**, nunca para bloquear — la
única fuente de verdad de la regla sigue siendo el backend.

- `useCurrentBusinessStore` gana el campo `plan` (ya viajaba en
  `GET /business/me`, simplemente no se guardaba).
- `<PlanLimitExceededNotice>` (nuevo, `shared/ui/`) — banner de aviso
  reusado en dos lugares: `ServiceWindowManager.jsx` (ventanillas de la
  cola actual vs. `maxServiceWindowsPerQueue`) y `QueuesControl.jsx`
  (colas del negocio vs. `maxQueuesPerBusiness`). No bloquea nada —
  el negocio sigue operando con lo que ya tiene, el aviso es solo
  informativo ("no vas a poder crear otra hasta reducir la cantidad o
  cambiar de plan").
- El conteo espeja exactamente el criterio del backend (total de filas,
  activas o no — ver también la sección de arriba sobre si eso debería
  contar solo activas, pendiente de confirmar con backend).

#### Cobertura

- `cypress/e2e/business-queue-window-crud.cy.js` — caso nuevo: el fixture
  base (2 ventanillas, plan basic) muestra el aviso.
- `cypress/e2e/business-operations.cy.js` — caso nuevo: un negocio con 2
  colas en plan basic (límite 1) muestra el aviso.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

## Bugfix — cierre del modelo dual de ventanillas (2026-08-10, backend)

Rama frontend: `bugfix/remove-legacy-service-windows-control`.

El backend cerró en dos fases el gap que ya venía documentado como
conocido (HU-6.3): el contador legado `Business.activeServiceWindows`
convivía con el CRUD real de `ServiceWindow`. Fase A hizo que toda `Queue`
nueva (al aprobar el negocio, o al crear una adicional) nazca con al menos
una `ServiceWindow` real automática. Fase B, con eso garantizado, eliminó
por completo el camino legado: `PUT /business/:businessId/service-windows`,
`ConfigureBusinessServiceWindowsUseCase`, y la columna
`Business.activeServiceWindows` en sí.

**El contrato de lectura no cambió** — `activeServiceWindows` sigue
viajando en `GET /business/me`, `GET /queue/:id/status`, etc., con el
mismo shape de siempre, solo que ahora sale del conteo real de
`ServiceWindow` de la `Queue` activa en vez de la columna borrada. Por eso
del lado frontend **no hizo falta tocar nada que solo lee ese campo**
(`useCurrentBusinessStore`, el mini-stat de `BusinessQueuePage.jsx`) — el
único cambio real fue eliminar todo lo que escribía por el camino viejo:
`ServiceWindowsControl.jsx` (la card "Ventanillas activas" de
`/panel/business/:businessSlug/operations`), su método en
`businessOperationsApi.js`, su schema, y los 4 tests de Cypress que
dependían del `PUT` ya inexistente. Detalle completo en
`docs/epica-2-gestion-negocios.md`, sección *"Superseded"* al final de
`HU-2.3`.

Con esto, el CRUD real (`ServiceWindowManager.jsx`) queda como el único
camino para gestionar ventanillas — resuelve de raíz la pregunta que le
había mandado a backend sobre el "modelo dual" (ya no hay dos modelos que
puedan desincronizarse).

### Cobertura

- `cypress/e2e/business-operations.cy.js` — reescrito: se sacaron los 4
  casos del contador legado, quedan estado operativo + colas.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

## Refinamiento — Pulido de UI en vivo en el Cola del panel (2026-08-18)

Motivado por el trabajo de `HU-4.2` (web ligera): se armó ahí un
`LiveIndicator` (punto pulsante violeta) y transiciones animadas al cambiar
un número en pantalla, y se llevó ese mismo pulido — solo el movimiento, no
la paleta oscura/gradiente del hero de login — al panel, empezando por
`BusinessQueuePage.jsx` (Cola), la pantalla con datos realmente en vivo vía
`useQueueRoom` (Socket.IO).

- `<LiveIndicator />` (`shared/ui/`, extraído de lo que antes era un
  `LiveDot` duplicado en las dos páginas de HU-4.2) al lado de "Personas
  esperando".
- El número grande de "Personas esperando" anima con `AnimatePresence`
  (fade + slight rise) cada vez que cambia — antes saltaba de golpe con
  cada actualización del socket.

**Deliberadamente acotado a esta pantalla por ahora.** El resto del panel
(Perfil, Horarios, Empleados, Backoffice) son pantallas de configuración,
no de datos en vivo — meter un punto pulsante ahí sería decorativo, no
informativo, y rompería la regla que el propio componente documenta
("nunca decorativo"). Si se suma otra pantalla con datos realmente en vivo
más adelante, este es el patrón a reusar.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código, y confirmando que ningún
test existente afirma sobre el dígito literal renderizado en el hero
(solo sobre el resto del texto alrededor, que no cambió).

## Bugfix — reconciliación con "restricciones de cola y planes" (2026-08-20, backend)

Rama backend `bugfix/restricciones-cola-y-planes` (ver `docs/epica-3-cola.md`
y `docs/epica-2-5-cuentas-organizaciones.md` en `espera-back`) agregó
validaciones que faltaban del lado del servidor. La mayoría son internas
(occupancy checks, índice único en DB) y no requieren nada acá, pero tres sí:

1. **Tres códigos de error nuevos, sin mapear**: `QUEUE_NO_TURN_READY`
   (llamar siguiente cuando lo único pendiente es una reserva telefónica que
   no llegó a su ETA), `SERVICE_WINDOW_REQUIRED` (atender sin ventanilla en
   una cola que sí tiene activas) y `BUSINESS_OUTSIDE_OPERATING_HOURS`
   (sacar turno —QR/web ligera, pública— fuera del horario configurado del
   negocio). Agregados a `shared/api/apiError.js`.
2. **`SUBSCRIPTION_INACTIVE` con mensaje desactualizado**: el texto decía
   "no podés crear un negocio nuevo", pero ese código ahora también lo tiran
   crear una cola o una ventanilla, no solo un negocio. Generalizado a "Tu
   suscripción está vencida o cancelada." sin mencionar la acción específica.
3. **Gap real en `StartAttentionControl`** (`QueueTurnList.jsx`): dejaba
   mandar "Iniciar" sin elegir ventanilla (opción "Sin ventanilla" siempre
   presente, botón nunca deshabilitado por selección faltante) aunque la
   cola tuviera ventanillas activas — exactamente el caso que el nuevo
   `400 SERVICE_WINDOW_REQUIRED` rechaza. Corregido: si hay ventanillas
   activas, "Sin ventanilla" desaparece y "Iniciar" queda deshabilitado
   hasta elegir una. `RedirectControl` ya exigía selección, no necesitó
   cambios.

`QUEUE_NO_TURN_READY` en la práctica es difícil de disparar desde la UI hoy:
el fix de backend que excluye reservas no vigentes de `waitingCount` ya deja
"Llamar siguiente" deshabilitado en ese escenario. Se mapeó igual como
resguardo ante alguna carrera.

### Cobertura

- `cypress/e2e/business-queue-turn-actions.cy.js` — nueva aserción: el botón
  "Iniciar" arranca deshabilitado con una ventanilla activa configurada, y
  se habilita recién al elegir una (test existente actualizado en
  consecuencia, ya que antes hacía click sin seleccionar).

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

## Bugfix — reconciliación con el estado `no_show` (2026-08-20, backend)

Backend agregó `TurnStatus.no_show` (ver `docs/epica-3-cola.md` en
`espera-back`, sección "estado no_show") para distinguir un turno llamado
que nunca se presentó de uno realmente atendido — antes ambos quedaban como
`completed`. El propio doc de backend marcó como pendiente que el panel no
distinguía esto visualmente; se cerró acá:

- `QueueHistoryTable.jsx` — nueva columna/tag "Estado" (Completado /
  Cancelado / No se presentó) en vez de mostrar los tres iguales. De paso,
  `formatTime()` ya no le pasa `null` a `new Date()` (resolvía silenciosamente
  al 1/1/1970 y mostraba una hora inventada) — un turno cancelado antes de
  ser llamado o sin `attendedAt` ahora muestra "—".
- `QueueMetricsSummary.jsx` — nuevas filas `noShowCount`/`noShowRate`
  ("No se presentaron" / "Tasa de no-show"), mismo patrón que las de
  cancelación. Sin esto, `totalCount` (que el backend redefinió como
  `completed + cancelled + no_show`) iba a subir sin que se viera de dónde
  sale ese número.

### Cobertura

- `cypress/e2e/business-queue-history.cy.js` — fixtures con turnos
  `no_show` y `cancelled` sin `calledAt` (nunca llamado); aserciones sobre
  los tags de estado por fila y sobre "— → —" en vez de una hora inventada.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

## Reconciliación — activar/desactivar cola y fairness del no_show (2026-08-20, backend)

Dos commits de backend (rama `bugfix/queue-activation-toggle`, ver
`docs/epica-3-cola.md` en `espera-back`), ambos con acción del lado del
panel:

**Activar/desactivar cola** — pedido explícito nuestro (ver
`prompt-backend-gestion-colas.md`). Nuevo contrato:
`PATCH /business/:businessId/queues/:queueId/toggle` → `Queue` actualizada.
`QueuesControl.jsx`: el badge estático "Activa"/"Inactiva" pasó a ser un
botón, mismo patrón visual que ya usa `ServiceWindowManager` para
ventanillas. Replica del lado del cliente la regla del backend (no se
puede desactivar la única cola activa del negocio, `409
QUEUE_LAST_ACTIVE`): el botón queda deshabilitado de entrada en ese caso,
en vez de dejar que el empleado lo intente y se lo rechacen. Sin diálogo de
confirmación — a diferencia de ventanillas, desactivar una cola no
interrumpe a nadie ya en la fila (`isActive` solo bloquea turnos *nuevos*),
así que no hay nada arriesgado que confirmar.

**Fairness del no_show** — a raíz de la charla sobre si "Llamar siguiente"
debería bloquear cuando el turno anterior sigue `called`. Backend encontró
un hueco relacionado pero distinto: si ninguna ventanilla estuvo libre
todavía para el turno `called` vigente, `CallNextUseCase` ahora rechaza en
vez de marcarlo `no_show` (`409 QUEUE_NO_WINDOW_AVAILABLE`) — no tiene
sentido llamar a un tercero cuando el segundo ni siquiera tuvo dónde ir.
Mapeado el código nuevo en `shared/api/apiError.js`; no hizo falta tocar
`BusinessQueuePage.jsx`, el mensaje ya sale por el mismo
`callNextMutation.error?.message` que muestra cualquier otro rechazo de
"Llamar siguiente".

**Todavía sin resolver** (marcar "ausente" como acción explícita en vez de
automática al pisar el turno llamado, ver
`prompt-backend-marcar-ausente-explicito.md`) — ninguno de estos dos
commits lo cubre; sigue pendiente del lado de backend.

### Cobertura

- `cypress/e2e/business-operations.cy.js` — desactivar una cola que no es
  la única activa, botón deshabilitado cuando sí lo es, y el caso de
  carrera entre pestañas (backend rechaza aunque el cliente no lo veía
  venir).

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

## Reconciliación — no_show como acción explícita (2026-08-20, backend)

Backend implementó exactamente lo pedido en
`prompt-backend-marcar-ausente-explicito.md` (rama
`bugfix/no-show-accion-explicita`, ver `docs/epica-3-cola.md` en
`espera-back`): "Llamar siguiente" ya no marca `no_show` automáticamente
al turno `called` vigente — ahora bloquea con `409 TURN_STILL_CALLED`
hasta que ese turno se resuelva a propósito, atendiéndolo o marcándolo
ausente. Nuevo contrato: `POST /queue/:queueId/turns/:turnId/no-show` →
`{ turnId, status: "no_show", noShowAt }`.

Backend también resolvió la pregunta abierta que dejé en el prompt (¿el
chequeo de fairness de `397c90f` — si la ventanilla nunca estuvo libre —
se traslada al endpoint nuevo?): decidió que no, a propósito. Ese chequeo
existía para que el *sistema* no castigara a alguien por un disparador
mecánico ciego; una vez que es el empleado quien decide explícitamente
"esta persona no está", ya tiene mejor información que la heurística.
Como consecuencia, `QUEUE_NO_WINDOW_AVAILABLE` (que había mapeado en
`apiError.js` al reconciliar `397c90f`) quedó muerto — nunca se dispara —
y se reemplazó por `TURN_STILL_CALLED`/`TURN_NOT_CALLED`.

### Cambios

- `businessQueueApi.markNoShow(queueId, turnId)` — nuevo.
- `QueueTurnList.jsx` — botón "Marcar ausente" junto a "Iniciar atención"
  para cualquier turno `called`.
- `BusinessQueuePage.jsx` — `markNoShowMutation` + `ConfirmDialog` (mismo
  patrón que "Cancelar turno": confirmación antes de la acción, ya que es
  justo el punto de este cambio — que sea deliberado, no accidental).
  "Llamar siguiente" ahora se deshabilita también cuando
  `calledCount > 0` (no solo cuando `waitingCount === 0`), con el texto
  del botón cambiando a "Resolvé el turno llamado" — mismo criterio que
  ya usamos para el toggle de "última cola activa": bloquear en la UI en
  vez de dejar que el empleado choque con el 409.
- `shared/api/apiError.js` — `QUEUE_NO_WINDOW_AVAILABLE` reemplazado por
  `TURN_STILL_CALLED` y `TURN_NOT_CALLED`.

### Cobertura

- `cypress/e2e/business-queue-turn-actions.cy.js` — marcar ausente con
  confirmación, error de backend traducido (`TURN_NOT_CALLED`), y
  "Llamar siguiente" deshabilitado con `calledCount: 1` (el fixture por
  defecto de este archivo).

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.
