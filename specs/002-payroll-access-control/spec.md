# Feature Specification: Absorción del rol finanzas en el rol administrador y creación de liquidaciones de sueldo

**Feature Branch**: `002-payroll-access-control`

**Created**: 2026-11-23

**Status**: Draft

**Input**: User description: "Quiero modificar el módulo de Contabilidad y Finanzas: eliminar el rol «finanzas» y absorberlo en el rol «administrador». Además, el rol administrador debe poder crear liquidaciones de sueldo desde una pestaña aparte que reutilice el mismo formulario ya existente para las facturas, con la gran diferencia de que en lugar de pedir «Tercero» pide RUT y nombre completo; si el RUT es nuevo, debe agregarse automáticamente al sistema con rol Trabajador y su contraseña inicial debe ser los primeros 4 dígitos del RUT, manteniendo las mismas restricciones del rol trabajador ya establecido. Debe generarse además otra pestaña aparte donde el administrador tenga acceso a las liquidaciones de sueldo, pueda seleccionar y editar cualquiera, y tenga un cuadro de búsqueda por RUT que filtre el listado mientras se escribe. Actualiza las historias de usuario para que sean coherentes con este cambio. No generes ninguna rama, trabaja solo en los archivos del main, sin crear ninguno nuevo, especificamente trabaja en el /002-payroll-access-control"

## Clarifications

### Session 2026-11-23

- Q: ¿Al crear la liquidación con un RUT nuevo se crea también la entidad personal (Tercero) en el módulo? → A: Sí, el sistema crea la entidad personal (Tercero) en el módulo como parte del alta del trabajador.
- Q: ¿Qué pasa con los accesos/demo de rol finanzas y con los accesos ya creados? → A: Los accesos de rol finanzas se eliminan y pasan a ser absorbidos por el administrador.
- Q: ¿El RUT nuevo se vincula a una factura de compra existente o se registra el settlement directamente? → A: El RUT nuevo se vincula directamente a su liquidación de sueldo (settlement).
- Q: ¿Se elimina el rol «finanzas» por completo del sistema o se mantiene como valor reservado? → A: El rol de finanzas se elimina por completo del sistema.

## User Scenarios & Testing *(mandatory)*

<!-- User stories should be PRIORITIZED as user journeys ordered by importance. Each user story/journey must be INDEPENDENTLY TESTABLE. -->

### User Story 1 - Crear liquidaciones de sueldo con alta automática de trabajador (Priority: P1)

Como administrador de remuneraciones, quiero crear una liquidación de sueldo desde una pestaña aparte que reutilice el mismo formulario ya existente para las facturas, con la gran diferencia de que en lugar de pedir «Tercero» pide «RUT» y «Nombre completo», para registrar el pago de un trabajador y, cuando el RUT sea nuevo, agregarlo al sistema con rol Trabajador y contraseña inicial de los primeros 4 dígitos del RUT.

**Why this priority**: P1, porque la liquidación nueva solo es operativa si el administrador puede emitirla desde el módulo; sin este alta guiada no existe la liquidación nueva que el cambio entrega.

**Independent Test**: con el módulo vacío y la demostración cargada, el administrador ingresa un RUT nuevo y un nombre completo en la pestaña de creación; el sistema crea el trabajador con su contraseña inicial y el trabajador nuevo ingresa con esos datos y ve su liquidación.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** usa la pestaña de creación de liquidaciones de sueldo, **Then** el formulario muestra los campos del formulario de facturas pero con «RUT» y «Nombre completo» en lugar del campo «Tercero».
2. **Given** un RUT nuevo válido y un nombre completo, **When** el administrador guarda la liquidación, **Then** el sistema crea el acceso con rol `trabajador` y contraseña inicial de los primeros 4 dígitos del cuerpo del RUT, y la vincula al trabajador.
3. **Given** un RUT inválido, de un tercero que no es personal o con conflicto de acceso, **When** el administrador guarda la liquidación, **Then** el sistema rechaza la creación y muestra el error correspondiente sin crear ningún registro; si el RUT ya tiene un acceso activo, la liquidación se registra vinculada al trabajador existente, sin crear entidad ni acceso nuevos.

---

### User Story 2 - Absorber el rol finanzas en el rol administrador (Priority: P1)

Como administrador de remuneraciones, quiero que el rol «finanzas» sea absorbido por el rol «administrador», para que la operación de facturación y liquidaciones se gestione con un único rol que conserve los permisos completos.

**Why this priority**: P1, porque elimina la duplicidad de roles operativos y de permisos descritos en la especificación previa.

**Independent Test**: con la demostración cargada, el administrador ingresa con su RUT y accede a las vistas operativas que antes correspondían a finanzas; no existe sesión ni vista operativa para el rol finanzas.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** ingresa, **Then** su rol visible es Administrador y tiene acceso a panel, terceros, facturas de venta y compra, liquidaciones, movimientos, flujo de caja, seguimiento y búsqueda, además de gestión de accesos y avisos del desarrollador (exclusivos del administrador).
2. **Given** un acceso con rol `finanzas`, **When** el sistema lo valida, **Then** el rol no es reconocido como válido dentro de la nueva matriz de roles y no existe vista operativa exclusiva para ese rol.

---

### User Story 3 - Ver y editar liquidaciones con búsqueda por RUT (Priority: P2)

Como administrador, quiero en una pestaña aparte ver las liquidaciones de sueldo, seleccionar y editar cualquiera, y filtrar por RUT mientras escribo en el buscador, para gestionar el ciclo de pagos por trabajador.

**Why this priority**: P2, porque complementa la creación de liquidaciones entregada en la User Story 1 sin cambiar el núcleo del cambio.

**Independent Test**: con dos trabajadores con liquidaciones distintas, el administrador filtra por RUT y edita una liquidación y comprueba el reflejo en el trabajador.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre la pestaña de liquidaciones de sueldo, **Then** ve el listado con trabajador, RUT, período, monto, estado, fecha de pago, factura vinculada y acción de edición.
2. **Given** un administrador autenticado, **When** escribe un RUT en el buscador de la pestaña, **Then** el listado se filtra mientras se escribe.
3. **Given** un administrador autenticado, **When** edita una liquidación, **Then** el cambio se guarda y se refleja en la vista del trabajador correspondiente.

### Edge Cases

- RUT nuevo con dígito verificador inválido: el sistema rechaza el alta del trabajador y registra la notificación al desarrollador.
- RUT que ya tiene un acceso activo: el sistema no crea un acceso duplicado; la liquidación se vincula al acceso y la entidad existentes.
- Período de liquidación con formato distinto de `YYYY-MM`: el sistema rechaza según las reglas existentes de la factura de compra a personal.
- Sin liquidaciones registradas: se muestra un estado vacío claro.
- Trabajador sin liquidación: se muestra un estado vacío claro, sin datos de otros trabajadores.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST eliminar el rol `finanzas` como rol reconocible en accesos, sesiones, matriz de acceso, datos de demostración y navegación, absorbiéndolo en el rol `administrador`.
- **FR-002**: El sistema MUST ofrecer al administrador una pestaña de creación de liquidaciones de sueldo que reutilice el formulario de facturas existente, con el campo «Tercero» sustituido por «RUT» y «Nombre completo».
- **FR-003**: El sistema MUST, al guardar una liquidación cuyo RUT sea nuevo, crear el acceso con rol `trabajador`, la entidad personal asociada y la contraseña inicial de los primeros 4 dígitos del cuerpo del RUT, y registrar el settlement vinculado al RUT nuevo.
- **FR-004**: El sistema MUST mantener las restricciones del rol trabajador ya establecidas para el acceso creado, incluyendo la obligación del tercero personal y la prohibición de duplicados.
- **FR-005**: El sistema MUST permitir al administrador ver y editar liquidaciones de trabajadores desde una pestaña aparte, con un cuadro de búsqueda por RUT que filtra el listado mientras se escribe.

- **FR-006**: El sistema MUST rechazar la creación de un acceso o trabajador cuando el RUT sea inválido o genere un conflicto de acceso (duplicado o tercero que no es personal), y registrar la incidencia correspondiente; cuando el RUT ya tiene un acceso activo no se crea un acceso nuevo y la liquidación se vincula al trabajador existente; cuando el RUT sea nuevo, el alta del trabajador incluye la creación de la entidad personal (Tercero).

### Key Entities *(include if feature involves data)*

- **AccessRecord**: registro de credencial con RUT, rol, tercero personal asociado y estado. Valores de rol válidos: `administrador` y `trabajador`; el rol `finanzas` fue absorbido en `administrador`.
- **Entity**: tercero con `tipoTercero = personal`, donde el RUT (`taxId`) identifica al trabajador.
- **LiquidacionSueldo**: entidad con período, sueldo base, descuentos, bonos, monto, estado y fecha de pago, vinculada por `documentId` (opcional: `null` en el alta directa con RUT nuevo) a una factura de compra a tercero personal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El administrador puede crear una liquidación de sueldo para un RUT nuevo y el trabajador nuevo ingresa con la contraseña inicial (primeros 4 dígitos del RUT) y ve su liquidación.
- **SC-002**: El rol `finanzas` ya no existe como rol de acceso ni como sesión; el administrador opera la facturación y las liquidaciones.
- **SC-003**: El cuadro de búsqueda por RUT filtra el listado de liquidaciones mientras se escribe.

## Assumptions

- El control de acceso sigue siendo una restricción de interfaz sobre datos del navegador; el MVP es solo frontend con almacenamiento en el navegador.
- La creación del acceso de trabajador ocurre como parte del alta de la liquidación cuando el RUT es nuevo.
- La sesión se mantiene con rol `administrador` o `trabajador`; no se agrega un cuarto rol.
