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
