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

- Estado: `setup inicial implementado`.
- Épicas en preparación: `Épica 1 - Autenticación y Onboarding`,
  `Épica 2 - Gestión de Negocios`.
- Historias implementadas: `HU-1.1 - Registro con email y password`,
  `HU-1.3 - Login con email y password`, `HU-1.5 - Refresh Token`,
  `HU-1.6 - Logout`, `HU-1.7 - Recuperación de password`, verificación de
  email (contrato de `HU-1.1`).
- Historias parciales: rutas base y placeholders para onboarding
  combinado/Google, panel de negocio, QR y empleados.
- Historias diferidas: mobile completa, deep links definitivos, cola persistida,
  métricas operativas, notificaciones push end-to-end, Google OAuth end-to-end.

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
    ui/
  features/
    auth/
    business-onboarding/
    business-profile/
    business-hours/
    business-operations/
    business-qr/
    business-employees/
```

## Superficies frontend

### Auth pública del panel

Responsabilidades:

- login;
- registro de usuario;
- recuperación de password;
- verificación de email;
- callback OAuth web.

Estado:

- `HU-1.1` implementada para `/register`;
- `HU-1.3` implementada para `/login`;
- `HU-1.5` implementada como mecanismo de transporte (sin pantalla propia)
  que protege todas las rutas detrás de `AuthLayout`;
- `HU-1.6` implementada: botón "Cerrar sesión" en `BusinessPanelLayout`;
- verificación de email implementada para `/verify-email`, con reenvío de
  enlace cuando el token falta, es inválido o venció;
- `HU-1.7` implementada: `/forgot-password` y `/reset-password`;
- rutas creadas para el resto de auth pública;
- placeholders visibles en flujos pendientes;
- Google OAuth web tiene contrato conocido, pero no se expone como acción de
  registro hasta implementar el callback completo;
- integración real pendiente historia por historia.

### Panel de negocios

Responsabilidades:

- perfil del negocio;
- horarios;
- ventanillas activas;
- estado operativo;
- QR;
- empleados.

Estado:

- layout base creado;
- rutas creadas;
- integración real pendiente historia por historia.

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
  submit exitoso, normalización de datos, error backend y ausencia de CTA Google
  operativo mientras OAuth siga diferido.
- Cypress e2e cubre `HU-1.3` en `/login`: render, validaciones cliente, submit
  exitoso con redirección según `businessId`, y los errores funcionales
  `EMAIL_NOT_VERIFIED`, `ACCOUNT_PENDING_REVIEW`, `LOGIN_TEMPORARILY_BLOCKED` y
  credenciales inválidas.
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
  usuario o a `/business/new` si todavía no tiene uno.
- Cobertura e2e: `cypress/e2e/login.cy.js`.
- Bugfix: `/business/register` (alta pública combinada, `POST
  /api/auth/register-business`) era el destino post-login para cuentas sin
  negocio, pidiéndole de nuevo identidad a un usuario ya autenticado. Se creó
  `BusinessCreatePage.jsx` en `/business/new` (protegida, solo campos de
  negocio, `POST /api/business`) como destino correcto.
- Cobertura e2e: `cypress/e2e/business-create.cy.js`.
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

## Próximo trabajo

Con el ciclo de sesión de la Épica 1 cerrado (registro, login, refresh,
logout, verificación de email y recuperación de password), la siguiente
unidad funcional propuesta es retomar el onboarding combinado de negocio
(`HU-1.8`/`HU-1.9`).
