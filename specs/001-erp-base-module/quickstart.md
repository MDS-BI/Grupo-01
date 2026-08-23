# Quickstart: ERP Software Base Module

## Setup

1. Install dependencies with `npm install`.
2. Start the development server with `npm run dev`.
3. Open the local Vite URL in a browser.

## Core User Flow

1. Create an entity using the form.
2. Search for an entity using the search box.
3. Edit or delete an entity from the list.
4. Refresh the page to confirm that entities persist in local storage.

## Validation

- Verify that required fields show validation errors.
- Verify that search results update as the user types.
- Verify that the list stays consistent after edit and delete actions.

## Extending the Base Module

Custom ERP modules tailor the base through a single configuration file (`src/module-config.js`) rather than by editing core code:

1. Set the module name and term mappings (e.g., Entity → Customer, Document → Sales Order); every screen relabels itself.
2. Declare custom fields per record type (text, number, date, select) — they appear automatically on forms, lists, validation, and search.
3. Define the document status lifecycle and permitted transitions (e.g., quote → order → invoiced).
4. Add module-specific validation rules alongside the base rules where needed.

Identity generation, timestamps, referential integrity between entities and documents, cascade deletion, navigation, and search remain handled by the base module. Without a config file, the app runs with default Entity/Document behavior. See `specs/001-erp-base-module/` for the full specification.
