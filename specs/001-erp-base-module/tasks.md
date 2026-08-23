# Tasks: ERP Software Base Module

**Input**: Design documents from `/specs/001-erp-base-module/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Vite project structure and shared tooling.

- [X] T001 Create Vite app structure with src/, tests/, and configuration files
- [X] T002 Install Vite and Vitest dependencies for the project
- [X] T003 [P] Configure linting and formatting tooling for the lightweight JavaScript app

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the storage layer and app shell that all stories depend on.

- [X] T004 Create entity data model and validation helpers in src/storage.js
- [X] T005 Implement browser localStorage persistence for entity records in src/storage.js
- [X] T006 Create the main app shell and render the initial empty state in src/app.js
- [X] T007 [P] Build a shared stylesheet foundation for layout, forms, and feedback states in src/styles.css

---

## Phase 3: User Story 1 - Create and organize entities (Priority: P1) 🎯 MVP

**Goal**: Allow users to add entities and see them in the list.

**Independent Test**: A user can open the app, submit an entity form, and see the new entity appear.

### Tests for User Story 1

- [X] T008 [P] [US1] Add unit tests for entity validation in tests/unit/storage.test.js
- [X] T009 [P] [US1] Add integration tests for creating an entity in tests/integration/create-entity.test.js

### Implementation for User Story 1

- [X] T010 [P] [US1] Create the entity form UI in src/components/entity-form.js
- [X] T011 [US1] Wire form submission to create and persist a new entity in src/app.js
- [X] T012 [US1] Render the entity list and show validation feedback in src/components/entity-list.js

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Edit and remove entities (Priority: P1)

**Goal**: Allow users to update or delete stored entities, staying responsive on large datasets.

**Independent Test**: A user can edit an existing entity or remove it, and the list updates correctly.

### Tests for User Story 2

- [X] T013 [P] [US2] Add unit tests for updating and deleting entities in tests/unit/storage.test.js
- [X] T014 [P] [US2] Add integration tests for editing and deleting an entity in tests/integration/edit-delete-entity.test.js

### Implementation for User Story 2

- [X] T015 [P] [US2] Add edit and delete controls to the entity list UI in src/components/entity-list.js
- [X] T016 [US2] Wire edit actions to populate the form and update persisted data in src/app.js
- [X] T017 [US2] Handle delete actions and remove records from storage and the UI in src/app.js

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Welcome screen with navigation (Priority: P1)

**Goal**: Provide the entry-point screen with two clearly labeled buttons leading to manage and search.

**Independent Test**: A user opens the app, sees the welcome screen, and reaches both other screens from its buttons.

### Implementation for User Story 3

- [x] T018 [P] [US3] Add a welcome screen view with two clearly labeled navigation buttons in index.html
- [x] T019 [P] [US3] Add view-switching logic for the welcome, manage, and search screens in src/app.js

**Checkpoint**: User Story 3 should be fully functional and testable independently.

---

## Phase 6: User Story 4 - Manage entities and documents on a dedicated screen (Priority: P1)

**Goal**: Provide the manage screen with the horizontal Entities/Documents/Home navigation tab and full management forms, without displaying the entity list.

**Independent Test**: From the welcome screen, a user reaches the manage screen, switches tabs, and adds, edits, and deletes an entity and a document.

### Implementation for User Story 4

- [x] T020 [P] [US4] Add a horizontal navigation tab with Entities, Documents, and Home buttons to the manage view in index.html
- [x] T021 [P] [US4] Organize the manage view into entities and documents panels and remove the entity list in index.html
- [x] T022 [US4] Add tab-switching logic and Home navigation from the manage screen in src/app.js
- [x] T023 [US4] Add selector-based edit and delete for entities and documents in src/app.js
- [x] T024 [P] [US4] Add integration tests for the manage navigation tab in tests/integration/manage-tabs.test.js
- [x] T025 [P] [US4] Add styling for the horizontal navigation tab in src/styles.css

**Checkpoint**: User Stories 1-4 should be fully functional and testable independently.

---

## Phase 7: User Story 5 - Define a module configuration profile (Priority: P1)

**Goal**: Introduce `src/module-config.js` so developers can tailor module identity without core-code edits, with safe defaults and clear error reporting.

**Independent Test**: A developer supplies a Sales configuration; the app loads showing it. Removing the file restores Entity/Document defaults without errors.

### Tests for User Story 5

- [X] T026 [P] [US5] Add unit tests for config loading, default fallback, and invalid-config reporting in tests/unit/module-config.test.js

### Implementation for User Story 5

- [X] T027 [US5] Create the config loader with defaults, validation, and clear error reporting in src/module-config.js
- [X] T028 [US5] Load the config at startup and pass it to all views in src/main.js and src/app.js

**Checkpoint**: Configuration drives nothing visible yet, but loads reliably and validates cleanly.

---

## Phase 8: User Story 6 - Relabel screens from configuration (Priority: P1)

**Goal**: Derive every user-facing label from the configuration so tailored modules speak their domain language everywhere.

**Independent Test**: With Entity→Customer and Document→Sales Order mappings, every tab, button, form label, heading, and message shows the mapped terms on all three screens; behavior is unchanged.

### Tests for User Story 6

- [X] T029 [P] [US6] Add integration tests verifying configured labels across welcome, manage, and search screens in tests/integration/relabeling.test.js

### Implementation for User Story 6

- [X] T030 [US6] Derive all user-facing labels from config instead of hard-coded text across index.html, src/app.js, and component files

**Checkpoint**: A configured module presents fully under its own terminology.

---

## Phase 9: User Story 7 - Declare custom fields for records (Priority: P1)

**Goal**: Let declared custom fields flow automatically through forms, validation, persistence, lists, and search.

**Independent Test**: Declaring a required number field on entities renders a number input that blocks blank saves, displays values in lists, and matches searches; with no declarations the app behaves like the unmodified base.

### Tests for User Story 7

- [X] T031 [P] [US7] Add unit tests for custom field validation and persistence in tests/unit/storage.test.js
- [X] T032 [P] [US7] Add integration tests for custom-field rendering on forms, lists, and search in tests/integration/custom-fields.test.js

### Implementation for User Story 7

- [X] T033 [P] [US7] Render declared custom fields dynamically on entity and document forms in src/components/entity-form.js and src/components/document-form.js
- [X] T034 [US7] Include custom fields in validation, persistence, lists, and search in src/storage.js and src/app.js

**Checkpoint**: Module-specific data requires zero UI code changes.

---

## Phase 10: User Story 8 - Search and find entities quickly (Priority: P2)

**Goal**: Allow users to search and filter entities quickly, staying responsive on large datasets.

**Independent Test**: A user can enter a search term and see matching entities only.

### Tests for User Story 8

- [X] T035 [P] [US8] Add unit tests for search filtering logic in tests/unit/storage.test.js
- [X] T036 [P] [US8] Add integration tests for search behavior in tests/integration/search-entities.test.js

### Implementation for User Story 8

- [X] T037 [P] [US8] Create the search bar UI in src/components/search-bar.js
- [X] T038 [US8] Connect search input to filtering and empty-state behavior in src/app.js
- [X] T039 [US8] Ensure search results stay in sync with create, edit, and delete actions in src/app.js

**Checkpoint**: Core data stories and search should now be independently functional.

---

## Phase 11: User Story 9 - Record a target date (Priority: P2)

**Goal**: Allow users to attach an optional target date to an entity.

**Independent Test**: A user can set a date on an entity and see it displayed in the list.

### Tests for User Story 9

- [X] T040 [P] [US9] Add unit tests for target date validation and persistence in tests/unit/storage.test.js

### Implementation for User Story 9

- [X] T041 [P] [US9] Add the target date input to the entity form in index.html
- [X] T042 [US9] Include targetDate in validation, create, update, and search logic in src/storage.js
- [X] T043 [US9] Wire targetDate into form submit, edit populate, and error display in src/app.js
- [X] T044 [US9] Display the target date in the entity list in src/app.js

**Checkpoint**: User Story 9 should be fully functional and testable independently.

---

## Phase 12: User Story 10 - Track document details for an entity (Priority: P2)

**Goal**: Allow users to record document details for an entity and view them together, with cascade deletion protecting referential integrity.

**Independent Test**: A user can add a document to an entity and see the details displayed with that entity; deleting the entity removes its documents.

### Tests for User Story 10

- [X] T045 [P] [US10] Add unit tests for entity_id generation and document validation in tests/unit/storage.test.js
- [X] T046 [P] [US10] Add integration tests for adding a document to an entity in tests/integration/add-document.test.js
- [X] T047 [P] [US10] Add integration tests for editing, deleting, and cascading document deletion in tests/integration/manage-document.test.js

### Implementation for User Story 10

- [X] T048 [P] [US10] Create the document form UI in src/components/document-form.js
- [X] T049 [P] [US10] Create the document list UI in src/components/document-list.js
- [X] T050 [US10] Wire document create, edit, and delete actions to persist documents in src/app.js
- [X] T051 [US10] Add entity_id to entity creation and display documents with their entity in src/app.js
- [X] T052 [US10] Cascade delete documents when an entity is deleted in src/storage.js

**Checkpoint**: Master data and transactional documents should be fully linked.

---

## Phase 13: User Story 11 - Search entities on a dedicated screen (Priority: P2)

**Goal**: Provide the dedicated search screen reachable from the welcome screen, keeping editing on the manage screen.

**Independent Test**: A user navigates from the welcome screen to the search screen, searches, sees results or an empty state, and returns Home.

### Implementation for User Story 11

- [x] T053 [P] [US11] Add the search input and results list to the dedicated search view in index.html
- [x] T054 [US11] Wire the search input to filter results and show an empty state on the search screen in src/app.js
- [x] T055 [US11] Add Home navigation from the search screen in index.html

**Checkpoint**: All business-user stories should be fully functional and testable independently.

---

## Phase 14: User Story 12 - Configure document status lifecycle (Priority: P2)

**Goal**: Enforce configured statuses and transitions on documents while keeping free-form status when unconfigured.

**Independent Test**: With quote→order→invoiced configured, only valid next statuses are offered, invalid ones rejected with explanations, and status is visible at a glance; without configuration, status remains free-form.

### Tests for User Story 12

- [X] T056 [P] [US12] Add unit tests for status transition enforcement in tests/unit/storage.test.js

### Implementation for User Story 12

- [X] T057 [US12] Restrict document status choices to permitted transitions and enforce them on save in src/components/document-form.js and src/storage.js

**Checkpoint**: The customization chain (US5 → US6/US7/US12) is complete end-to-end.

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Improve quality, accessibility, reliability, and large-dataset behavior across all stories.

- [X] T058 [P] Add accessibility refinements for labels, keyboard focus, and semantic structure
- [X] T059 [P] Add final UX polish for empty states, validation messages, and responsive layout
- [X] T060 Verify list rendering and search stay responsive and correct with 500 records (FR-032, SC-004)
- [X] T061 Run the full test suite and smoke-test the main user flows
- [x] T062 [P] Add styling for the welcome screen and view navigation in src/styles.css
- [x] T063 Run the full test suite and production build to verify no regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup completion
- User Story 1 (Phase 3): Depends on Foundational completion
- User Story 2 (Phase 4): Depends on User Story 1 implementation completion
- User Story 3 (Phase 5): Depends on Foundational completion
- User Story 4 (Phase 6): Depends on User Story 3 completion and benefits from User Stories 1-2 forms being available
- User Story 5 (Phase 7): Depends on Foundational completion; unlocks US6, US7, US12
- User Story 6 (Phase 8): Depends on User Story 5 completion
- User Story 7 (Phase 9): Depends on User Story 5 completion
- User Story 8 (Phase 10): Depends on Foundational completion and can proceed after User Story 1
- User Story 9 (Phase 11): Depends on Foundational completion and can proceed after User Story 1
- User Story 10 (Phase 12): Depends on User Story 1 implementation completion and the entity_id field
- User Story 11 (Phase 13): Depends on User Story 8 (search logic) and User Story 3 (navigation)
- User Story 12 (Phase 14): Depends on User Story 5 (config) and User Story 10 (documents)
- Polish (Phase 15): Depends on all desired user stories being complete

### Parallel Opportunities

- T003 can run in parallel with setup tasks
- T007 can be completed alongside storage and app shell work
- Tests for each story can be created in parallel with implementation tasks for the same story
- After Phase 7 (config profile), US6 (Phase 8) and US7 (Phase 9) can proceed in parallel
- US8 (Phase 10) and US9 (Phase 11) are independent and can proceed in parallel after User Story 1
- In Phase 15, T058-T060 can run in parallel before the final verification tasks T061-T063
