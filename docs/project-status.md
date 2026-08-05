# Estado y Arquitectura del Frontend

## Resumen ejecutivo

`espera-front` es el frontend web de Espera. Su foco actual es construir el panel
web de negocios y los flujos públicos livianos necesarios para autenticación,
onboarding y resolución de QR.

El frontend comparte repositorio para varias superficies web, pero no deben
mezclarse mentalmente:

- el panel web opera el negocio;
- la entrada pública QR atiende al cliente de a pie;
- la app móvil de usuarios queda como superficie futura separada.

## Estado general

- Estado: `Épica 1, 2, 3 y 6 cerradas (alcance web/panel)`; `Épica 8` en
  progreso.
- Épicas: `Épica 1 - Autenticación y Onboarding` y `Épica 2 - Gestión de
  Negocios` cerradas en su alcance web. `Épica 3 - Cola` completa tanto del
  lado backend (12 historias, tiempo real vía Socket.IO) como del lado
  panel (`HU-3.8` a `HU-3.11`), ver `docs/epica-3-cola.md`. `Épica 6 -
  Panel del Negocio` completa (6/6 historias: `HU-6.1`, `HU-6.2`, `HU-6.3`,
  `HU-6.4`, `HU-6.5`, `HU-6.6`), ver `docs/epica-6-panel-del-negocio.md`.
  `Épica 8 - Backoffice` en progreso (`HU-8.1` — acceso: login reusado +
  redirección por rol + layout `/backoffice` — implementada; `HU-8.2` a
  `HU-8.7` pendientes), ver `docs/epica-8-backoffice.md`.
- Historias implementadas: `HU-1.1`, `HU-1.3`, `HU-1.5`, `HU-1.6`, `HU-1.7`,
  `HU-1.8`, `HU-1.9`, verificación de email (contrato de `HU-1.1`), `HU-2.1`
  (cerrada junto con `HU-1.8`), `HU-2.2`, `HU-2.3`, `HU-2.4`, `HU-2.5`,
  `HU-2.6`, `HU-2.8`, `HU-6.1` (dashboard cola), `HU-3.8` a `HU-3.11`
  (lista, turno manual, cancelar, atención en dos etapas + ventanillas),
  `HU-6.4` (historial), `HU-6.5` (métricas), `HU-6.6` (UX mobile del
  panel), `HU-8.1` (acceso al Backoffice).
- Historias diferidas: `HU-1.2`/`HU-1.4` (Google mobile).
- Historias diferidas transversales: mobile completa, deep links
  definitivos, notificaciones push end-to-end, gate de UI por rol
  `employee` en el panel (ver `HU-2.8` en `docs/epica-2-gestion-negocios.md`).

## Stack actual

- React
- Vite
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Tailwind CSS
- Lucide React
- Framer Motion
- Geist
- Cypress

## Arquitectura actual

```text
src/
  app/
    layouts/
    providers/
    router/
  shared/
    api/
    auth/
    business/
    config/
    queue/
    ui/
  features/
    auth/
    business-onboarding/
    business-home/
    business-profile/
    business-hours/
    business-operations/
    business-qr/
    business-employees/
    business-queue/
```

## Superficies frontend

### Auth pública del panel

Responsabilidades:

- login;
- registro de usuario;
- recuperación de password;
- verificación de email;
- login/registro con Google (callback OAuth web);
- onboarding de negocio (panel vacío + alta de negocio).

Estado:

- `HU-1.1` implementada para `/register`;
- `HU-1.3` implementada para `/login`;
- `HU-1.5` implementada como mecanismo de transporte (sin pantalla propia)
  que protege todas las rutas detrás de `AuthLayout`;
- `HU-1.6` implementada: botón "Cerrar sesión" en `BusinessPanelLayout`;
- verificación de email implementada para `/verify-email`, con reenvío de
  enlace cuando el token falta, es inválido o venció;
- `HU-1.7` implementada: `/forgot-password` y `/reset-password`;
- `HU-1.9` implementada: botón "Continuar con Google" unificado en
  `/login` y `/register`, callback real en `/oauth/google/callback`;
- `HU-1.8` implementada: `/panel` recibe sin negocio con aviso + CTA,
  `/business/new` da de alta el negocio con el mismo lenguaje visual que
  login/registro;
- integración real de Épica 1 completa en su alcance web.

### Panel de negocios

Responsabilidades:

- onboarding: panel vacío + alta de negocio (`HU-1.8`);
- perfil del negocio (`HU-2.6`);
- horarios (`HU-2.2`);
- ventanillas activas (`HU-2.3`);
- estado operativo (`HU-2.5`);
- QR (`HU-2.4`);
- empleados (`HU-2.8`);
- cola: dashboard en vivo + lista de turnos (`HU-6.1`/`HU-3.8`);
- UX mobile del panel de cola e historial (`HU-6.6`).

Estado:

- onboarding (`HU-1.8`) implementado end-to-end: `BusinessPanelLayout`
  resuelve el negocio actual por `slug` contra `GET /business/me` y
  muestra el banner de `pending`/`rejected`/`approved`;
- perfil, horarios, ventanillas, estado operativo, QR y empleados
  implementados end-to-end contra el backend real (Épica 2 completa, ver
  `docs/epica-2-gestion-negocios.md`);
- cola: dashboard, lista, alta manual, cancelar, atender en dos etapas
  (`called → attending → completed`) y gestión de ventanillas de servicio
  (crear/activar/desactivar, tipos `cashier`/`customer_service`/
  `information`/`admin`/`technical`) implementados con tiempo real vía
  Socket.IO (`HU-6.1`, `HU-3.8` a `HU-3.11`), más historial de turnos
  completados y métricas comparativas por día (`HU-6.4`/`HU-6.5`, pantalla
  nueva "Historial") — ver `docs/epica-3-cola.md`. Épica 3 queda completa
  en su alcance panel; hay un bug de backend conocido que rompe el
  refresco en vivo específicamente al crear un turno nuevo (no al
  llamar/cancelar/atender);
- las pantallas de cola e historial se adaptan a mobile sin scroll
  horizontal (`HU-6.6`) — ver `docs/epica-6-panel-del-negocio.md`. Épica 6
  queda completa en su alcance panel;
- gate de UI por rol (`employee` vs `business_admin`) diferido: hoy ambos
  roles ven el mismo menú en el panel.

### Entrada pública QR

Responsabilidades:

- resolver `/q/:token`;
- mostrar el negocio escaneado;
- orientar al cliente final sin exigir app móvil;
- preparar futura continuidad hacia app móvil o navegador.

Estado:

- ruta base creada como placeholder;
- se recomienda separarla conceptualmente de `business-qr` del panel.

### Mobile futuro

Responsabilidades proyectadas:

- flujo completo de cliente final;
- turnos;
- estado en tiempo real;
- notificaciones;
- deep links.

Estado:

- fuera del primer corte frontend web.

## Decisiones actuales

- La paleta de marca es violeta. El tono principal, tomado del logo, es
  `#500097`.
- La escala secundaria de violeta se basa en `#752174`, `#822e81`, `#903a8d`,
  `#9d479a` y `#aa54a7`.
- La escala violeta se complementará con blancos y colores especiales para
  alertas, modales y acciones cuando cada caso de UI lo requiera.
- La tipografía principal del frontend es `Geist Sans`; `Geist Mono` queda
  reservado para datos, códigos y usos técnicos.
- Tailwind CSS será la base visual principal.
- Framer Motion se usará con moderación para microinteracciones y transiciones
  de estado, respetando rendimiento y `prefers-reduced-motion`.
- Las pantallas deben mantenerse granulares: páginas como orquestadores,
  componentes pequeños para escena, formularios, campos, botones y estados.
- El logo debe usarse como anclaje de marca, no como etiqueta decorativa ni con
  texto redundante pegado.
- La jerarquía visual debe priorizar objetivo y acción principal por encima de
  efectos, fondos o elementos ornamentales.
- Las acciones visibles no deben prometer flujos incompletos: si un endpoint
  existe pero falta callback, estado final o manejo de errores, se documenta como
  diferido y no se muestra como CTA operativo.
- Zustand será el estado global liviano para sesión y negocio actual.
- TanStack Query manejará server-state, cache e invalidaciones.
- React Hook Form y Zod manejarán formularios y validaciones.
- El frontend guarda `accessToken` solo en memoria (nunca en `localStorage` ni
  `sessionStorage`), para no exponerlo a un eventual XSS; la sesión se
  restaura tras una recarga vía la cookie `refreshToken` httpOnly.
- El refresh token viaja por cookie `httpOnly`; el contrato backend también lo
  devuelve en body por compatibilidad, pero el frontend web no debe depender de
  leer la cookie desde JavaScript.
- Código, funciones y comentarios inline se escriben en inglés.
- Los textos visibles para usuarios se escriben en español rioplatense,
  inicialmente orientado a público argentino.
- Documentación se escribe en español con tildes y Ñ.

## Calidad actual

Comandos principales:

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.

Cobertura automatizada:

- Cypress e2e cubre `HU-1.1` en `/register`: render, validaciones cliente,
  submit exitoso, normalización de datos, error backend y el botón
  "Continuar con Google" (`HU-1.9`).
- Cypress e2e cubre `HU-1.3` en `/login`: render, validaciones cliente, submit
  exitoso con redirección por `slug`, los errores funcionales
  `EMAIL_NOT_VERIFIED`, `ACCOUNT_REJECTED`, `LOGIN_TEMPORARILY_BLOCKED` y
  credenciales inválidas, y el botón "Continuar con Google" (`HU-1.9`).
- Cypress e2e cubre `HU-1.5` sobre rutas del panel: restauración de sesión sin
  `accessToken` cacheado vía cookie de refresh, redirección a `/login` sin
  sesión ni cookie válida, y reintento automático cuando el `accessToken`
  cacheado ya venció.
- Cypress e2e cubre `HU-1.6` en el panel: logout exitoso, logout que igual
  redirige si el backend falla, y que el botón "atrás" del navegador no
  vuelve a mostrar contenido protegido después de salir.
- Cypress e2e cubre verificación de email en `/verify-email`: link sin
  token, verificación exitosa con CTA a login, token inválido/vencido,
  reenvío exitoso y reenvío fallido con mensaje genérico.
- Cypress e2e cubre `HU-1.7` en `/forgot-password` y `/reset-password`:
  validación de email, confirmación genérica exitosa, error genérico de
  backend, link inválido sin token, validación de password y confirmación,
  reset exitoso con redirección a `/login`, y enlace vencido/inválido sin
  perder el formulario.
- Cypress e2e cubre `HU-1.8` en `/business/new`: render con solo campos de
  negocio, validaciones cliente, alta exitosa con refresh de token y
  redirección por `slug`, error de backend sin perder el formulario, y
  redirección a `/login` sin sesión.
- Cypress e2e cubre `HU-1.9` en `/oauth/google/callback`: login exitoso sin
  negocio, login exitoso con negocio, cancelación en Google, enlace sin
  `code`/`state`, y error funcional (`AUTH_PROVIDER_MISMATCH`).
- Cypress e2e cubre `HU-2.6` en `/panel/business/:businessSlug/profile`:
  precarga de datos, validación de campos requeridos, atributos de categoría
  informativos, guardado exitoso, error de backend sin perder el formulario.
- Cypress e2e cubre `HU-2.2` en `/panel/business/:businessSlug/hours`:
  estados vacíos, validación de al menos un rango, apertura antes que
  cierre, guardado con día no laborable, error de backend.
- Cypress e2e cubre `HU-2.3`/`HU-2.5` en
  `/panel/business/:businessSlug/operations`: precarga de ventanillas y
  estado operativo, validación de máximo, guardado con `0` ventanillas
  ("sin atención disponible") y con más de `0`, cambio de estado operativo
  con mensaje del backend, error de backend.
- Cypress e2e cubre `HU-2.4` en `/panel/business/:businessSlug/qr`: QR
  activo con enlace, estado "en transición", descarga de PNG, regeneración
  con aviso de vigencia del QR anterior, error de backend.
- Cypress e2e cubre `HU-2.8` en `/panel/business/:businessSlug/employees` y
  `/business/employee-invitations/:token`: estado vacío, listado de
  activos, validación de email, invitación exitosa, error de backend,
  revocación; aceptación de invitación exitosa, validación de contraseñas,
  token inválido/vencido.
- Cypress e2e cubre `HU-6.1`/`HU-3.8` en
  `/panel/business/:businessSlug/queue`: negocio sin cola todavía,
  métricas + lista de turnos activos, "Cola vacía" deshabilitado sin
  turnos esperando, llamar al siguiente turno actualiza dashboard y lista,
  error de backend al llamar, error al cargar estado/lista.
- Cypress e2e cubre `HU-3.9`/`HU-3.10`/`HU-3.11` en la misma ruta: validación
  de nombre vacío, alta de turno manual con limpieza de formulario, error de
  backend al agregar, el botón de "Iniciar atención" solo aparece en turnos
  `called` y el de "Finalizar atención" solo en `attending`, selección de
  ventanilla al iniciar atención, cancelar un turno lo saca de la lista,
  iniciar/finalizar atención saca el turno o actualiza su estado, error de
  backend en las tres acciones.
- Cypress e2e cubre `HU-6.4`/`HU-6.5` en
  `/panel/business/:businessSlug/queue/history`: comparativa de métricas
  (hoy vs. día anterior), tabla de turnos completados, cambio de fecha
  (vuelve a pedir ambos endpoints), estado vacío sin turnos completados,
  error de backend en métricas e historial.
- Cypress e2e cubre el refinamiento de ventanillas (ocupación, CRUD
  completo, derivación) en `business-queue-window-crud.cy.js` y
  `business-queue-windows.cy.js`: derivar un turno `attending` a otra
  ventanilla, editar/eliminar ventanillas, confirmación al desactivar/
  eliminar una ventanilla ocupada, y que los códigos de error del backend
  (`code`) se traduzcan a español vía `src/shared/api/apiError.js`.
- 107 tests e2e en total, todos verdes (`accept-employee-invitation`,
  `business-create`, `business-employees`, `business-hours`,
  `business-operations`, `business-profile`, `business-qr`,
  `business-queue`, `business-queue-turn-actions`, `business-queue-history`,
  `business-queue-windows`, `business-queue-window-crud`, `google-login`,
  `login`, `logout`, `password-recovery`, `refresh-token`, `register`,
  `verify-email`).

## Avance actual

- `HU-1.1` implementada en frontend para registro local con email y password.
- Ruta relacionada: `/register`.
- Endpoint consumido: `POST /api/auth/register`.
- La pantalla valida campos en cliente, conserva errores inline y muestra estado
  de éxito orientando a verificar email.
- Cobertura e2e: `cypress/e2e/register.cy.js`.
- `HU-1.3` implementada en frontend para login local con email y password.
- Ruta relacionada: `/login`.
- Endpoints consumidos: `POST /api/auth/login`, `GET /api/auth/me`,
  `GET /api/business/me`.
- La pantalla valida campos en cliente, traduce los códigos funcionales de
  error del backend a mensajes en español y redirige al panel del negocio del
  usuario (por `slug`) o a `/panel` (vacío) si todavía no tiene uno.
- Cobertura e2e: `cypress/e2e/login.cy.js`.
- Bugfix histórico (superado en `HU-1.8`): `/business/register` (alta
  pública combinada, `POST /api/auth/register-business`) era el destino
  post-login para cuentas sin negocio, pidiéndole de nuevo identidad a un
  usuario ya autenticado. Se creó `BusinessCreatePage.jsx` en
  `/business/new` (protegida, solo campos de negocio, `POST /api/business`)
  como destino correcto, y luego, con `HU-1.8`, se eliminó por completo
  `/business/register` y se reemplazó el gate obligatorio por el panel
  vacío en `/panel`. Ver `HU-1.8` en
  `docs/epica-1-autenticacion-onboarding.md` para el detalle completo.
- `HU-1.5` implementada en frontend: `useSessionBootstrap` ya no depende de
  tener un `accessToken` cacheado para intentar restaurar la sesión, porque
  el interceptor de `httpClient` resuelve cualquier `401` contra
  `POST /api/auth/refresh-token` (cookie httpOnly) antes de redirigir a
  `/login`.
- No agrega ruta ni pantalla propia; protege todo lo que vive detrás de
  `AuthLayout`.
- Cobertura e2e: `cypress/e2e/refresh-token.cy.js`.
- `HU-1.6` implementada en frontend: `LogoutButton` en el sidebar de
  `BusinessPanelLayout` llama `POST /api/auth/logout` y siempre limpia la
  sesión local y redirige a `/login`, incluso si la llamada al backend
  falla.
- Cobertura e2e: `cypress/e2e/logout.cy.js`.
- Verificación de email implementada en frontend (contrato de `HU-1.1`, sin
  número de historia propio).
- Ruta relacionada: `/verify-email`.
- Endpoints consumidos: `GET /api/auth/verify-email`,
  `POST /api/auth/resend-verification`.
- La pantalla confirma el token al montarse vía `useQuery`, orienta a
  iniciar sesión si fue exitosa, y ofrece reenvío con mensaje genérico (sin
  código funcional disponible) si el token falta, es inválido o venció.
- Cobertura e2e: `cypress/e2e/verify-email.cy.js`.
- `HU-1.7` implementada en frontend para recuperación de password.
- Rutas relacionadas: `/forgot-password`, `/reset-password`.
- Endpoints consumidos: `POST /api/auth/forgot-password`,
  `POST /api/auth/reset-password`.
- `/forgot-password` muestra confirmación genérica sin filtrar si el email
  existe (refleja la misma ambigüedad que ya implementa el backend);
  `/reset-password` lee el `token` del query string, exige la misma fuerza
  de password que registro, y redirige a `/login` al guardar (el backend ya
  revoca todas las sesiones activas del usuario).
- Bugfix relacionado en backend: los enlaces de email de verificación y
  reset tenían un prefijo `/auth/` que no existía en las rutas reales del
  frontend; se corrigió en `espera-back` (commit `09e4e43`).
- Cobertura e2e: `cypress/e2e/password-recovery.cy.js`.
- `HU-1.8` implementada en frontend para onboarding de negocio.
- Rutas relacionadas: `/panel` (vacío, sin negocio), `/business/new`
  (alta), `/panel/business/:businessSlug/*` (con negocio).
- Endpoints consumidos: `GET /api/business/me`, `GET /api/business/categories`,
  `POST /api/business`, `POST /api/auth/refresh-token`.
- El post-login ya no obliga a completar el formulario de negocio antes de
  entrar al panel: `/panel` muestra un aviso + CTA cuando no hay negocio.
  `BusinessCreatePage` usa el mismo lenguaje visual que login/registro y,
  al crear el negocio, refresca el token (para reflejar `business_admin`
  sin esperar el próximo login) y redirige por `slug`.
- `BusinessPanelLayout` resuelve el negocio actual contra `GET /business/me`
  y muestra el banner de `pending`/`rejected`/`approved` — antes era código
  muerto que nunca se alimentaba.
- Cobertura e2e: `cypress/e2e/business-create.cy.js`.
- `HU-1.9` implementada en frontend para login/registro unificado con
  Google.
- Rutas relacionadas: `/login`, `/register`, `/oauth/google/callback`.
- Endpoints consumidos: `GET /api/auth/google/url`,
  `POST /api/auth/login/google`.
- Un mismo botón ("Continuar con Google") y un mismo endpoint sirven para
  crear cuenta o loguearse, sin que el frontend necesite distinguir los dos
  casos (el backend resuelve *find-or-create*). `GoogleCallbackPage` usa
  `useQuery` (no `useMutation` + `useEffect`, que quedaba encallado en
  `pending` bajo `StrictMode`) siguiendo el mismo patrón que
  `VerifyEmailPage`.
- Cobertura e2e: `cypress/e2e/google-login.cy.js`.
- `HU-2.1` implementada junto con `HU-1.8` (ver esa historia arriba); en esta
  épica se sumó el campo `phone` (opcional) al alta de negocio.
- `HU-2.6` implementada en frontend para editar perfil del negocio.
- Ruta relacionada: `/panel/business/:businessSlug/profile`.
- Endpoints consumidos: `GET /api/business/me`, `GET /api/business/categories`,
  `GET /api/business/categories/:categoryId/config`,
  `PATCH /api/business/:businessId/profile`.
- Cobertura e2e: `cypress/e2e/business-profile.cy.js`.
- `HU-2.2` implementada en frontend para configurar horarios de atención.
- Ruta relacionada: `/panel/business/:businessSlug/hours`.
- Endpoints consumidos: `GET /api/business/:businessId/hours`,
  `PUT /api/business/:businessId/hours`.
- La validación cliente espeja las reglas del backend (apertura antes que
  cierre, sin solapamientos, sin fechas no laborables repetidas) reusando
  helpers puros para no duplicar la lógica de comparación en dos formatos.
- Sin cobertura e2e todavía; validado manualmente.
- `HU-2.3` y `HU-2.5` implementadas en frontend, comparten pantalla
  ("Operación").
- Ruta relacionada: `/panel/business/:businessSlug/operations`.
- Endpoints consumidos: `PUT /api/business/:businessId/service-windows`,
  `PATCH /api/business/:businessId/operational-status`.
- Se detectó y resolvió un gap de contrato durante `HU-2.3`:
  `activeServiceWindows` no se podía leer desde ningún endpoint (solo
  escribir); se pidió al backend sumarlo a `GET /business/me` y ya está
  mergeado.
- Sin cobertura e2e todavía; validado manualmente, incluyendo el caso `0`
  ventanillas ("sin atención disponible").
- `HU-2.4` implementada en frontend para el QR del negocio.
- Ruta relacionada: `/panel/business/:businessSlug/qr`.
- Endpoints consumidos: `GET /api/business/:businessId/qr`,
  `POST /api/business/:businessId/qr/regenerate`,
  `GET /api/business/:businessId/qr.png`.
- Se sumó `httpClient.getBlob()` porque el PNG es un endpoint autenticado
  que devuelve binario, no JSON; el mismo blob se reusa para mostrar la
  imagen y para la descarga.
- Sin cobertura e2e todavía; validado manualmente, incluyendo regeneración
  con transición de 24hs.
- `HU-2.8` implementada en frontend para invitar y gestionar empleados.
- Rutas relacionadas: `/panel/business/:businessSlug/employees`,
  `/business/employee-invitations/:token` (pública).
- Endpoints consumidos: `POST /api/business/:businessId/employees/invitations`,
  `GET /api/business/:businessId/employees`,
  `DELETE /api/business/:businessId/employees/:userId`,
  `POST /api/business/employee-invitations/:token/accept`.
- Validado manualmente end-to-end contra el backend real sin depender de
  email real (Resend sin dominio configurado en desarrollo): token de
  invitación tomado directo de la base para simular el link del mail.
- Diferido: el rol `employee` no tiene todavía ninguna pantalla operativa
  ni gate de UI propio en el panel; ver `HU-2.8` en
  `docs/epica-2-gestion-negocios.md`.
- Cobertura e2e: `cypress/e2e/business-employees.cy.js`,
  `cypress/e2e/accept-employee-invitation.cy.js`.
- `HU-6.1` implementada en frontend para el dashboard de la cola.
- `HU-3.8` implementada en frontend para la lista de turnos activos.
- Ruta relacionada: `/panel/business/:businessSlug/queue`.
- Endpoints consumidos: `GET /api/queue/:queueId/status`,
  `GET /api/queue/:queueId/turns`, `POST /api/queue/turns/call-next`.
- Se sumó `socket.io-client` como dependencia nueva; `useQueueRoom`
  (`shared/queue/useQueueRoom.js`) centraliza la suscripción al room
  `queue:{queueId}` para toda la pantalla de cola.
- Se detectó y resolvió, antes de esta HU, la falta de `queueId` en
  `GET /business/me` y de creación automática de `Queue` (incluido backfill
  para negocios ya aprobados) — ver `HU-6.1` en `docs/epica-3-cola.md`.
- Bug de backend encontrado validando el tiempo real: crear un turno
  (`CreateTurnUseCase`/`CreateManualTurnUseCase`) no emite `queue:update` —
  confirmado con un cliente socket.io-client puro, sin frontend de por
  medio. Reportado al backend, sin resolver todavía. El resto de las
  acciones (llamar siguiente, cancelar, atender) sí emiten correctamente.
- Cobertura e2e: `cypress/e2e/business-queue.cy.js`.
- `HU-3.9`/`HU-3.10`/`HU-3.11` implementadas en frontend (agregar turno
  manual, cancelar, iniciar/finalizar atención en dos etapas + gestión de
  ventanillas de servicio), misma ruta y pantalla que `HU-3.8`.
- Endpoints consumidos: `POST /api/queue/:queueId/turns/manual`,
  `POST /api/queue/:queueId/turns/:turnId/cancel`,
  `POST /api/queue/:queueId/turns/:turnId/attend` (maneja
  `called→attending` y `attending→completed` según el estado actual),
  `GET/POST /api/queue/:queueId/windows`,
  `PATCH /api/queue/:queueId/windows/:windowId/toggle`.
- Se detectó y corrigió un bug propio: `reset()` de react-hook-form no
  limpiaba el input del formulario de turno manual después de un alta
  exitosa (posible interacción con el React Compiler del proyecto,
  `reactCompilerPreset` en `vite.config.js`). Se resolvió remontando el
  formulario vía `key` en vez de depender de `reset()` — mismo patrón
  reusado en el formulario de ventanillas — ver `HU-3.9` en
  `docs/epica-3-cola.md`.
- Refinamiento de producto: se sumó el estado intermedio `attending` (para
  medir la duración real de atención) y la entidad `ServiceWindow`
  (ventanillas identificables con tipo: `cashier`/`customer_service`/
  `information`/`admin`/`technical`) — ver detalle en `HU-3.11` de
  `docs/epica-3-cola.md`.
- Se detectó y reportó un bug de backend durante la validación: la
  migración de `attending` creó la columna `started_attention_at` en
  snake_case, pero Prisma esperaba `startedAttentionAt` — rompía con 500
  `GET /status` y `GET /turns`. Confirmado corregido en local.
- Se extendió el layout de la pantalla de cola a ancho completo (antes
  limitado a `max-w-2xl`): dashboard arriba a todo el ancho, y grid de dos
  columnas (turnos activos / ventanillas) debajo.
- Validado manualmente contra el backend real: ciclo completo turno manual
  → cancelar uno → llamar al otro → iniciar atención (con ventanilla) →
  finalizar atención → lista vacía.
- Cobertura e2e: `cypress/e2e/business-queue-turn-actions.cy.js`.
- `HU-6.6` implementada en frontend para operar el panel desde el celular.
- Mismas rutas que `HU-6.1` y `HU-6.4`/`HU-6.5`
  (`/panel/business/:businessSlug/queue` y `.../queue/history`); no agrega
  pantallas propias, ajusta el layout responsive de ambas.
- No consume contratos nuevos.
- `FormButton` suma `size="lg"` (64px) para el botón "Llamar siguiente";
  `useQueueRoom` refresca también en cada reconexión del socket y al volver
  la pestaña a estar visible; los `<select>` de derivar/iniciar atención
  pasaron a tener ancho fijo (antes se autoajustaban al texto de la opción
  más larga y forzaban scroll horizontal de página completa); las tablas de
  historial y métricas se reemplazan por listas tipo tarjeta por debajo de
  `sm`; las tarjetas de Historial suman `min-w-0` para cortar la
  propagación del tamaño mínimo automático de CSS Grid; el padding mobile
  del layout del panel ahora suma `env(safe-area-inset-left/right)`.
- Ver detalle completo en `HU-6.6` de `docs/epica-6-panel-del-negocio.md`.
- Sin cobertura e2e todavía: Cypress no pudo levantar en este entorno de
  desarrollo durante la sesión de implementación (no relacionado al código);
  validado con Chrome headless controlado directo por CDP y captura de
  pantalla.

## Próximo trabajo

Con `HU-2.1` a `HU-2.8` cerradas, la Épica 2 queda completa en su alcance
web. Épica 3 (Cola) está completa también del lado panel: se
implementaron `HU-3.8` a `HU-3.11` — el panel ya permite operar la cola de
punta a punta. Épica 6 (Panel del Negocio) queda completa: `HU-6.1`
(dashboard), `HU-6.2`/`HU-6.3` (cerradas junto con `HU-2.5`/`HU-2.3`),
`HU-6.4`/`HU-6.5` (historial + métricas comparativas por día, pantalla
"Historial") y `HU-6.6` (UX mobile: botón principal ≥64px, sin scroll
horizontal en portrait/landscape, refresco automático al volver de pantalla
apagada) — ver `docs/epica-6-panel-del-negocio.md`.
`HU-3.1`/`HU-3.3`/`HU-3.4`/`HU-3.5`/`HU-3.6` no aplican a este repo
(cliente final: mobile o entrada QR pública).

Bloqueante externo a resolver antes de considerar cerrada la experiencia de
tiempo real: el bug de backend de arriba (creación de turno sin emitir
`queue:update`) — afecta tanto a `HU-3.1` (app) como a `HU-3.9` (manual).

Deuda conocida a resolver en paralelo o antes de seguir con Épica 3:

- gate de UI por rol (`employee` vs `business_admin`) en la navegación del
  panel — ahora que existe una pantalla real que un `employee` puede usar
  (operar la cola completa), tiene sentido diseñarlo ahora.
