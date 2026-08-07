# Tasks: Tourist Destination Manager

**Input**: Design documents from `/specs/001-destination-manager/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Vite project structure and shared tooling.

- [ ] T001 Create Vite app structure with src/, tests/, and configuration files
- [ ] T002 Install Vite and Vitest dependencies for the project
- [ ] T003 [P] Configure linting and formatting tooling for the lightweight JavaScript app

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the storage layer and app shell that all stories depend on.

- [ ] T004 Create destination data model and validation helpers in src/storage.js
- [ ] T005 Implement browser localStorage persistence for destination records in src/storage.js
- [ ] T006 Create the main app shell and render the initial empty state in src/app.js
- [ ] T007 [P] Build a shared stylesheet foundation for layout, forms, and feedback states in src/styles.css

---

## Phase 3: User Story 1 - Create and organize destinations (Priority: P1) 🎯 MVP

**Goal**: Allow users to add destinations and see them in the list.

**Independent Test**: A user can open the app, submit a destination form, and see the new destination appear.

### Tests for User Story 1

- [ ] T008 [P] [US1] Add unit tests for destination validation in tests/unit/storage.test.js
- [ ] T009 [P] [US1] Add integration tests for creating a destination in tests/integration/create-destination.test.js

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create the destination form UI in src/components/destination-form.js
- [ ] T011 [US1] Wire form submission to create and persist a new destination in src/app.js
- [ ] T012 [US1] Render the destination list and show validation feedback in src/components/destination-list.js

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Edit and remove destinations (Priority: P1)

**Goal**: Allow users to update or delete stored destinations.

**Independent Test**: A user can edit an existing destination or remove it, and the list updates correctly.

### Tests for User Story 2

- [ ] T013 [P] [US2] Add unit tests for updating and deleting destinations in tests/unit/storage.test.js
- [ ] T014 [P] [US2] Add integration tests for editing and deleting a destination in tests/integration/edit-delete-destination.test.js

### Implementation for User Story 2

- [ ] T015 [P] [US2] Add edit and delete controls to the destination list UI in src/components/destination-list.js
- [ ] T016 [US2] Wire edit actions to populate the form and update persisted data in src/app.js
- [ ] T017 [US2] Handle delete actions and remove records from storage and the UI in src/app.js

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Search and find destinations quickly (Priority: P2)

**Goal**: Allow users to search and filter destinations quickly.

**Independent Test**: A user can enter a search term and see matching destinations only.

### Tests for User Story 3

- [ ] T018 [P] [US3] Add unit tests for search filtering logic in tests/unit/storage.test.js
- [ ] T019 [P] [US3] Add integration tests for search behavior in tests/integration/search-destinations.test.js

### Implementation for User Story 3

- [ ] T020 [P] [US3] Create the search bar UI in src/components/search-bar.js
- [ ] T021 [US3] Connect search input to filtering and empty-state behavior in src/app.js
- [ ] T022 [US3] Ensure search results stay in sync with create, edit, and delete actions in src/app.js

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: User Story 4 - Record a planned visit date (Priority: P2)

**Goal**: Allow users to attach an optional planned visit date to a destination.

**Independent Test**: A user can set a date on a destination and see it displayed in the list.

### Tests for User Story 4

- [ ] T023 [P] [US4] Add unit tests for planned date validation and persistence in tests/unit/storage.test.js

### Implementation for User Story 4

- [ ] T024 [P] [US4] Add the planned visit date input to the destination form in index.html
- [ ] T025 [US4] Include plannedDate in validation, create, update, and search logic in src/storage.js
- [ ] T026 [US4] Wire plannedDate into form submit, edit populate, and error display in src/app.js
- [ ] T027 [US4] Display the planned visit date in the destination list in src/app.js

**Checkpoint**: User Story 4 should be fully functional and testable independently.

---

## Phase 7: User Story 5 - Track booking details for a destination (Priority: P2)

**Goal**: Allow users to record booking details for a destination and view them together.

**Independent Test**: A user can add a booking to a destination and see the booking details displayed with that destination.

### Tests for User Story 5

- [ ] T031 [P] [US5] Add unit tests for destination_id generation and booking validation in tests/unit/storage.test.js
- [ ] T032 [P] [US5] Add integration tests for adding a booking to a destination in tests/integration/add-booking.test.js
- [ ] T033 [P] [US5] Add integration tests for editing, deleting, and cascading booking deletion in tests/integration/manage-booking.test.js

### Implementation for User Story 5

- [ ] T034 [P] [US5] Create the booking form UI in src/components/booking-form.js
- [ ] T035 [P] [US5] Create the booking list UI in src/components/booking-list.js
- [ ] T036 [US5] Wire booking create, edit, and delete actions to persist bookings in src/app.js
- [ ] T037 [US5] Add destination_id to destination creation and display bookings with their destination in src/app.js
- [ ] T038 [US5] Cascade delete bookings when a destination is deleted in src/storage.js

**Checkpoint**: User Story 5 should be fully functional and testable independently.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improve quality, accessibility, and reliability across all stories.

- [ ] T028 [P] Add accessibility refinements for labels, keyboard focus, and semantic structure
- [ ] T029 [P] Add final UX polish for empty states, validation messages, and responsive layout
- [ ] T030 Run the full test suite and smoke-test the main user flows

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup completion
- User Story 1 (Phase 3): Depends on Foundational completion
- User Story 2 (Phase 4): Depends on User Story 1 implementation completion
- User Story 3 (Phase 5): Depends on Foundational completion and can proceed after search UI is ready
- User Story 4 (Phase 6): Depends on Foundational completion and can proceed after User Story 1 implementation completion
- User Story 5 (Phase 7): Depends on User Story 1 implementation completion and can proceed after the destination_id field is added
- Polish (Phase 8): Depends on all desired user stories being complete

### Parallel Opportunities

- T003 can run in parallel with setup tasks
- T007 can be completed alongside storage and app shell work
- Tests for each story can be created in parallel with implementation tasks for the same story
- T023 (User Story 4 tests) can be written in parallel with the form and wiring tasks T024-T026
- T031 (User Story 5 unit tests) can be written in parallel with the booking UI and wiring tasks T034-T038
