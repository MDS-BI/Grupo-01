# Investigación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Decisión: Usar Vite con HTML, CSS y JavaScript vanilla

**Justificación**: La solicitud enfatiza un enfoque de mínimas librerías y una implementación ligera. Vite proporciona una experiencia de desarrollo rápida y un pipeline de construcción simple sin requerir un framework más pesado. JavaScript vanilla mantiene la aplicación fácil de entender, fácil de probar y fácil de mantener para una pequeña aplicación de página única, y deja a los módulos personalizados libres de adoptar cualquier enfoque de interfaz por encima de ella.

## Alternativas consideradas

- React o Vue: Ecosistema de componentes más sólido, pero añade más abstracción y sobrecarga de dependencias de las necesarias para este alcance.
- HTML estático plano sin Vite: Más simple, pero Vite ofrece un mejor flujo de trabajo de desarrollo local y paso de construcción para crecimiento futuro.
- Persistencia en backend con base de datos: No es necesaria para un módulo base de espacio único y añadiría complejidad innecesaria; el contrato de almacenamiento está aislado, por lo que un backend puede introducirse más tarde sin cambiar la lógica del módulo.

## Decisiones adicionales

- Se usará localStorage del navegador para la persistencia porque el módulo base es de espacio único y no necesita almacenamiento del lado servidor.
- La interfaz inicial será una experiencia de página única con un panel, campo de búsqueda y lista de entidades.
- La aplicación favorecerá la mejora progresiva y los controles de formulario nativos accesibles sobre widgets personalizados complejos.
- El modelo de datos separa los datos maestros (Entidad) de los registros transaccionales (Documento), vinculados por un identificador público autogenerado (`entity_id`), de modo que los módulos personalizados puedan adjuntar cualquier significado de dominio a ambos lados sin cambios estructurales.
- Las preocupaciones base (generación de identidad, marcas de tiempo, integridad referencial, eliminación en cascada) residen en la capa de almacenamiento, manteniendo los módulos personalizados limitados a campos, etiquetas y reglas de validación.

## Decisión: fábrica compartida para dos formularios de factura independientes

**Justificación**: La Revisión 4 exige dos formularios independientes, pero duplicar un formulario de factura de más de 400 líneas en dos archivos haría que cualquier cambio de validación, estado o campos base tuviera que aplicarse dos veces (Constitución, principio I). Una fábrica `createInvoiceForm({ tipoFactura, root })` crea dos instancias con estado aislado, cada una con su propio `root` y sus propios `editingId`, entidades y errores. Los envoltorios `invoice-sale-form.js` e `invoice-purchase-form.js` hacen explícita la independencia de cada vista sin repetir la lógica.

**Alternativas consideradas**:
- Dos formularios completamente separados: máxima independencia, pero duplicación alta y riesgo de divergencia en reglas compartidas.
- Un formulario único con selector de tipo: es la situación actual y no cumple la separación visual/funcional.
- Una fábrica con estado global compartido: no sirve, porque ambas vistas pueden coexistir en el DOM y necesitan estados independientes.

## Decisión: renderizador de listados con columnas declarativas por tipo

**Justificación**: Los dos listados comparten la agrupación por tercero, el estado vacío y las acciones de editar/eliminar, pero difieren en columnas. Un renderizador común con `columns` declarativas evita duplicar la estructura de tabla y permite que cada vista defina su contrato de columnas: venta incluye `salesOrderId`; compra incluye `centroCosto` y `periodoLiquidacion`.

**Alternativas consideradas**:
- Dos listados separados con su propio renderizado: más código duplicado y pruebas repetidas.
- Un listado único que muestra todos los campos: incumple la separación de columnas de la Revisión 4.

## Decisión: separación lógica y de UI sobre un único Document

**Justificación**: El almacenamiento ya funciona con `erp.documents` y `customFields.tipoFactura`; cambiarlo a dos colecciones obligaría a migrar datos, duplicar la capa de almacenamiento y romper la integridad referencial existente. La separación visual y funcional se logra fijando el tipo por vista, aislando los listados y forzando el tipo al guardar. El tipo sigue siendo un dato del documento, no una decisión del usuario en el formulario.

**Alternativas consideradas**:
- Dos colecciones (`erp.salesInvoices` y `erp.purchaseInvoices`): separación física real, pero migración y duplicación innecesarias para el MVP.
- Dos entidades distintas: mismo problema y además duplica validaciones y movimientos.

## Decisión: retirar la vista genérica de documentos del menú y del HTML

**Justificación**: FR-020 prohíbe una vista genérica de documentos en el menú y FR-006 prohíbe reutilizarla. Mantenerla oculta dejaría una ruta muerta y confusa. Las pruebas que usaban `document-form`/`document-list` se migran a las vistas de venta y compra; la lógica compartida se conserva en las fábricas.

**Alternativas consideradas**:
- Mantener la vista genérica oculta por compatibilidad: conserva deuda y contradice la spec.
- Mantener el menú "Documentos" como acceso a todas las facturas: incumple la separación exigida.
