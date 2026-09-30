# Épica 4 - Canales de Entrada

## Resumen

Formas de entrar a la cola además del flujo principal de la app (Épica 3).
Del lado de `espera-front`, la única superficie nueva es **HU-4.2**: una
web ligera y pública para sacar turno sin tener la app instalada, entrando
desde el QR físico del negocio.

Contrato y reglas de negocio completos del lado backend:
`docs/epica-4-canales-entrada.md` en el repo de `espera-back`.

## Estado general

- Estado: `HU-4.2 implementada`, `HU-4.5 implementada`.
- **HU-4.1** (escanear QR) y **HU-4.3** (turno manual desde el panel) ya
  estaban cubiertas — HU-4.1 por el resolver de QR (`docs/epica-2-gestion-negocios.md`)
  y HU-4.3 por `ManualTurnForm` (`docs/epica-3-cola.md`). Ninguna necesitó
  trabajo nuevo acá.
- **HU-4.4** (dispensador físico) bloqueada del lado backend — no hay nada
  que hacer en el frontend hasta que se defina el hardware.
- **HU-4.5** (reserva por teléfono/WhatsApp, piloto) — agregada fuera de
  backlog, ver sección al final. Extiende `ManualTurnForm`, no crea
  pantallas nuevas.

## Superficies involucradas

- pública, sin auth (`/q/*`) — nueva.

## HU-4.2 - Sacar turno sin tener la app instalada (web ligera)

Estado: `implementado`.

### Objetivo de experiencia

Alguien escanea el QR físico de un negocio sin tener la app instalada, ve
una web liviana con el nombre del negocio, pone su nombre y saca turno sin
cuenta ni login. Después ve su número y posición actualizarse solo, y un
aviso bien visible cuando lo llaman.

### Pantallas / Rutas

```text
/q/:token         (ResolveQrPage — ya existía como placeholder, se completó acá)
/q/turn/:turnId   (GuestTurnStatusPage — nueva)
```

Ambas públicas, bajo `PublicLayout` — sin `AuthLayout`, sin sesión.

### Contratos backend usados

```text
GET  /api/qr/:token                    público   (ya existía, sin cambios de contrato)
POST /api/queue/guest-turns            público, rate-limited (5/10min por IP)
  body: { businessId, guestName }  →  201 { turnId, queueId, displayNumber, position }
GET  /api/queue/guest-turns/:turnId    público, sin rate limit
  →  { turnId, queueId, displayNumber, status, position, estimatedWaitMinutes, serviceWindowId }
```

### Decisiones de implementación

**Reusa `AuthVisualScene` (el hero de dos columnas de login/register), no
`AuthFormShell`.** Primer intento usó el shell simple centrado (mismo que
verificar email / aceptar invitación de empleado) razonando que alguien
escaneando un QR está apurado y no necesita "pantalla de marketing" — el
usuario pidió explícitamente que se vea más parecido a login/registro,
llamativo pero liviano. `AuthVisualScene` en sí no es pesado (gradientes
CSS + un par de imágenes, nada de video/canvas) y en mobile el `decoration`
lateral ya está oculto (`hidden lg:block`), así que no le agrega peso a
quien realmente está en el celular — solo se nota en desktop.

**`QueueSignal` (el gráfico de 3 pasos animado del lado de `RegisterVisualScene`)
se extrajo a su propio archivo** (`features/auth/components/QueueSignal.jsx`)
para poder reusarlo acá con etiquetas propias ("Escaneás" / "Sacás turno" /
"Te llamamos") vía un nuevo `GuestVisualScene.jsx` (`features/business-qr/components/`)
— mismo patrón que `LoginVisualScene`/`RegisterVisualScene`, wrapper de
`AuthVisualScene` con `title`/`description`/`decoration` fijos para esta
superficie. `RegisterVisualScene` no cambió de comportamiento, solo de
dónde importa el componente.

**El copy del hero cambia con el estado del turno** en
`GuestTurnStatusPage` (`sceneCopyByStatus`) — "Ya estás en la fila." mientras
espera, "¡Es tu turno!" cuando lo llaman, etc. — para que el mensaje grande
de fondo refuerce lo mismo que ya dice la card, en vez de quedar genérico
todo el tiempo.

Import cruzado entre features (`business-qr` → `auth`), mismo patrón ya
establecido en el resto del código (`LoginPage` ya importa
`businessOnboardingApi`).

**Sin polling infinito.** `GuestTurnStatusPage` usa
`refetchInterval: (query) => query.state.data?.status === 'waiting' ? 6000 : false`
— deja de pedir en cuanto el turno sale de `waiting` (llamado, atendido,
cancelado). No hay ningún push/socket para el visitante anónimo (decisión
explícita del backend: sin dispositivo registrado, no hay canal), así que
polling acotado es la única opción razonable.

**"¡Es tu turno!" se muestra para `called` y `attending`**, no solo
`called` — desde la perspectiva del visitante ambos significan "andá para
el negocio ahora", la distinción entre "te llamaron" y "ya te están
atendiendo" no le aporta nada a alguien sin la app.

**`redirected` no se trata como "es tu turno".** El backend documenta que
`position: 0`/`estimatedWaitMinutes: 0` es igual para `called`/`attending`/
`redirected`, pero mostrarle "¡Es tu turno!" a alguien que en realidad está
siendo movido de ventanilla (sin que el visitante hiciera nada) sería
confuso — se le muestra en cambio "te estamos derivando, esperá el
llamado".

**El estado operativo del negocio se chequea antes de mostrar el
formulario**, no solo al enviarlo — `ResolveQrPage` ya tiene
`business.operationalStatus` de la respuesta de `GET /qr/:token`, así que
si está `paused`/`closed` se muestra el aviso y se oculta el formulario en
vez de dejar que el usuario lo complete y recién ahí reciba
`BUSINESS_OPERATIONAL_STATUS_BLOCKED` (ya mapeado, se mantiene como
resguardo si el estado cambia entre que se resolvió el QR y que se envía
el formulario).

**Nuevo código de error mapeado**: `RATE_LIMIT_EXCEEDED` (usado también,
en teoría, por otros endpoints con `rateLimiter`, pero nunca se había
necesitado traducir hasta ahora porque login/register tienen su propio
manejo específico de bloqueo).

### Cobertura

- `cypress/e2e/guest-turn-web.cy.js` — sacar un turno y ver el estado
  `waiting` con posición/estimado, negocio pausado oculta el formulario,
  QR inválido/vencido muestra error traducido, "¡Es tu turno!" en
  `called`, estado final en `completed`, turno inexistente muestra error.

No pude correr la suite en este entorno (Cypress no levanta su binario de
Electron acá); verificado por lint + build + lectura de código.

## Refinamiento — Cartel imprimible para el QR físico (2026-08-18)

`BusinessQrPage` (panel del negocio) solo ofrecía "Descargar PNG" del QR
pelado, sin marca ni instrucciones — el dueño tenía que armar el cartel
para pegar en el local por su cuenta. Se agregó un botón "Imprimir
cartel" que dispara `window.print()` sobre una vista dedicada
(`QrPosterPrint.jsx`), oculta en pantalla y mostrada solo vía
`@media print` (`.qr-poster-print` en `index.css`): fondo degradado
oscuro igual al de `/login` y la web ligera de HU-4.2 (mismo gradiente
de `AuthVisualScene`, pero estático — sin motion ni blur, que no aportan
nada en papel), título grande, nombre del negocio, el QR sobre una
tarjeta blanca (necesaria para el quiet zone y que escanee bien) y una
línea de instrucción. El resto del panel (sidebar, topbar) y el contenido
normal de la página (`.qr-page-screen-only`) se ocultan durante la
impresión para que solo salga el cartel.

No se agregó ninguna librería de PDF/canvas — es una vista HTML normal
que el navegador imprime directo; queda a criterio del usuario el diálogo
de impresión del navegador (tamaño de papel, orientación, "gráficos de
fondo" activado para que el degradado salga impreso).

## HU-4.5 - Reservar turno por teléfono/WhatsApp (piloto)

Estado: `implementada`. Contrato completo (prioridad, `queueJoinedAt`,
fairness) documentado en `docs/epica-4-canales-entrada.md` de
`espera-back` — acá solo lo que cambió del lado UI.

### Motivación

Validación con usuarios: solo usarían la app si les ahorra tiempo real, y
hasta esta historia el único flujo sin escanear en persona (HU-4.2, web
ligera) igual requiere estar parado en el local. La reserva por teléfono
es la única forma de ahorrarle tiempo real a alguien — llama o escribe
por WhatsApp, un empleado del local la carga, y la persona llega recién
cuando está por tocarle.

### Cambios

No se creó ninguna pantalla nueva — se extendió `ManualTurnForm`
(`src/features/business-queue/components/ManualTurnForm.jsx`), ya usado
para HU-4.3:

- Checkbox "Reserva por teléfono/WhatsApp" que revela dos campos
  opcionales: **Teléfono** (para que el empleado pueda volver a llamar) y
  **Minutos** (`etaMinutes`, "¿en cuánto dice que llega?", que el backend
  usa para no dejarla colarse en la cola frente a gente que se registra en
  vivo mientras tanto — ver `queueJoinedAt` en la doc de backend).
- Sin tildar el checkbox, el turno se manda igual que siempre
  (`source: "manual"`, sin `phone` ni `etaMinutes`) — cero cambio de
  comportamiento para el flujo de HU-4.3 existente.
- `QueueTurnList` (`src/features/business-queue/components/QueueTurnList.jsx`)
  ahora muestra el teléfono junto al nombre cuando existe, un tag
  "Reservado" para `source === "phone"`, y lee `waitingMinutes` negativo
  (turno con ETA que todavía no llegó) como "llega en ~X min" en vez de
  "esperando hace X min".
- `manualTurnSchema` (`src/features/business-queue/model/businessQueueSchemas.js`)
  y `businessQueueApi.createManualTurn` extendidos para los campos nuevos;
  este último pasó de recibir `guestName` suelto a recibir el objeto
  completo de valores (`BusinessQueuePage.jsx` actualizado en consecuencia).

**Refinamiento — sin cálculos de tiempo para el empleado.** Dos ajustes
separados, mismo motivo:

- El campo "Minutos" para `etaMinutes` era un número libre — obligaba al
  empleado a convertir mentalmente lo que dijo la persona por teléfono
  ("una hora y media" → 90). Se reemplazó por un campo "Hora de llegada"
  con `type="time"` — mismo control nativo que ya usa `WeeklyHoursEditor`
  para los horarios de atención — donde el empleado tipea la hora tal cual
  se la dijeron ("15:30"). `minutesUntil` (`shared/format/duration.js`)
  convierte esa hora a los `etaMinutes` que espera el backend justo antes
  de enviar el turno; si la hora ya pasó hoy, asume que es al día
  siguiente (reserva nocturna).
- `listQuery` en `BusinessQueuePage.jsx` ahora tiene `refetchInterval:
  30_000` — antes, los minutos por turno (`waitingMinutes`,
  `estimatedWaitMinutes`) solo se recalculaban cuando llegaba un evento de
  socket (turno creado/llamado/cancelado); entre eventos, el número
  quedaba clavado en pantalla aunque el reloj siguiera corriendo, y el
  empleado tenía que estimar cuánto había pasado desde la última vez que
  lo vio.
- Se agregó `src/shared/format/duration.js` (`formatMinutes`) para
  colapsar minutos crudos a días/horas/minutos en vez de mostrar números
  grandes sin formato (un turno de HU-3.9/historial atendido un día
  después, por ejemplo, mostraba "2054 min" en vez de "1d 10h"). Aplicado
  en `QueueHistoryTable`, `QueueTurnList` y el hero de `BusinessQueuePage`.

### Explícitamente fuera de alcance

Mismo alcance acotado que decidió backend: nada de horario/slot fijo,
nada de auto-detección de "no show" (se sigue resolviendo a ojo con
"Cancelar turno"), nada de integración con WhatsApp Business API — la
reserva la toma una persona del local, no un bot.

### Cobertura

- `cypress/e2e/business-queue-turn-actions.cy.js` — turno manual sin
  reserva sigue mandando `{ guestName, source: "manual" }` (se actualizó
  la aserción del body para incluir `source`, que antes no se enviaba);
  nuevo caso: tildar el checkbox, cargar teléfono y hora de llegada con
  `cy.clock()` fijado, y verificar que el POST manda
  `{ guestName, phone, source: "phone", etaMinutes }` con el número de
  minutos correcto ya calculado.
- `cypress/e2e/business-queue-history.cy.js` — un turno con `waitMinutes:
  2054` se muestra como "1d 10h", no como el número crudo.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.
