# Épica 4 - Canales de Entrada

## Resumen

Formas de entrar a la cola además del flujo principal de la app (Épica 3).
Del lado de `espera-front`, la única superficie nueva es **HU-4.2**: una
web ligera y pública para sacar turno sin tener la app instalada, entrando
desde el QR físico del negocio.

Contrato y reglas de negocio completos del lado backend:
`docs/epica-4-canales-entrada.md` en el repo de `espera-back`.

## Estado general

- Estado: `HU-4.2 implementada`.
- **HU-4.1** (escanear QR) y **HU-4.3** (turno manual desde el panel) ya
  estaban cubiertas — HU-4.1 por el resolver de QR (`docs/epica-2-gestion-negocios.md`)
  y HU-4.3 por `ManualTurnForm` (`docs/epica-3-cola.md`). Ninguna necesitó
  trabajo nuevo acá.
- **HU-4.4** (dispensador físico) bloqueada del lado backend — no hay nada
  que hacer en el frontend hasta que se defina el hardware.

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
