# Data Model: ERP Software Base Module

## Entity: Entity (master data record)

| Field | Type | Description | Constraints |
|---|---|---|---|
| id | string | Unique internal identifier for the entity record | Required, generated automatically |
| entity_id | string | Public identifier used to link documents to this entity | Required, generated automatically, unique |
| name | string | Name of the entity | Required, non-empty |
| code | string | Business code or key identifying the entity | Required, non-empty |
| category | string | Optional classification such as type, group, or class | Optional |
| description | string | Short description or notes | Optional |
| targetDate | string | Optional target date in YYYY-MM-DD format; custom modules define its meaning (e.g., due date, review date) | Optional, must be a valid calendar date if provided |
| createdAt | string | Timestamp when the entity was created | Required |
| updatedAt | string | Timestamp when the entity was last updated | Required |

## Entity: Document (transactional record)

| Field | Type | Description | Constraints |
|---|---|---|---|
| id | string | Unique identifier for the document | Required, generated automatically |
| entity_id | string | Identifier of the entity this document belongs to | Required, must reference an existing entity's entity_id |
| reference | string | Document reference or confirmation number | Required, non-empty |
| startDate | string | Start date in YYYY-MM-DD format | Required, must be a valid calendar date |
| endDate | string | End date in YYYY-MM-DD format | Required, must be a valid calendar date, must be on or after startDate |
| quantity | number | Quantity associated with the document | Optional, must be a positive integer |
| totalAmount | number | Total document amount in the configured currency | Optional, must be non-negative |
| currency | string | Currency code for the document amount | Optional |
| status | string | Document status such as draft, pending, approved, or cancelled | Optional |
| createdAt | string | Timestamp when the document was created | Required |
| updatedAt | string | Timestamp when the document was last updated | Required |

## Entity: ModuleConfig

Configuration object loaded at startup that tailors the base module into a specific module.

| Field | Type | Description | Constraints |
|---|---|---|---|
| moduleName | string | Display name of the tailored module | Required, non-empty |
| labels | object | Term mappings such as `{ entity: "Customer", entities: "Customers", document: "Sales Order", documents: "Sales Orders" }` | Optional; falls back to Entity/Document |
| customFields | array | Field definitions per record type: `{ target: "entity"\|"document", key, label, type: "text"\|"number"\|"date"\|"select", required: boolean, options?: string[] }` | Optional; keys MUST NOT collide with base field names |
| statusLifecycle | object | Ordered statuses and permitted transitions for documents, e.g., `{ statuses: ["quote", "order", "invoiced"], transitions: { quote: ["order"], order: ["invoiced"], invoiced: [] } }` | Optional |

## ModuleConfig Rules

- The configuration is loaded once at startup and applied across all screens.
- When the configuration is absent, built-in defaults apply: Entity/Document labels, no custom fields, free-form status.
- Invalid or conflicting values must be reported clearly instead of failing silently.
- Custom field keys must not collide with base field names (`id`, `entity_id`, `name`, `code`, `category`, `description`, `targetDate`, `reference`, `startDate`, `endDate`, `quantity`, `totalAmount`, `currency`, `status`).
- Custom field values are persisted alongside base fields without schema changes to storage.
- A configured lifecycle replaces free-form status entry; without one, status stays free-form.

## Validation Rules

- An entity must include a non-empty name.
- An entity must include a non-empty code.
- Category and description are optional but should be stored as strings.
- Target date is optional but, when present, must be a valid calendar date in YYYY-MM-DD format.
- An entity_id must be generated automatically and must be unique across all entities.
- A document must include a reference and valid start and end dates.
- End date must be on or after start date.
- A document must reference an existing entity via entity_id.
- The application should normalize text for consistent search behavior.

## Relationships

- Each entity is stored independently and appears as a single row in the entity list.
- Each entity has one entity_id used to connect to its documents.
- Each document belongs to exactly one entity, linked by the entity's entity_id.
- When an entity is deleted, all documents referencing its entity_id are also deleted.
- Search operations are performed across the stored entity records.

## Extensibility Notes

- Custom modules may add domain-specific fields to either record type; base fields above must keep their names and semantics so storage, validation, and referential integrity remain intact.
- The `status` field is intentionally free-form at the base level so each custom module can impose its own lifecycle (e.g., order statuses, approval states).
