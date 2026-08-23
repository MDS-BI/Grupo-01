# Feature Specification: Enterprise Resource Planning (ERP) Software Base Module

**Feature Branch**: 001-erp-base-module  
**Created**: 2026-07-08  
**Status**: Draft  
**Input**: User description: "Build an Enterprise Resource Planning (ERP) software base module that can be extended into custom ERP modules. It must provide master data management (entities) and linked transactional documents with create/edit/delete/search capabilities."

## Purpose

This project serves as a reusable base module for building custom ERP modules. It establishes the common patterns every ERP module needs: managing master data records (**Entities**) and their associated transactional **Documents**, with navigation, validation, persistence, and search already in place so custom modules only need to define their domain-specific fields and rules.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and organize entities (Priority: P1)
As a business user, I want to create entity entries with clear details so I can build and maintain the module's master data.

**Why this priority**: This is the core value of the product because without creating entities, the rest of the experience cannot provide value.

**Independent Test**: A user can open the module, add a new entity, and see it appear in the list.

**Acceptance Scenarios**:

1. **Given** a user is viewing the entity list, **When** they create a new entity with a name and code, **Then** the new entity is saved and appears in the list.
2. **Given** a user is creating an entity, **When** they leave required information blank, **Then** the system prevents saving and explains what is needed.

---

### User Story 2 - Edit and remove entities (Priority: P1)
As a business user, I want to update or remove entities when master data changes so the records stay accurate.

**Why this priority**: Keeping records current is essential for trust in the tool and for supporting everyday business operations.

**Independent Test**: A user can select an existing entity, change its information, or remove it, and the list reflects the change.

**Acceptance Scenarios**:

1. **Given** an entity already exists in the list, **When** the user edits its details, **Then** the updated information is saved and shown in the list.
2. **Given** an entity is no longer relevant, **When** the user deletes it, **Then** it is removed from the list and no longer appears in search results.
3. **Given** hundreds of entities are stored, **When** the user edits or deletes one, **Then** the list updates correctly and remains responsive.

---

### User Story 3 - Welcome screen with navigation (Priority: P1)

As a business user, I want to land on a welcome screen with two clear buttons when I open the app so I can choose whether to manage my records or search them.

**Why this priority**: The welcome screen is the entry point of the app. Nothing else can be reached without it, so it must exist before the two management screens are useful.

**Independent Test**: A user can open the app, see a welcome screen, and reach the manage and search screens from its two buttons.

**Acceptance Scenarios**:

1. **Given** the user opens the app, **When** the app loads, **Then** a welcome screen is shown with two clearly labeled buttons, one for managing and one for searching.
2. **Given** the welcome screen is shown, **When** the user activates the manage button, **Then** the app navigates to the manage screen.
3. **Given** the welcome screen is shown, **When** the user activates the search button, **Then** the app navigates to the search screen.

---

### User Story 4 - Manage entities and documents on a dedicated screen (Priority: P1)

As a business user, I want a dedicated screen where I can add, edit, and remove entities and their documents so I can manage the module's data in one focused place.

**Why this priority**: This preserves the core value of the module's management capabilities, presented as a single management screen reachable from the welcome screen.

**Independent Test**: A user can navigate from the welcome screen to the manage screen, use the horizontal navigation tab to switch between entity and document management and return Home, and successfully add, edit, and delete an entity and a document.

**Acceptance Scenarios**:

1. **Given** the user is on the manage screen, **When** they view the top of the screen, **Then** a horizontal navigation tab is shown with three buttons: Entities, Documents, and Home.
2. **Given** the navigation tab is shown, **When** the user activates the Entities button, **Then** the entity management content is displayed.
3. **Given** the navigation tab is shown, **When** the user activates the Documents button, **Then** the document management content is displayed.
4. **Given** the user is on the manage screen, **When** they view the screen, **Then** the list of entities is not shown.
5. **Given** the user is on the manage screen, **When** they create a new entity, **Then** the entity is saved.
6. **Given** an entity already exists, **When** the user edits its details, **Then** the updated information is saved.
7. **Given** an entity is no longer relevant, **When** the user deletes it, **Then** it is removed along with its documents.
8. **Given** an entity exists, **When** the user adds, edits, or deletes a document, **Then** the document changes are saved and associated with that entity.
9. **Given** the user is on the manage screen, **When** they activate the Home button on the navigation tab, **Then** they return to the welcome screen.

---

### User Story 5 - Define a module configuration profile (Priority: P1)

As a module developer, I want to declare a single configuration file that defines my module's identity, terminology, custom fields, and rules so I can tailor the base module into a specific module without modifying its core code.

**Why this priority**: Config-driven tailoring is what turns this project from a fixed app into a reusable base. Without it, every custom module would require editing core source files, which defeats the purpose of the template; all later customization stories depend on this mechanism existing first.

**Independent Test**: A developer provides a configuration file defining a Sales profile (module name, Entity→Customer mappings, custom fields, lifecycle), and the app presents itself fully as a Sales module; removing the file restores base defaults without errors.

**Acceptance Scenarios**:

1. **Given** a configuration file defines the module name, **When** the app loads, **Then** the welcome screen shows the configured module name.
2. **Given** a complete configuration (name, term mappings, custom fields, lifecycle), **When** the app loads, **Then** the module presents fully under the configured identity with no base-module terms visible anywhere.
3. **Given** no configuration is provided, **When** the app loads, **Then** the app falls back to the built-in Entity/Document defaults without errors.
4. **Given** the configuration contains invalid or conflicting values, **When** the app loads, **Then** the system reports the problem clearly instead of failing silently.

---

### User Story 6 - Relabel screens from configuration (Priority: P1)

As a module developer, I want all user-facing labels derived from the configuration so a tailored module speaks its domain language everywhere consistently.

**Why this priority**: Users trust a module that consistently says "Customer" and "Sales Order" rather than a generic "Entity" leaking through half the interface; inconsistent terminology makes tailored modules feel broken. This story depends on the configuration profile (User Story 5).

**Independent Test**: A developer maps Entity→Customer and Document→Sales Order in the configuration, and every tab, button, form label, heading, and message across all three screens uses the mapped terms.

**Acceptance Scenarios**:

1. **Given** term mappings are defined in the configuration, **When** any screen loads, **Then** tabs, buttons, form labels, headings, and empty-state messages show the configured terms.
2. **Given** labels have been remapped, **When** the user navigates between screens, **Then** navigation behavior is unchanged.
3. **Given** no mappings are provided, **When** any screen loads, **Then** the default Entity/Document terms are shown.

---

### User Story 7 - Declare custom fields for records (Priority: P1)

As a module developer, I want to declare additional fields for entities and documents in the configuration so they automatically appear on forms, lists, validation, and search without writing UI code.

**Why this priority**: Custom modules exist because their records carry domain-specific data (a customer's credit limit, an invoice's due date). If adding fields requires editing forms and validation by hand, tailoring is error-prone and does not scale. This story depends on the configuration profile (User Story 5).

**Independent Test**: A developer declares a custom required number field on entities; it renders as a number input on the form, blocks saving when blank, displays stored values in lists, and matches searches.

**Acceptance Scenarios**:

1. **Given** a custom entity field of type number declared as required, **When** the user creates or edits an entity, **Then** the field renders as a number input and a blank value prevents saving with a clear explanation.
2. **Given** a custom field has a saved value, **When** the user views the list or detail view, **Then** the value is displayed.
3. **Given** custom fields are declared, **When** the user searches using a term matching a custom field value, **Then** matching records are returned.
4. **Given** no custom fields are declared, **When** the app runs, **Then** behavior is identical to the unmodified base module.

---

### User Story 8 - Search and find entities quickly (Priority: P2)
As a business user, I want to search my entities by key details so I can quickly find the record I need.

**Why this priority**: Fast retrieval improves usefulness once the dataset grows beyond a small number of entries.

**Independent Test**: A user can enter a search term and see only matching entities.

**Acceptance Scenarios**:

1. **Given** multiple entities are stored, **When** the user searches with a matching term, **Then** only matching entities are shown.
2. **Given** the search does not match any entity, **When** the user submits the search, **Then** the system shows a clear empty state and allows the user to try again.
3. **Given** hundreds of entities are stored, **When** the user searches, **Then** matching results appear promptly without noticeable delay.

---

### User Story 9 - Record a target date (Priority: P2)
As a business user, I want to attach an optional target date to an entity so I can plan and sort records by when something is due.

**Why this priority**: Date-aware planning enhances the core value once the dataset grows, but is not required for basic management.

**Independent Test**: A user can set a date on an entity and see it displayed in the list.

**Acceptance Scenarios**:

1. **Given** a user is creating or editing an entity, **When** they enter a target date, **Then** the date is saved and shown in the list.
2. **Given** an entity has a date set, **When** the user views the list, **Then** entities with dates can be identified at a glance.
3. **Given** a user leaves the date blank, **When** they save the entity, **Then** the entity is still saved without a date (optional field).

---

### User Story 10 - Track document details for an entity (Priority: P2)
As a business user, I want to record document details for an entity so I can keep transactional activity organized alongside each master data record.

**Why this priority**: Documents add practical operational value once entities are managed, but are not required for core management.

**Independent Test**: A user can add a document to an entity and see the document details displayed with that entity.

**Acceptance Scenarios**:

1. **Given** an entity exists in the list, **When** the user adds a document with details, **Then** the document is saved and associated with that entity.
2. **Given** a document exists for an entity, **When** the user views the entity, **Then** the document details are shown together with the entity.
3. **Given** an entity is deleted, **When** the deletion is confirmed, **Then** its associated documents are also removed.
4. **Given** a user is creating a document, **When** they leave the required document information blank, **Then** the system prevents saving and explains what is needed.

---

### User Story 11 - Search entities on a dedicated screen (Priority: P2)

As a business user, I want a dedicated search screen so I can quickly find entities without the editing forms cluttering the view.

**Why this priority**: Fast retrieval is valuable once the dataset grows, and a separate screen keeps the management experience focused, but search is not required for basic management.

**Independent Test**: A user can navigate from the welcome screen to the search screen, enter a search term, and see only matching entities.

**Acceptance Scenarios**:

1. **Given** the user is on the search screen, **When** they enter a matching search term, **Then** only matching entities are shown.
2. **Given** the search does not match any entity, **When** the user submits the search, **Then** a clear empty state is shown and the user can try again.
3. **Given** hundreds of entities are stored, **When** the user searches from the search screen, **Then** matching results appear promptly without noticeable delay.
4. **Given** the user is on the search screen, **When** they activate the back navigation, **Then** they return to the welcome screen.

---

### User Story 12 - Configure document status lifecycle (Priority: P2)

As a module developer, I want to define allowed document statuses and permitted transitions so documents follow the domain's lifecycle instead of accepting arbitrary status text.

**Why this priority**: Real modules need controlled lifecycles (e.g., quote → order → invoiced), but free-form status remains acceptable for simple extensions, so this enhances the base without being required for basic tailoring. This story depends on the configuration profile (User Story 5).

**Independent Test**: A developer configures a lifecycle of quote→order→invoiced; the status control offers only valid next statuses, invalid transitions are rejected with an explanation, and status is visible at a glance in lists.

**Acceptance Scenarios**:

1. **Given** a lifecycle is configured, **When** the user edits a document's status, **Then** only statuses reachable via permitted transitions are offered.
2. **Given** an invalid transition is attempted through any means, **When** it is submitted, **Then** the system rejects it with a clear explanation.
3. **Given** a lifecycle is configured, **When** the user views document lists or details, **Then** the current status is identifiable at a glance.
4. **Given** no lifecycle is configured, **When** documents are edited, **Then** status remains free-form text as in the unmodified base module.

---

### Edge Cases

- What happens when a user attempts to save an entity without a required name or code?
- How does the system handle a search that returns no matches?
- What happens if a user tries to edit or delete an entity that no longer exists?
- What happens when a user enters a target date that is not a valid calendar date?
- What happens to an entity's documents when the entity is deleted?
- What happens when a user enters an end date that is before the start date on a document?
- What happens when the configuration declares a custom field whose key collides with a base field name?
- What happens when the configuration references an unknown field type or an invalid lifecycle transition definition?
- What happens when stored records contain custom field values that are no longer declared in the configuration?
- What happens when a user opens the app directly on the manage or search screen (e.g., via a deep link or browser reload) without going through the welcome screen?
- What happens when a user presses the browser back button while on the manage or search screen?
- What happens if a user navigates away from the manage screen while a form still has unsaved changes?
- Do entities and documents remain intact when navigating between the welcome, manage, and search screens?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow users to create an entity record with at least a name and code.
- **FR-002**: The system MUST allow users to edit the details of an existing entity record.
- **FR-003**: The system MUST allow users to delete an existing entity record.
- **FR-004**: The system MUST allow users to search entity records by name, code, category, or other descriptive keywords.
- **FR-005**: The system MUST display a clear list of entities and indicate when no results match a search.
- **FR-006**: The system MUST present clear feedback when required information is missing or an action cannot be completed.
- **FR-007**: The system MUST keep entity data consistent after create, edit, and delete operations.
- **FR-008**: The system MUST allow users to add, edit, and remove document details for an entity.
- **FR-009**: The system MUST associate each document with exactly one entity and remove associated documents when the entity is deleted.
- **FR-010**: The system MUST display a welcome screen as the initial view, containing two clearly labeled navigation buttons.
- **FR-011**: The system MUST navigate to a dedicated manage screen when the first button is selected.
- **FR-012**: The manage screen MUST display a horizontal navigation tab at the top with three buttons: Entities, Documents, and Home.
- **FR-013**: The Entities button MUST show the entity management content on the manage screen.
- **FR-014**: The Documents button MUST show the document management content on the manage screen.
- **FR-015**: The Home button MUST return the user to the welcome screen from the manage screen.
- **FR-016**: The manage screen MUST NOT display the list of entities.
- **FR-017**: The manage screen MUST provide the entity create, edit, and delete functionality.
- **FR-018**: The manage screen MUST provide the document create, edit, and delete functionality.
- **FR-019**: The system MUST navigate to a dedicated search screen when the second button is selected.
- **FR-020**: The search screen MUST allow searching entities by name, code, category, description, or target date.
- **FR-021**: The system MUST provide a way to return to the welcome screen from the search screen.
- **FR-022**: The system MUST keep entity and document data intact and consistent while navigating between screens.
- **FR-023**: The system MUST load the module configuration at startup and apply it across all screens.
- **FR-024**: The system MUST fall back to built-in defaults (Entity/Document terminology, no custom fields, no lifecycle) when no configuration is provided.
- **FR-025**: The system MUST report invalid or conflicting configuration clearly instead of failing silently.
- **FR-026**: The system MUST render declared custom fields on create/edit forms with input types matching their declared types.
- **FR-027**: The system MUST validate custom field values, including required ones, before saving, using the same feedback UX as base validation.
- **FR-028**: The system MUST include custom field values in search results and display them in lists and detail views.
- **FR-029**: The system MUST derive all user-facing labels from the module configuration rather than hard-coded text.
- **FR-030**: The system MUST enforce configured status transitions on documents regardless of how a change is submitted.
- **FR-031**: The system MUST keep document status free-form when no lifecycle is configured.
- **FR-032**: The system MUST keep list rendering and search responsive and correct for datasets of at least 500 entity records.

### Extensibility Requirements *(base module obligations)*

Custom modules built on this base MUST be able to:

- **XR-001**: Extend entity and document records with additional domain-specific fields without changing the base storage structure.
- **XR-002**: Relabel screens, tabs, forms, and lists with module-specific terminology without altering navigation behavior.
- **XR-003**: Add module-specific validation rules alongside the base validation rules.
- **XR-004**: Rely on the base module for identity generation, timestamps, referential integrity between entities and documents, and cascade deletion.

### Key Entities *(include if feature involves data)*

- **Entity**: A master data record managed by the module, including its name, business code, descriptive details, classification category, an optional target date, and an auto-generated entity_id. Custom modules define what real-world thing an Entity represents (e.g., customer, product, asset).
- **Document**: Transactional details attached to an entity, linked to it by the entity's entity_id. Custom modules define what a Document represents (e.g., order, invoice, contract).
- **ModuleConfig**: The tailoring object loaded at startup defining the module name, terminology labels, custom field definitions, and document status lifecycle. See data-model.md for its full shape.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new entity and see it in the list in under 2 minutes.
- **SC-002**: Users can find an existing entity through search in under 10 seconds after entering a relevant term.
- **SC-003**: At least 90% of test users can complete create, edit, delete, and search tasks without assistance.
- **SC-004**: The system remains usable for a dataset of at least 500 entity records without loss of core functionality.
- **SC-005**: A user can reach the manage and search screens from the welcome screen in under 10 seconds on first use.
- **SC-006**: All existing entity and document management functionality remains functional after the multi-screen change (no regression).
- **SC-007**: Users can navigate between the welcome, manage, and search screens without losing any stored entities or documents.
- **SC-008**: A developer can produce a tailored module using only the configuration file, with zero modifications to core source files.

## Assumptions

- The base module manages data for a single workspace rather than a shared multi-tenant database.
- Tailoring into a specific module is performed through a module configuration file rather than by editing core source files.
- Each entity includes basic information sufficient for identification and tracking; custom modules supply domain-specific fields.
- The initial release focuses on core master data and document management rather than advanced ERP capabilities such as approval workflows, posting periods, or reporting.
- Search is performed against the stored entity records.
- The manage screen consolidates the add/edit entity and add/edit document forms into one management screen.
- The manage screen organizes entity and document management behind a horizontal navigation tab with Entities, Documents, and Home buttons, and does not display the entity list.
- Only one screen is shown at a time; there is no side-by-side layout of manage and search content.
- Navigation between screens is handled within the app (e.g., view switching), and the browser back button should behave predictably.
- Data continues to be persisted to browser localStorage and is not affected by screen navigation.
- The search screen focuses on finding and viewing entities; editing remains on the manage screen.
