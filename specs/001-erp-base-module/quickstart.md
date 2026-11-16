# Inicio Rápido: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Configuración

1. Instale las dependencias con `npm install`.
2. Inicie el servidor de desarrollo con `npm run dev`.
3. Abra la URL local de Vite en un navegador.

## Flujo de Usuario Principal

0. Si es su primera vez, abra la **Guía de uso** (botón del marco general o acceso del home) y siga sus 8 pasos; usa los mismos pasos que esta lista y no modifica datos (HU8, pendiente de implementar: ver T079 a T088 de `tasks.md`).
1. Cargue los datos de demostración desde el home cuando el módulo esté vacío (HU6).
2. En el home revise los KPIs: total por cobrar, total por pagar y facturas vencidas, y use los accesos directos.
3. Cree un tercero (cliente, proveedor o personal) con nombre, código, RUT, tipo y, si es cliente, límite de crédito.
4. Abra **Facturas de venta** y cree una factura de venta a un cliente (con `salesOrderId` opcional); la factura nace en Borrador. El formulario no muestra centro de costo ni período de liquidación.
5. Abra **Facturas de compra** y cree una factura de compra a un proveedor o a un personal (con centro de costo Activo/Consumible y, si es personal, período de liquidación `YYYY-MM`); la factura nace en Borrador. El formulario no muestra orden de venta.
6. Use **Editar** en cada listado. Compruebe que el folio y las fechas son de solo lectura. Seleccione **Emitida** y guarde. En compras, pruebe guardar sin centro de costo para comprobar la validación y luego emita con **Activo** o **Consumible**.
7. Vuelva a **Editar**, seleccione **Pagada** e ingrese el monto igual al total y la fecha de pago. En **Movimientos financieros**, compruebe la emisión y el pago, con la orden de venta o el centro de costo según el tipo de factura.
8. Abra el seguimiento para ver la deuda por tercero y las facturas vencidas (vencida = vencimiento anterior a hoy).
9. Elimine un tercero con facturas y compruebe la confirmación y el borrado en cascada de facturas y movimientos.

## Validación

### Separación de facturas (Revisión 4)

- Verifique que el menú no muestra una entrada genérica "Documentos" y que las facturas se abren solo desde "Facturas de venta" o "Facturas de compra".
- Verifique que una factura de venta no aparece en el listado de compra ni una de compra en el de venta.
- Verifique que el listado de venta muestra la columna Orden de venta (`salesOrderId`) y que el de compra muestra Centro de costo y Período de liquidación.
- Verifique que el formulario de venta no ofrece centro de costo ni período de liquidación, y que el de compra no ofrece orden de venta.
- Verifique que el tipo de factura no se puede cambiar desde el formulario y que se guarda según la vista de origen.
- Verifique que editar o eliminar desde un listado opera sobre el documento correcto y refresca la vista de su tipo.

### Reglas generales

- Verifique que los campos obligatorios muestran errores de validación.
- Verifique que un documento exige folio entero positivo y que el descuento no puede superar el subtotal.
- Verifique que un correo electrónico con formato inválido se rechaza con una explicación.
- Verifique que una compra no se puede emitir sin centro de costo y que el período de liquidación a personal debe ser `YYYY-MM` no posterior a la emisión.
- Verifique que no se puede pagar con un monto distinto del total ni pasar una factura Pagada a otro estado.
- Verifique que los movimientos financieros aparecen y no se pueden editar ni eliminar a mano.
- El aviso al superar el límite de crédito forma parte de T026 de `tasks.md` y sigue pendiente.
- Verifique que los resultados de búsqueda se actualizan a medida que el usuario escribe.
- Verifique que la lista permanece consistente tras las acciones de edición y eliminación.
- Verifique que las estadísticas del panel coinciden con el número de registros almacenados.

## Extender el Módulo Base

Los módulos ERP personalizados adaptan la base mediante un único archivo de configuración (`src/module-config.js`) en lugar de editar el código central:

1. Establezca el nombre del módulo y los mapeos de términos (p. ej., Entidad → Cliente, Documento → Pedido de Venta); cada pantalla se reetiqueta, incluida la barra lateral y el logotipo.
2. Declare campos personalizados por tipo de registro para usarlos en los formularios y la validación. Las columnas de las tablas de facturas se definen en `INVOICE_VIEWS`.
3. Defina el ciclo de vida de estados de documentos y las transiciones permitidas (p. ej., cotización → pedido → facturado).
4. Opcionalmente establezca `theme.accentColor` para remarcar los resaltados y controles principales de todo el espacio de trabajo.
5. Añada reglas de validación específicas del módulo junto a las reglas base donde sea necesario.

La generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, eliminación en cascada, navegación y búsqueda siguen siendo gestionadas por el módulo base. Sin archivo de configuración, la aplicación se ejecuta con el comportamiento predeterminado Entidad/Documento. Consulte `specs/001-erp-base-module/` para la especificación completa.
