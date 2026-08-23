# Entity Storage Contract

## Purpose

The app stores entity records locally in the browser using `localStorage`.

## Data Shape

Each entity record must include:

- `id`: unique string
- `entity_id`: unique string, automatically generated, used to link documents
- `name`: non-empty string
- `code`: non-empty string
- `category`: optional string
- `description`: optional string
- `createdAt`: ISO timestamp string
- `updatedAt`: ISO timestamp string

## Operations

- `loadEntities()`: returns all stored entities.
- `saveEntities(entities)`: persists the full list.
- `addEntity(entity)`: appends a new entity.
- `updateEntity(id, updates)`: updates an existing entity.
- `deleteEntity(id)`: removes an entity by id.

## Document Storage

Each document record must include:

- `id`: unique string
- `entity_id`: the linked entity's auto-generated entity_id
- `reference`: non-empty string
- `startDate`: valid calendar date string
- `endDate`: valid calendar date string, on or after startDate
- `quantity`: optional positive integer
- `totalAmount`: optional non-negative number
- `currency`: optional string
- `status`: optional string
- `createdAt`: ISO timestamp string
- `updatedAt`: ISO timestamp string

Operations:

- `loadDocuments()`: returns all stored documents.
- `saveDocuments(documents)`: persists the full list.
- `addDocument(document)`: appends a new document.
- `updateDocument(id, updates)`: updates an existing document.
- `deleteDocument(id)`: removes a document by id.
- `deleteDocumentsForEntity(entityId)`: removes all documents linked to a deleted entity.

## Validation Expectations

- Missing `name` or `code` must be rejected before persistence.
- An entity_id must be generated automatically and must be unique.
- A document without an `entity_id` matching an existing entity must be rejected.
- Deleting an entity must also remove all documents linked to its entity_id.
- Storage operations should preserve the current list order and update timestamps.

## Extensibility Expectations

- Additional fields added by custom modules must be persisted alongside base fields without special handling in the storage layer.
- Base operations above remain stable so custom modules can build on them without modification.
