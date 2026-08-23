# Research: ERP Software Base Module

## Decision: Use Vite with vanilla HTML, CSS, and JavaScript

**Rationale**: The request emphasizes a minimal-library approach and a lightweight implementation. Vite provides a fast development experience and simple build pipeline without requiring a heavier framework. Vanilla JavaScript keeps the app easy to understand, easy to test, and easy to maintain for a small single-page app, and leaves custom modules free to adopt any UI approach on top of it.

## Alternatives considered

- React or Vue: Stronger component ecosystem, but adds more abstraction and dependency overhead than needed for this scope.
- Plain static HTML without Vite: Simpler, but Vite offers a better local development workflow and build step for future growth.
- Backend persistence with a database: Not necessary for a single-workspace base module and would add unnecessary complexity; the storage contract is isolated so a backend can be introduced later without changing module logic.

## Additional decisions

- Browser localStorage will be used for persistence because the base module is single-workspace and does not need server-side storage.
- The initial UI will be a single-page experience with a form, search field, and entity list.
- The app will favor progressive enhancement and accessible native form controls over custom complex widgets.
- The data model separates master data (Entity) from transactional records (Document), linked by an auto-generated public identifier (`entity_id`), so custom modules can attach any domain meaning to both sides without structural changes.
- Base concerns (identity generation, timestamps, referential integrity, cascade deletion) live in the storage layer, keeping custom modules limited to fields, labels, and validation rules.
