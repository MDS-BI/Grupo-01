# Data Model: Tourist Destination Manager

## Entity: TouristDestination

| Field | Type | Description | Constraints |
|---|---|---|---|
| id | string | Unique identifier for the destination | Required, generated automatically |
| destination_id | string | Public identifier used to link bookings to this destination | Required, generated automatically, unique |
| name | string | Name of the destination | Required, non-empty |
| location | string | Geographic location or region | Required, non-empty |
| category | string | Optional category such as beach, city, mountain, or nature | Optional |
| description | string | Short description or notes | Optional |
| plannedDate | string | Planned visit date in YYYY-MM-DD format | Optional, must be a valid calendar date if provided |
| createdAt | string | Timestamp when the destination was created | Required |
| updatedAt | string | Timestamp when the destination was last updated | Required |

## Entity: Booking

| Field | Type | Description | Constraints |
|---|---|---|---|
| id | string | Unique identifier for the booking | Required, generated automatically |
| destination_id | string | Identifier of the destination this booking belongs to | Required, must reference an existing destination's destination_id |
| reference | string | Booking reference or confirmation number | Required, non-empty |
| checkIn | string | Check-in date in YYYY-MM-DD format | Required, must be a valid calendar date |
| checkOut | string | Check-out date in YYYY-MM-DD format | Required, must be a valid calendar date, must be after checkIn |
| guests | number | Number of guests | Optional, must be a positive integer |
| totalPrice | number | Total booking price in the destination's currency | Optional, must be non-negative |
| currency | string | Currency code for the booking price | Optional |
| status | string | Booking status such as confirmed, pending, or cancelled | Optional |
| createdAt | string | Timestamp when the booking was created | Required |
| updatedAt | string | Timestamp when the booking was last updated | Required |

## Validation Rules

- A destination must include a non-empty name.
- A destination must include a non-empty location.
- Category and description are optional but should be stored as strings.
- Planned visit date is optional but, when present, must be a valid calendar date in YYYY-MM-DD format.
- A destination_id must be generated automatically and must be unique across all destinations.
- A booking must include a reference and valid check-in and check-out dates.
- Check-out must be on or after check-in.
- A booking must reference an existing destination via destination_id.
- The application should normalize text for consistent search behavior.

## Relationships

- Each destination is stored independently and appears as a single row in the destination list.
- Each destination has one destination_id used to connect to its bookings.
- Each booking belongs to exactly one destination, linked by the destination's destination_id.
- When a destination is deleted, all bookings referencing its destination_id are also deleted.
- Search operations are performed across the stored destination records.
