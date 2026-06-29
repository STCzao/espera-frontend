# Espera Frontend

Frontend principal de Espera para el panel web de negocios y las superficies
públicas livianas necesarias para autenticación, onboarding y entrada por QR.

## Contexto del producto

Espera tiene dos mundos principales:

- Panel web para negocios: superficie actual y prioritaria.
- App móvil para usuarios: superficie futura para clientes finales.

Además, el producto necesita una tercera puerta ligera: una web pública para
clientes que escanean el QR del local y todavía no descargaron la app. Esa
experiencia debe resolver una acción inmediata desde navegador y, más adelante,
podrá direccionar a la app móvil cuando corresponda.

## Superficies frontend

- `Auth pública del panel`: login, registro, verificación de email y recuperación
  de password.
- `Panel de negocios`: configuración y operación inicial del negocio.
- `Entrada pública QR`: experiencia liviana para clientes de a pie desde
  `/q/:token`.
- `Mobile futuro`: no vive en este frontend por ahora, pero condiciona algunos
  diferidos y decisiones de navegación.

## Stack

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

## Identidad visual

La paleta de marca principal es violeta. El tono principal, tomado del logo, es:

```text
#500097
```

La escala secundaria es:

```text
#752174
#822e81
#903a8d
#9d479a
#aa54a7
```

Se complementará con tonalidades blancas y colores específicos para alertas,
modales y botones cuando cada experiencia lo necesite.

La tipografía principal es `Geist Sans`. Para datos, códigos y usos técnicos se
reserva `Geist Mono`.

## Arquitectura

El proyecto usa una estructura `feature-based`:

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

Regla práctica:

- `app` contiene wiring de aplicación: rutas, providers y layouts.
- `shared` contiene infraestructura reusable sin conocimiento de una historia.
- `features/*/api` consume endpoints concretos.
- `features/*/model` define schemas, reglas y tipos conceptuales de la feature.
- `features/*/pages` contiene pantallas enrutables.
- `features/*/components` contiene UI propia de la feature.

## Idioma del proyecto

- Código, nombres de funciones, variables, comentarios inline y mensajes de UI:
  código en inglés.
- Textos visibles para usuarios: español rioplatense, inicialmente orientado a
  público argentino.
- Documentación de producto y arquitectura: español con tildes y Ñ.

## Variables de entorno

Partir de `.env.example`.

Variables principales:

- `VITE_API_BASE_URL`

## Puesta en marcha local

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar en desarrollo:

```bash
npm run dev
```

3. Validar build:

```bash
npm run lint
npm run build
npm run test:e2e
```

## Documentación

- [Estado del proyecto](D:/Programacion/SaaS/Espera/espera-front/docs/project-status.md)
- [Arranque Épicas 1 y 2](D:/Programacion/SaaS/Espera/espera-front/docs/frontend-epicas-1-2.md)
- [Épica 1 - Autenticación y Onboarding](D:/Programacion/SaaS/Espera/espera-front/docs/epica-1-autenticacion-onboarding.md)
- [Diseño de interfaz](D:/Programacion/SaaS/Espera/espera-front/docs/diseno-de-interfaz.md)
- [Estándar de documentación frontend](D:/Programacion/SaaS/Espera/espera-front/docs/frontend-story-documentation-standard.md)
