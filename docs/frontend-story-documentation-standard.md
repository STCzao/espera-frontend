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
