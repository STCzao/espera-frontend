# Sync con backend — se separó el listado de negocios de las métricas de plataforma

Fecha: 2026-08-06. Bugfix en `espera-back` (rama `bugfix/separate-business-listing-from-metrics`, mergeada a `develop`). Afecta `backofficeApi.js` y `BusinessMetricsTable.jsx`.

## El problema que motivó el cambio

`GET /api/business/platform/metrics` devolvía, dentro de `range.businesses`, un listado de negocios filtrable/ordenable/paginable (`organizationId`, `categoryId`, `status`, `subscriptionPlan`, `subscriptionStatus`, `sortBy`, `page`, `pageSize`). Pero ese listado se construía iterando los turnos del rango de fechas seleccionado — así que **un negocio sin turnos en ese rango desaparecía del listado**, sin importar que cumpliera todos los filtros. Por ejemplo: filtrar por `status=suspended` para revisar negocios suspendidos no mostraba ninguno si no tuvieron actividad reciente, aunque existieran.

Eran dos responsabilidades distintas mezcladas en un solo endpoint: navegar/gestionar el directorio de negocios (no debería depender de actividad) vs. ver métricas agregadas de la plataforma (sí depende, correctamente, de un rango de fechas).

## Qué cambió

### 1. `GET /api/business/platform/metrics` vuelve a su shape simple

Ya no tiene query params de filtro/orden/paginación — solo `fromDate`/`toDate` (default: últimos 7 días). `range.businesses` (el objeto paginado) desaparece; en su lugar hay `range.topBusinesses`, un array fijo de los 5 negocios con más turnos en el rango, sin `organizationId`/`status`/`categoryId`/`subscriptionPlan`/`subscriptionStatus`:

```json
{
  "totalActiveBusinesses": 12,
  "totalRegisteredUsers": 340,
  "turnsToday": 58,
  "turnsThisWeek": 401,
  "range": {
    "fromDate": "2026-07-30",
    "toDate": "2026-08-05",
    "totalTurns": 401,
    "cancelledTurns": 37,
    "cancellationRate": 12.4,
    "topBusinesses": [
      { "businessId": "...", "businessName": "Cafe Espera", "turnCount": 80 }
    ],
    "topCategories": [
      { "categoryId": "...", "categoryName": "Cafetería", "turnCount": 210 }
    ]
  }
}
```

### 2. `GET /api/business` (nuevo) — directorio de negocios, sin depender de `Turn`

```text
GET /api/business   (requiere permiso platform:manage_approvals, igual que el resto del Backoffice)
```

Query params, todos opcionales:

| Param                | Tipo                                                 | Default     |
| -------------------- | ------------------------------------------------------ | ----------- |
| `organizationId`      | uuid                                                    | sin filtro  |
| `categoryId`          | uuid                                                    | sin filtro  |
| `status`              | `pending`\|`approved`\|`rejected`\|`suspended`          | sin filtro  |
| `subscriptionPlan`    | `basic`\|`pro`\|`premium`                               | sin filtro  |
| `subscriptionStatus`  | `pending`\|`trial`\|`active`\|`expired`\|`cancelled`    | sin filtro  |
| `sortBy`              | `businessName`\|`createdAt`                             | `createdAt` |
| `sortDir`             | `asc`\|`desc`                                           | `desc`      |
| `page`                | entero ≥ 1                                              | `1`         |
| `pageSize`            | entero 1-50                                             | `20`        |

Response:

```json
{
  "items": [
    {
      "businessId": "...",
      "businessName": "Cafe Espera",
      "organizationId": "...",
      "status": "approved",
      "categoryId": "...",
      "subscriptionPlan": "pro",
      "subscriptionStatus": "active",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 12
}
```

Un negocio aparece acá si matchea los filtros, tenga o no turnos recientes — es el endpoint correcto para cualquier pantalla de "listar/gestionar negocios" (filtrar por estado, plan, rubro, etc.), a diferencia de `platform/metrics`, que es solo para el dashboard de actividad.

## Qué necesita el panel

1. **`BusinessMetricsTable.jsx`**: si usaba `range.businesses.items` para pintar una tabla filtrable de negocios, ese uso ahora corresponde a `GET /api/business` (nuevo). Si solo mostraba el top de negocios más activos del dashboard, corresponde a `range.topBusinesses` (mismo dato que antes, sin los campos de filtro que igual no se usaban para eso).
2. **`backofficeApi.js`**: agregar una función para `GET /api/business` con sus params de filtro/orden/paginación; actualizar la que llama a `platform/metrics` si asumía el shape viejo de `range.businesses`.
3. No hay breaking changes en `totalActiveBusinesses`/`totalRegisteredUsers`/`turnsToday`/`turnsThisWeek`/`cancellationRate`/`topCategories` — siguen igual.

## Referencia técnica completa

`espera-back/docs/epica-8-backoffice.md`, sección *"Bugfix — separación del listado de negocios y las métricas"* (HU-8.5).
