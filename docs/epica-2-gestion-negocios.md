# Épica 2 - Gestión de Negocios

## Resumen

La Épica 2 cubre el panel operativo de un negocio ya dado de alta (`HU-1.8`):
perfil, horarios de atención, ventanillas activas, estado operativo, QR de
entrada y gestión de empleados. Reemplaza los `PlaceholderPage` que dejó el
scaffolding inicial por integración real contra el backend, que ya tenía
estas historias implementadas de antes (`docs/epica-2-gestion-negocios.md` en
`espera-back`).

## Estado general

- Estado: `implementado` (alcance web del panel de un solo negocio).
- Historias implementadas: `HU-2.1` (alta, cerrada en `HU-1.8`), `HU-2.2`,
  `HU-2.3`, `HU-2.4`, `HU-2.5`, `HU-2.6`, `HU-2.8`.
- Historia inexistente en el backlog: `HU-2.7` no está definida ni en
  backend ni en frontend (mismo gap documentado en `espera-back`).
- Historias diferidas transversales: gate de UI por rol (`employee` ve el
  mismo panel que `business_admin` hoy, sin ítems de nav deshabilitados);
  queda documentado como deuda a resolver junto con Épica 3, cuando el rol
  `employee` tenga una pantalla operativa real (cola).

## Superficies involucradas

- Panel de negocios (todas las historias de esta épica).
- Auth pública, solo como superficie de aceptación de invitación
  (`/business/employee-invitations/:token`, sin sesión previa).

## Contratos principales de la épica

Panel (requiere sesión + `business:edit` o `employee:manage` según el
endpoint):

```text
GET   /api/business/:businessId/hours
PUT   /api/business/:businessId/hours
PUT   /api/business/:businessId/service-windows
PATCH /api/business/:businessId/operational-status
PATCH /api/business/:businessId/profile
GET   /api/business/categories/:categoryId/config
GET   /api/business/:businessId/qr
POST  /api/business/:businessId/qr/regenerate
GET   /api/business/:businessId/qr.png
POST  /api/business/:businessId/employees/invitations
GET   /api/business/:businessId/employees
DELETE /api/business/:businessId/employees/:userId
```

Público:

```text
POST /api/business/employee-invitations/:token/accept
```

## HU-2.1 - Registrar negocio con nombre, categoría y dirección

Ver `HU-1.8` en `docs/epica-1-autenticacion-onboarding.md`: el alta de
negocio (`BusinessCreatePage`, `/business/new`) se documentó ahí porque es al
mismo tiempo el cierre del onboarding de Épica 1. No se repite acá.

En esta épica se sumó `phone` (opcional) al formulario de alta, alineado con
un cambio de contrato de backend posterior a `HU-1.8`
(`bugfix/extend-list-my-businesses-profile-fields` en `espera-back`).

## HU-2.6 - Editar datos del negocio

Estado: `implementado`

### Objetivo de experiencia

El dueño del negocio puede corregir nombre, categoría, teléfono y dirección
después del alta, y ver qué atributos configurables tiene su categoría
(aunque todavía no pueda cargarles valores).

### Pantallas / Rutas

```text
/panel/business/:businessSlug/profile
```

### Estados de UI

- `loading`: mientras se resuelve `GET /business/me`.
- `success`: form precargado con los datos actuales.
- `error` (categorías): mensaje inline si `GET /business/categories` falla,
  sin bloquear el resto del formulario.
- `error` (guardado): mensaje inline con el error del backend, sin perder los
  valores cargados en el form.
- informativo: bloque de atributos de categoría, marcado explícitamente como
  "todavía no se pueden cargar valores" para no prometer una función que no
  existe.

### Integración frontend

- `BusinessProfilePage.jsx` no recibe el `id` real del negocio por props ni
  por store: resuelve `currentBusiness` buscando por `slug` dentro de
  `GET /business/me` (mismo patrón que `BusinessPanelLayout`, pero
  consultado de forma independiente).
- El formulario se precarga con `reset()` en un `useEffect` una vez que
  `currentBusiness` resuelve — necesario porque `FormSelect`
  (`shared/ui/FormSelect.jsx`) fuerza `defaultValue=""` en el `<select>`
  nativo; sin el `reset()` posterior, la categoría se vería vacía aunque el
  formulario tuviera el valor correcto internamente.
- `categoryId` seleccionado dispara `useCategoryConfig` (`useWatch` +
  `useQuery` con `enabled: Boolean(categoryId)`), que trae los atributos de
  esa categoría desde `GET /business/categories/:categoryId/config`.
- Al guardar, invalida `['business-me']` para que el resto del panel
  (sidebar, `BusinessHomePage`) reciba el nombre/estado actualizado.

### Contratos consumidos

```text
GET /api/business/me
GET /api/business/categories
GET /api/business/categories/:categoryId/config
PATCH /api/business/:businessId/profile
```

### Datos enviados

```ts
type UpdateBusinessProfileRequest = {
  name: string;
  categoryId: string;
  phone?: string;
  address: string;
};
```

### Datos esperados

```ts
type CategoryAttribute = {
  key: string;
  label: string;
  type: 'number' | 'text' | 'boolean' | 'select';
  required: boolean;
};
```

### Reglas de presentación

- `phone` es el único campo opcional del formulario; el resto son
  obligatorios.
- Los atributos de categoría se muestran solo si la categoría seleccionada
  tiene al menos uno (`categoryConfigQuery.data?.length > 0`).

### Diferidos

- Carga de valores para los atributos de categoría (hoy son solo
  informativos).

### Validación

- Cobertura e2e: `cypress/e2e/business-profile.cy.js` — precarga de nombre,
  validación de campos requeridos, atributos informativos al elegir
  categoría, guardado exitoso con confirmación, error de backend sin perder
  el formulario.
- Validado manualmente contra el backend real (Render Postgres) incluyendo
  el campo `phone`.

## HU-2.2 - Configurar horarios de atención

Estado: `implementado`

### Objetivo de experiencia

El dueño define, por día de la semana, en qué rangos horarios atiende, y
puede marcar fechas puntuales como no laborables (feriados, vacaciones).

### Pantallas / Rutas

```text
/panel/business/:businessSlug/hours
```

### Estados de UI

- `loading`: mientras se resuelve `GET .../hours`.
- `empty`: sin rangos ni días no laborables cargados, con mensaje explícito
  en cada bloque en vez de una grilla vacía sin contexto.
- `error` (lectura): mensaje inline si el `GET` falla.
- `error` (validación cliente): mensajes por campo y a nivel de array
  (rango solapado, apertura después del cierre, fecha repetida).
- `error` (guardado): mensaje inline con el error del backend.
- `success`: confirmación inline tras guardar.

### Integración frontend

- `businessId` se lee directo de `useCurrentBusinessStore` (ya resuelto por
  `BusinessPanelLayout`), sin volver a pedir `GET /business/me` como hace
  `BusinessProfilePage`.
- `WeeklyHoursEditor` y `NonWorkingDaysEditor` son dos `useFieldArray`
  independientes (`weeklyHours`, `nonWorkingDays`) dentro del mismo form.
- El `PUT` reemplaza la configuración completa (no hay edición parcial por
  fila): se manda el array entero tal como lo espera el backend.
- La validación cliente (`businessHoursSchemas.js`) espeja las reglas del
  backend usando los helpers puros `isValidHourRange` y
  `hasOverlappingRanges` (`businessHoursRules.js`), para no duplicar la
  lógica de comparación de horarios en dos formatos distintos.

### Contratos consumidos

```text
GET /api/business/:businessId/hours
PUT /api/business/:businessId/hours
```

### Datos enviados

```ts
type ConfigureBusinessHoursRequest = {
  weeklyHours: Array<{ dayOfWeek: number; opensAt: string; closesAt: string }>;
  nonWorkingDays: Array<{ date: string; reason?: string }>;
};
```

### Datos esperados

```ts
type BusinessHoursResponse = {
  businessId: string;
  weeklyHours: Array<{ dayOfWeek: number; opensAt: string; closesAt: string }>;
  nonWorkingDays: Array<{ date: string; reason?: string }>;
};
```

### Reglas de presentación

- `dayOfWeek` se muestra como nombre de día (`Domingo`...`Sábado`), nunca
  como número, en el `<select>` de cada rango.
- Al menos un rango semanal es obligatorio para guardar (mismo mínimo que
  exige el backend).
- No se soportan rangos que crucen medianoche (mismo límite que el backend
  documenta para Épica 2; rubros nocturnos quedan fuera de alcance).

### Diferidos

- Cobertura e2e (no existe spec de Cypress para esta pantalla todavía).

### Validación

- Validado manualmente contra el backend real.
- Sin cobertura automatizada e2e: queda como deuda, ver `Próximo trabajo` en
  `project-status.md`.

## HU-2.3 - Definir ventanillas o cajas activas

Estado: `implementado`

### Objetivo de experiencia

El dueño indica cuántos puntos de atención tiene funcionando en paralelo, y
entiende que `0` significa "no estoy recibiendo turnos ahora".

### Pantallas / Rutas

```text
/panel/business/:businessSlug/operations
```

Comparte pantalla con `HU-2.5` (ver esa sección para el resto del layout).

### Estados de UI

- `error` (validación cliente): entero fuera de `0`-`50`.
- `error` (guardado): mensaje inline con el error del backend.
- `success`: mensaje distinto según `attentionAvailable` — "disponible para
  recibir turnos" o "sin atención disponible" cuando queda en `0`.

### Integración frontend

- `activeServiceWindows` se lee de `useCurrentBusinessStore`, alimentado por
  `GET /business/me` (campo sumado en un bugfix de backend posterior al
  contrato original de esta HU, ver `Decisiones de producto / alcance`).
- Al guardar, `useCurrentBusinessStore.setState({ activeServiceWindows })`
  actualiza el store directo con la respuesta del `PUT`, sin re-fetchear
  `/business/me`.

### Contratos consumidos

```text
PUT /api/business/:businessId/service-windows
```

### Datos enviados

```ts
type ConfigureServiceWindowsRequest = {
  activeServiceWindows: number; // 0-50
};
```

### Datos esperados

```ts
type ConfigureServiceWindowsResponse = {
  businessId: string;
  activeServiceWindows: number;
  attentionAvailable: boolean;
};
```

### Decisiones de producto / alcance

`PUT .../service-windows` no tenía, en su contrato original, contraparte de
lectura: ni el propio endpoint ni `GET /business/me` devolvían el valor ya
guardado. Se detectó como gap durante esta implementación, se documentó y se
pidió al backend sumar `activeServiceWindows` a `GET /business/me`
(`bugfix/extend-list-my-businesses-profile-fields`, ya mergeado). Antes de
ese fix, el formulario no tenía forma de distinguir "nunca configuró nada"
de "configuró 3 y volvió a entrar" — siempre arrancaba en el default `1`.

### Diferidos

- Cobertura e2e (no existe spec de Cypress para esta pantalla todavía).

### Validación

- Validado manualmente contra el backend real, incluyendo el caso `0`
  (negocio sin atención disponible).

## HU-2.4 - Generar QR único del negocio

Estado: `implementado`

### Objetivo de experiencia

El dueño puede ver el QR de su negocio, descargarlo en PNG para imprimir, y
regenerarlo si lo necesita, sabiendo que el anterior sigue funcionando 24hs
para no cortar a quien ya lo tenga guardado.

### Pantallas / Rutas

```text
/panel/business/:businessSlug/qr
```

### Estados de UI

- `loading` (metadata): mientras resuelve `GET .../qr`.
- `loading` (imagen): `QrPreview` muestra "Generando…" mientras baja el PNG.
- `error` (metadata): mensaje inline si `GET .../qr` falla.
- `error` (regenerar): mensaje inline con el error del backend.
- `success` (regenerar): mensaje con la fecha/hora hasta la que el QR
  anterior sigue resolviendo.

### Integración frontend

- `GET /business/:id/qr.png` es un endpoint autenticado que devuelve un
  binario, no JSON. `httpClient` no soportaba eso (`response.json()` a
  ciegas), así que se sumó `httpClient.getBlob(path)` — reusa el mismo
  manejo de token/refresh/errores que `get`, pero resuelve `response.blob()`
  en vez de `response.json()`.
- El PNG se pide encadenado a la metadata (`enabled: Boolean(qrQuery.data)`)
  y se convierte a `Object URL` con `useMemo` (no en un `useEffect` con
  `setState`, para no disparar un render en cascada); un `useEffect` aparte
  se encarga solo de `URL.revokeObjectURL` en el cleanup.
- El mismo blob se usa para dos cosas: mostrar la imagen (`<img>`) y
  disparar la descarga (`<a download>` sintético), sin pedirlo dos veces.
- `qrUrl` (el link público `/q/:token`) es texto/destino, no la imagen — se
  muestra aparte como enlace, no se le pasa a un `<img src>`.
- Al regenerar, la query de metadata se actualiza con
  `queryClient.setQueryData`, lo que cambia la `queryKey` de la query del
  PNG (incluye `qrQuery.data?.token`) y dispara el refetch de la imagen
  nueva automáticamente.

### Contratos consumidos

```text
GET  /api/business/:businessId/qr
POST /api/business/:businessId/qr/regenerate
GET  /api/business/:businessId/qr.png
```

### Datos esperados

```ts
type BusinessQrResponse = {
  businessId: string;
  token: string;
  qrUrl: string;
  downloadUrl: string; // no se usa: se arma la ruta propia por convención de httpClient
  status: 'active';
};

type RegenerateQrResponse = BusinessQrResponse & {
  status: 'active';
  previousQrValidUntil: string;
};
```

### Reglas de presentación

- `downloadUrl` que devuelve el backend (`/api/business/:id/qr.png`, con
  prefijo `/api` incluido) no se usa tal cual: `httpClient` ya antepone
  `apiBaseUrl` a cada path, así que reusarlo generaría `/api/api/...`. El
  frontend arma su propio path relativo (`/business/:id/qr.png`).
- El estado `retiring` se etiqueta como "En transición (vence en 24hs)".

### Diferidos

- Pantalla pública `/q/:token` (`ResolveQrPage`) sigue siendo placeholder;
  no es parte de esta HU tal como está acotada en backend (ver
  `Contratos diferidos` de `HU-2.4` en `espera-back`).
- Cobertura e2e (no existe spec de Cypress para esta pantalla todavía).

### Validación

- Validado manualmente contra el backend real: generación perezosa,
  descarga de PNG, regeneración con mensaje de transición.

## HU-2.5 - Cambiar estado operativo del negocio

Estado: `implementado`

### Objetivo de experiencia

El dueño avisa a sus clientes si hay demoras, si pausa la atención
temporalmente o si cierra antes de lo previsto, sin que eso dependa de tocar
horarios ni ventanillas.

### Pantallas / Rutas

```text
/panel/business/:businessSlug/operations
```

Comparte pantalla con `HU-2.3`: `BusinessOperationsPage` monta
`ServiceWindowsControl` y `OperationalStatusControl` como dos tarjetas
independientes, cada una con su propio form y su propia mutación.

### Estados de UI

- `error` (validación cliente): estado fuera del enum, motivo demasiado
  largo.
- `error` (guardado): mensaje inline con el error del backend.
- `success`: se muestra el `customerMessage` que devuelve el backend
  ("Con demoras.", "Atención pausada temporalmente.", etc.), no un texto
  fijo del frontend, para no duplicar copy que puede cambiar del lado
  backend.

### Integración frontend

- El `<select>` de estado se precarga con `reset()` en un `useEffect`
  (mismo motivo que en `HU-2.6`: `FormSelect` fuerza `defaultValue=""`, así
  que sin el `reset()` posterior al render inicial el valor visual no
  reflejaría el `operationalStatus` real del negocio).
- Al guardar, actualiza `useCurrentBusinessStore` directo con la respuesta
  del `PATCH`, mismo patrón que `HU-2.3`.

### Contratos consumidos

```text
PATCH /api/business/:businessId/operational-status
```

### Datos enviados

```ts
type UpdateOperationalStatusRequest = {
  operationalStatus: 'normal' | 'delayed' | 'paused' | 'closed';
  reason?: string;
};
```

### Datos esperados

```ts
type UpdateOperationalStatusResponse = {
  businessId: string;
  operationalStatus: 'normal' | 'delayed' | 'paused' | 'closed';
  acceptsNewTurns: boolean;
  indicator: 'none' | 'yellow' | 'red' | 'gray';
  customerMessage: string;
};
```

### Reglas de presentación

- Los cuatro estados se etiquetan en español (Normal, Con demoras, Pausado,
  Cerrado); el `indicator` (`none`/`yellow`/`red`/`gray`) que devuelve el
  backend no se usa todavía porque no hay dónde mostrarlo público (queda
  para cuando exista discovery/mobile).

### Diferidos

- Notificación push a turnos activos al cerrar (`business.closed`): es un
  evento de dominio backend, integración diferida hasta que exista cola
  persistida y dispositivos registrados (Épica 3+).
- Cobertura e2e (no existe spec de Cypress para esta pantalla todavía).

### Validación

- Validado manualmente contra el backend real, incluyendo el mensaje al
  cliente por cada estado.

## HU-2.8 - Invitar empleados al panel

Estado: `implementado`

### Objetivo de experiencia

El dueño invita empleados por email sin compartir su cuenta; el invitado
acepta con sus propios datos de acceso (sin sesión previa) y queda listado
como activo; el dueño puede revocarlo cuando quiera.

### Pantallas / Rutas

```text
/panel/business/:businessSlug/employees
/business/employee-invitations/:token
```

La segunda es pública (`PublicLayout`), fuera de `AuthLayout`: quien acepta
la invitación todavía no tiene cuenta ni sesión.

### Estados de UI

- `error` (validación cliente, invitar): email inválido.
- `error` (invitar, backend): mensaje inline (ej. invitación duplicada,
  invitar al propio owner).
- `success` (invitar): confirmación con la fecha de vencimiento (7 días).
- `empty` (lista): "Todavía no invitaste a ningún empleado."
- `error` (lista): mensaje inline si `GET .../employees` falla.
- por fila: botón de revocar deshabilitado mientras esa revocación
  puntual está en curso (no bloquea el resto de la lista).
- aceptación: mismos estados que cualquier alta de cuenta (validación de
  password, error si el token es inválido/venció).

### Integración frontend

- `businessEmployeesSchemas.js` espeja las reglas de backend: mismo regex de
  password (mayúscula + minúscula + número) que `authSchemas.js` en
  `features/auth`, duplicado localmente en vez de importado — cada feature
  mantiene sus propios schemas en este proyecto, no hay un módulo de
  validación compartido entre features.
- La lista de empleados (`GET .../employees`) solo devuelve membresías
  activas por diseño de backend; invitar a alguien no lo agrega a esta
  lista hasta que acepte — por eso invitar no invalida `['business-employees']`,
  solo revocar lo hace.
- `AcceptEmployeeInvitationPage` reusa `AuthVisualScene` y `PasswordField`
  de `features/auth/components` (mismo lenguaje visual que registro/login),
  import cruzado entre features consistente con el resto del código (ej.
  `LoginPage` ya importa `businessOnboardingApi` de otra feature).
- Al aceptar, redirige a `/login` (la cuenta nueva no arranca con sesión
  iniciada).

### Contratos consumidos

```text
POST   /api/business/:businessId/employees/invitations
GET    /api/business/:businessId/employees
DELETE /api/business/:businessId/employees/:userId
POST   /api/business/employee-invitations/:token/accept
```

### Datos enviados

```ts
type InviteEmployeeRequest = { email: string };

type AcceptInvitationRequest = {
  firstName: string;
  lastName: string;
  password: string;
};
```

### Datos esperados

```ts
type InviteEmployeeResponse = {
  invitationId: string;
  businessId: string;
  email: string;
  status: 'pending';
  expiresAt: string;
};

type EmployeeListResponse = {
  businessId: string;
  employees: Array<{
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    status: 'active';
  }>;
};
```

### Reglas de presentación

- El owner nunca aparece en su propia lista de empleados: `BusinessEmployee`
  y `Business.ownerUserId` son relaciones distintas en el dominio: el owner
  no es un empleado.
- El botón de revocar por fila usa `revokeMutation.variables` para
  deshabilitar solo el que está en curso, no toda la lista.

### Decisiones de producto / alcance

El rol global `employee` que resulta de aceptar una invitación no tiene, hoy,
ninguna pantalla del panel donde operar: sus permisos de backend
(`queue:read`, `queue:call_next`, `turn:create`, `turn:cancel`) apuntan a
funciones de cola que Épica 3 todavía no implementó. El frontend tampoco
distingue el rol del usuario logueado en ningún punto de la navegación — un
`employee` ve el mismo menú que un `business_admin` y cualquier acción real
le devuelve `403`. Se decidió no resolver esto ahora porque la pantalla que
un `employee` necesita (operar la cola) todavía no existe; conviene
diseñar el gate de rol junto con esa pantalla en vez de ocultar nav items
para un caso de uso que hoy no lleva a ningún lado.

### Diferidos

- Gate de UI por rol (`employee` vs `business_admin`) en la navegación del
  panel — ver `Decisiones de producto / alcance`.
- Diseño final del email transaccional de invitación: no configurado en el
  entorno de desarrollo (Resend sin dominio propio todavía), probado
  manualmente tomando el token directo de `business_employee_invitations`
  en la base.
- Cobertura e2e (no existe spec de Cypress para esta pantalla todavía).

### Validación

- Validado manualmente end-to-end contra el backend real: invitar → aceptar
  (token de DB, sin depender de email real) → aparece activo en la lista →
  revocar → desaparece de la lista.
