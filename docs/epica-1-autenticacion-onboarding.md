# Épica 1 - Autenticación y Onboarding

## Resumen

La Épica 1 cubre el acceso inicial a Espera desde el frontend web: registro,
login, sesión, verificación de email, recuperación de password y onboarding de
negocios.

El primer corte se enfoca en flujos públicos del panel y en preparar el acceso
al panel web de negocios. Los flujos mobile de usuario final quedan diferidos.

## Estado general

- Estado: `implementado parcialmente`.
- Historias implementadas: `HU-1.1`, `HU-1.3`, `HU-1.5`.
- Historias parciales: rutas base para verificación de email, recuperación
  de password, callback OAuth y onboarding de negocio.
- Historias diferidas: registro/login Google mobile.
- Motivos de diferidos: dependen de la app móvil, deep links y configuración real
  por plataforma.

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
POST /api/auth/register-business
POST /api/auth/register-business/google
POST /api/auth/login/google
```

Sesión:

```text
POST /api/auth/refresh-token
POST /api/auth/logout
GET /api/auth/me
```

Admin:

```text
PATCH /api/business/:businessId/approve
```

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

- Reenvío de verificación desde esta pantalla.
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
- Si el login responde `200`, el `accessToken` se guarda vía `persistSession`
  y se precarga la cache de TanStack Query (`queryKey: ['session']`) llamando
  a `GET /api/auth/me` antes de redirigir, para conocer `businessId` sin
  esperar un segundo round-trip en `AuthLayout`.
- Redirección post-login: si existe `location.state.from` (ruta protegida que
  disparó el login), se vuelve ahí. Si no, y el usuario ya tiene
  `businessId`, se navega a `/panel/business/:businessId`; si no tiene
  negocio asociado, se navega a `/business/register`.
- Si el backend responde error, se conserva el formulario y se muestra un
  mensaje específico mapeado por código funcional (`getLoginErrorMessage`).
- No se invalida cache adicional: el login es el punto de entrada de la
  sesión, no hay datos previos que limpiar.

### Contratos consumidos

```text
POST /api/auth/login
GET /api/auth/me
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
    businessId?: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
  };
};
```

### Reglas de presentación

- El formulario muestra campos de email y password, sin reglas de fuerza de
  password (eso es exclusivo de registro).
- El campo de password permite mostrar u ocultar el valor ingresado.
- El botón principal se deshabilita mientras se envía el formulario.
- Los errores de backend se traducen a mensajes en español según el código
  funcional, nunca se muestra el mensaje crudo en inglés que devuelve la API:
  - `EMAIL_NOT_VERIFIED`: invita a revisar el email, sin ofrecer un botón de
    reenvío porque esa pantalla (`/verify-email`) sigue siendo un placeholder.
  - `ACCOUNT_PENDING_REVIEW` / `ACCOUNT_REJECTED`: estado de revisión de la
    cuenta de negocio.
  - `LOGIN_TEMPORARILY_BLOCKED`: bloqueo temporal por intentos fallidos.
  - Sin código (401 credenciales inválidas) o error inesperado: mensaje
    genérico que no revela si falló el email o la password.
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
- Selección de negocio cuando una cuenta pertenece a más de uno.
- Login Google web end-to-end.
- Tests de componentes.
- Medición de analytics.

### Validación

- `npm run lint`: ok.
- `npm run build`: ok.
- `npm run test:e2e`: ok.
- Cypress cubre render de `/login`, validaciones cliente sin request al
  backend, submit exitoso con normalización de email, redirección a
  `/business/register` sin negocio asociado, redirección a
  `/panel/business/:businessId` con negocio asociado, y los cuatro casos de
  error funcional (`EMAIL_NOT_VERIFIED`, `ACCOUNT_PENDING_REVIEW`,
  `LOGIN_TEMPORARILY_BLOCKED`, credenciales inválidas sin código).
- Flujo manual esperado: abrir `/login`, completar credenciales válidas,
  enviar, y verificar la redirección esperada según si la cuenta tiene
  negocio asociado.

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
