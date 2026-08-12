import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { addDestination, loadDestinations, loadBookings } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
  vi.resetModules();
  await import('../../src/app.js');
  document.dispatchEvent(new w.Event('DOMContentLoaded'));
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 7 - manage screen navigation tab', () => {
  it('opens the manage screen from the welcome screen', () => {
    qs('welcome-manage').click();
    expect(qs('view-manage').hidden).toBe(false);
    expect(qs('view-welcome').hidden).toBe(true);
  });

  it('shows a horizontal navigation tab with Destinations, Bookings, and Home buttons', () => {
    qs('welcome-manage').click();
    const buttons = [...qs('view-manage').querySelectorAll('.nav-tabs .tab-button')];
    expect(buttons.length).toBe(3);
    expect(buttons.map(b => b.textContent)).toEqual(['Destinations', 'Bookings', 'Home']);
  });

  it('switches between the destinations and bookings panels', () => {
    qs('welcome-manage').click();
    expect(qs('panel-destinations').hidden).toBe(false);
    expect(qs('panel-bookings').hidden).toBe(true);
    qs('tab-bookings').click();
    expect(qs('panel-destinations').hidden).toBe(true);
    expect(qs('panel-bookings').hidden).toBe(false);
    qs('tab-destinations').click();
    expect(qs('panel-destinations').hidden).toBe(false);
    expect(qs('panel-bookings').hidden).toBe(true);
  });

  it('does not display a destination list on the manage screen', () => {
    addDestination({ name: 'Paris', location: 'France' });
    qs('welcome-manage').click();
    expect(qs('destination-list')).toBeNull();
    expect(qs('view-manage').querySelector('ul#destination-list')).toBeNull();
  });

  it('returns to the welcome screen via the Home tab', () => {
    qs('welcome-manage').click();
    qs('tab-home').click();
    expect(qs('view-welcome').hidden).toBe(false);
    expect(qs('view-manage').hidden).toBe(true);
  });

  it('lets a user add, edit, and delete a destination without a list', () => {
    qs('welcome-manage').click();
    qs('name').value = 'Paris';
    qs('location').value = 'France';
    qs('destination-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadDestinations().length).toBe(1);

    const editSelect = qs('edit-destination');
    expect([...editSelect.options].map(o => o.textContent)).toContain('Paris — France');
    editSelect.value = editSelect.options[1].value;
    editSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('destination-id').value).toBe(loadDestinations()[0].id);
    expect(qs('submit-button').textContent).toBe('Update');

    qs('name').value = 'Paris Updated';
    qs('destination-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadDestinations()[0].name).toBe('Paris Updated');

    qs('delete-destination').click();
    expect(loadDestinations().length).toBe(0);
  });

  it('lets a user add and delete a booking from the bookings tab', () => {
    const dest = addDestination({ name: 'Paris', location: 'France' });
    qs('welcome-manage').click();
    qs('tab-bookings').click();
    qs('booking-destination').value = dest.destination_id;
    qs('booking-reference').value = 'REF-1';
    qs('booking-checkIn').value = '2026-08-01';
    qs('booking-checkOut').value = '2026-08-05';
    qs('booking-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadBookings().length).toBe(1);

    qs('edit-booking').value = qs('edit-booking').options[1].value;
    qs('edit-booking').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('booking-id').value).toBe(loadBookings()[0].id);

    qs('delete-booking').click();
    expect(loadBookings().length).toBe(0);
  });
});
