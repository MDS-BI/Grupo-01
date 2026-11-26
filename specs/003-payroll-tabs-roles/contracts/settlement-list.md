# Contract: Pestaña «Gestionar liquidaciones de sueldo» (listado + búsqueda RUT)

**Feature**: [spec.md](../spec.md) | **Date**: 2026-11-24 (actualizado 2026-11-26)

Contrato de la vista existente `payroll-admin` tras los cambios (listado administrable / lectura para finanzas).

## 1. Contrato de UI

- Sección `#view-payroll-admin` existente; se **añade** un cuadro de búsqueda:
  - `#payroll-filter-rut`, etiqueta «Buscar por RUT», listener `input` (mismo patrón que `data-invoice-filter` existente) → **filtrado en vivo, sin botón** (FR-008).
  - Se conservan los filtros existentes «trabajador» y «período».
- Columnas del listado (sin cambios): trabajador, RUT, período, monto, estado, fecha de pago, factura vinculada, acción.
- Estados vacíos: lista completa si la búsqueda está vacía; «sin resultados» si no hay coincidencias, conservando el texto escrito (FR-009); «sin liquidaciones» si no hay registros.

## 2. Contrato de filtrado (extensión de `resolveAdminSettlements`)

```
resolveAdminSettlements({ settlements, purchaseInvoices, entities, filters })
  filters rut (NUEVO): string
    - vacío            → sin efecto (listado completo)
    - no vacío         → incluye solo liquidaciones cuyo tercero (entityId → entity)
                         tenga RUT normalizado que contenga el texto buscado
                         (coincidencia parcial, case/formato insensible vía normalizeRut)
    - combinado        → los filtros worker/period/entityId/rut se aplican en AND
    - sin coincidencias → []
```

Función pura y testeable en unit tests (`tests/unit/payroll.test.js`).

## 3. Acciones por rol

| Acción | administrador | finanzas | trabajador |
|---|---|---|---|
| Ver listado completo | ✅ | ✅ | ❌ (redirigido) |
| Búsqueda por RUT en vivo | ✅ | ✅ | ❌ |
| Filtrar trabajador/período | ✅ | ✅ | ❌ |
| Seleccionar liquidación | ✅ | ✅ (resaltado/lectura) | ❌ |
| Botón «Editar» → form de edición | ✅ | ❌ **no renderizado** (flag `canEdit: false`) | ❌ |
| Asociar acceso (`canAssociate`) | ✅ | ❌ | ❌ |
| «Registrar pago» (`canRegisterPayment`) | ❌ | ✅ solo si la liquidación está `Emitida` | ❌ |
| Crear liquidación (esta pestaña) | ❌ (usar `payroll-create`) | ❌ | ❌ |

- Implementación: `renderPayrollList` acepta `canEdit` (por defecto `true` para no romper usos actuales); `refreshPayrollAdmin` pasa `canEdit: role === 'administrador'`.
- Doble bloqueo: acción oculta + `ACCESS_MATRIX`/`resolveRoute` (FR-010, FR-011, SC-005).
- «Registrar pago»: `refreshPayrollAdmin` pasa `canRegisterPayment: role === 'finanzas'`; el botón solo se muestra en liquidaciones `Emitidas`. Doble bloqueo también aquí: `registerPayrollPayment` vuelve a comprobar el rol y el estado antes de guardar.

## 4. Edición (solo administrador)

- Mismo flujo `payroll-form` y `handlePayrollSubmit` existentes: validaciones y ciclo de vida de estado sin cambios; cambios persistidos se reflejan en la vista del trabajador al siguiente refresco.
- Errores → `showErrors` con mensaje claro, sin guardar (esc. 5 de US2).

## 4b. Registro de pago (solo finanzas, Session 2026-11-24)

- «Registrar pago» abre `#payroll-payment-form` con la fecha de pago; el monto pagado es siempre el total.
- Al guardar, `registerPayrollPayment(id)` deja la liquidación en `Pagada` con `fechaPago`, y la factura vinculada en `Pagada` con `montoPagado = total` y `fechaPago`. No cambia el total, el desglose, el RUT ni otros campos.
- Se rechaza con mensaje claro si quien lo intenta no es `finanzas`, si la liquidación o su factura no están `Emitidas`, si la fecha no tiene formato `AAAA-MM-DD` o si el monto difiere del total.

## 5. Contratos relacionados

- Permisos de navegación: [role-module-matrix.md](./role-module-matrix.md)
- Estructura de datos: [../data-model.md](../data-model.md)
