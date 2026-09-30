# Épica 6 - Panel del Negocio

## Resumen

Cubre las herramientas que el dueño/empleado usa para operar el negocio desde
el panel web: dashboard de cola, ventanillas activas, estado operativo,
historial de turnos, métricas y experiencia mobile del panel. Es una épica
transversal — tres de sus seis historias comparten pantalla y fecha de cierre
con Épica 2 y Épica 3, así que este documento resume cada una y remite al
detalle técnico donde ya está escrito en vez de duplicarlo.

## Estado general

- Estado: `completo` — 6/6 historias, 19 puntos.
- Historias implementadas: `HU-6.1` (5 pts, dashboard), `HU-6.2` (2 pts,
  cerrada como `HU-2.5`), `HU-6.3` (2 pts, cerrada como `HU-2.3`), `HU-6.4`
  (3 pts, historial), `HU-6.5` (3 pts, métricas), `HU-6.6` (4 pts, UX mobile
  del panel).
- Historias diferidas: ninguna.

## Superficies involucradas

- panel (única superficie de esta épica).

## Contratos principales de la épica (alcance panel)

Ver el detalle completo de cada contrato en la historia correspondiente más
abajo; agrupados están en `docs/epica-3-cola.md` (`HU-6.1`/`6.4`/`6.5`) y
`docs/epica-2-gestion-negocios.md` (`HU-6.2`/`6.3`).

## HU-6.1 - Dashboard con estado de la cola en tiempo real

Story points: `5`.

Estado: `implementado`.

Comparte pantalla y ruta con `HU-3.8` a `HU-3.11` de Épica 3 — el detalle
completo (objetivo de experiencia, estados de UI, contratos, bug de backend
encontrado durante la validación) está documentado en
`docs/epica-3-cola.md`, sección `HU-6.1`.

## HU-6.2 - Cambiar estado operativo del negocio

Story points: `2`.

Estado: `implementado` — cerrada junto con `HU-2.5` (misma pantalla
`/panel/business/:businessSlug/operations`, mismo alcance). Ver
`docs/epica-2-gestion-negocios.md`, sección `HU-2.5`.

## HU-6.3 - Definir ventanillas o cajas activas

Story points: `2`.

Estado: `implementado` — cerrada junto con `HU-2.3` (misma pantalla
`/panel/business/:businessSlug/operations`, mismo alcance). Ver
`docs/epica-2-gestion-negocios.md`, sección `HU-2.3`.

## HU-6.4 - Historial de turnos / HU-6.5 - Métricas de la cola

Story points: `3` + `3`.

Estado: `implementado`.

Pantalla propia "Historial" (`/panel/business/:businessSlug/queue/history`).
El detalle completo (contratos, tipos de respuesta, bug de backend de
`priority` manejado defensivamente) está documentado en
`docs/epica-3-cola.md`, sección `HU-6.4 - Historial de turnos / HU-6.5 -
Métricas de la cola`.

## HU-6.6 - Operar el panel cómodamente desde el celular

Story points: `4`.

Estado: `implementado`.

### Objetivo de experiencia

El empleado opera la cola y consulta el historial desde el celular sin
scroll horizontal, con el botón principal de acción cómodo al tacto, y sin
perder el estado en vivo cuando la pantalla se apaga y se vuelve a encender.

### Pantallas / Rutas

```text
/panel/business/:businessSlug/queue
/panel/business/:businessSlug/queue/history
```

No agrega rutas propias — ajusta el layout responsive de las dos pantallas
de `HU-6.1` y `HU-6.4`/`HU-6.5`.

### Estados de UI

- portrait angosto (~375px): layout de una columna, sin scroll horizontal.
- landscape (~812×375): cola y botón principal visibles sin scroll
  horizontal.
- vuelta de background/pantalla apagada: el estado en vivo se refresca solo,
  sin que el empleado tenga que recargar.

### Integración frontend

- `FormButton` suma la prop `size` (`default` = `min-h-12`/48px, `lg` =
  `min-h-16`/64px); el botón "Llamar siguiente" de `HU-6.1` usa `size="lg"`
  para cumplir el mínimo de 64px de superficie táctil.
- `useQueueRoom` (`shared/queue/useQueueRoom.js`) ahora también refresca el
  estado en el handler de `connect` (no solo en el primer join, sino en cada
  reconexión) y agrega un listener de `document.visibilitychange` que
  refresca al volver a `visible` — cubre tanto el reconnect propio de
  socket.io como el caso de un browser mobile que suspende la pestaña de
  forma más agresiva que lo que el reconnect del socket detecta solo.
- `QueueTurnList.jsx`: los `<select>` de `RedirectControl`/
  `StartAttentionControl` no tenían ancho propio — un `<select>` nativo sin
  ancho se autoajusta al texto de su opción más larga, lo que forzaba scroll
  horizontal de página entera en mobile. Se les fijó `w-24`. El cluster de
  acciones de cada fila (`Finalizar`/derivar/`Cancelar`) ahora puede pasar a
  una segunda línea propia (`flex-wrap` en el `<li>` y en el cluster) en vez
  de forzar la fila más ancha que la pantalla.
- `QueueHistoryTable.jsx`/`QueueMetricsSummary.jsx`: ambas tablas (6 y 3
  columnas respectivamente) se ocultan por debajo de `sm` y se reemplazan
  por una lista de filas tipo tarjeta, mismo patrón visual que el resto del
  panel, en vez de forzar cada tabla a scrollear horizontalmente dentro de
  su propia tarjeta.
- Las dos tarjetas de `BusinessQueueHistoryPage.jsx` (`rounded-lg border`)
  suman `min-w-0`: sin eso, el tamaño mínimo automático de un ítem de CSS
  Grid se calcula a partir del contenido — y una fila con texto `nowrap`
  (`truncate`) varios niveles abajo podía arrastrar toda la columna del
  grid (y la página entera) más ancha que el viewport, aunque esa fila ya
  tuviera su propio `min-w-0`/`flex-1` a nivel de flexbox. `min-w-0` en el
  ítem de grid corta esa propagación.
- `index.css`: `.panel-layout__content`/`.panel-layout__mobile-topbar` ahora
  suman `env(safe-area-inset-left/right)` al padding fijo de 16px — sin eso,
  el gutter quedaba desparejo en landscape sobre un celular con notch (el
  safe area solo crece de un lado). Además se agregó `overflow-x: hidden`
  en `html, body` como red de seguridad — ningún elemento suelto puede
  forzar scroll/corrimiento de página completa; el scroll horizontal
  legítimo sigue viviendo solo en el `overflow-x-auto` propio de cada tabla
  (a partir de `sm`).

### Contratos consumidos

Ninguno nuevo — reusa los contratos ya documentados en `HU-6.1` y
`HU-6.4`/`HU-6.5` (`docs/epica-3-cola.md`).

### Reglas de presentación

- el botón de acción principal de una pantalla es el único candidato a
  `size="lg"` — no se aplica a botones secundarios, para que el tamaño siga
  comunicando jerarquía.
- las tablas con más de 2-3 columnas necesitan su versión de lista de
  tarjetas para mobile; no alcanza con reducir padding o acortar contenido,
  porque un dato tabular denso (fechas, horarios, contadores) sigue sin
  entrar en ~360px útiles de una pantalla angosta.

### Decisiones de producto / alcance

Se evaluó primero achicar el padding y acortar el contenido de las tablas
(fechas `dd/mm` en vez de ISO, menos padding por celda, fusionar columnas)
antes de pasar a lista de tarjetas — insuficiente por sí solo para la tabla
de 6 columnas de "Turnos completados", suficiente en un primer intento para
la de 3 columnas de métricas hasta confirmar que igual forzaba overflow en
un viewport real angosto.

### Diferidos

- Ninguno — los 4 criterios de aceptación de la historia (botón ≥64px, sin
  scroll horizontal en portrait, cola y botón visibles en landscape,
  refresco automático al volver de pantalla apagada) están implementados.

### Validación

- Verificado con Chrome headless controlado directamente por CDP (WebSocket
  crudo, sin Cypress ni Puppeteer) a 390×844: `document.documentElement
  .scrollWidth - clientWidth === 0` con la "red de seguridad" `overflow-x:
  hidden` deshabilitada a propósito para confirmar que el fix real (no solo
  el clipping) resuelve el overflow — más una captura de pantalla que
  confirma texto truncado con elipsis en vez de cortado, y margen simétrico
  en ambas tarjetas.
- Cypress: pendiente — el binario de Cypress (Electron) no pudo levantar en
  este entorno de desarrollo durante esta sesión (`cypress verify` falla
  con `bad option: --smoke-test` incluso reinstalando el cache, en Bash y
  en PowerShell nativo, con o sin sandbox, con Electron o con Edge como
  browser objetivo) — no relacionado al código de esta historia. Falta
  correr la suite completa (incluida `zz-mobile-check.cy.js`, que hoy es un
  spec descartable de verificación, no un test permanente) en un entorno
  donde Cypress levante.
