# Frontend - Arranque Épicas 1 y 2

## Objetivo

Este documento resume lo necesario para iniciar el frontend de Espera usando una
estructura `feature-based`. El primer foco recomendado es el panel web de
negocio, porque las épicas 1 y 2 ya tienen backend suficiente para autenticación,
onboarding y gestión operativa inicial.

## Alcance recomendado del primer corte

El frontend debería arrancar con tres superficies:

- Panel de negocio autenticado.
- Flujos públicos livianos: verificación de email, reset de password,
  aceptación de invitación y resolución QR.
- Pantallas administrativas mínimas solo si se necesita aprobar cuentas de
  negocio desde UI.

Fuera del primer corte:

- App móvil completa.
- Login/registro Google mobile.
- Cola persistida real.
- Métricas operativas.
- Notificaciones push end-to-end.

## Estructura Feature-Based Sugerida

```text
src/
  app/
    router/
    providers/
    layouts/
  shared/
    api/
      httpClient.ts
      apiError.ts
    auth/
      tokenStorage.ts
      session.ts
    ui/
    config/
    utils/
    types/
  features/
    auth/
      api/
      model/
      pages/
      components/
      hooks/
    business-onboarding/
      api/
      model/
      pages/
      components/
    business-profile/
      api/
      model/
      pages/
      components/
    business-hours/
      api/
      model/
      pages/
      components/
    business-operations/
      api/
      model/
      pages/
      components/
    business-qr/
      api/
      model/
      pages/
      components/
    business-employees/
      api/
      model/
      pages/
      components/
    public-entry/
      api/
      model/
      pages/
      components/
```

Regla práctica:

- `shared` contiene infraestructura reusable sin conocimiento de una historia.
- `features/*/api` conoce endpoints concretos.
- `features/*/model` define tipos, schemas, mappers y estado local de la feature.
- `features/*/pages` contiene pantallas enrutable.
- `features/*/components` contiene UI propia de la feature.

## Base HTTP y Sesión

El backend usa:

- `Authorization: Bearer <accessToken>` para endpoints autenticados.
- Cookie `refreshToken` httpOnly al hacer login/refresh.
- `POST /api/auth/refresh-token` para rotar sesión.

Recomendación frontend:

- Guardar `accessToken` en memoria o storage controlado por la app.
- Enviar requests con `credentials: "include"` para que viaje la cookie.
- Centralizar retry de `401` con refresh token.
- No depender de leer la cookie de refresh desde JavaScript.

Roles relevantes:

```ts
type Role = "user" | "employee" | "business_admin" | "super_admin";
type ApprovalStatus = "pending" | "approved" | "rejected";
```

Permisos prácticos para UI:

- `business_admin`: accede a configuración del negocio y empleados.
- `employee`: accede a operación de cola futura, no a configuración ni métricas.
- `super_admin`: puede aprobar cuentas de negocio.
- `user`: perfil consumidor; no es foco del panel actual.

## Épica 1 - Autenticación y Onboarding

### Feature: `auth`

Pantallas sugeridas:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/oauth/google/callback`

Endpoints:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/login/google
POST /api/auth/refresh-token
POST /api/auth/logout
GET /api/auth/me
GET /api/auth/verify-email?token=:token
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/google/url
```

Contratos principales:

```ts
type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type RegisterResponse = {
  userId: string;
};
```

Estados de UX importantes:

- Email no verificado: mostrar pantalla de aviso y acción de reenviar email.
- Cuenta de negocio pendiente: bloquear ingreso al panel y mostrar estado de
  revisión.
- Cuenta de negocio rechazada: mostrar mensaje claro y canal de soporte.
- Login inválido o rate limit: mostrar error sin perder el formulario.

### Feature: `business-onboarding`

Pantallas sugeridas:

- `/business/register`
- `/business/register/google`
- `/business/pending-review`

Endpoints:

```text
POST /api/auth/register-business
POST /api/auth/register-business/google
PATCH /api/auth/business-accounts/:userId/approve
```

Contrato base:

```ts
type RegisterBusinessRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessSlug: string;
  categoryId: string;
  address?: string;
};

type RegisterBusinessResponse = {
  userId: string;
  businessId: string;
  approvalStatus: "pending";
};
```

Notas de producto:

- La cuenta de negocio puede verificar email antes de ser aprobada.
- El panel operativo debe quedar bloqueado hasta `approvalStatus: "approved"`.
- Google OAuth web usa `state` y cookie temporal; el callback visual es del
  frontend.

## Épica 2 - Gestión de Negocios

### Feature: `business-profile`

Pantallas sugeridas:

- `/panel/business/:businessId/profile`
- Primer paso de configuración luego del onboarding.

Endpoints:

```text
POST /api/business
PATCH /api/business/:businessId/profile
GET /api/business/categories/:categoryId/config
```

Contrato de edición:

```ts
type UpdateBusinessProfileRequest = {
  name?: string;
  categoryId?: string;
  address?: string;
};

type CategoryAttribute = {
  key: string;
  label: string;
  type: "number" | "text" | "boolean" | "select";
  required: boolean;
};
```

UX esperada:

- Formulario con nombre, categoría y dirección.
- Al cambiar categoría, consultar metadata de categoría para habilitar campos.
- Latitud/longitud son opcionales y no deberían bloquear UI.

### Feature: `business-hours`

Pantalla sugerida:

- `/panel/business/:businessId/hours`

Endpoints:

```text
GET /api/business/:businessId/hours
PUT /api/business/:businessId/hours
```

Contrato:

```ts
type WeeklyHour = {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  opensAt: string; // HH:mm
  closesAt: string; // HH:mm
};

type NonWorkingDay = {
  date: string; // YYYY-MM-DD
  reason?: string;
};

type BusinessHoursPayload = {
  weeklyHours: WeeklyHour[];
  nonWorkingDays: NonWorkingDay[];
};
```

Reglas de UI:

- No permitir rangos solapados para el mismo día.
- No permitir apertura posterior o igual al cierre.
- No soportar rangos que crucen medianoche en este corte.
- Mostrar días no laborables como excepciones completas.

### Feature: `business-operations`

Pantalla sugerida:

- `/panel/business/:businessId/operations`

Endpoints:

```text
PUT /api/business/:businessId/service-windows
PATCH /api/business/:businessId/operational-status
```

Contratos:

```ts
type ServiceWindowsRequest = {
  activeServiceWindows: number;
};

type OperationalStatus = "normal" | "delayed" | "paused" | "closed";

type UpdateOperationalStatusRequest = {
  operationalStatus: OperationalStatus;
  reason?: string;
};

type OperationalStatusResponse = {
  businessId: string;
  operationalStatus: OperationalStatus;
  acceptsNewTurns: boolean;
  indicator: "none" | "yellow" | "red" | "gray";
  customerMessage: string;
};
```

UX esperada:

- Control numérico para ventanillas activas.
- Permitir `0` como pausa por falta de atención disponible.
- Estado `delayed`: indicar demora, pero mantener turnos habilitados.
- Estados `paused` y `closed`: bloquear nuevos turnos.
- Para `closed`, pedir motivo opcional si la UI lo considera útil.

### Feature: `business-qr`

Pantallas sugeridas:

- `/panel/business/:businessId/qr`
- `/q/:token`

Endpoints:

```text
GET /api/business/:businessId/qr
POST /api/business/:businessId/qr/regenerate
GET /api/business/:businessId/qr.png
GET /api/qr/:token
```

Contrato panel:

```ts
type BusinessQrResponse = {
  businessId: string;
  token: string;
  qrUrl: string;
  downloadUrl: string;
  status: "active";
};
```

Contrato público:

```ts
type ResolveQrResponse = {
  token: string;
  qrUrl: string;
  qrStatus: "active" | "retiring";
  action: "OPEN_BUSINESS_TURN_FLOW";
  appPath: string;
  business: {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    address?: string;
    listingStatus: "draft" | "hidden" | "published";
    activeServiceWindows: number;
    operationalStatus: "normal" | "delayed" | "paused" | "closed";
  };
};
```

UX esperada:

- Mostrar QR actual y botón de descarga PNG.
- Regenerar QR con confirmación, explicando que el anterior sigue válido 24 h.
- `/q/:token` debe resolver negocio y preparar entrada al flujo de turno.
- Como la cola persistida todavía no está, la pantalla pública puede mostrar
  negocio, estado y CTA futuro o informativo.

### Feature: `business-employees`

Pantallas sugeridas:

- `/panel/business/:businessId/employees`
- `/business/employee-invitations/:token`

Endpoints:

```text
POST /api/business/:businessId/employees/invitations
GET /api/business/:businessId/employees
POST /api/business/employee-invitations/:token/accept
DELETE /api/business/:businessId/employees/:userId
```

Contratos:

```ts
type InviteEmployeeRequest = {
  email: string;
};

type InviteEmployeeResponse = {
  invitationId: string;
  businessId: string;
  email: string;
  status: "pending";
  expiresAt: string;
};

type EmployeeListResponse = {
  businessId: string;
  employees: Array<{
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    status: "active";
  }>;
};

type AcceptEmployeeInvitationRequest = {
  firstName: string;
  lastName: string;
  password: string;
};

type AcceptEmployeeInvitationResponse = {
  businessId: string;
  userId: string;
  role: "employee";
  status: "active";
};
```

UX esperada:

- Invitar por email.
- Mostrar lista de empleados activos.
- Revocar con confirmación.
- Aceptación pública por token, sin sesión previa.
- Explicar que la invitación vence a los 7 días.

## Layouts y Rutas Iniciales

```text
/login
/register
/forgot-password
/reset-password?token=:token
/verify-email?token=:token
/business/register
/business/pending-review
/business/employee-invitations/:token
/q/:token
/panel/business/:businessId
/panel/business/:businessId/profile
/panel/business/:businessId/hours
/panel/business/:businessId/operations
/panel/business/:businessId/qr
/panel/business/:businessId/employees
```

Layouts:

- `PublicLayout`: login, registro, reset, verificación, QR público.
- `AuthLayout`: protege sesión autenticada.
- `BusinessPanelLayout`: navegación lateral/superior del negocio.
- `PendingReviewLayout`: cuenta autenticada pero no aprobada.

## Estados Globales Mínimos

Sesión:

```ts
type SessionState = {
  accessToken: string | null;
  user: {
    id: string;
    email: string;
    role: Role;
    approvalStatus: ApprovalStatus;
    businessId?: string;
  } | null;
  status: "unknown" | "authenticated" | "anonymous";
};
```

Panel:

```ts
type CurrentBusinessState = {
  businessId: string | null;
  canEditBusiness: boolean;
  canManageEmployees: boolean;
  canOperateQueue: boolean;
};
```

## Manejo de Errores

El backend usa errores con mensaje y, en varios casos, `code`.

Errores importantes para UX:

- `EMAIL_NOT_VERIFIED`: mostrar aviso y reenviar verificación.
- `ACCOUNT_PENDING_REVIEW`: enviar a pantalla de revisión pendiente.
- `ACCOUNT_REJECTED`: mostrar rechazo y soporte.
- `LOGIN_TEMPORARILY_BLOCKED`: mostrar cooldown.
- `BUSINESS_OWNERSHIP_REQUIRED`: bloquear pantalla o volver al selector.
- `EMPLOYEE_INVITATION_PENDING`: indicar que ya existe invitación vigente.
- `EMPLOYEE_INVITATION_EXPIRED`: pedir nueva invitación.
- `QR_CODE_NOT_FOUND`: mostrar QR inválido o vencido.

## Orden de Implementación Recomendado

1. Base de app: router, layouts, cliente HTTP, sesión y refresh.
2. `auth`: login, logout, refresh, `/me`, register, verify email.
3. `business-onboarding`: registro de negocio y pending review.
4. `business-profile`: perfil y categoría.
5. `business-hours`: horarios y días no laborables.
6. `business-operations`: ventanillas y estado operativo.
7. `business-qr`: panel QR y landing `/q/:token`.
8. `business-employees`: invitación, listado, aceptación y revocación.

## Checklist de Integración

- Requests autenticados envían `Authorization`.
- Requests de sesión usan `credentials: "include"`.
- Refresh token se rota y actualiza `accessToken`.
- Rutas de panel verifican rol y aprobación.
- `business_admin` no entra al panel si está pendiente.
- `employee` no ve configuración ni empleados.
- Formularios reflejan validaciones del backend.
- Contratos diferidos se muestran como pantallas informativas, no como features
  terminadas.
