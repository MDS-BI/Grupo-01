# Módulo de Contabilidad y Finanzas — Grupo 1

Modelación de Sistemas 2026-2 · Departamento de Ingeniería Industrial · Universidad de Concepción

Módulo de facturación y pagos (por cobrar y por pagar) de un sistema ERP, construido sobre el template `Speckit_Template` con Spec Driven Development (Specify → Clarify → Plan → Tasks → Analyze → Implement). Es una aplicación solo frontend: los datos se guardan en el navegador (`localStorage` y `sessionStorage`) y no hay backend ni base de datos remota.

## Equipo

| Integrante | Historia de usuario original | Aportes principales al repositorio |
|---|---|---|
| Rivera Benavente, Jaime Alberto | HU1 Registrar terceros | Organización inicial del repositorio y del README; HU8 guía de uso y tutorial (tarea 6); revisión de privacidad con Speckit en la 002 (sin modo invitado, rol finanzas); MER único; formato en pesos chilenos; registro en Speckit de cambios hechos sin él; aviso al superar el límite de crédito (FR-029); correcciones con Speckit de la 003 (finanzas sin poder cambiar montos de liquidaciones; clarify y tasks del formulario propio de crear liquidación; T064) y de la 004 (menú de finanzas); revisiones del repositorio contra la rúbrica |
| Zavala Campos, Elías Ignacio | HU5 Ver la deuda por tercero y las facturas vencidas | Menú desplegable ☰ «Utilidades & Sesión» y reorganización del Panel |
| Vásquez Mera, Carolina Andrea | HU2 Emitir facturas de venta | Revisión 3 de la spec 001 e implementación de las HU1 a HU7 (05-11); minuta de cambios de la reunión con el profesor (04-11); coordinación del grupo; specs 003 (pestañas de liquidación y permisos por rol) y 004 (rediseño de los paneles por rol y constitución v1.1.0) con su implementación; implementación de T053–T062 y T065–T066 de la 003; cierre de tareas de la 001 |
| Espinoza Muñoz, Matías Ignacio | HU3 Registrar facturas de compra | Flujo de caja y Resumen financiero del Panel (tareas 7 y 8); desglose de la liquidación e historial de pagos del trabajador (HU3 de la 002) |
| Ulloa Troncoso, Javier Ignacio | HU4 Registrar el pago y marcar Pagada | Spec 002 (acceso por RUT, liquidaciones de sueldo y separación de facturas) y su primera implementación |
| Aguayo Puentes, Mauro Alejandro | HU6 Datos de demostración y otros módulos | Separación de las facturas de venta y de compra; revisión del login (rol visible y cierre de sesión) |

Coordinación del grupo: Carolina Vásquez.

## Visión de producto

**Problema.** Muchas pequeñas y medianas empresas llevan sus facturas en planillas sueltas. Eso les hace perder de vista cuánto les deben, cuánto deben y qué está vencido, y su flujo de caja se resiente. Además, las liquidaciones de sueldo quedan al alcance de cualquiera que abra la planilla.

**Solución (MVP).** Un módulo de facturación y pagos con acceso por RUT y contraseña. Registra terceros (clientes, proveedores y personal), facturas de venta y de compra separadas con su ciclo Borrador → Emitida → Pagada, liquidaciones de sueldo, movimientos financieros, flujo de caja y seguimiento de la deuda. Cada rol ve solo lo que le corresponde.

### Usuarios y roles

El módulo distingue tres roles de acceso. Cada usuario del negocio entra con uno de ellos:

| Usuario del negocio | Rol en la aplicación | Qué hace |
|---|---|---|
| Encargado de cobranzas | Finanzas | Registra clientes y emite facturas de venta |
| Encargado de pagos a proveedores | Finanzas | Registra facturas de compra |
| Contador | Finanzas | Registra los pagos de facturas y de liquidaciones de sueldo (sin poder cambiar sus montos) y revisa movimientos y flujo de caja |
| Gerencia | Finanzas | Revisa el Panel, el resumen financiero, la deuda por tercero y las vencidas |
| Responsable de remuneraciones (RRHH) | Recursos Humanos (clave interna `administrador`) | Crea y edita las liquidaciones de sueldo (con alta automática del trabajador, previa confirmación) y administra los accesos. No ve facturas ni reportes financieros |
| Trabajador | Trabajador | Ve solo su propia liquidación, con desglose e historial de pagos |
| Integrante del equipo (demostración) | Cualquiera, tras cargar la demostración | Carga datos ficticios para mostrar el flujo |

### Qué incluye el MVP

- **Acceso obligatorio** con RUT y contraseña, tres roles y cierre de sesión. No existe modo invitado.
- **Terceros** de tipo cliente, proveedor o personal, con RUT validado (módulo 11) y límite de crédito para clientes.
- **Facturas de venta y de compra** en vistas y colecciones separadas, con ciclo Borrador → Emitida → Pagada; centro de costo (Activo/Consumible) al emitir compras y período `AAAA-MM` en las compras a personal.
- **Pagos** como campos de la factura (monto pagado y fecha de pago).
- **Liquidaciones de sueldo** con sueldo base, descuentos y bonos, vinculadas a su factura de compra.
- **Movimientos financieros** generados por emisiones y pagos (solo lectura).
- **Flujo de caja** de las facturas pagadas y **resumen financiero** del Panel (saldo neto, deuda pendiente y caja neta).
- **Seguimiento** de la deuda por tercero y de las facturas vencidas, y **búsqueda** de registros.
- **Montos en pesos chilenos** con separador de miles.
- **Guía de uso** paso a paso según el rol, desde el menú ☰.
- **Datos de demostración** ficticios, cargados desde la pantalla de acceso.

**Qué no incluye (desarrollo futuro).** Pagos parciales o como registro propio, cambio y recuperación de contraseña, plan de cuentas y asientos contables, cálculo legal de remuneraciones (AFP, salud, impuestos), activos fijos, presupuestos, conciliación bancaria y backend.

## Escalabilidad y desarrollo futuro

- **Etapa 2: pagos como registro propio.** Hoy el pago va como campos de la factura. Más adelante se separaría en un registro ligado a la factura, para permitir pagos parciales y varios pagos por factura.
- **Etapa 3: contabilidad general.** Plan de cuentas y asientos contables alimentados por las facturas emitidas y pagadas, además de activos fijos, presupuestos y cálculo de remuneraciones.
- **Etapa 4: sistema completo.** Backend y base de datos reales, autenticación segura (contraseñas cifradas, cambio y recuperación), permisos aplicados en el servidor e integración con el resto de los módulos del ERP.

**Integración con otros módulos.** Los terceros se relacionan con `customers` (CRM) y `vendors` (Compras). Las facturas de venta, con `sales_orders` (Ventas), y las de compra, con `purchase_orders` (Compras). Por ahora la relación se guarda como referencia manual en texto libre (`salesOrderId` y "Referencia a otro módulo").

## Riesgos de datos y sesgos

- **RUT:** es un dato personal. Solo los roles administrador y finanzas ven los RUT de terceros; el trabajador solo ve el suyo.
- **Remuneraciones:** sueldos, descuentos y bonos son datos sensibles. El trabajador solo ve su propia liquidación; las de los demás las ven solo RRHH (administrador) y finanzas, como pidió el profesor.
- **Contraseña inicial (riesgo conocido):** son los primeros 4 dígitos del RUT y no se puede cambiar. Quien conozca el RUT de un compañero puede entrar como él.
- **Control solo de interfaz (riesgo conocido):** los permisos se aplican en el navegador, sin servidor ni cifrado. Alguien con conocimientos técnicos podría leer o modificar los datos.
- **Almacenamiento:** `localStorage` no es seguro; el MVP no debe usarse con datos reales. Los datos de demostración son ficticios.
- **RUT sin cifrar (riesgo conocido):** los RUT se guardan en texto plano en el navegador. Cifrarlos o guardarlos con *hash* requiere un backend, por lo que queda para la Etapa 4 de desarrollo futuro, como indicó el profesor.
- **Sesgo en el límite de crédito:** si se fija con criterios subjetivos, puede discriminar a algunos clientes (O'Neil, 2016). Los criterios deben documentarse y, en el futuro, calcularse con una fórmula transparente y revisable.
- **Sesgo en el seguimiento:** que una factura esté vencida no prueba que el cliente sea mal pagador (puede haber errores de registro o acuerdos de pago). El seguimiento informa, pero no debe usarse solo para castigar a un tercero.

## Dudas consultadas y cómo se resolvieron

| Duda (octubre-noviembre) | Cómo quedó |
|---|---|
| Un solo Tercero y una sola Factura, o documentos separados | Un solo Tercero con `tipoTercero`. Las facturas de venta y de compra se separaron en vistas (05-11) y en colecciones (`erp.salesInvoices` y `erp.purchaseInvoices`, 16-11) |
| Pagos como campos de la factura | Se mantiene: monto pagado y fecha de pago. Los pagos parciales quedan para el futuro |
| `startDate` y `endDate` como emisión y vencimiento | Sí, con las etiquetas "Fecha de emisión" y "Fecha de vencimiento" |
| Líneas de detalle de la factura | No en el MVP: basta con subtotal, descuento y total |
| Nomenclatura | Se usan los nombres del template (`entity_id`, `document_id`), con su correspondencia al modelo ERP base en `data-model.md` |
| Identificador compartido con CRM, Ventas y Compras | Referencia manual en texto libre, como indicó el ayudante |
| Contenido de `plan.md` | Incluye las puertas de calidad (`npm run check`) y la tabla de cobertura |
| Código del template copiado al repositorio | Se partió de esa base y los cambios se hacen con `speckit.implement`, como pidió el profesor |
| Pruebas e2e | El MVP no tiene pruebas e2e: los recorridos se cubren con pruebas de integración en Vitest y jsdom, y el ciclo completo de la demostración (crear, emitir y pagar una liquidación con los tres roles) se ensayó en el navegador el 26-11 |
| Versión de Speckit y constitución | Se mantiene la del repositorio; el profesor agregó la integración de Speckit con Claude el 15-11 |

## Cómo ejecutar

Requisitos: Node.js 22.22 o superior y npm.

> Desde la spec 004 el proyecto incluye la tipografía IBM Plex Sans como dependencia local (`@fontsource/ibm-plex-sans`), para no depender de internet. Después de cada `git pull`, ejecuta `npm install` antes de `npm run dev`.

```bash
npm install
npm run dev      # abre la aplicación en http://localhost:5173/
npm run check    # lint, formato y pruebas
npm run build    # genera la versión de producción en dist/
```

Para probar la aplicación:

1. Abre la aplicación y presiona **Cargar demostración** en la pantalla de acceso.
2. Ingresa con uno de los accesos ficticios de la sección [Datos de demostración](#datos-de-demostración) (por ejemplo, finanzas: `55.555.555-5` / `5555`).
3. Abre **Guía de uso** en el menú ☰ para un recorrido paso a paso.

### Solución de problemas

**«El RUT no está registrado» al ingresar.** Los accesos de demostración no vienen precargados: se crean al presionar **Cargar demostración** y quedan guardados solo en el navegador de quien prueba. Presiona ese botón antes de ingresar.

**«Cargar demostración» muestra «El módulo ya contiene datos o registros previos…».** La demostración solo se carga en un navegador sin datos del módulo. Si antes probaste otra versión del proyecto, u otro proyecto en la misma dirección (`localhost:5173`), quedaron datos guardados y no se crean los accesos de la tabla. Por ejemplo, hasta el 17-11-2026 el administrador de demostración era `11.111.111-1`. Para empezar limpio:

1. Abre la aplicación en una **ventana de incógnito** (`Ctrl + Shift + N` en Chrome o Edge), o
2. Borra los datos del sitio: `F12` → pestaña **Application** → **Storage** → **Clear site data**, y recarga la página.

Luego presiona **Cargar demostración** e ingresa, por ejemplo, con `88.888.888-8` / `8888`.

**La aplicación no abre o falta la tipografía después de un `git pull`.** Ejecuta `npm install` antes de `npm run dev`: la spec 004 agregó la dependencia `@fontsource/ibm-plex-sans`.

## Estado del proyecto (26-11-2026)

- **Especificaciones:** `specs/001-erp-base-module/` (facturación y pagos: HU1 a HU10), `specs/002-payroll-access-control/` (acceso por rol y liquidaciones: HU1 a HU7), `specs/003-payroll-tabs-roles/` (pestañas de liquidación y permisos por rol: HU1 a HU3) y `specs/004-role-dashboard-redesign/` (rediseño visual de los paneles por rol y de la gestión de liquidaciones: HU1 a HU7). Cada una tiene `spec.md`, `plan.md`, `data-model.md`, `tasks.md`, `quickstart.md` y `contracts/`.
- **Modelo entidad-relación:** `specs/001-erp-base-module/mer.png`, generado desde la sección 13 de `specs/002-payroll-access-control/data-model.md` (MER único del módulo). La spec 004 no cambia el modelo de datos.
- **Identidad visual (constitución v1.1.0):** nombre «Contabilidad y Finanzas», acento `#0f62fe`, tipografía IBM Plex Sans local con números tabulares, color solo para comunicar estado y montos en pesos chilenos.
- **Implementación:** todas las historias están implementadas, incluidos el aviso al superar el límite de crédito (FR-029 de la 001, T121–T125) el formulario propio para crear liquidaciones de la 003 (T053–T066) y la presentación consistente de datos de la 004 (T045–T060: fechas DD-MM-AAAA, montos en pesos, RUT con puntos, sin identificadores internos y rol «Recursos Humanos»). Las cuatro specs tienen todas sus tareas marcadas. La verificación se hace con `npm run check` (lint, formato y pruebas).
- **Revisión final:** se recorrió la demostración completa y se ejecutó `/speckit.analyze` (T049, T051 y T052 de la 001). El 26-11-2026 el grupo acordó cerrar los cambios del repositorio para enfocarse en la presentación.

## Registro de decisiones

| Fecha | Decisión | Quién |
|---|---|---|
| 28-10-2026 | Mover los specs a `specs/001-erp-base-module/`, según el feedback del profesor | Jaime Rivera |
| 29-10-2026 | Alcance del MVP: facturación y pagos, por cobrar y por pagar (pendiente de validar con el grupo) | Jaime Rivera |
| 29-10-2026 | Modelo de datos: un solo Tercero y una sola Factura, con los campos `tipoTercero` y `tipoFactura`; el pago va como campos de la factura (el ayudante recomendó documentos separados; pendiente de confirmar con el profesor) | Jaime Rivera |
| 29-10-2026 | `plan.md`: se edita solo el resumen y se mantienen las partes técnicas del template, como indican las clases | Jaime Rivera |
| 29-10-2026 | `tasks.md`: tareas por historia de usuario, armadas siguiendo las reglas de `speckit.tasks` porque OpenCode aún no está configurado | Jaime Rivera |
| 30-10-2026 | Respuestas del ayudante (Matías Arriagada): el MVP solo necesita lo esencial del departamento y no tiene que estar completo; el MER muestra solo lo que tendrá el proyecto y se puede cambiar después; basta con el README y los specs, sin informe aparte | Jaime Rivera |
| 30-10-2026 | Respuestas del ayudante: los comandos de Speckit se ejecutan desde OpenCode (`/speckit-...`); el código se genera con `speckit.implement`; cada integrante escribe su historia de usuario en el mismo `spec.md`, editándolo a mano | Jaime Rivera |
| 30-10-2026 | Integración con otros módulos: se deja de forma universal y se enfoca en este departamento; el ayudante lo confirmará con el profesor | Jaime Rivera |
| 01-11-2026 | Se fusionó el PR #2 a `main` y se borró la rama `docs/actualizar-readme`. Desde ahora el grupo trabaja solo en `main` y hace Fetch/Pull antes de editar, como indicó el profesor en su video | Jaime Rivera |
| 01-11-2026 | Reparto de historias: HU1 Jaime, HU2 Carolina, HU3 Matías, HU4 Javier y HU6 Mauro. Quedan por definir la HU5 y el líder del grupo. Se retira la HU7 (consultar facturas por número y fecha) y se mantiene la HU3 de Matías, para dejar seis historias | Grupo |
| 01-11-2026 | Se eliminó la copia duplicada de `spec.md` en la raíz (`001-erp-base-module/`), que reapareció por una edición hecha sobre la ruta antigua | Jaime Rivera |
| 01-11-2026 | Se precisó la HU6 para cargar clientes, proveedores y facturas ficticias, probar los procesos de cobro y pago y guardar referencias manuales a otros módulos. Se mantiene el alcance genérico indicado por el ayudante, pendiente de confirmación con el profesor y de alinear los demás documentos. | Mauro Aguayo |
| 01-11-2026 | Para la carga de demostración se definió que el módulo debe estar vacío. Repetir la carga no debe generar duplicados y, si existen registros propios, deben conservarse sin agregar los ejemplos. Estas condiciones quedaron incorporadas en los escenarios de aceptación de HU6. | Mauro Aguayo |
| 01-11-2026 | Se detallaron las tareas T040–T044 para cubrir pruebas, datos ficticios, botón de carga y referencias a otros módulos. Se conservaron sus identificadores y las tareas de los demás integrantes. La implementación sigue pendiente; tener la historia redactada no implica marcar estas tareas como terminadas. | Mauro Aguayo |
| 03-11-2026 | Feedback del profesor del 02-11: hacer la primera implementación, registrar lo modificado y lo incremental y volver al spec; dividir al grupo entre ajustes previos y funcionalidad nueva; integrar la nueva versión en 2 semanas | Grupo |
| 03-11-2026 | Revisión de coherencia entre documentos: se corrigió el conteo de aclaraciones pendientes, se alinearon `plan.md` y `tasks.md` (estructura de archivos y número de tareas), se retiraron del `spec.md` las menciones a personas y se unificó el formato de la HU6 | Jaime Rivera |
| 03-11-2026 | Elías Zavala asumió la HU5 (ver la deuda por tercero y las facturas vencidas), según sus commits del 02 y 03-11-2026. Con esto las seis historias tienen responsable; queda por definir el líder del grupo | Elías Zavala |
| 03-11-2026 | Se corrigió la configuración de ESLint y Prettier (error de arranque de ESLint, globales del navegador, `.prettierignore` para documentos y formato de los archivos de `tests/`) y se actualizó `package-lock.json` | Jaime Rivera |
| 03-11-2026 | Se copió al repositorio el módulo base del template (`src/`, `index.html`, `tests/setup/` y pruebas actuales) y se reemplazaron las pruebas antiguas. Se agregaron los globales de Node para `tests/` en ESLint y un almacenamiento en memoria en `tests/setup/dom.js` para Node 25 o superior. `npm run check` pasa | Jaime Rivera |
| 03-11-2026 | Revisión de coherencia con el código del template: se corrigieron en `data-model.md` las claves de almacenamiento (`erp.entities`, `erp.documents`) y el campo `document_id`; se registró que el template ya rechaza códigos de tercero duplicados (FR-019 solo queda pendiente para serie-folio); en `tasks.md` se marcaron T001 a T003 y se corrigieron las rutas de validación (`src/validation.js`). Se agregó la sección Cómo ejecutar | Jaime Rivera |
| 04-11-2026 | Reunión del grupo con el profesor: la minuta de cambios (11 puntos) define los ajustes de interfaz, terceros de tipo personal, centro de costo y liquidaciones; cada integrante toma tareas de la minuta | Grupo (minuta: Carolina Vásquez) |
| 05-11-2026 | Revisión 3 de la spec 001: terceros con tipo personal, facturas de venta y de compra como documentos separados en la interfaz y movimientos financieros (`erp.movements`); se implementan las HU1 a HU7 | Carolina Vásquez |
| 11-11-2026 | Nueva spec 002: acceso por RUT y contraseña con roles, liquidación de sueldo como factura de compra a un tercero personal y separación física de las facturas. Se crea en una spec aparte para no mezclarla con la facturación | Javier Ulloa |
| 16-11-2026 | Las facturas de venta y de compra se guardan en colecciones separadas (`erp.salesInvoices` y `erp.purchaseInvoices`), con migración idempotente desde `erp.documents` | Mauro Aguayo |
| 16-11-2026 | Se agregan el Flujo de caja y el Resumen financiero del Panel (tareas 7 y 8 de la minuta) | Matías Espinoza |
| 16-11-2026 | Se especifica la HU8 (guía de uso y mapa de navegación y accesos), tarea 6 de la minuta | Jaime Rivera |
| 17-11-2026 | Feedback del profesor sobre privacidad (un trabajador no debe ver la información de un colega): se elimina el modo invitado, se agrega el rol finanzas, la demostración se carga desde la pantalla de acceso y se documentan como riesgos la contraseña inicial y el control solo de interfaz. Se hizo con el ciclo completo de Speckit (clarify, plan, tasks, analyze, implement) | Grupo (ejecución: Jaime Rivera) |
| 17-11-2026 | El RUT del administrador de demostración pasa de `11.111.111-1` a `88.888.888-8`, porque coincidía con el de un proveedor de la demostración | Grupo |
| 20-11-2026 | La liquidación pasa a ser una entidad propia (`LiquidacionSueldo`, en `erp.payrollSettlements`) con sueldo base, descuentos y bonos, vinculada a su factura de compra; el trabajador ve su desglose y el historial de sus pagos | Matías Espinoza |
| 21-11-2026 | Mejora de UX en navegación y Panel: se oculta la barra lateral fija para usar ancho completo, se incorpora el menú desplegable "Utilidades & Sesión" (`☰`) adaptado por rol (Accesos y Avisos solo para administrador; Cerrar sesión para todos) con barra de retorno al Panel, y se reorganizan en grilla responsiva los 8 accesos operativos reales dentro del Panel sin agregar opciones vacías. | Elías Zavala |
| 23-11-2026 | Regla del profesor: todo cambio pasa por los comandos de Speckit. Los cambios hechos sin Speckit (flujo de caja, resumen del Panel y menú ☰) se registran en las specs y tareas, marcados como hechos y con su commit de origen | Jaime Rivera |
| 23-11-2026 | MER único del módulo (001 + 002) con 8 entidades, ajustado a lo que guarda la aplicación; `mer.png` se regenera desde ese diagrama | Jaime Rivera |
| 23-11-2026 | Todos los montos se muestran en pesos chilenos con separador de miles, y el trabajador no ve el Flujo de caja ni el Resumen financiero | Jaime Rivera |
| 23-11-2026 | La guía de uso se abre desde el menú ☰ y muestra solo los pasos de las vistas que el rol puede abrir (11 pasos para administrador y finanzas, 2 para trabajador) | Jaime Rivera |
| 24-11-2026 | Se implementa la spec 003 con el ciclo completo de Speckit (analyze dos veces antes de implementar): el administrador queda limitado al Panel, crear y gestionar liquidaciones y control de accesos; finanzas ve las liquidaciones en solo lectura con búsqueda por RUT; nadie ve los avisos al desarrollador. Se agregaron T041 (pruebas heredadas y guía de uso) y T042 (vista de creación sin selector de tercero ni facturas de proveedores) | Carolina Vásquez |
| 24-11-2026 | Spec 004, rediseño de los paneles por rol según el feedback del profesor (más atractivo e intuitivo). Administrador: Panel solo con resumen de nómina y accesos de liquidaciones, sin datos financieros (corrige un hueco de la 003). Finanzas: 4 indicadores con color por estado y variación favorable/desfavorable respecto al mes anterior, fórmulas en tooltip, gráfico SVG propio de 6 meses, alertas, últimos 5 movimientos y 4 accesos rápidos compactos; se elimina «Deuda pendiente» por sumar lo que nos deben con lo que debemos. Trabajador: monto líquido destacado, período legible y desglose solo si tiene valores. Nombre del sistema «Contabilidad y Finanzas», iniciales de la persona en el círculo y banner de guía descartable por rol. Ciclo Speckit completo (constitution, specify, plan, tasks regeneradas con TDD); las rondas 2 a 4 de implementación se hicieron con ayuda directa de Claude sobre las mismas tareas de `tasks.md`, verificadas con `npm run check` y revisión en el navegador. Nota: el commit `5c55ff7` contiene la ronda 4 aunque su mensaje dice ronda 3 | Carolina Vásquez |
| 24-11-2026 | Spec 004, HU7 agregada tras la verificación manual: «Gestionar liquidaciones de sueldo» con períodos legibles, estado con color y referencia «Compra serie-folio» en vez del identificador interno; el formulario de edición aparece solo al pulsar «Editar», se reduce a período, estado (lista), sueldo base, bonos y descuentos, y el monto líquido se calcula solo (sueldo base + bonos − descuentos) para evitar liquidaciones inconsistentes. Implementado con ayuda directa de Claude | Carolina Vásquez |
| 25-11-2026 | Se corrige la spec 003 tras una prueba manual: finanzas podía cambiar el monto de una liquidación editando su factura de compra. Esas facturas quedan de solo lectura para finanzas en todas las vistas, salvo registrar el pago; se pide confirmación antes de crear el acceso de un trabajador nuevo | Jaime Rivera |
| 25-11-2026 | Se corrige la spec 004: el menú ☰ de finanzas no permitía llegar a Terceros, Seguimiento ni Liquidaciones de sueldo. Ahora muestra sus 8 vistas antes de «Guía de uso»; los accesos rápidos siguen siendo cuatro | Jaime Rivera |
| 25-11-2026 | FR-029 de la 001: al emitir una venta que hace superar el límite de crédito del cliente se muestra un aviso con confirmación explícita, sin bloquear la emisión (T121–T125, que reemplazan a T026). Ciclo Speckit completo (clarify, tasks, implement) | Jaime Rivera |
| 25-11-2026 | Spec 003: la vista «Crear liquidación de sueldo» pasa a tener un formulario propio (RUT, nombre completo, período, sueldo base, bonos, descuentos, fechas, serie y folio) con el monto líquido calculado y sin campos de factura de compra; su listado muestra solo liquidaciones. Clarify y tasks con Speckit (Jaime Rivera); implementación de T053–T062 con ayuda directa de Claude sobre esas mismas tareas | Jaime Rivera y Carolina Vásquez |
| 25-11-2026 | Cierre para la entrega final: Carolina Vásquez queda como coordinadora del grupo; se marcan en `tasks.md` de la 001 las tareas ya hechas o reemplazadas por otras (T004, T026, T045–T047, T050, T068, T070, T079–T088 y el anexo de la HU2); se corrige la codificación de `plan.md` de la 001 (cuatro tildes guardadas fuera de UTF-8) y se actualiza su `quickstart.md` | Carolina Vásquez |
| 26-11-2026 | Spec 003 (T064): el listado de «Crear liquidación de sueldo» se refresca al abrir la pestaña, porque quedaba vacío después de «Cargar demostración» hasta guardar una liquidación | Jaime Rivera |
| 26-11-2026 | `/speckit.analyze` sobre la spec 003 detectó que `plan.md`, `research.md`, `data-model.md`, `quickstart.md` y los contratos seguían describiendo el formulario de compra reutilizado. Se sincronizaron con las clarificaciones del 24-11 (pago por finanzas, facturas vinculadas en solo lectura) y del 25-11 (formulario propio), con notas de *superseded* en `tasks.md` y sin cambios en `spec.md` ni en el código | Carolina Vásquez |
| 26-11-2026 | Al ensayar la demo en vivo del ciclo completo (crear → emitir → pagar) se detectaron dos errores en la spec 003: una liquidación creada con el formulario propio no se podía emitir por no tener centro de costo (T065, se asigna «Consumible») y los formularios de edición y pago quedaban abiertos al cambiar de rol (T066, se cierran al cerrar sesión). Ambos con prueba previa | Carolina Vásquez |
| 26-11-2026 | Revisión final del README contra la rúbrica: se actualizan el estado del proyecto y los aportes del equipo; la sección de la funcionalidad 002 se alinea con los permisos de la 003 (describía a finanzas editando liquidaciones y al administrador con todas las funciones); se corrigen los pasos de la guía por rol y se agrega el riesgo del RUT sin cifrar | Jaime Rivera |
| 26-11-2026 | Spec 001 (clarify): se cierran sus dos «(Por confirmar)» (fechas de emisión y vencimiento; vista «Buscar» en FR-020 y FR-022) y el mapa de navegación se alinea con los permisos de la 003 | Jaime Rivera |
| 26-11-2026 | Spec 004 (T045–T060): toda fecha visible en DD-MM-AAAA, todos los montos en pesos chilenos (las listas de facturas mostraban «250000 CLP»), ninguna vista muestra identificadores internos (Movimientos y Control de accesos los mostraban), RUT siempre con puntos, el rol administrador se muestra como «Recursos Humanos» (la clave interna no cambia), leyenda del ciclo Borrador → Emitida (aprobada por RRHH) → Pagada (finanzas registró el pago) y sin desborde horizontal a 390 px. Ciclo Speckit completo; el commit de la implementación es `6ad8eee`, cuyo nombre quedó como «http://localhost:5173/» por un error al copiar | Jaime Rivera |
| 26-11-2026 | Spec 002 (clarify): notas «superseded por 004 (FR-059)» donde se indicaba «Rol: Administrador», para que los specs no se contradigan al regenerar la aplicación desde ellos, como hará el profesor el día de la presentación | Jaime Rivera |

## Uso de IA (anexo)

Según la política del curso, cada consulta a un modelo de IA generativa se registra con modelo, fecha y secuencia de prompts.

| Fecha | Integrante | Modelo (versión) | Para qué | Prompts |
|---|---|---|---|---|
| Antes del 26-10-2026 (fecha exacta no registrada) | Jaime Rivera | Gemini (Google), versión no registrada | Primer avance: versión anterior de los specs | No se conservan: el chat fue borrado |
| 28-10-2026 al 03-11-2026 | Jaime Rivera | Claude (Anthropic); modelo configurado en la sesión: claude-sonnet-5-5 (el modelo que respondió puede variar) | Organización del repositorio, definición del alcance, README, spec, data-model, MER, plan y tasks; resolución de conflictos del PR; revisión del repositorio contra el enunciado, la rúbrica y el feedback; corrección de incoherencias entre documentos; preparación del computador para el taller y corrección de ESLint y Prettier | Secuencia resumida: (1) reorganizar el repositorio según el feedback del profesor; (2) definir el alcance del módulo (facturación y pagos, por cobrar y por pagar); (3) rehacer `spec.md` y `data-model.md` y generar el MER; (4) editar solo el resumen de `plan.md` y armar `tasks.md`; (5) resolver los conflictos del PR y repartir las historias; (6) revisar el repositorio contra el enunciado, la rúbrica y el feedback; (7) corregir incoherencias entre documentos; (8) preparar el computador para el taller de OpenCode y Speckit; (9) probar y corregir la configuración de ESLint y Prettier |
| 03-11-2026 | Jaime Rivera | Big Pickle (modelo por defecto de OpenCode 1.19.5) | Pruebas de la instalación de OpenCode en el repositorio: lectura de archivos y `/speckit.analyze`, con el agente Plan, sin editar archivos | (1) "Responde solo con la palabra OK"; (2) "Lee specs/001-erp-base-module/tasks.md y spec.md. Dime cuántas tareas con identificador T### hay en tasks.md, cuántas historias de usuario tiene spec.md y cuántos marcadores [NEEDS CLARIFICATION] hay en spec.md."; (3) `/speckit.analyze` |
| 01-11-2026 | Mauro Aguayo | GPT-6.1 Sol (ChatGPT Work) | Apoyo para comprender y redactar la HU6, definir sus escenarios de aceptación y ajustar sus tareas al resto del proyecto. También se recibió orientación para resolver problemas de Git y mantener el trabajo en main. | No se conservan |
| 02-11-2026 | Mauro Aguayo | GPT-6.1 Sol (OpenCode) | Revisión de la coherencia entre especificaciones, plan y tareas mediante speckit.analyze. Se analizaron los hallazgos y las propuestas de mejora para identificar ajustes pendientes antes de implementar el módulo. | No se conservan |
| 11-11-2026 | Javier Ulloa | Opencode, modelos gratuitos | Creacion de roles (Trabajador y Administrador) | Genera dos roles nuevos "Trabajador" y "Administrador", el rol de trabajador solo tendra acceso a lectura exclusivamente a su liquidacion de sueldo, mientras que administrador podra crear y editar liquidaciones de sueldo |
| 16-11-2026 al 17-11-2026 | Mauro Aguayo | GPT Sol (OpenCode) | Apoyo para separar las facturas de venta y de compra y mejorar la pantalla de acceso y la navegación de sesión. | (1) Separar las facturas de venta y de compra. (2) Revisar y ajustar el inicio y cierre de sesión. |
| 04-11-2026 al 16-11-2026 | Jaime Rivera | Claude (Anthropic); modelo configurado en la sesión: claude-sonnet-5-5 (el modelo que respondió puede variar) | Preguntas para el profesor (Word, PDF y Teams); análisis del repositorio, del chat del grupo y de la minuta de cambios; redacción de la HU8 (tarea 6: guía de uso y tutorial) en `spec.md`, `tasks.md`, `plan.md`, `quickstart.md` y `contracts/navigation-and-access.md`. La HU8 se escribió directamente en los archivos, sin comandos de Speckit; el 23-11 se actualizó con `/speckit.clarify`. | (1) "Analiza el repo con todos los archivos según la rúbrica y hazme un PDF con las preguntas ordenadas"; (2) "Analiza la conversación del grupo y la minuta de Caro"; (3) "Analiza el repositorio antes de empezar con mi tarea, que es la 6"; (4) "Haz una última revisión general, sobre todo a la tarea 6". |
| 16-11-2026 | Javier Ulloa| Opencode, modelos gratuitos | Implementacion de los ultimos cambios para evaluar avances y posibles cambios | Uso de /speckit.implement  |
| 17-11-2026 al 23-11-2026 | Jaime Rivera | Claude (Anthropic); modelo configurado en la sesión: claude-opus-5-5 desde el 17-11 (el modelo que respondió puede variar) | Revisión del repositorio contra la rúbrica, el feedback del profesor y el video de la app; prueba de privacidad por rol en el navegador (detectó que el modo invitado mostraba los sueldos); redacción de los prompts de Speckit y revisión de cada resultado antes del commit; detección de RUT de demostración con dígito verificador inválido y del foco perdido en la guía; generación de `mer.png` desde el diagrama Mermaid de `data-model.md`. Claude no hizo commits. | (1) "Analiza los chats, el video de Juvex y el feedback del profesor"; (2) "Revisa cada cosa que se hizo, partiendo por lo que más nos preocupa"; (3) "Crea el mensaje para el grupo"; (4) "Empecemos con lo que dijiste que se podía hacer"; (5) "Revisa que todo esté bien"; (6) "Vamos con el MER" y "Hagamos el anexo". |
| 17-11-2026 al 18-11-2026 | Jaime Rivera | Big Pickle (modelo por defecto de OpenCode 1.19.5) | Ciclo completo de Speckit sobre la spec 002 por el feedback de seguridad y privacidad: eliminar el modo invitado, agregar el rol finanzas, cargar la demostración desde el acceso y documentar los riesgos de la contraseña inicial y del control solo de interfaz. | (1) `/speckit.clarify` con las seis decisiones del grupo; (2) corrección de los RUT de demostración (88.888.888-8 y 55.555.555-5); (3) `/speckit.plan`; (4) `/speckit.tasks` conservando T001-T078 (agrega T079-T111); (5) `/speckit.analyze` y aplicación de F2, F4, F5, F10 y F14; (6) `/speckit.implement` de T079-T111; `npm run check` 275/275. |
| 16-11-2026 y 20-11-2026 | Matías Espinoza | Big Pickle (OpenCode; versión no registrada) | Tareas 7 y 8 de la minuta: vista de Flujo de caja (entradas y salidas financieras) y Resumen financiero del Panel conectado a las entidades y movimientos reales (HU9 y HU10 de la spec 001, commit `ec14932`). Modificación de la HU3 para mejorar la interfaz del trabajador con el desglose de la liquidación y el historial de pagos (spec 002, commit `7f64cff`). | (1) "Seguir trabajando con el plan de tareas siguiendo los pasos 7 y 8 creacion de la vista de flujo de caja (entradas y salidas financieras) y Conectar las tarjetas de resumen numérico del Home/Dashboard (saldos, deuda, caja) directamente con las entidades y movimentos reales creados"; (2) "modificacion de la hu3 para mejorar la interfaz de trabajador agregando historial de pagos". |
| 21-11-2026 | Elías Zavala | Gemini (Google) y OpenCode | Diagnóstico de compatibilidad de navegación y pruebas, diseño UX del menú desplegable por rol y reorganización responsiva de los 8 accesos operativos del Panel (Iteraciones A y B). | 1. Revisión del estado actual del repositorio y opciones de mejora UX. → 2. Diagnóstico de IDs `#nav-*`/`#qa-*` e impacto en pruebas de integración. → 3. Implementación incremental de Iteración A (menú `☰`, barra de retorno y ancho completo) e Iteración B (grilla e íconos del Panel). |
| 23-11-2026 | Jaime Rivera | Big Pickle (modelo por defecto de OpenCode 1.19.5) | Registro en Speckit de cambios hechos sin él y mejoras pendientes: menú ☰ de Elías (spec 002, T142-T147); MER único en `data-model.md`; HU9 Flujo de caja y HU10 Resumen financiero de Matías (spec 001, T089-T098); formato en pesos chilenos y bloqueo por rol (T099-T111); HU8 actualizada a roles e implementación del tutorial (T112-T120). | (1) `/speckit.clarify` y `/speckit.tasks` del menú ☰ en la 002 y `/speckit.implement` de T147; (2) `/speckit.plan` solo para la sección 13 (MER) de `data-model.md`; (3) `/speckit.clarify`, `/speckit.tasks` y `/speckit.implement` de HU9, HU10 y formato CLP en la 001 (con `SPECIFY_FEATURE_DIRECTORY=specs/001-erp-base-module`); (4) `/speckit.clarify`, `/speckit.tasks` y `/speckit.implement` de la HU8 y corrección del foco (FR-035, T120); `npm run check` 323/323. |
| 23-11-2026 al 24-11-2026 | Javier Ulloa | Opencode, con modelos gratuitos variados | Para modificar roles de trabajador, administrador y finanzas, ademas crear pestaña de creacion de liquidacion de sueldo y otra para visualizar lista de liquidaciones de sueldo | Generar que rol de administrador cree exclusivamente liquidaciones de sueldo, generar una pestaña a parte con listado mas busqueda de liquidaciones de sueldo filtradas por RUT, y que al rol de finanzas se le restringia la edicion y creacion de liquidaciones de sueldo (solo lectura) |
| 23-11-2026 al 24-11-2026 | Carolina Vásquez | Claude (Anthropic), en un Proyecto de claude.ai; modelo de la sesión: claude-opus-5-5 | Tutoría para ejecutar el proyecto y aplicar el feedback del profesor; diagnóstico visual del Panel; instalación de la skill frontend-design en OpenCode; revisión del repositorio tras los cambios del grupo; guía del ciclo Speckit de la spec 003 (análisis de los informes de `/speckit.analyze`, corrección de tareas y de pruebas heredadas, detección en el navegador de facturas de proveedores visibles al administrador); redacción de la constitución v1.1.0 y de la spec 004; revisión de spec, plan y tareas; implementación directa de las rondas 2 a 4 de la 004 y de la HU7 sobre las tareas de `tasks.md`, verificada con `npm run check` y en el navegador; README y sección de solución de problemas | (1) "Necesito saber cómo ejecutar el modelo para ver cómo está quedando" → (2) "El profesor nos dijo que teníamos que hacerlo visualmente más atractivo y mejorar el panel de inicio" → (3) "Cómo obtener la skill frontend-design" (trabajando con OpenCode) → (4) "Analiza si quedó en orden el repositorio para comenzar con las modificaciones del panel" → (5) "Yo implementaré todo, indícame cómo hacerlo con la 003" (con los informes de `/speckit.analyze`) → (6) "Necesito mejorar la vista de los paneles: más llamativos e intuitivos, con otro color y otro título" → (7) "Mantener el color y cambiar la tipografía a una idónea de finanzas" → (8) "¿Puedes hacer las modificaciones directamente en el repositorio?" → (9) "Cómo podemos mejorar Gestionar liquidaciones en el rol de administrador" → (10) "Verifica si el README está actualizado (el profesor no pudo ingresar con los RUT)" → (11) "Agrega la sección de solución de problemas" |
| 24-11-2026 | Carolina Vásquez | OpenCode, con modelos gratuitos de OpenCode Zen que fueron variando según su disponibilidad y el límite de tokens; versiones no registradas | Ciclo Speckit de la spec 003 (análisis, correcciones e implementación por fases, T001–T042) y de la spec 004 hasta la ronda 1 (constitución, specify, plan, tasks e implementación de T001–T017) | (1) `/speckit.analyze` sobre la 003 dos veces, con correcciones de tareas entre medio → (2) `/speckit.implement` por fases: 1-2, T041 (pruebas heredadas), 3, 4-5, 6-7 con T042 → (3) `/speckit.constitution` (identidad visual v1.1.0) → (4) `/speckit.specify` de la 004 y sus correcciones → (5) `/speckit.plan` → (6) `/speckit.tasks`, regenerado con TDD y luego corregido → (7) `/speckit.implement` T001–T008 y T013–T017 |
| 24-11-2026 al 25-11-2026 | Jaime Rivera | Claude (Anthropic), modelo configurado en la sesión: claude-opus-5-5; y Big Pickle (modelo por defecto de OpenCode 1.19.5) | Claude: revisión del trabajo del grupo contra la rúbrica y prueba de permisos en el navegador (detectó que finanzas podía cambiar montos de liquidaciones y que no podía llegar a sus vistas), redacción de prompts y revisión de cada resultado; Revert de dos commits que habían reemplazado la spec 002 por una versión antigua. OpenCode: ciclos clarify, tasks e implement en las specs 003 y 004. Claude no hizo commits | (1) "Revisa el repo, mi grupo estuvo trabajando"; (2) "Revisa si está todo bien según la rúbrica"; (3) `/speckit.clarify`, `/speckit.tasks` y `/speckit.implement` en la 003 (T043-T052) y en la 004 (T037-T040); `npm run check` 398/398 |
| 25-11-2026 | Carolina Vásquez | Claude (Anthropic), modelo configurado en la sesión: claude-opus-5-5 (el modelo que respondió puede variar) | Revisión del repositorio contra los 6 ítems de la rúbrica antes de la presentación; implementación de T053–T062 de la spec 003 (pruebas primero) con verificación en un navegador headless; cierre de tareas de la 001, corrección de la codificación de `plan.md` y actualización de este README. Claude no hizo commits | (1) "Necesito que analices el estado del repo y me digas si estamos listos para armar la presentación, según los 6 puntos que están en el archivo subido al contexto"; (2) "Ayúdame a cerrar lo que queda pendiente" |
| 26-11-2026 | Carolina Vásquez | Claude (Anthropic), modelo configurado en la sesión: claude-opus-5-5 (el modelo que respondió puede variar) | Corrección de los hallazgos CRITICAL, HIGH y MEDIUM de `/speckit.analyze` en la documentación de diseño de la spec 003, contrastada con el código; también la presentación y la guía de ensayo de la demo (fuera del repositorio); recorrido automatizado de la demo en un navegador, que detectó los errores de T065 y T066, y su corrección con pruebas previas. Claude no hizo commits | (1) "Desarróllame la parte 3 y la parte 4" (guía de ensayo y presentación); (2) "Hacer las correcciones contigo" (sobre el reporte de `/speckit.analyze`); (3) "Necesito modificar qué mostrar y qué decir en la demo en vivo" |
| 25-11-2026 al 26-11-2026 | Jaime Rivera | Claude (Anthropic), modelo configurado en la sesión: claude-opus-5-5 (el modelo que respondió puede variar); y Big Pickle (modelo por defecto de OpenCode 1.19.5) | Claude: análisis de la conversación con el profesor sobre los roles; prueba en el navegador del formulario de crear liquidación (detectó campos de factura de compra, ids repetidos y el listado vacío corregido en T064); revisión final del repositorio y de la página contra la rúbrica; redacción de los prompts y de esta actualización del README. OpenCode: clarify, tasks e implement de la 003 (T053–T064); clarify de la 001 y de la 002; clarify, tasks e implement de la 004 (T045–T060). Claude no hizo commits | (1) "Analiza lo que respondió el profe para ver con qué seguimos"; (2) `/speckit.clarify` del formulario propio de crear liquidación; (3) `/speckit.tasks` de T053–T063 y de T064; (4) `/speckit.implement` de T064; (5) "Haz una evaluación total del repo, del MVP y de la página según la rúbrica y lo que ha dicho el profe"; (6) "Hagamos todo el ítem A de arreglos"; (7) `/speckit.clarify` de la 001 para cerrar pendientes; (8) "Mejoremos todo lo que queda del repo hasta el más mínimo detalle" (clarify, tasks e implement de la 004); (9) `/speckit.clarify` de la 002 para alinearla con la 004 |

## Referencias

- O'Neil, C. (2016). *Weapons of Math Destruction: How Big Data Increases Inequality and Threatens Democracy*. Crown.
- Template `MDS-BI/Speckit_Template` y modelo de datos ERP base del curso.
- Enunciado del trabajo grupal y diapositivas de Modelación de Sistemas 2026-2, Universidad de Concepción.

---

## Base técnica del template (original, no modificar)

> **Nota:** esta sección es la descripción original del template y no refleja el estado actual del módulo. Por ejemplo, los datos se guardan en las claves `erp.*` (`erp.entities`, `erp.documents`, `erp.accessRecords`, entre otras). Para el funcionamiento actual, ver «Cómo ejecutar», «Estado del proyecto» y las specs en `specs/`.

### ERP Software Base Module (Vite + Vanilla JS)

Minimal single-page app serving as an Enterprise Resource Planning (ERP) software base module. It provides the common foundation for building custom ERP modules: master data management (Entities) and linked transactional documents (Documents) with create/edit/delete/search, validation, and browser localStorage persistence — using Vite and vanilla HTML, CSS, and JavaScript.

The user interface is fully in **Spanish** (default terms: Entidad / Documento; module name: Módulo Base ERP), including labels, validation messages, empty states, and dialogs.

Entities carry standard ERP master-data fields (name, code, tax ID, email, phone, address, category, target date, credit limit, payment terms). Documents use series + folio numbering and carry a monetary breakdown (subtotal, discount, tax, total), currency, payment terms, notes, quantity, dates, and status.

The app presents itself as a coherent ERP workspace:

- **Workspace shell** — every screen lives inside a branded chrome: a top bar with a logo (an SVG monogram derived from the module name) and module name, plus a persistent sidebar of module buttons (Panel, Entidades, Documentos, Búsqueda). The active module is highlighted (`aria-current="page"`), and the sidebar collapses to an icon rail on narrow viewports.
- **Home dashboard** — the entry screen offers quick-action buttons for key ERP tasks (new entity, new document, open management areas, find records) and live statistic cards showing record counts.
- **Design tokens** — styling is driven by CSS custom properties in `src/styles.css`, so branding changes apply globally.

### Setup

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints).

### Tests

Run the full test suite (unit + integration) with:

```bash
npm test
```

Or a one-off run without watch mode:

```bash
npx vitest run
```

### Building Custom Modules

Custom ERP modules built on this base define:

- What an **Entity** represents (e.g., customer, product, asset) plus domain-specific fields.
- What a **Document** represents (e.g., order, invoice, contract).
- Module-specific labels and validation rules.

The base module handles identity generation, timestamps, referential integrity between entities and documents, cascade deletion, navigation, and search. See `specs/001-erp-base-module/` for the full specification.

### Tailoring via Configuration

All tailoring lives in one place: the `userConfig` object at the top of `src/module-config.js`. Developers edit this single export; no core code changes are required. Available knobs:

- `moduleName` — display name shown in the top bar, dashboard, and document title; also derives the logo monogram.
- `labels` — rename Entity/Document terms across every screen, including sidebar buttons, quick actions, forms, and messages. Spanish articles and agreements (el/la, seleccionado/a) are derived from the first word of each configured term.
- `customFields` — declare extra fields per record type with `target` (`entity` or `document`), `key`, `label`, `type` (`text`, `number`, `date`, or `select`), optional `required`, and `options` for selects. Keys must not collide with base field names (see `specs/001-erp-base-module/data-model.md`). Values persist alongside records and appear in search results.
- `statusLifecycle` — restrict document statuses to a configured list of `statuses` with permitted `transitions` between them. Without it, status stays a free-form field.
- `theme.accentColor` — a hex color (e.g., `"#0f62fe"`) applied across the shell as highlights and primary controls. Invalid values fall back to the default.

If the configuration is invalid (unknown types, bad keys, transitions referencing unknown statuses, non-hex accent colors), the app shows the problems in a banner and falls back to defaults instead of breaking.

### Notes

- Data is persisted to `localStorage` under the keys `erp_base_module:entities` and `erp_base_module:documents`.
- Deleting an entity also deletes its documents (cascade).
- This project intentionally uses vanilla HTML, CSS, and JavaScript for simplicity.

---

## Control de acceso por RUT y contraseña (funcionalidad 002)

La aplicación abre en una pantalla de acceso con RUT y contraseña. **El ingreso es
obligatorio**: no existe el rol invitado ni la opción "Continuar sin iniciar
sesión". Sin una sesión válida no se muestra ninguna vista de negocio. La
contraseña inicial son los primeros cuatro dígitos del cuerpo del RUT, omitiendo
puntos y dígito verificador. Los accesos los crea el administrador; la contraseña
inicial es inmutable y no puede cambiarse desde la aplicación. La sesión se guarda
en `sessionStorage` (`erp.session`): se conserva al recargar la pestaña y termina
al cerrar sesión o al cerrar la pestaña. **Cerrar sesión** es la última opción del menú desplegable ☰ «Utilidades & Sesión»,
sin una opción para volver al acceso desde dentro del ERP.

Los roles son administrador, finanzas y trabajador:

- **Trabajador**: ve solo **Mi liquidación**, la liquidación vigente de su tercero
  personal con sueldo base, descuentos, bonos y el historial de pagos efectuados,
  en modo de solo lectura.
- **Finanzas**: ve y edita terceros, facturas de venta y de compra, movimientos,
  flujo de caja, seguimiento y búsqueda. Ve las liquidaciones de sueldo en solo
  lectura, con búsqueda por RUT, y su única acción sobre ellas es **Registrar
  pago** en las liquidaciones `Emitidas`. Las facturas de compra vinculadas a una
  liquidación también son de solo lectura para este rol. No administra accesos.
- **Administrador (Recursos Humanos)**: ve el Panel de nómina, **Crear
  liquidación de sueldo** (formulario propio, con alta automática del trabajador
  previa confirmación), **Gestionar liquidaciones de sueldo** (editar y emitir) y
  **Control de accesos**. No ve terceros, facturas ni reportes financieros
  (spec 003).
- Ningún rol ve los avisos al desarrollador: se siguen registrando, pero sin una
  vista en la interfaz (spec 003, FR-020).

Las facturas de venta y compra viven en colecciones separadas
(`erp.salesInvoices` y `erp.purchaseInvoices`) y la migración desde
`erp.documents` es idempotente. Las liquidaciones se guardan como entidad propia
en `erp.payrollSettlements` (esquema `2.0.0`), vinculadas por `documentId` a su
factura de compra; guardan el desglose de sueldo base, descuentos y bonos, y
reflejan `estado`, `fechaPago` y `monto` de la factura. El historial del
trabajador solo incluye liquidaciones `Pagadas` con fecha de pago, ordenadas de
más reciente a más antiguo. Si ya existen facturas de compra de terceros
personales, el backfill crea las liquidaciones que falten con desglose en `0`,
es idempotente por `documentId` y usa la marca
`erp.migration.payrollSettlements`. El acceso rápido "Nueva entidad"/"Nuevo
tercero" se eliminó del panel porque duplicaba a "Abrir gestión de
entidades/terceros".

### Guía de uso

Con sesión iniciada, la opción **Guía de uso** del menú desplegable ☰
«Utilidades & Sesión» abre un panel no modal para los tres roles. El Panel también
muestra **¿Primera vez? Ver la guía** para los tres roles; sin sesión no aparece
ninguna entrada de la guía.

El recorrido se filtra por rol. Finanzas ve 11 pasos: Panel, Terceros, Facturas
de venta, Facturas de compra, Emitir y pagar, Liquidaciones de sueldo,
Movimientos financieros, Flujo de caja, Seguimiento, el menú ☰ y Cuidados. El
administrador ve 6: Panel, Crear liquidación de sueldo, Gestionar liquidaciones
de sueldo, Control de accesos, el menú ☰ y Cuidados. El trabajador ve 2: Mi
liquidación y Cuidados. La guía usa los permisos existentes,
permite "Anterior", "Siguiente"/"Finalizar", "Ir a" y "Cerrar", devuelve el foco
al control que la abrió y no modifica datos, sesión ni almacenamiento.

### Datos de demostración

En un navegador sin datos, usar **Cargar demostración** desde la pantalla de
acceso. La carga precarga los datos ficticios, permanece en la pantalla de acceso,
no crea sesión ni abre vistas, y es idempotente. Después se ingresa con una de
estas credenciales ficticias:

| Rol | RUT | Contraseña inicial |
|---|---|---|
| Recursos Humanos (administrador) | `88.888.888-8` | `8888` |
| Finanzas | `55.555.555-5` | `5555` |
| Trabajador (Ana Pérez Soto) | `22.222.222-2` | `2222` |
| Trabajador (Bruno Soto Vega) | `45.000.000-0` | `4500` |

Cada trabajador de demostración tiene una liquidación vigente con desglose y al
menos dos liquidaciones pagadas con fechas de pago distintas para probar el
historial.

La carga anterior desde el panel (`qa-load-demo`) queda superada por la tarea
T107; la demostración se carga solo desde `login-demo-load`. La tarea T077 queda
superada por T107.

> **Advertencia de seguridad:** el control de acceso es solo una restricción de
> interfaz sobre datos guardados en el navegador. La contraseña inicial es
> inmutable y no hay backend ni cifrado, por lo que **no deben usarse datos
> reales**. Los RUT y nombres de la demostración son ficticios.

### Verificación

```bash
npm run check   # lint + formato + pruebas unitarias y de integración
```

El comando ejecuta las pruebas unitarias y de integración (incluye autenticación,
roles, aislamiento, separación de facturas, migración, sesión, avisos y
demostración). Las mejoras de accesibilidad (etiquetas asociadas, `role="alert"`,
`thead`/`tbody`, estados vacíos y navegación por teclado) y las mediciones de
rendimiento se registran en `specs/002-payroll-access-control/quickstart.md`.
