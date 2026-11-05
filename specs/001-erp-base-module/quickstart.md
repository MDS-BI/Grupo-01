# Inicio Rápido: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Configuración

1. Instale las dependencias con `npm install`.
2. Inicie el servidor de desarrollo con `npm run dev`.
3. Abra la URL local de Vite en un navegador.

## Flujo de Usuario Principal

1. Cargue los datos de demostración desde el home cuando el módulo esté vacío (HU6).
2. En el home revise los KPIs: total por cobrar, total por pagar y facturas vencidas, y use los accesos directos.
3. Cree un tercero (cliente, proveedor o personal) con nombre, código, RUT, tipo y, si es cliente, límite de crédito.
4. Cree una factura de venta a un cliente (con `salesOrderId` opcional) o una factura de compra a un proveedor (con centro de costo Activo/Consumible, o período de liquidación `YYYY-MM` si es personal); la factura nace en Borrador.
5. Emita la factura y compruebe que aparece en su listado (venta y compra son listados separados) y que generó un movimiento financiero.
6. Registre el pago (monto igual al total + fecha) y márquela Pagada; verifique el movimiento de contrapartida.
7. Abra el seguimiento para ver la deuda por tercero y las facturas vencidas (vencida = vencimiento anterior a hoy).
8. Elimine un tercero con facturas y compruebe la confirmación y el borrado en cascada de facturas y movimientos.

## Validación

- Verifique que los campos obligatorios muestran errores de validación.
- Verifique que un documento exige folio entero positivo y que el descuento no puede superar el subtotal.
- Verifique que un correo electrónico con formato inválido se rechaza con una explicación.
- Verifique que una compra no se puede emitir sin centro de costo y que el período de liquidación a personal debe ser `YYYY-MM` no posterior a la emisión.
- Verifique que no se puede pagar con un monto distinto del total ni pasar una factura Pagada a otro estado.
- Verifique que los movimientos financieros aparecen y no se pueden editar ni eliminar a mano.
- Verifique que emitir una factura que supera el límite de crédito avisa y exige confirmación, sin bloquear.
- Verifique que los resultados de búsqueda se actualizan a medida que el usuario escribe.
- Verifique que la lista permanece consistente tras las acciones de edición y eliminación.
- Verifique que las estadísticas del panel coinciden con el número de registros almacenados.

## Extender el Módulo Base

Los módulos ERP personalizados adaptan la base mediante un único archivo de configuración (`src/module-config.js`) en lugar de editar el código central:

1. Establezca el nombre del módulo y los mapeos de términos (p. ej., Entidad → Cliente, Documento → Pedido de Venta); cada pantalla se reetiqueta, incluida la barra lateral y el logotipo.
2. Declare campos personalizados por tipo de registro (texto, número, fecha, selección) — aparecen automáticamente en formularios, listas, validación y búsqueda.
3. Defina el ciclo de vida de estados de documentos y las transiciones permitidas (p. ej., cotización → pedido → facturado).
4. Opcionalmente establezca `theme.accentColor` para remarcar los resaltados y controles principales de todo el espacio de trabajo.
5. Añada reglas de validación específicas del módulo junto a las reglas base donde sea necesario.

La generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, eliminación en cascada, navegación y búsqueda siguen siendo gestionadas por el módulo base. Sin archivo de configuración, la aplicación se ejecuta con el comportamiento predeterminado Entidad/Documento. Consulte `specs/001-erp-base-module/` para la especificación completa.
