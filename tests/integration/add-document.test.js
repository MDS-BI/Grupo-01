import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { addEntity, loadDocuments } from '../../src/storage.js';

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
  const { boot } = await import('../../src/app.js');
  await boot();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 10 - add a document to an entity', () => {
  it('saves a document associated with the selected entity', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    qs('welcome-manage').click();
    qs('tab-documents').click();
    qs('document-entity').value = entity.entity_id;
    qs('reference').value = 'SO-100';
    qs('startDate').value = '2026-08-01';
    qs('endDate').value = '2026-08-05';
    qs('quantity').value = '3';
    qs('totalAmount').value = '1499.50';
    qs('currency').value = 'EUR';
    qs('status').value = 'pending';
    qs('document-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    const all = loadDocuments();
    expect(all.length).toBe(1);
    expect(all[0].entity_id).toBe(entity.entity_id);
    expect(all[0].reference).toBe('SO-100');
    expect(all[0].quantity).toBe(3);
    expect(all[0].totalAmount).toBe(1499.5);
  });

  it('prevents saving when required document information is blank', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    qs('welcome-manage').click();
    qs('tab-documents').click();
    qs('document-entity').value = entity.entity_id;
    qs('reference').value = '';
    qs('document-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadDocuments().length).toBe(0);
    expect(qs('error-reference').textContent).toContain('required');
  });

  it('rejects an end date before the start date with an explanation', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    qs('welcome-manage').click();
    qs('tab-documents').click();
    qs('document-entity').value = entity.entity_id;
    qs('reference').value = 'SO-101';
    qs('startDate').value = '2026-08-05';
    qs('endDate').value = '2026-08-01';
    qs('document-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadDocuments().length).toBe(0);
    expect(qs('error-endDate').textContent).toContain('on or after');
  });

  it('requires a known entity for the document', () => {
    qs('welcome-manage').click();
    qs('tab-documents').click();
    qs('reference').value = 'ORPHAN';
    qs('startDate').value = '2026-08-01';
    qs('endDate').value = '2026-08-05';
    qs('document-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadDocuments().length).toBe(0);
    expect(qs('error-document-entity').textContent).toContain('entity');
  });
});
