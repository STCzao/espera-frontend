# Estándar de Documentación Frontend

Este documento define cómo documentar épicas e historias del frontend de Espera.
Replica el criterio del backend, pero adapta el formato a pantallas, rutas,
estados visuales e integración con APIs.

## Reglas generales

- Separar producto, experiencia, integración técnica y diferidos.
- Los textos de UI deben orientar acciones o decisiones; no deben describir
  obviedades del layout ni nombrar zonas como si fueran rótulos de plantilla.
- Cuando un componente ya comunica su función por posición, forma o contexto, no
  agregar texto redundante.
- La página enrutable debe orquestar estado e integración; los componentes
  visuales, formularios, campos, botones y estados deben separarse en módulos
  pequeños desde el inicio.
- Documentar cualquier decisión de jerarquía visual importante: qué elemento
  manda, qué acción es primaria y qué queda como apoyo.
- No marcar una historia como `implementado` si solo existe la ruta o el
  contrato preparado.
- Documentar rutas frontend y endpoints backend por separado.
- Aclarar permisos y roles cuando una pantalla parezca accesible pero no lo sea.
- Explicar inconsistencias aparentes entre frontend y backend.
- Marcar qué vive en cada superficie: auth pública, panel, entrada QR o mobile.
- Incluir ejemplos de request/response cuando el frontend tenga que consumirlos.
- Documentar estados visuales, no solo endpoints.

## Comentarios inline

Replica el criterio que ya aplica el backend: por defecto el código no lleva
comentarios, porque nombres de funciones y componentes ya explican el qué.

- Agregar un comentario inline solo cuando el código contenga una decisión de
  producto, un límite técnico, un workaround puntual o una separación de
  responsabilidades que no sea evidente leyendo nombres y tipos.
- Evitar comentarios que describan sintaxis obvia o repitan lo que ya dice el
  nombre de la función/variable.
- Cuando la situación se repita (mismo tipo de decisión en más de una
  pantalla), preferir documentarla acá como regla general en lugar de
  comentarla suelta en cada archivo.

Ejemplos esperados de cuándo sí comentar en frontend:

- una llamada a la API que precarga cache de TanStack Query con una
  `queryKey` compartida para evitar un round-trip duplicado;
- un mapeo de error de backend a mensaje de UI que depende de un código
  funcional no evidente por el nombre del campo;
- una decisión de UX que contradice lo "obvio" (ej. no redirigir
  automáticamente después de una acción exitosa);
- un workaround de entorno o de librería (ej. limitaciones de Cypress/Vite en
  un script de `scripts/`).

## Granularidad de componentes y funciones

Separar por una razón concreta (reuso real, lógica propia o legibilidad de un
bloque que creció demasiado), no por separar. Tres líneas claras en el mismo
lugar son mejores que tres funciones de una línea que obligan a saltar entre
fragmentos para entender una sola escena.

### Cuándo extraer una función dentro del mismo archivo

- Hay una duplicación real: el mismo patrón de JSX/lógica se repite más de una
  vez en el archivo con distintos parámetros (ej. dos blobs animados con la
  misma estructura, distintos valores de animación).
- Un bloque de JSX tiene lógica propia (cálculo, condición, mapeo) que ensucia
  la lectura del componente principal si queda inline.
- No extraer un bloque de JSX de un solo uso y sin lógica solo para darle
  nombre; eso fragmenta una escena cohesiva sin agregar valor.

### Cuándo mover algo a un archivo nuevo

- El componente, hook o función se usa o se va a usar desde más de una
  pantalla/feature (ej. `AuthField`, `PasswordField`, compartidos entre
  registro y login).
- Encapsula una pieza con identidad propia dentro del vocabulario del
  proyecto: escena visual, panel de formulario, campo, botón, estado vacío o
  de error (ver regla general de páginas como orquestadoras).
- Contiene lógica de negocio o integración (schemas de validación, mapeo de
  errores de backend, llamadas a API) que conviene poder testear o importar
  de forma aislada.
- El archivo actual ya superó el tamaño en el que cuesta encontrar dónde
  está cada cosa; en ese caso, separar primero lo que tenga identidad propia
  (no fragmentar todo por igual).

### Cuándo no separar

- El elemento se usa una sola vez, no tiene lógica propia y su única función
  es visual u ornamental dentro de esa pantalla puntual.
- La separación obligaría a pasar muchas props solo para reconstruir un
  bloque que, junto, se entiende mejor.

## Idioma

- Código, nombres de funciones, variables y comentarios inline: inglés.
- Textos visibles para usuarios: español rioplatense, inicialmente orientado a
  público argentino.
- Documentación de producto, arquitectura, decisiones y estado: español con
  tildes y Ñ.

## Estructura base de épica

```md
# Épica X - Nombre

## Resumen

Qué cubre la épica, para quién y cuál es el corte funcional.

## Estado general

- Estado: implementado | implementado parcialmente | pendiente | diferido
- Historias implementadas
- Historias parciales
- Historias diferidas
- Motivos de diferidos

## Superficies involucradas

- auth pública
- panel
- entrada QR
- admin
- mobile futuro

## Contratos principales de la épica

Endpoints agrupados por superficie:

- público
- panel
- admin
- mobile
```

## Estructura base de historia

```md
## HU-X.Y - Título

Story points: N

Estado: `implementado | parcial | pendiente | diferido`

### Objetivo de experiencia

Qué tiene que poder hacer el usuario en pantalla.

### Pantallas / Rutas

```text
/ruta
/otra-ruta/:param
```

### Estados de UI

- loading
- success
- empty
- error
- forbidden
- pending approval
- expired token

### Integración frontend

- qué botón dispara qué endpoint;
- qué pasa después de guardar;
- redirecciones;
- toasts, modales o mensajes inline;
- invalidación de cache;
- actualización de Zustand/local state.

### Contratos consumidos

```text
POST /api/auth/login
GET /api/business/:businessId/qr
```

### Datos esperados

```ts
type ExampleResponse = {
  id: string;
};
```

### Reglas de presentación

- cuándo mostrar un mensaje;
- cuándo deshabilitar acciones;
- qué rol puede ver cada cosa;
- qué estados backend se traducen a labels visuales.
- cuál es la acción primaria;
- qué textos deben evitarse por redundantes;
- cómo se usa el logo o marca sin convertirlo en decoración.

### Decisiones de producto / alcance

Por qué se tomó cierto camino y qué queda afuera.

### Diferidos

- pantallas no construidas;
- deep links pendientes;
- mobile pendiente;
- analytics pendiente;
- estados preparados pero no integrados end-to-end.

### Validación

- tests cubiertos;
- flujo manual esperado;
- riesgos pendientes.
```

## Estados de historia

- `pendiente`: no existe implementación funcional.
- `parcial`: existe ruta, pantalla base o integración incompleta.
- `implementado`: flujo usable end-to-end contra backend o contrato mockeado
  explícitamente aceptado.
- `diferido`: fuera de alcance por decisión documentada.

## Nombres recomendados de secciones

Para frontend, el equivalente de `Contrato backend` es:

```md
### Integración frontend
```

Esa sección debe explicar cómo la pantalla usa contratos externos, estado local,
cache, navegación y feedback visual.
