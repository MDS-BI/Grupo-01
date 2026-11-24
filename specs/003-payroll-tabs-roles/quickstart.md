# Quickstart: Pestañas de liquidación de sueldo y permisos por rol

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-24

Guía de validación manual end-to-end. Los detalles de contrato están en [contracts/](./contracts/) y el modelo en [data-model.md](./data-model.md); aquí solo el recorrido y los resultados esperados.

## Prerrequisitos

```powershell
npm install        # solo la primera vez
npm run check      # gate de calidad: lint + format + tests — debe estar en verde
```

- Navegador moderno; la app es 100 % local (`localStorage`), sin backend.
- Datos de demo existentes válidos (no hace falta regenerarlos).

## Arranque

```powershell
npm run dev        # servidor de desarrollo (Vite)
npm run test -- --run   # o: npm test -- --run  (suite completa)
```

## Escenario A — US1: crear liquidación con RUT nuevo (admin)

1. Iniciar sesión como `administrador`.
2. **Esperado**: el nav muestra exactamente «Crear liquidación de sueldo», «Gestionar liquidaciones de sueldo» y «Control de accesos»; el Panel solo enlaza esas dos pestañas; no hay «Avisos al desarrollador» ni entidades/facturas/movimientos/etc. (FR-013, FR-020, SC-004).
3. Abrir «Crear liquidación de sueldo»: se ve el formulario de factura de compra + campos obligatorios «RUT» y «Nombre completo» (FR-001, FR-002).
4. Completar con un **RUT nuevo** válido y guardar.
5. **Esperado**: éxito; en `localStorage` existen la factura de compra, la liquidación vinculada, el tercero `tipoTercero: 'personal'` con ese RUT y un acceso `trabajador` activo cuya contraseña es `initialPassword(rut)` = primeros 4 dígitos del cuerpo del RUT (FR-003, SC-001).
6. Cerrar sesión y entrar con ese RUT + contraseña inicial: primer intento exitoso; se ve solo su liquidación/historial en lectura (SC-002, FR-006).
7. Repetir el paso 4 con el **mismo RUT**: **Esperado**: solo se crea/actualiza la liquidación; no hay entidad, tercero ni acceso duplicado (FR-004).
8. Probar RUT con DV inválido y campos vacíos: **Esperado** rechazo con mensaje junto al campo y ningún registro creado (FR-005).

## Escenario B — US2: listado con búsqueda por RUT

1. Como `administrador`, abrir «Gestionar liquidaciones de sueldo» con ≥ 2 trabajadores con liquidaciones.
2. **Esperado**: columnas completas + acciones «Editar»/«Asociar»; filtros trabajador y período siguen funcionando (FR-007).
3. Escribir un RUT parcial en «Buscar por RUT»: **Esperado** el listado se reduce **mientras se escribe**, sin botón (FR-008, SC-003 < 1 s).
4. Búsqueda sin coincidencias: **Esperado** estado vacío «sin resultados» conservando el texto (FR-009).
5. Búsqueda vacía: **Esperado** listado completo.
6. Seleccionar una liquidación y «Editar» con valores válidos: **Esperado** cambios persistidos; la vista del trabajador los refleja al refrescar (esc. 4).
7. Editar con valores que incumplan reglas: **Esperado** rechazo con mensaje, sin guardar (esc. 5).

## Escenario C — US3: matriz de permisos

1. Como `finanzas`: nav = entidades, facturas venta/compra, movimientos, flujo de caja, seguimiento, búsqueda, Panel y «Gestionar liquidaciones de sueldo»; **sin** control de accesos ni avisos (FR-014).
2. En el listado de liquidaciones finanzas: **Esperado** búsqueda por RUT funcional pero **cero acciones** «Editar»/«Asociar» (FR-011, SC-005).
3. Intento directo (URL/estado interno) a `payroll-create` como finanzas o trabajador: **Esperado** redirección a la vista permitida del rol con mensaje, sin datos (FR-016, esc. 7 de US1).
4. Intento directo a entidades/facturas/etc. como administrador: **Esperado** redirigido a «Gestionar liquidaciones de sueldo» con mensaje (esc. 4 de US3).
5. Como `trabajador`: sin cambios; solo su liquidación e historial en lectura (FR-015).
6. Comprobar que ningún rol puede abrir `dev-notifications`; los avisos siguen en consola/`localStorage` (FR-020).

## Escenario D — 002 superseded y regresiones

1. Revisar `specs/002-payroll-access-control/spec.md` y `contracts/payroll-views.md`: **Esperado** notas puntuales «Superseded by 003-payroll-tabs-roles» en las partes contradictorias, sin reescritura del documento (FR-018).
2. `npm run check`: **Esperado** verde al 100 % salvo tests actualizados explícitamente por esta feature (SC-006).

## Criterios de éxito medibles

| SC | Verificación |
|---|---|
| SC-001 | Escenario A pasos 4–5 |
| SC-002 | Escenario A paso 6 |
| SC-003 | Escenario B pasos 3–4 |
| SC-004 | Escenarios C pasos 3–4 |
| SC-005 | Escenario C paso 2 |
| SC-006 | Escenario D paso 2 (`npm run check`) |
