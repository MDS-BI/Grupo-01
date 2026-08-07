# Destination Storage Contract

## Purpose

The app stores destination records locally in the browser using `localStorage`.

## Data Shape

Each destination record must include:

- `id`: unique string
- `destination_id`: unique string, automatically generated, used to link bookings
- `name`: non-empty string
- `location`: non-empty string
- `category`: optional string
- `description`: optional string
- `createdAt`: ISO timestamp string
- `updatedAt`: ISO timestamp string

## Operations

- `loadDestinations()`: returns all stored destinations.
- `saveDestinations(destinations)`: persists the full list.
- `addDestination(destination)`: appends a new destination.
- `updateDestination(id, updates)`: updates an existing destination.
- `deleteDestination(id)`: removes a destination by id.

## Booking Storage

Each booking record must include:

- `id`: unique string
- `destination_id`: the linked destination's auto-generated destination_id
- `reference`: non-empty string
- `checkIn`: valid calendar date string
- `checkOut`: valid calendar date string, on or after checkIn
- `guests`: optional positive integer
- `totalPrice`: optional non-negative number
- `currency`: optional string
- `status`: optional string
- `createdAt`: ISO timestamp string
- `updatedAt`: ISO timestamp string

Operations:

- `loadBookings()`: returns all stored bookings.
- `saveBookings(bookings)`: persists the full list.
- `addBooking(booking)`: appends a new booking.
- `updateBooking(id, updates)`: updates an existing booking.
- `deleteBooking(id)`: removes a booking by id.
- `deleteBookingsForDestination(destinationId)`: removes all bookings linked to a deleted destination.

## Validation Expectations

- Missing `name` or `location` must be rejected before persistence.
- A destination_id must be generated automatically and must be unique.
- A booking without a `destination_id` matching an existing destination must be rejected.
- Deleting a destination must also remove all bookings linked to its destination_id.
- Storage operations should preserve the current list order and update timestamps.
