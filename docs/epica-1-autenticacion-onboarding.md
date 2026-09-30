# Épica 1 - Autenticación y Onboarding

## Resumen

La Épica 1 cubre el acceso inicial a Espera desde el frontend web: registro,
login, sesión, verificación de email, recuperación de password, onboarding de
negocios (con y sin Google) y el panel vacío que recibe a un usuario sin
negocio todavía.

El primer corte se enfoca en flujos públicos del panel y en preparar el acceso
al panel web de negocios. Los flujos mobile de usuario final quedan diferidos.

## Estado general

- Estado: `implementado` (alcance web). Mobile queda diferido.
- Historias implementadas: `HU-1.1`, `HU-1.3`, `HU-1.5`, `HU-1.6`, `HU-1.7`,
  `HU-1.8`, `HU-1.9`. Verificación de email (contrato de `HU-1.1`) también
  implementada.
- Historias diferidas: `HU-1.2` y `HU-1.4`, registro/login con Google en app
  móvil.
- Motivos de diferidos: dependen de la app móvil, deep links y configuración
  real por plataforma (no hay app móvil registrada todavía).

## Superficies involucradas

- Auth pública del panel.
- Panel de negocios.
- Entrada pública QR, solo como dependencia futura de navegación.
- Mobile futuro, fuera del primer corte web.

## Contratos principales de la épica

Público:

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/verify-email?token=:token
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/google/url
POST /api/auth/login/google
GET /api/business/categories
```

Sesión:

```text
POST /api/auth/refresh-token
POST /api/auth/logout
GET /api/auth/me
```

Panel (requiere sesión):

```text
GET /api/business/me
POST /api/business
```

Admin:

```text
PATCH /api/auth/business-accounts/:userId/approve
```

**Deprecados, no usar en flujos nuevos:** `POST /api/auth/register-business` y
`POST /api/auth/register-business/google` (alta combinada de cuenta+negocio
en un paso, arquitectura previa a `HU-1.8`/`HU-1.9`). El flujo vigente separa
siempre cuenta (`POST /api/auth/register` o `POST /api/auth/login/google`) de
negocio (`POST /api/business`, autenticado). Ver `HU-1.8` y `HU-1.9` abajo.

## HU-1.1 - Registro con email y password

Story points: no normalizado.

Estado: `implementado`

### Objetivo de experiencia

Una persona puede crear una cuenta local desde `/register` usando nombre,
apellido, email y password. Al terminar, la pantalla confirma que la cuenta fue
creada y orienta al usuario a verificar su email antes de iniciar sesión.

### Pantallas / Rutas

```text
/register
/login
```

### Estados de UI

- `idle`: formulario listo para completar.
- `loading`: botón deshabilitado con indicador de progreso.
- `success`: confirmación de cuenta creada y llamada a revisar el email.
- `error`: mensaje inline con el error devuelto por backend.
- `validation`: mensajes por campo antes de enviar.

### Integración frontend

- El botón `Crear cuenta` dispara `POST /api/auth/register`.
- La validación previa usa `react-hook-form`, `zod` y las mismas reglas visibles
  del backend.
- Si el registro responde `201`, se muestra una pantalla de éxito sin iniciar
  sesión automáticamente.
- Si el backend responde error, se conserva el formulario y se muestra el mensaje
  recibido.
- La pantalla ofrece navegación secundaria hacia `/login`.
- No se actualiza Zustand porque el registro no crea una sesión autenticada.
- No se invalida cache de TanStack Query porque todavía no hay datos autenticados
  consumidos en esta historia.

### Contratos consumidos

```text
POST /api/auth/register
```

### Datos enviados

```ts
type RegisterRequest = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
};
```

### Datos esperados

```ts
type RegisterResponse = {
  userId: string;
};
```

### Reglas de presentación

- El formulario muestra campos de nombre, apellido, email, password y
  confirmación de password.
- El password debe tener al menos 8 caracteres, una mayúscula, una minúscula y un
  número.
- La confirmación de password se valida en frontend y se envía al backend para
  respetar el contrato de registro.
- Los campos de password permiten mostrar u ocultar el valor ingresado.
- Nombre y apellido deben tener al menos 2 caracteres y usar letras, espacios,
  apóstrofes o guiones.
- El email se normaliza en minúsculas antes de enviarse.
- El botón principal se deshabilita mientras se envía el formulario.
- La pantalla de éxito no promete acceso inmediato; comunica que falta verificar
  el email.
- La pantalla usa una firma visual de línea de espera para representar el paso
  `Cuenta -> Negocio -> Panel`.
- Las animaciones respetan preferencias de movimiento reducido.
- El copy visible de la interfaz se escribe en español rioplatense.

### Decisiones de producto / alcance

El registro local se mantiene como flujo público simple. No inicia sesión
automáticamente porque el backend deja el email pendiente de verificación y el
login requiere email verificado.

Aunque la cuenta inicial representa al dueño, el negocio se registra después en
un flujo separado. La UI no debe mezclar la creación de identidad con la carga
del negocio.

Google OAuth queda fuera de `HU-1.1` hasta implementar el callback real. No se
debe mostrar una acción visible como disponible si el frontend solo puede iniciar
OAuth pero no completar el registro.

### Diferidos

- Reenvío de verificación desde esta pantalla (existe en `/verify-email`,
  no acá).
- Registro y login Google web end-to-end.
- Callback visual completo de Google.
- Tests de componentes.
- Medición de analytics.
- Registro Google mobile.

### Validación

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.
- Cypress cubre render de `/register`, ausencia de CTA Google operativo,
  visibilidad de password, validaciones cliente sin request al backend,
  confirmación de password, submit exitoso con datos normalizados y error de
  backend sin perder el formulario.
- Flujo manual esperado: abrir `/register`, completar datos válidos, enviar,
  recibir confirmación y verificar que los errores de validación aparecen sin
  perder el formulario.

## Verificación de email (cierre de contrato de HU-1.1)

Sin número de historia propio en el backlog: `GET /api/auth/verify-email` y
`POST /api/auth/resend-verification` están documentados como parte del
contrato de `HU-1.1` en el backend, no de una historia separada.

Estado: `implementado`

### Objetivo de experiencia

Una persona que se registró y recibió el email de verificación puede
completar la activación de su cuenta abriendo el link, y queda orientada a
iniciar sesión. Si el link es inválido o venció, puede pedir uno nuevo sin
perder el flujo.

### Pantallas / Rutas

```text
/verify-email?token=:token
```

### Estados de UI

- `verifying`: se está confirmando el token contra el backend.
- `success`: email verificado, CTA para ir a `/login`.
- `invalid-link`: no llegó `token` en la URL (acceso directo a la ruta sin
  link real).
- `error`: el backend rechazó el token (inválido o vencido).
- `resend-success`: se reenvió un nuevo email de verificación.
- `resend-error`: no se pudo reenviar (cuenta ya verificada, rate limit, o
  fallo de envío).

### Integración frontend

- Al montar, `VerifyEmailPage` lee `token` del query string
  (`useSearchParams`) y dispara `GET /api/auth/verify-email?token=...` vía
  `useQuery` (no `useEffect` + mutation manual: el fetch en mount es
  exactamente el caso de uso de `useQuery`, con `enabled: Boolean(token)`
  evitando la llamada cuando no hay token).
- `retry: false` porque el token se invalida en el backend tras el primer
  uso exitoso; reintentar automáticamente solo generaría un segundo error
  inútil.
- Tanto el estado "sin token" como el de "verificación fallida" reutilizan
  `ResendVerificationForm` (`src/features/auth/components/ResendVerificationForm.jsx`),
  que dispara `POST /api/auth/resend-verification` con el email ingresado.
- No se autologuea al usuario tras verificar: el backend no devuelve sesión
  en esta respuesta, solo confirma el email.

### Contratos consumidos

```text
GET /api/auth/verify-email
POST /api/auth/resend-verification
```

### Datos enviados

```ts
type ResendVerificationRequest = {
  email: string;
};
```

### Datos esperados

```ts
type VerifyEmailResponse = {
  message: string;
};

type ResendVerificationResponse = {
  message: string;
};
```

### Reglas de presentación

- Los errores de `GET /api/auth/verify-email` y de
  `POST /api/auth/resend-verification` no traen código funcional
  (`AppError` sin segundo argumento en ambos use cases), así que no se
  intenta diferenciarlos por mensaje exacto del backend: se usa un mensaje
  genérico en español para cada flujo en lugar de mostrar el texto en
  inglés del backend o inventar una distinción que el contrato no ofrece.
- El copy visible de la interfaz se escribe en español rioplatense.

### Decisiones de producto / alcance

No se distingue "token inválido" de "token vencido" en la UI porque el
backend no expone esa diferencia con un código — ambos casos resuelven
igual del lado del usuario (pedir un reenvío), así que la distinción no
aporta valor de producto, solo complejidad.

### Diferidos

- Auto-reenvío cuando el usuario llega sin token (hoy requiere ingresar el
  email manualmente).
- Tests de componentes.
- Medición de analytics.

### Validación

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.
- Cypress (`verify-email.cy.js`) cubre: link sin token, verificación
  exitosa con CTA a login, token inválido/vencido, reenvío exitoso y
  reenvío fallido con mensaje genérico.
- Flujo manual esperado: registrarse, abrir el link del email de
  verificación, confirmar que lleva a la pantalla de éxito, y desde ahí
  iniciar sesión.

## HU-1.3 - Login con email y password

Story points: no normalizado.

Estado: `implementado`

### Objetivo de experiencia

Una persona con cuenta local y email verificado puede iniciar sesión desde
`/login` con email y password, y queda redirigida al panel de su negocio (o al
onboarding de negocio si todavía no tiene uno).

### Pantallas / Rutas

```text
/login
/forgot-password
/register
```

### Estados de UI

- `idle`: formulario listo para completar.
- `loading`: botón deshabilitado con indicador de progreso.
- `error`: mensaje inline específico según el código funcional devuelto por
  backend.
- `validation`: mensajes por campo antes de enviar.

### Integración frontend

- El botón `Ingresar` dispara `POST /api/auth/login`.
- La validación previa usa `react-hook-form` y `zod` (`loginSchema`), sin
  reglas de complejidad de password porque el backend tampoco las exige en
  login.
- Si el login responde `200`, el `accessToken` se guarda vía `persistSession`,
  y en paralelo se precarga la cache de TanStack Query (`queryKey:
  ['session']`) llamando a `GET /api/auth/me` (para que `AuthLayout` no
  repita el fetch) y se consulta `GET /api/business/me`
  (`businessOnboardingApi.listMine()`) para saber si el usuario ya tiene
  negocio propio. Esta lógica vive en `usePostLoginRedirect`
  (`src/features/auth/hooks/usePostLoginRedirect.js`), compartida con el
  login por Google (`HU-1.9`) para no duplicarla.
- Redirección post-login: si existe `location.state.from` (ruta protegida que
  disparó el login), se vuelve ahí. Si no, y `GET /api/business/me` devuelve
  al menos un negocio, se navega a `/panel/business/:slug` (el primero de la
  lista, usando el `slug` público, nunca el `id` interno); si la lista viene
  vacía o la consulta falla, se navega a `/panel` (panel vacío, ver `HU-1.8`).
- Si el backend responde error, se conserva el formulario y se muestra un
  mensaje específico mapeado por código funcional (`getLoginErrorMessage`).
- No se invalida cache adicional: el login es el punto de entrada de la
  sesión, no hay datos previos que limpiar.

### Contratos consumidos

```text
POST /api/auth/login
GET /api/auth/me
GET /api/business/me
```

### Datos enviados

```ts
type LoginRequest = {
  email: string;
  password: string;
};
```

### Datos esperados

```ts
type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

type MeResponse = {
  user: {
    id: string;
    email: string;
    role: 'user' | 'employee' | 'business_admin' | 'super_admin';
    approvalStatus: 'pending' | 'approved' | 'rejected';
  };
};

type MyBusinessesResponse = {
  businesses: Array<{
    id: string;
    name: string;
    slug: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    listingStatus: string;
    operationalStatus: string;
  }>;
};
```

`id` es el UUID interno del negocio: se usa solo para llamadas de API (hoy,
para poblar `useCurrentBusinessStore` desde `BusinessPanelLayout`), nunca en
URLs ni en texto visible. `slug` es el identificador público, usado en rutas
(`/panel/business/:slug`) y en cualquier lugar donde el usuario vea el
negocio nombrado. `status` es el estado de aprobación comercial del negocio
(distinto de `listingStatus`, que controla visibilidad pública en discovery).

### Reglas de presentación

- El formulario muestra campos de email y password, sin reglas de fuerza de
  password (eso es exclusivo de registro).
- El campo de password permite mostrar u ocultar el valor ingresado.
- El botón principal se deshabilita mientras se envía el formulario.
- Los errores de backend se traducen a mensajes en español según el código
  funcional, nunca se muestra el mensaje crudo en inglés que devuelve la API:
  - `EMAIL_NOT_VERIFIED`: invita a revisar el email, sin ofrecer un botón de
    reenvío porque esa pantalla (`/verify-email`) sigue siendo un placeholder.
  - `ACCOUNT_REJECTED`: la solicitud de negocio fue rechazada por el equipo.
  - `LOGIN_TEMPORARILY_BLOCKED`: bloqueo temporal por intentos fallidos.
  - Sin código (401 credenciales inválidas) o error inesperado: mensaje
    genérico que no revela si falló el email o la password.
  - `ACCOUNT_PENDING_REVIEW` **ya no existe** desde `HU-1.8`: un
    `business_admin` con negocio `pending` puede loguearse normalmente y ve
    su estado dentro del panel (`BusinessPanelLayout`), no como error de
    login. Ver `HU-1.8`.
- El copy visible de la interfaz se escribe en español rioplatense.

### Decisiones de producto / alcance

El login no resuelve membership en organizaciones ni selección entre varios
negocios: usa directamente el `businessId` que ya viaja en `GET /api/auth/me`
para un único negocio por cuenta de tipo `business_admin`. Selección
multi-negocio queda fuera de esta historia.

No se construye un flujo de reenvío de verificación desde el error
`EMAIL_NOT_VERIFIED` porque esa pantalla todavía no tiene integración real;
mostrar un botón que no hace nada violaría la regla de no prometer acciones
incompletas.

### Diferidos

- Reenvío de verificación desde el error de login.
- ~~Selección de negocio cuando una cuenta pertenece a más de uno.~~
  Resuelto (2026-08-21) — ver refinamiento "switcher de sucursal" más abajo.
  `resolvePostLoginPath` sigue aterrizando siempre en `businesses[0]` a
  propósito (ver esa sección para el motivo).
- Tests de componentes.
- Medición de analytics.

### Validación

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.
- Cypress (`login.cy.js`, 10 tests) cubre render de `/login`, validaciones
  cliente sin request al backend, submit exitoso con normalización de email
  y redirección a `/panel` sin negocio asociado, redirección a
  `/panel/business/:slug` con negocio asociado, redirección a `/panel`
  cuando `GET /business/me` falla, los casos de error funcional
  (`EMAIL_NOT_VERIFIED`, `ACCOUNT_REJECTED`, `LOGIN_TEMPORARILY_BLOCKED`,
  credenciales inválidas sin código), y el botón de Google pidiendo la URL
  de autorización.
- Flujo manual esperado: abrir `/login`, completar credenciales válidas,
  enviar, y verificar la redirección esperada según si la cuenta tiene
  negocio asociado.

### Historial del redirect post-login (resuelto)

`resolvePostLoginPath` originalmente decidía el destino según
`user.businessId`, pero ese campo nunca llegaba poblado desde el backend:
`JWTTokenService.generateAccessToken()` (`espera-back`) nunca lo firmaba, y
`User` no tiene esa relación — la relación real es `Business.ownerUserId →
User.id` (`1:N`), y no existía ningún endpoint para resolverla. Esto se
documentó como riesgo conocido y se resolvió en `espera-back` (rama
`bugfix/resolve-user-business`) agregando `GET /api/business/me`.

`resolvePostLoginPath` ahora recibe la lista de negocios del usuario
(`businessOnboardingApi.listMine()`, que llama `GET /api/business/me`) y usa
el primero si existe, o `/business/new` si la lista viene vacía o la
consulta falla por cualquier motivo (ver Integración frontend).

**Deuda técnica registrada:** la primera versión de `GET /api/business/me`
quedó protegida con `authorize("business:edit")`, permiso exclusivo del rol
`business_admin`. Una cuenta `user` sin negocio recibía `403` en lugar de
`200 { businesses: [] }`, mezclando autorización con resultado de dominio.
Se corrigió quitando ese gate (el endpoint ya scopea por `ownerUserId`, el
permiso de rol no agregaba seguridad real), pero queda como antecedente de
que el acoplamiento implícito entre rol y "tiene negocio" puede repetirse si
se agregan otros caminos a `business_admin`.

**Segundo hallazgo, durante prueba manual:** el destino original sin negocio
era `/business/register` (`BusinessRegisterPage.jsx`), pero esa pantalla
consume `POST /api/auth/register-business` — el contrato de **alta pública
combinada** de HU-1.8/1.9 (crea cuenta + negocio para alguien sin cuenta
previa). Un usuario ya autenticado terminaba reescribiendo nombre, apellido,
email y password que ya había provisto. El contrato correcto para "cuenta
existente sin negocio" ya existía y nunca se usaba: `POST /api/business`
(`RegisterBusinessUseCase`, módulo `business`), que solo pide datos de
negocio y toma `ownerUserId` de la sesión. Ese endpoint tenía a su vez el
mismo bug de permiso que `GET /api/business/me` (`authorize("business:edit")`
bloqueando al rol `user`, que es exactamente para quien existe el endpoint);
se corrigió igual, quitando el gate de rol.

Se creó `BusinessCreatePage.jsx` (ruta `/business/new`, protegida por
`AuthLayout`) como pantalla dedicada para este caso, con solo los campos de
negocio. `BusinessRegisterPage.jsx` y `/business/register` quedaron
intactos en ese momento para su propósito original (alta pública combinada).

**Continúa en `HU-1.8`:** ese propósito original dejó de existir. El backend
deprecó `POST /api/auth/register-business` (alta combinada) a favor del
flujo separado cuenta→negocio, así que `BusinessRegisterPage.jsx` y la ruta
`/business/register` se eliminaron por completo — no quedó ningún flujo que
los consumiera. Ver `HU-1.8` para el rediseño final del onboarding de
negocio (panel vacío en vez de gate obligatorio, `BusinessCreatePage.jsx`
con el mismo lenguaje visual que login/registro).

## HU-1.5 - Refresh Token

Story points: no normalizado.

Estado: `implementado`

### Objetivo de experiencia

Una persona que ya inició sesión no debe volver a loguearse mientras su
sesión siga vigente en el backend, ni siquiera después de recargar la
página o de que su `accessToken` en memoria haya quedado inválido o
ausente.

### Pantallas / Rutas

```text
/panel/business/:businessId/*
```

No agrega pantalla propia: es un mecanismo de transporte que protege todas
las rutas detrás de `AuthLayout`.

### Estados de UI

- `loading`: `AuthLayout` muestra `LoadingScreen` mientras se resuelve la
  sesión (intento de `/auth/me`, y si hace falta, `refresh-token`).
- `authenticated`: se renderiza la ruta protegida.
- `anonymous`: redirección a `/login` con `state.from` para volver después.

### Integración frontend

- `useSessionBootstrap` (dentro de `AuthLayout`) llama siempre a
  `GET /api/auth/me`, sin condicionarlo a tener un `accessToken` cacheado.
- `httpClient` ya intercepta cualquier `401` (salvo el del propio
  `/auth/refresh-token`) y antes de propagar el error intenta
  `POST /api/auth/refresh-token` (cookie `refreshToken` httpOnly, sin body),
  y si responde ok, reintenta la request original una sola vez con el nuevo
  `accessToken`.
- Esto cubre dos casos antes no resueltos por separado: accessToken presente
  pero vencido, y accessToken ausente por completo (recarga dura) pero con
  cookie de sesión todavía válida.
- Si el refresh falla (cookie ausente o inválida), se limpia la sesión local
  y se deja que el `401` original propague, lo que lleva a `AuthLayout` a
  redirigir a `/login`.
- No hay refresh proactivo por expiración anticipada: el mecanismo es
  reactivo, disparado por el primer `401` de cualquier request autenticada.
- `tokenStorage` (`src/shared/auth/tokenStorage.js`) guarda el `accessToken`
  únicamente en una variable de módulo, nunca en `localStorage` ni
  `sessionStorage`. Cualquier recarga de página pierde el token a propósito;
  la sesión se restaura siempre por la cookie httpOnly, no por storage
  persistente legible desde JavaScript.

### Contratos consumidos

```text
POST /api/auth/refresh-token
GET /api/auth/me
```

### Datos esperados

```ts
type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};
```

El frontend web solo usa `accessToken` de la respuesta; el `refreshToken` en
body se ignora porque la rotación real ocurre vía cookie httpOnly.

### Reglas de presentación

- No hay UI propia de esta historia: el éxito es invisible para el usuario
  (no nota que hubo un refresh) y el único estado visible es el `loading`
  breve mientras se resuelve.
- El `LoadingScreen` debe evitar parpadeos largos: la resolución es un máximo
  de dos requests (`/auth/me` + `/auth/refresh-token` + reintento).

### Decisiones de producto / alcance

`useSessionBootstrap` deja de condicionar el fetch de `/auth/me` a la
presencia de `accessToken` en el store. Antes, sin token cacheado, la
pantalla redirigía directo a `/login` sin intentar la cookie de refresh,
contradiciendo el objetivo de la historia ("sin pedir login constante").

No se implementa refresh proactivo (por ejemplo, decodificar `exp` del JWT y
refrescar antes de que venza): el enfoque reactivo ya cubre el caso de uso
real con menos complejidad, y evita mantener un timer de sesión en el
cliente.

Se decidió sacar el `accessToken` de `localStorage` por superficie de XSS: un
script inyectado puede leer `localStorage` pero no una cookie `httpOnly`. El
`accessToken` dura 15 minutos y vive solo en memoria; el `refreshToken`
(30 días, el que de verdad importa proteger) ya estaba en cookie `httpOnly`
desde las bases del proyecto. El costo del cambio es una restauración de
sesión (un round-trip extra) en cada recarga dura, en vez de continuar
directo con un token cacheado.

### Diferidos

- Refresh proactivo por expiración anticipada.
- Métricas de sesión (duración, frecuencia de refresh).
- Tests de componentes.

### Validación

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.
- Cypress (`refresh-token.cy.js`) cubre: restauración de sesión en una ruta
  protegida sin `accessToken` en memoria vía cookie, redirección a `/login`
  cuando no hay sesión ni cookie válida, y confirmación de que el
  `accessToken` no queda persistido en `localStorage` tras un login exitoso.
- Flujo manual esperado: iniciar sesión, recargar cualquier ruta del panel y
  verificar que no redirige a `/login` (debe verse el `LoadingScreen` breve
  mientras se restaura por cookie) y que `localStorage` no contiene el
  `accessToken`.

## HU-1.6 - Logout

Story points: no normalizado.

Estado: `implementado`

### Objetivo de experiencia

Una persona autenticada puede cerrar su sesión desde el panel de negocio de
forma explícita, y al volver atrás con el navegador no debe poder seguir
viendo contenido protegido.

### Pantallas / Rutas

```text
/panel/business/:businessId/*
```

No agrega pantalla propia: el botón vive en el layout del panel
(`BusinessPanelLayout`), disponible desde cualquier sección.

### Estados de UI

- `idle`: botón "Cerrar sesión" disponible.
- `confirming`: modal de confirmación abierto, esperando que el usuario
  confirme o cancele.
- `loading`: dentro del modal, botón de confirmar deshabilitado con label
  "Cerrando sesión…".
- sin estado de error visible: el logout nunca le muestra un error al
  usuario, porque siempre termina sacándolo del panel (ver decisión abajo).

### Integración frontend

- `LogoutButton` (`src/features/auth/components/LogoutButton.jsx`) primero
  abre `ConfirmDialog` (`src/shared/ui/ConfirmDialog.jsx`); solo al
  confirmar dispara `authApi.logout()`, que llama `POST /api/auth/logout` y
  limpia la sesión local si responde ok.
- `ConfirmDialog` es un componente genérico de `shared/ui` (no exclusivo de
  auth): título, descripción, label de confirmar/cancelar y estado de
  carga configurables por props. Pensado para reusarse en cualquier acción
  destructiva o irreversible del panel (ej. futuras eliminaciones), no solo
  logout.
- El componente no depende de que la llamada al backend tenga éxito: en
  `onSettled` limpia la sesión local de forma explícita (`clearSession()`),
  remueve la cache de TanStack Query (`queryKey: ['session']`) y redirige a
  `/login` con `replace: true` sin importar si el backend respondió ok,
  falló o no hubo red.
- `replace: true` evita que el botón "atrás" del navegador vuelva a la
  pantalla del panel; aunque el usuario fuerce el "atrás", `AuthLayout`
  vuelve a correr `useSessionBootstrap` (HU-1.5) y, sin cookie de sesión
  válida, redirige de nuevo a `/login`.
- Se usa `BusinessPanelLayout` como único punto de montaje porque hoy es la
  única superficie protegida por `AuthLayout`.

### Contratos consumidos

```text
POST /api/auth/logout
```

### Datos esperados

No hay payload relevante para la UI: la respuesta exitosa es
`{ message: string }` y no se usa para nada más que confirmar el `200`.

### Reglas de presentación

- El botón del sidebar usa las clases utilitarias existentes
  (`button secondary`) del layout del panel, no introduce un nuevo sistema
  visual.
- El ícono (`LogOut` de `lucide-react`) acompaña el label, nunca lo
  reemplaza.
- El modal de confirmación usa `role="alertdialog"`, foco automático en el
  botón de confirmar al abrirse, y cierre con `Escape`.
- El botón de confirmar dentro del modal usa el color de peligro
  (`espera-danger`), distinto del botón que abre el modal, para remarcar
  que es la acción irreversible.

### Decisiones de producto / alcance

El logout se trata como una acción que **siempre** termina en `/login`,
incluso si `POST /api/auth/logout` falla por red o error de servidor. La
alternativa (mostrar un error y dejar al usuario "atascado" en el panel)
no tiene sentido de producto: la intención de salir es del usuario, no
depende de que el backend confirme. El peor caso de un fallo de red es que
la sesión del servidor (`RefreshSession`) quede viva hasta su expiración
natural (30 días) en lugar de revocarse al instante, lo cual es un costo
aceptable frente a frustrar la acción de logout.

### Diferidos

- Logout en todas las pestañas abiertas simultáneamente (no hay
  sincronización entre pestañas).
- Trampa de foco completa dentro del modal (hoy solo se enfoca el botón de
  confirmar al abrir; no se restringe el `Tab` para que no salga del modal).
- Tests de componentes.

### Validación

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.
- Cypress (`logout.cy.js`) cubre: cancelar el modal sin cerrar sesión,
  logout exitoso con redirección, logout que redirige igual aunque el
  backend falle, y que el botón "atrás" del navegador después de salir no
  vuelve a mostrar el panel.
- Flujo manual esperado: iniciar sesión, entrar al panel, hacer clic en
  "Cerrar sesión", confirmar en el modal, verificar redirección a `/login`,
  y confirmar que navegar de nuevo a una ruta del panel exige loguearse
  otra vez.

## HU-1.7 - Recuperación de password

Story points: no normalizado.

Estado: `implementado`

### Objetivo de experiencia

Una persona con cuenta local que olvidó su password puede pedir un enlace
de recuperación por email y, desde ahí, definir una contraseña nueva sin
necesidad de tener sesión activa.

### Pantallas / Rutas

```text
/forgot-password
/reset-password?token=:token
```

### Estados de UI

- `idle`: formulario listo para completar (en ambas pantallas).
- `loading`: botón deshabilitado con indicador de progreso.
- `success` (`/forgot-password`): confirmación genérica, sin revelar si el
  email existe.
- `invalid-link` (`/reset-password`): no llegó `token` en la URL.
- `error`: mensaje específico (`/forgot-password`) o genérico de enlace
  vencido/inválido (`/reset-password`).
- `validation`: mensajes por campo antes de enviar.

### Integración frontend

- `/forgot-password` dispara `POST /api/auth/forgot-password` con el email.
  El backend responde siempre `200` con el mismo mensaje genérico exista o
  no la cuenta (para no filtrar qué emails están registrados); el frontend
  refleja esto mostrando éxito sin más matices apenas la request resuelve
  ok.
- `/reset-password` lee `token` del query string (`useSearchParams`, mismo
  patrón que `VerifyEmailPage`) y lo manda junto con `password` y
  `confirmPassword` a `POST /api/auth/reset-password`.
- Si el reset tiene éxito, se navega a `/login` (`replace: true`); el
  backend ya revocó todas las `RefreshSession` activas del usuario, así que
  cualquier sesión vieja en otra pestaña/dispositivo queda inválida en el
  próximo request.
- Sin `token` en la URL, `/reset-password` no intenta ninguna request:
  muestra el estado de enlace inválido directo con link a
  `/forgot-password`.

### Contratos consumidos

```text
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Datos enviados

```ts
type ForgotPasswordRequest = {
  email: string;
};

type ResetPasswordRequest = {
  token: string;
  password: string;
  confirmPassword: string;
};
```

### Datos esperados

```ts
type ForgotPasswordResponse = {
  message: string;
};

type ResetPasswordResponse = {
  message: string;
};
```

### Reglas de presentación

- El password nuevo exige las mismas reglas que registro (mínimo 8
  caracteres, mayúscula, minúscula y número), validadas en cliente con el
  mismo patrón que `registerSchema`.
- Los errores de `POST /api/auth/reset-password` no traen código funcional
  (`AppError` sin segundo argumento en `ResetPasswordUseCase`), así que se
  usa un mensaje genérico de "enlace inválido o vencido" con link directo a
  pedir uno nuevo, en vez de mostrar el texto en inglés del backend.
- El copy visible de la interfaz se escribe en español rioplatense.
- `/forgot-password` y `/reset-password` usan el mismo tratamiento visual
  que `/login` y `/register` (escena animada + tarjeta), no el estilo
  utilitario plano de `/verify-email`: son parte del mismo flujo de acceso
  al panel, no pantallas de tránsito.

### Decisiones de producto / alcance

`/forgot-password` no distingue "email no encontrado" de "email enviado":
el backend ya implementa esa ambigüedad a propósito (`RequestPasswordResetUseCase`
devuelve el mismo mensaje en ambos casos) para no permitir enumerar cuentas
registradas. El frontend respeta esa decisión y no agrega lógica que la
contradiga.

Al sumar estas dos pantallas con el mismo tratamiento visual de login y
registro, la escena decorativa (fondo animado, glows, logo fantasma) dejaba
de ser exclusiva de dos pantallas y pasaba a ser compartida por cuatro. Se
extrajo `AuthVisualScene.jsx` (genérico, parametrizado por `title`,
`description` y un slot opcional `decoration`) y `LoginVisualScene.jsx`/
`RegisterVisualScene.jsx` pasaron a ser wrappers finos sobre ese
componente, en vez de mantener cuatro copias del mismo bloque decorativo.

### Diferidos

- Reenvío del email de recuperación desde `/forgot-password` (el usuario
  tiene que volver a completar el formulario si no llegó).
- Tests de componentes.
- Medición de analytics.

### Validación

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.
- Cypress (`password-recovery.cy.js`, 8 tests) cubre: validación de email
  en `/forgot-password`, confirmación genérica exitosa, error genérico de
  backend, link inválido sin token en `/reset-password`, validación de
  password y de confirmación, reset exitoso con redirección a `/login`, y
  enlace vencido/inválido sin perder el formulario.
- Flujo manual esperado: pedir recuperación con un email registrado, abrir
  el enlace del email real (no el de un test), completar la nueva
  contraseña, y verificar que el login viejo (con sesiones previas) ya no
  funciona en otras pestañas.

### Nota técnica relacionada (backend)

Los enlaces de `verify-email` y `reset-password` que arma el backend
(`src/shared/infrastructure/email.ts`) tenían el prefijo `/auth/` (ej.
`/auth/reset-password?token=...`), que no coincide con las rutas reales del
frontend (`/reset-password`, `/verify-email`, sin prefijo). Se corrigió en
`espera-back` (rama `bugfix/resolve-user-business`, commit
`09e4e43`), junto con el valor de ejemplo de `APP_URL` en `.env.example`
(apuntaba al puerto del backend, no al del frontend). Afectaba también al
enlace de verificación de email ya mergeado.

## HU-1.8 - Registro de negocio con cuenta pendiente

Story points: no normalizado.

Estado: `implementado`

### Objetivo de experiencia

Una persona con cuenta verificada puede entrar al panel **sin tener negocio
todavía**: lo ve vacío, con un aviso y un botón para registrarlo cuando
quiera. Al registrarlo, el negocio queda pendiente de revisión, pero la
persona sigue operando el panel (por ahora, viéndolo) sin que nada la
bloquee.

### Pantallas / Rutas

```text
/panel
/panel/business/:businessSlug/*
/business/new
```

### Estados de UI

- `empty`: `/panel` sin negocio asociado — aviso + botón "Registrar tu
  negocio", sidebar con la navegación deshabilitada (no hay nada que
  navegar todavía).
- `pending`: banner de advertencia en `BusinessPanelLayout` cuando
  `status === 'pending'`.
- `rejected`: banner de error cuando `status === 'rejected'`.
- `approved`: sin banner de aprobación; si además hay `listingStatus`, se
  muestra el estado público de discovery.
- `loading` / `error` (alta de negocio): mismos estados que cualquier
  formulario del resto de la épica.

### Integración frontend

- El post-login (`HU-1.3`, `HU-1.9`) manda a `/panel` cuando la cuenta no
  tiene negocios, en vez de forzar un formulario antes de dejar entrar al
  panel.
- `BusinessPanelLayout` (`src/app/layouts/BusinessPanelLayout.jsx`) resuelve
  el negocio actual a partir del `:businessSlug` de la URL: consulta
  `GET /business/me`, busca el que matchea por `slug` y llena
  `useCurrentBusinessStore` (`src/shared/business/currentBusinessStore.js`)
  con `id`, `slug`, `name`, `status`, `listingStatus`, `operationalStatus`.
  Sin `businessSlug` en la URL (ruta `/panel`), limpia el store y renderiza
  `NoBusinessPanel` como `index`.
- `NoBusinessPanel.jsx` es solo el aviso + link a `/business/new`; no arma
  el negocio, delega en `BusinessCreatePage`.
- `BusinessCreatePage.jsx` (ruta `/business/new`, protegida por
  `AuthLayout`) pide nombre, categoría (`GET /business/categories`) y
  dirección, dispara `POST /business` y, en el `onSuccess`:
  1. llama a `authApi.refreshToken()` — el JWT actual sigue diciendo
     `role: user` hasta el próximo login/refresh, y recién con el token
     nuevo refleja `business_admin`;
  2. navega a `/panel/business/:businessSlug` con el `slug` que devuelve la
     respuesta (nunca el `id`).
- El sidebar de `BusinessPanelLayout` nunca muestra el `id`/UUID interno:
  mientras se resuelve el negocio actual muestra `…`, y una vez resuelto
  muestra `name`.

### Contratos consumidos

```text
GET /api/business/me
GET /api/business/categories
POST /api/business
POST /api/auth/refresh-token
```

### Datos enviados

```ts
type CreateBusinessRequest = {
  name: string;
  categoryId: string;
  address: string;
};
```

### Datos esperados

```ts
type CreateBusinessResponse = {
  businessId: string;
  businessSlug: string;
  status: 'pending';
};
```

### Reglas de presentación

- `BusinessCreatePage` usa el mismo lenguaje visual que `/login` y
  `/register` (`BusinessCreateVisualScene.jsx` + `BusinessCreateFormPanel.jsx`,
  ambos reusando `AuthVisualScene`/`AuthField` en vez de inventar un
  sistema propio): coherencia visual en todo el onboarding, no solo en el
  primer paso.
- El botón de navegación de la sidebar se deshabilita visualmente
  (`panel-layout__nav-item--disabled`) en vez de ocultarse cuando no hay
  negocio: comunica que esas secciones van a existir, no que no existen.
- El copy visible de la interfaz se escribe en español rioplatense.

### Decisiones de producto / alcance

El diseño original obligaba a completar el formulario de negocio antes de
dejar entrar al panel (gate previo). Se cambió a "panel primero, negocio
cuando quieras" porque el objetivo real de esta historia es que la persona
pueda **ver** el panel apenas verifica su cuenta, no que opere con datos
reales — operar de verdad es Épica 2. Forzar el formulario antes de mostrar
nada no aportaba valor y sí fricción.

`POST /business` no expone el `id` interno en ningún lugar visible (URL,
sidebar, breadcrumbs); solo se usa internamente, guardado en
`useCurrentBusinessStore`, para el día en que las pantallas de gestión
(perfil, horarios, QR, empleados — hoy placeholders) necesiten armar
llamadas a los endpoints que todavía piden `businessId` en la URL (ver
Riesgos y Pendientes al final del documento).

Se llama a `POST /auth/refresh-token` explícitamente después de crear el
negocio, en vez de esperar a que el usuario recargue o vuelva a loguearse:
sin esto, el usuario vería reflejado su nuevo rol `business_admin` recién
en la próxima sesión, lo cual es confuso justo después de una acción que
acaba de completar.

### Diferidos

- Selección entre negocios cuando una cuenta tiene más de uno (siempre se
  usa el primero de la lista, igual que en `HU-1.3`).
- Páginas de gestión reales (perfil, horarios, operación, QR, empleados):
  hoy son placeholders (`PlaceholderPage`), Épica 2.
- `PendingReviewLayout.jsx`, `BusinessPendingReviewPage.jsx` y
  `ApprovalStatusBadge.jsx` quedaron como scaffolding de un intento previo,
  sin ruta que los use; no se eliminaron ni se conectaron, decisión
  pendiente para un bugfix aparte.
- Tests de componentes.

### Validación

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.
- Cypress (`business-create.cy.js`, 5 tests) cubre: render de `/business/new`
  con solo campos de negocio, validaciones cliente, alta exitosa con
  refresh de token y redirección por `slug`, error de backend sin perder el
  formulario, y redirección a `/login` sin sesión.
- Flujo manual esperado: loguearse sin negocio, ver `/panel` vacío con el
  aviso, tocar "Registrar tu negocio", completar el formulario, confirmar
  que redirige a `/panel/business/:slug` con el banner de "pendiente de
  revisión" visible.

## HU-1.9 - OAuth de Google (panel web)

Story points: no normalizado.

Estado: `implementado`

### Objetivo de experiencia

Una persona puede crear cuenta o iniciar sesión indistintamente con Google
desde `/login` **o** `/register` — el resultado es el mismo (sesión
iniciada, mismo destino post-login que `HU-1.3`) sin que la persona tenga
que saber de antemano si ya tenía cuenta o no.

### Pantallas / Rutas

```text
/login
/register
/oauth/google/callback
```

### Estados de UI

- `idle`: botón "Continuar con Google" disponible (en login y en registro).
- `loading` (botón): pidiendo la URL de autorización a Google, justo antes
  de redirigir el navegador.
- `loading` (callback): "Conectando con Google…" mientras se intercambia
  `code`/`state` por sesión.
- `error` (callback): mensaje específico según el motivo (cancelado en
  Google, enlace inválido, o código funcional del backend) con link a
  volver a `/login`.
- éxito: no tiene estado propio visible, redirige igual que un login
  exitoso por email/password.

### Integración frontend

- `useGoogleAuthRedirect` (`src/features/auth/hooks/useGoogleAuthRedirect.js`)
  centraliza el pedido de `GET /auth/google/url` y el
  `window.location.assign(url)`; lo usan tanto `LoginPage` como
  `RegisterPage`.
- `GoogleAuthButton` (`src/features/auth/components/GoogleAuthButton.jsx`)
  es el botón + divisor + mensaje de error, compartido entre
  `LoginFormPanel` y `RegisterFormPanel` — mismo componente, no una copia
  por pantalla.
- `GoogleCallbackPage.jsx` lee `code`, `state` y `error` de la URL
  (`useSearchParams`) y usa **`useQuery`** (no `useMutation` disparado
  desde un `useEffect`) para llamar `POST /auth/login/google`, siguiendo el
  mismo patrón que `VerifyEmailPage` (fetch en mount atado a un parámetro
  de URL). Al resolver con éxito, dispara el mismo
  `usePostLoginRedirect` que usa `LoginPage`.
- El backend resuelve login/registro en un único endpoint
  (`POST /auth/login/google`) con semántica *find-or-create*: si el email
  de Google no tiene cuenta, la crea (`role: user`, sin password, email
  verificado por Google); si ya existe, hace login. El frontend no
  necesita distinguir los dos casos.

### Contratos consumidos

```text
GET /api/auth/google/url
POST /api/auth/login/google
```

### Datos enviados

```ts
type LoginWithGoogleRequest = {
  code: string;
  state: string;
};
```

### Datos esperados

```ts
type GoogleUrlResponse = {
  url: string;
  state: string;
};

type LoginWithGoogleResponse = {
  accessToken: string;
  refreshToken: string;
};
```

### Reglas de presentación

- El botón es idéntico en `/login` y `/register`: mismo ícono, mismo label
  ("Continuar con Google"), mismo lugar relativo al formulario (debajo, con
  un divisor "o").
- Los códigos de error del backend se traducen en `getLoginErrorMessage`
  (compartido con `HU-1.3`, ver `loginErrorMessages.js`):
  `GOOGLE_OAUTH_STATE_MISMATCH`, `GOOGLE_EMAIL_NOT_VERIFIED`,
  `AUTH_PROVIDER_MISMATCH` (el email ya existe pero se registró con
  password), `GOOGLE_ACCOUNT_MISMATCH` y `ACCOUNT_REJECTED`.
- El copy visible de la interfaz se escribe en español rioplatense.

### Decisiones de producto / alcance

Se descartó a propósito un endpoint de "registro con Google" separado del
de "login con Google" (que hubiera espejado `POST /auth/register` vs
`POST /auth/login`). Esa separación tiene sentido en email/password porque
registrar necesita verificar el email y pedir password — Google ya
resuelve las dos cosas por su cuenta (entrega el email verificado, es el
propio mecanismo de auth), así que no había ninguna razón real para
bloquear a alguien nuevo con "no encontramos tu cuenta, registrate primero"
cuando ya demostró ser dueño del email. Un solo botón, un solo endpoint,
mismo resultado desde cualquiera de las dos pantallas.

**Nota técnica (bug de librería):** la primera versión de
`GoogleCallbackPage` usaba `useMutation` disparada desde un `useEffect` al
montar. Bajo `StrictMode`, la mutación quedaba encallada en `pending` para
siempre — el fetch se completaba (confirmado con la request real en las
DevTools) pero el estado de React Query nunca se actualizaba a
`success`/`error`. Se resolvió reemplazando el patrón por `useQuery` con
`enabled`, igual que ya hacía `VerifyEmailPage` para el mismo tipo de caso
("ejecutar un fetch una vez al montar, atado a un parámetro de la URL").

**Nota técnica (config, backend):** en desarrollo local, `GOOGLE_CALLBACK_URL`
y `APP_URL` (`espera-back/.env`, no trackeado en git) deben apuntar al
**origen del frontend** (`http://localhost:5173`), no al del backend
(`http://localhost:3000`). Google redirige el navegador directo a
`GOOGLE_CALLBACK_URL` tal cual está configurado — si apunta al backend, cae
en un `404 Cannot GET` porque ahí no existe (ni debe existir) una ruta
`GET /auth/google/callback`: quien procesa el `code`/`state` es
`GoogleCallbackPage.jsx` en el frontend. Además, el "Authorized redirect
URI" configurado en Google Cloud Console tiene que matchear exacto ese
valor, o Google rechaza el intercambio con `redirect_uri_mismatch`.

### Diferidos

- `HU-1.2` / `HU-1.4`: registro/login con Google en app móvil (dependen de
  la app móvil y su configuración OAuth propia).
- Tests de componentes.
- Medición de analytics.

### Validación

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.
- Cypress (`google-login.cy.js`, 5 tests) cubre: login exitoso sin
  negocios (→ `/panel`), login exitoso con negocio (→
  `/panel/business/:slug`), cancelación en Google, enlace sin
  `code`/`state`, y error funcional (`AUTH_PROVIDER_MISMATCH`). Se sumó un
  test a `login.cy.js` y otro a `register.cy.js` para el botón pidiendo la
  URL de autorización.
- Validado manualmente end-to-end en navegador real contra Google OAuth
  real (no solo mockeado): detectó y permitió corregir el problema de
  `GOOGLE_CALLBACK_URL`/`APP_URL` mal configurados, que ningún test
  automatizado con intercepts podía haber encontrado.
- Flujo manual esperado: desde `/login` o `/register`, tocar "Continuar con
  Google", completar el consentimiento real, y verificar que vuelve
  autenticado al destino correcto según tenga o no negocio.

## Riesgos y Pendientes Transversales

- **Gap de contrato con backend:** los endpoints de gestión de negocio
  (perfil, horarios, service-windows, estado operativo, QR, empleados — 9
  rutas en total) siguen pidiendo el `businessId` interno en la URL, pero
  el frontend hoy solo expone/usa el `slug` en rutas y UI. El `id` queda
  disponible en `useCurrentBusinessStore` para cuando esas pantallas dejen
  de ser placeholders, pero no está probado end-to-end porque todavía no
  existen. Si el backend no ofrece una forma de resolver `slug → id` (o no
  acepta `slug` directamente en esas rutas), esas pantallas no van a poder
  armar sus llamadas.
- **Scaffolding sin resolver:** `PendingReviewLayout.jsx`,
  `BusinessPendingReviewPage.jsx` y `ApprovalStatusBadge.jsx` no están
  ruteados en ningún lado. Candidatos a eliminar o a wirear, pendiente de
  decisión.
- ~~**Selección de negocio:** ninguna pantalla soporta todavía elegir entre
  varios negocios de una misma cuenta; siempre se opera con el primero de
  la lista.~~ Resuelto — ver refinamiento "switcher de sucursal" al final
  de este documento.
- **Cobertura E2E 100% mockeada:** Cypress corre contra `cy.intercept`, sin
  backend real ni base de datos real en el pipeline. La validación con
  Google OAuth real (`HU-1.9`) y con Postman/backend real sigue siendo
  manual.
- Cierre de `HU-1.2`/`HU-1.4` (mobile) cuando exista app registrada.

## Refinamiento — switcher de sucursal en el panel (2026-08-21)

Un dueño puede tener varias `Business` (sucursales) bajo la misma cuenta,
pero hasta ahora no había ninguna forma de moverse entre ellas desde el
panel salvo cambiando la URL a mano (`/panel/business/:slug`) sabiendo el
slug de memoria — `resolvePostLoginPath.js` siempre aterriza en
`businesses[0]` (comentario explícito en el código: "selection between
them is deferred"). No hacía falta nada nuevo del backend:
`ListMyBusinessesUseCase` (`GET /business/me`, ya consumido en
`BusinessPanelLayout.jsx` vía `businessOnboardingApi.listMine`) ya
devolvía la lista completa con `slug`/`name`/`status`, todo lo necesario.

### Cambios

- `BusinessPanelLayout.jsx` — el nombre del negocio en el topbar
  (`.panel-layout__topbar-business`) pasa a ser un `<select>` nativo
  cuando `businessesQuery.data.length > 1`, con el mismo look tipográfico
  que el texto plano que reemplaza (mismo criterio que el selector de
  colas en `BusinessQueuePage.jsx`: invisible en el caso común de una sola
  sucursal, sin agregar UI de más). Elegir una sucursal navega a
  `/panel/business/:slug` — reusa el mecanismo que el layout ya tiene para
  resolver `currentBusiness` a partir del `businessSlug` de la URL, sin
  estado nuevo.
- `resolvePostLoginPath.js` **no se tocó a propósito** — sigue aterrizando
  en `businesses[0]` después del login; alcanza con que, una vez adentro,
  el dueño pueda moverse a las demás con el switcher nuevo.

### Explícitamente fuera de alcance

Nada de comparación/agregación entre sucursales (métricas cruzadas, "cuál
tiene menos espera ahora ahora") — es navegación, no comparación. Quedó
anotado aparte, sin urgencia.

### Cobertura

- `cypress/e2e/business-panel-switcher.cy.js` — no aparece con una sola
  sucursal; con dos, aparece, arranca en la sucursal de la URL actual, y
  elegir la otra navega correctamente.

No pude correr la suite en este entorno (Cypress no levanta su binario de
Electron acá); verificado por lint + build + lectura de código.

## Refinamiento — alta de sucursal adicional desde el panel (2026-08-21)

El switcher de arriba resuelve moverse entre sucursales que ya existen,
pero no había ninguna forma de **crear** una adicional una vez que la
cuenta ya tenía al menos una — `/business/new` (`BusinessCreatePage.jsx`)
solo estaba enlazado desde `NoBusinessPanel.jsx`, la pantalla de "todavía
no tenés negocio" (cero sucursales). Reportado al revisar por qué una
cuenta con el plan recién cambiado "no tiene para switchear": la cuenta
tenía una sola sucursal, así que el switcher no debía aparecer (correcto),
pero tampoco había manera de agregar una segunda sin escribir la URL a
mano.

### El dato que faltaba: `maxBusinesses` no estaba en el mirror del frontend

`shared/business/planLimits.js` (mirror de `PLAN_LIMITS` de
`espera-back`) solo tenía `maxQueuesPerBusiness`/`maxServiceWindowsPerQueue`
— le faltaba `maxBusinesses`, que el backend sí tiene:
**`basic: 1`, `pro: 1`, `premium: Infinity`**. Dato importante para
cualquiera probando esto: cambiar una cuenta a plan **Pro** habilita
colas ilimitadas *por negocio*, pero no un segundo negocio — para eso
hace falta **Premium**. Agregado al mirror del frontend.

### Cambios

- `BusinessPanelLayout.jsx` — botón "+" (`aria-label="Agregar sucursal"`)
  junto al switcher/nombre del negocio en el topbar, enlaza a
  `/business/new`. Visible solo si `businessesQuery.data.length <
  getPlanLimit(plan).maxBusinesses` — mismo criterio de "invisible en el
  caso común" que el switcher y que "Crear cola" en `QueuesControl.jsx`;
  en la práctica solo lo ven cuentas Premium.
- `BusinessCreatePage.jsx` **no se tocó** — ya funciona como ruta
  standalone independiente de cuántos negocios tenga la cuenta (navega a
  `/panel/business/:slug` del nuevo negocio al crearlo), no asumía "cero
  negocios" en ningún lado.

### Cobertura

- `cypress/e2e/business-panel-switcher.cy.js` — el botón no aparece con
  plan basic/pro (una sola sucursal permitida); aparece y apunta a
  `/business/new` con plan premium.

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.

## Bugfix — "Volver al panel" mandaba a un dueño con negocio a la pantalla vacía (2026-08-21)

Reportado al probar el "+ Nueva sucursal" recién agregado: un dueño que ya
tiene un negocio, entra a `/business/new` para crear el segundo, y toca
"Volver al panel" (`to="/panel"`, sin slug) — en vez de volver a su
negocio, aterrizaba en `NoBusinessPanel` ("Todavía no registraste tu
negocio"), como si la cuenta no tuviera ninguno.

### La causa

`/panel` (la ruta índice, sin `:businessSlug`) tenía como único hijo
`<Route index element={<NoBusinessPanel />} />` — **incondicional**, sin
ninguna consulta de si la cuenta realmente tiene negocios. Tenía sentido
mientras el único camino hacia esa ruta era el redirect post-login con
cero negocios (`resolvePostLoginPath.js`) — pero "Volver al panel" abrió
un segundo camino hacia la misma ruta para una cuenta que sí tiene
negocios, y ahí quedó expuesto que la ruta nunca chequeaba nada.

### Fix

Nuevo `PanelIndexRedirect.jsx` como elemento de esa ruta índice: pide
`GET /business/me` (mismo `queryKey: ['business-me']` que ya usa
`BusinessPanelLayout.jsx`, así que no duplica el fetch — cachea) y:
- si hay al menos un negocio, navega a `/panel/business/:slug` del
  primero (misma regla "el primero encontrado" que
  `resolvePostLoginPath.js`, por consistencia);
- si no hay ninguno, recién ahí muestra `NoBusinessPanel`.

`resolvePostLoginPath.js` no se tocó — sigue resolviendo el destino
post-login por su cuenta; este fix cubre la ruta `/panel` bare en sí
misma para cualquier otro camino que termine ahí (bookmarks viejos,
"Volver al panel", etc.), no solo el login.

### De paso — alerta de error del formulario de alta, unificada

`BusinessCreateFormPanel.jsx` tenía su propio cuadro de error
(`border-[#f3b7ce] bg-[#fff3f7]`, colores hardcodeados) en vez de
reusar `.business-alert business-alert--danger`, que ya existe y se ve
prácticamente igual — duplicado accidental, no una decisión de diseño.
Reemplazado.

### Cobertura

- `cypress/e2e/business-create.cy.js` — "Volver al panel" con una cuenta
  que ya tiene un negocio navega a `/panel/business/:slug`, no a la
  pantalla vacía; `/panel` sin negocios sigue mostrando `NoBusinessPanel`
  (caso real preservado).

No pude correr la suite en este entorno (mismo bloqueo de Cypress);
verificado por lint + build + lectura de código.
