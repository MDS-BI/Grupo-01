import { describe, it, expect, beforeEach } from 'vitest';
import { clearAll, loadDestinations, addDestination, updateDestination, deleteDestination, validateDestination, searchDestinations, loadBookings, addBooking, updateBooking, deleteBooking, deleteBookingsForDestination, validateBooking } from '../../src/storage.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

beforeEach(() => { store.clear(); });

describe('storage', () => {
  it('validates destination', () => {
    expect(validateDestination({name:'', location:''}).valid).toBe(false);
    expect(validateDestination({name:'A', location:'B'}).valid).toBe(true);
  });

  it('adds and loads destinations', () => {
    const d = addDestination({name:'Paris', location:'France'});
    const all = loadDestinations();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(d.id);
  });

  it('updates a destination', () => {
    const d = addDestination({name:'X', location:'Y'});
    const updated = updateDestination(d.id, { name: 'X2' });
    expect(updated.name).toBe('X2');
  });

  it('deletes a destination', () => {
    const d1 = addDestination({name:'A', location:'B'});
    const d2 = addDestination({name:'C', location:'D'});
    deleteDestination(d1.id);
    const all = loadDestinations();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(d2.id);
  });

  it('accepts a valid planned date', () => {
    const res = validateDestination({name:'A', location:'B', plannedDate:'2026-08-06'});
    expect(res.valid).toBe(true);
  });

  it('rejects an invalid planned date', () => {
    const res = validateDestination({name:'A', location:'B', plannedDate:'2026-13-45'});
    expect(res.valid).toBe(false);
    expect(res.errors.plannedDate).toBeDefined();
  });

  it('allows an empty planned date', () => {
    const res = validateDestination({name:'A', location:'B', plannedDate:''});
    expect(res.valid).toBe(true);
  });

  it('persists planned date on create and update', () => {
    const d = addDestination({name:'Paris', location:'France', plannedDate:'2026-09-01'});
    expect(loadDestinations()[0].plannedDate).toBe('2026-09-01');
    const updated = updateDestination(d.id, { plannedDate:'2026-10-01' });
    expect(updated.plannedDate).toBe('2026-10-01');
  });

  it('searches by planned date', () => {
    addDestination({name:'Paris', location:'France', plannedDate:'2026-09-01'});
    addDestination({name:'Rome', location:'Italy', plannedDate:'2026-11-20'});
    const results = searchDestinations('2026-09-01');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Paris');
  });

  it('generates a unique destination_id for each destination', () => {
    const d1 = addDestination({name:'Paris', location:'France'});
    const d2 = addDestination({name:'Rome', location:'Italy'});
    expect(d1.destination_id).toBeDefined();
    expect(d1.destination_id).not.toBe(d2.destination_id);
    expect(loadDestinations()[0].destination_id).toBe(d1.destination_id);
  });

  it('validates a booking', () => {
    const dest = addDestination({name:'Paris', location:'France'});
    expect(validateBooking({destinationId:dest.destination_id, reference:'ABC', checkIn:'2026-08-01', checkOut:'2026-08-05'}).valid).toBe(true);
    expect(validateBooking({destinationId:'missing', reference:'ABC', checkIn:'2026-08-01', checkOut:'2026-08-05'}).valid).toBe(false);
    expect(validateBooking({destinationId:dest.destination_id, reference:'', checkIn:'2026-08-01', checkOut:'2026-08-05'}).valid).toBe(false);
    expect(validateBooking({destinationId:dest.destination_id, reference:'ABC', checkIn:'2026-08-05', checkOut:'2026-08-01'}).valid).toBe(false);
  });

  it('rejects invalid guests and totalPrice on a booking', () => {
    const dest = addDestination({name:'Paris', location:'France'});
    const base = { destinationId:dest.destination_id, reference:'ABC', checkIn:'2026-08-01', checkOut:'2026-08-05' };
    expect(validateBooking({...base, guests:0}).valid).toBe(false);
    expect(validateBooking({...base, guests:2.5}).valid).toBe(false);
    expect(validateBooking({...base, guests:2}).valid).toBe(true);
    expect(validateBooking({...base, totalPrice:-1}).valid).toBe(false);
    expect(validateBooking({...base, totalPrice:100.5}).valid).toBe(true);
  });

  it('adds and loads bookings linked by destination_id', () => {
    const dest = addDestination({name:'Paris', location:'France'});
    const b = addBooking({destinationId:dest.destination_id, reference:'REF-1', checkIn:'2026-08-01', checkOut:'2026-08-05', guests:2, totalPrice:500, currency:'EUR', status:'confirmed'});
    const all = loadBookings();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(b.id);
    expect(all[0].destination_id).toBe(dest.destination_id);
    expect(all[0].guests).toBe(2);
    expect(all[0].totalPrice).toBe(500);
  });

  it('updates a booking', () => {
    const dest = addDestination({name:'Paris', location:'France'});
    const b = addBooking({destinationId:dest.destination_id, reference:'REF-1', checkIn:'2026-08-01', checkOut:'2026-08-05'});
    const updated = updateBooking(b.id, { reference: 'REF-2' });
    expect(updated.reference).toBe('REF-2');
  });

  it('deletes a booking', () => {
    const dest = addDestination({name:'Paris', location:'France'});
    const b1 = addBooking({destinationId:dest.destination_id, reference:'REF-1', checkIn:'2026-08-01', checkOut:'2026-08-05'});
    const b2 = addBooking({destinationId:dest.destination_id, reference:'REF-2', checkIn:'2026-08-02', checkOut:'2026-08-06'});
    deleteBooking(b1.id);
    const all = loadBookings();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(b2.id);
  });

  it('deletes bookings for a destination', () => {
    const d1 = addDestination({name:'Paris', location:'France'});
    const d2 = addDestination({name:'Rome', location:'Italy'});
    addBooking({destinationId:d1.destination_id, reference:'REF-1', checkIn:'2026-08-01', checkOut:'2026-08-05'});
    addBooking({destinationId:d1.destination_id, reference:'REF-2', checkIn:'2026-08-02', checkOut:'2026-08-06'});
    addBooking({destinationId:d2.destination_id, reference:'REF-3', checkIn:'2026-08-03', checkOut:'2026-08-07'});
    deleteBookingsForDestination(d1.destination_id);
    const all = loadBookings();
    expect(all.length).toBe(1);
    expect(all[0].destination_id).toBe(d2.destination_id);
  });

  it('cascades booking deletion when a destination is deleted', () => {
    const d1 = addDestination({name:'Paris', location:'France'});
    const d2 = addDestination({name:'Rome', location:'Italy'});
    addBooking({destinationId:d1.destination_id, reference:'REF-1', checkIn:'2026-08-01', checkOut:'2026-08-05'});
    addBooking({destinationId:d2.destination_id, reference:'REF-2', checkIn:'2026-08-02', checkOut:'2026-08-06'});
    deleteDestination(d1.id);
    const bookings = loadBookings();
    expect(bookings.length).toBe(1);
    expect(bookings[0].destination_id).toBe(d2.destination_id);
  });
});
