# Contract: Matriz de rol ↔ módulos y redirecciones

**Feature**: [spec.md](../spec.md) | **Date**: 2026-11-24 (actualizado 2026-11-26)

Interfaz de navegación/permisos expuesta por la SPA. Fuentes de verdad: `VIEWS`/`ACCESS_MATRIX`/`resolveRoute` (`src/app.js`) y `ADMIN_MODULES`/`FINANCE_MODULES`/`navLabel` (`src/components/shell.js`).

## 1. Módulos visibles en navegación por rol

| `data-module` | Etiqueta | administrador | finanzas | trabajador |
|---|---|---|---|---|
| `payroll-create` | Crear liquidación de sueldo | ✅ | ❌ | ❌ |
| `payroll-admin` | Gestionar liquidaciones de sueldo | ✅ | ✅ (solo lectura + «Registrar pago» de `Emitidas`) | ❌ |
| `payroll-worker` | Mi liquidación | ❌ | ❌ | ✅ |
| `access` | Control de accesos | ✅ | ❌ | ❌ |
| `entities` | Entidades | ❌ | ✅ | ❌ |
| `invoice-sale` | Facturas de venta | ❌ | ✅ | ❌ |
| `invoice-purchase` | Facturas de compra | ❌ | ✅ | ❌ |
| `movements` | Movimientos | ❌ | ✅ | ❌ |
| `cashflow` | Flujo de caja | ❌ | ✅ | ❌ |
| `tracking` | Seguimiento | ❌ | ✅ | ❌ |
| `search` | Búsqueda | ❌ | ✅ | ❌ |
| `dev-notifications` | Avisos al desarrollador | ❌ | ❌ | ❌ |
| `dashboard` | Panel | ✅ (solo 2 pestañas de liquidaciones) | ✅ (sus módulos) | ✅ (su liquidación) |

Invariante: el nav del administrador contiene **exactamente** el Panel, «Crear liquidación de sueldo», «Gestionar liquidaciones de sueldo» y «Control de accesos» (`ADMIN_MODULES = ['dashboard', 'payroll-create', 'payroll-admin', 'access']`, FR-013); ningún rol muestra «Avisos al desarrollador» (FR-020).

## 2. Acceso directo / navegación no permitida

```
resolveRoute(view, role):
  - Sesión ausente        → 'login' (sin datos expuestos)
  - view permitida para el rol → 'view'
  - view no permitida     → vista por defecto del rol + mensaje claro (FR-016)
    · administrador → 'payroll-admin'
    · finanzas      → 'dashboard'
    · trabajador    → 'payroll-worker'
```

- Abrir `payroll-create` como finanzas/trabajador ⇒ redirigido (US1 esc. 7).
- `dev-notifications` no es alcanzable por ningún rol ⇒ cualquier intento cae en la vista por defecto del rol.
- **«Mensaje claro»** (toda redirección de esta sección y los rechazos asociados): un elemento en el DOM con `role="alert"` o `role="status"` y **texto no vacío**, visible para el usuario.

## 3. Acciones dentro de `payroll-admin`

| Acción | administrador | finanzas |
|---|---|---|
| Ver listado | ✅ | ✅ |
| Buscar/filtrar por RUT (en vivo) | ✅ | ✅ |
| Botón «Editar» | ✅ | ❌ (no se renderiza) |
| Asociar acceso | ✅ | ❌ |
| «Registrar pago» | ❌ | ✅ solo en liquidaciones `Emitidas` (FR-011) |

## 3b. Facturas de compra vinculadas a una liquidación

| Acción | administrador | finanzas |
|---|---|---|
| Ver en «Facturas de compra» | ❌ (sin acceso al módulo) | ✅ con aviso de solo lectura |
| Editar o eliminar | ❌ | ❌ bloqueado desde cualquier vista (`isLinkedPayrollDocument`) |

## 4. Contratos relacionados

- Alta de trabajador y formulario: [creation-flow.md](./creation-flow.md)
- Listado y búsqueda RUT: [settlement-list.md](./settlement-list.md)
