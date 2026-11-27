# Quickstart: Rediseño visual de paneles por rol

**Feature**: `specs/004-role-dashboard-redesign/spec.md`

**Fecha**: 2026-11-24

**Uso**: guía de instalación y verificación manual/automatizada después de implementar las tareas derivadas de este plan.

## Preparación

```powershell
npm install
npm install @fontsource/ibm-plex-sans
npm run dev
```

- La segunda línea solo es necesaria si `package.json` aún no incluye la dependencia.
- Vite abre la aplicación en el servidor local indicado en terminal.
- Para validar tipografía sin internet, cargar la app con la red desactivada o bloquear dominios externos.

## Datos de demostración

| Rol | Acceso | Clave | Perfil esperado |
|---|---|---|---|
| Administrador | `88.888.888-8` | `8888` | `Recursos Humanos` / `R` |
| Finanzas | `55.555.555-5` | `5555` | `Finanzas` / `F` |
| Trabajador Ana | `22.222.222-2` | `2222` | `Ana Pérez Soto` / `AP` |
| Trabajador Bruno | `45000000-0` | `4500` | `Bruno Soto Vega` / `BS` |

## Verificación global

1. Confirmar que el título de la pestaña y `#brand-name` dicen exactamente `Contabilidad y Finanzas`.
2. Confirmar que el círculo superior derecho muestra `R`, `F`, `AP` o `BS` según el usuario; nunca `ERP` ni iniciales del módulo.
3. Confirmar en herramientas de desarrollador que `font-family` resuelve a IBM Plex Sans y que los montos usan cifras de ancho fijo.
4. Confirmar la paleta v1.2.0: acento `#023047`, gráficos `#219EBC`, información `#8ECAE6`, acción `#FFB703` con texto `#023047`, borde crítico `#FB8500`, texto favorable `#126782` y texto crítico `#A84F00`, con fondo gris claro y tarjetas blancas.
5. Confirmar que los períodos visibles aparecen como texto legible, p. ej. `noviembre 2026`, y que toda fecha visible como texto usa `DD-MM-AAAA` sin cambiar entradas ni almacenamiento `AAAA-MM-DD`.
6. Confirmar que los RUT visibles usan puntos y guion, p. ej. `22.222.222-2`, y que los montos visibles usan `formatCurrencyCLP`, p. ej. `$250.000`, nunca `250000 CLP`.
7. Reducir la ventana a 390 px: la página no debe desbordar horizontalmente; las tablas anchas se desplazan dentro de su contenedor.

## Verificación por rol

### Administrador

1. Iniciar sesión con `88.888.888-8` / `8888`.
2. En el Panel, confirmar `Rol: Recursos Humanos`, saludo con `Recursos Humanos`, mes legible y dos tarjetas: `Crear liquidación de sueldo` y `Gestionar liquidaciones de sueldo`.
3. Confirmar el resumen de nómina con tres métricas: trabajadores con acceso, liquidaciones del mes actual y liquidaciones en borrador.
4. Buscar en el DOM las palabras `Resumen financiero`, `Indicadores`, `Deuda pendiente`, `Caja neta`, `Por cobrar`, `Por pagar` y `Facturas vencidas`: ninguna debe aparecer visible.
5. Confirmar que no existe gráfico SVG de tendencia, alertas financieras ni tabla de movimientos.
6. Intentar abrir módulos financieros desde navegación: se mantiene la redirección de la spec 003.

### Finanzas

1. Cerrar sesión e iniciar con `55.555.555-5` / `5555`.
2. Confirmar saludo con `Finanzas` y mes legible.
3. Confirmar una sola sección de indicadores con exactamente cuatro tarjetas en una fila: `Caja neta`, `Por cobrar`, `Por pagar`, `Facturas vencidas`.
4. Confirmar que `Deuda pendiente` no aparece y que `Terceros` y `Facturas` son texto secundario.
5. Probar los tooltips ⓘ: la fórmula aparece solo al enfocar/hover; la etiqueta visible no contiene la fórmula.
6. Verificar colores v1.2.0:
   - Caja negativa: número `#A84F00`, borde/tinte `#FB8500`, sin fondo `#FFB703`.
   - Facturas vencidas > 0: texto `#A84F00`, borde/tinte `#FB8500`, sin fondo `#FFB703`.
   - Variación de caja: sube `#126782`, baja `#A84F00`.
   - Variación de por pagar/vencidas: sube `#A84F00`, baja `#126782`.
   - Variación de por cobrar: neutra.
   - Gráfico: ingresos `#219EBC`, gastos `#A84F00`.
   - Sin mes anterior: `sin dato anterior`, nunca `0 %`.
   - Contraste: texto ≥ `4.5:1`; gráficos y bordes ≥ `3:1`; flechas y etiquetas preservan el significado sin color.
7. Confirmar que cada tarjeta abre su lista filtrada: caja → Flujo de caja, cobrar → ventas, pagar → compras, vencidas → Seguimiento.
8. Confirmar gráfico SVG al lado de las alertas, con título, descripción, leyenda y seis meses.
9. Confirmar tabla con máximo cinco movimientos y enlace `Ver todos`.
10. Contar accesos rápidos: exactamente `Nueva factura de venta`, `Nueva factura de compra`, `Flujo de caja`, `Buscar`, todos en una línea.

### Trabajador

1. Cerrar sesión e iniciar con `22.222.222-2` / `2222`.
2. Confirmar que la navegación muestra solo `Mi liquidación` y que `#view-dashboard` permanece oculto.
3. Confirmar banner `¿Primera vez?` arriba de la vista del trabajador.
4. Confirmar nombre visible, período en texto legible y monto líquido destacado con `$` y separador de miles.
5. Confirmar que la tabla de desglose aparece solo si hay sueldo base, descuentos o bonos con valor.
6. Confirmar historial con montos en `$` y fechas de pago en `DD-MM-AAAA`.
7. Confirmar ausencia de indicadores, gráfico y alertas financieras.

## Banner y sesión

1. Con administrador, finanzas y trabajador, abrir el banner y verificar que se abre la guía sin modificar datos ni sesión.
2. Descartar el banner con un rol y recargar la página: permanece oculto para ese rol.
3. Cambiar a otro rol en la misma pestaña: el banner debe aparecer salvo que ese rol también lo haya descartado.
4. Verificar en `sessionStorage` la clave `erp.guideDismissed.<role>` y confirmar que `erp.session` no cambió.

## Verificación automática

```powershell
npm run check
npm run build
```

- `npm run check` ejecuta lint, formato y pruebas Vitest.
- `npm run build` confirma que la fuente local y el SVG propio se empaquetan sin recursos remotos.
- El resultado esperado es cero errores y cero pruebas fallidas.

## Criterios de salida

- 100 % de roles con solo datos y accesos autorizados.
- Panel del administrador con dos acciones de liquidación, tres métricas y cero indicadores financieros.
- Panel de finanzas con cuatro indicadores visibles sin scroll a 1366x768.
- Sin etiqueta `Deuda pendiente`.
- Sin `AAAA-MM` ni identificadores internos (`doc_`, `ent_`, `set_`, `salesOrderId`) en textos visibles; las fechas visibles usan `DD-MM-AAAA` y los RUT usan puntos y guion.
- Montos visibles en formato canónico CLP con `$`, separador de miles y ancho fijo, p. ej. `$250.000`.
- Nombre del sistema e iniciales correctos en todas las vistas, con `Recursos Humanos` / `R` para el rol administrador.
- Todas las pruebas automatizadas pasan.
