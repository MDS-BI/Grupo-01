import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { addEntity, loadEntities, loadDocuments } from '../../src/storage.js';

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

describe('User Story 3 - welcome screen with navigation', () => {
  it('shows a welcome screen with two clearly labeled buttons on load', () => {
    expect(qs('view-welcome').hidden).toBe(false);
    expect(qs('welcome-manage').textContent).toBe('Manage Entities & Documents');
    expect(qs('welcome-search').textContent).toBe('Search Entities');
  });

  it('navigates to the manage screen from the manage button', () => {
    qs('welcome-manage').click();
    expect(qs('view-manage').hidden).toBe(false);
    expect(qs('view-welcome').hidden).toBe(true);
  });

  it('navigates to the search screen from the search button', () => {
    qs('welcome-search').click();
    expect(qs('view-search').hidden).toBe(false);
    expect(qs('view-welcome').hidden).toBe(true);
  });
});

describe('User Story 4 - manage entities and documents on a dedicated screen', () => {
  it('shows a horizontal navigation tab with three buttons', () => {
    qs('welcome-manage').click();
    const buttons = [...qs('view-manage').querySelectorAll('.nav-tabs .tab-button')];
    expect(buttons.length).toBe(3);
    expect(buttons.map(b => b.textContent)).toEqual(['Entities', 'Documents', 'Home']);
  });

  it('switches between the entities and documents panels', () => {
    qs('welcome-manage').click();
    expect(qs('panel-entities').hidden).toBe(false);
    expect(qs('panel-documents').hidden).toBe(true);
    qs('tab-documents').click();
    expect(qs('panel-entities').hidden).toBe(true);
    expect(qs('panel-documents').hidden).toBe(false);
    qs('tab-entities').click();
    expect(qs('panel-entities').hidden).toBe(false);
    expect(qs('panel-documents').hidden).toBe(true);
  });

  it('does not display an entity list on the manage screen', () => {
    addEntity({ name: 'Acme', code: 'AC-001' });
    qs('welcome-manage').click();
    expect(qs('entity-list')).toBeNull();
    expect(qs('view-manage').querySelector('ul#entity-list')).toBeNull();
  });

  it('creates, edits, and deletes an entity without a list', () => {
    qs('welcome-manage').click();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadEntities().length).toBe(1);

    const editSelect = qs('edit-entity');
    editSelect.value = editSelect.options[1].value;
    editSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('submit-button').textContent).toBe('Update');
    qs('name').value = 'Acme Updated';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadEntities()[0].name).toBe('Acme Updated');

    qs('delete-entity').click();
    expect(loadEntities().length).toBe(0);
  });

  it('adds and deletes a document from the documents tab', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    qs('welcome-manage').click();
    qs('tab-documents').click();
    qs('document-entity').value = entity.entity_id;
    qs('reference').value = 'SO-1';
    qs('startDate').value = '2026-08-01';
    qs('endDate').value = '2026-08-05';
    qs('document-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadDocuments().length).toBe(1);

    qs('edit-document').value = qs('edit-document').options[1].value;
    qs('edit-document').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('document-id').value).toBe(loadDocuments()[0].id);

    qs('delete-document').click();
    expect(loadDocuments().length).toBe(0);
  });

  it('returns to the welcome screen via the Home tab', () => {
    qs('welcome-manage').click();
    qs('tab-home').click();
    expect(qs('view-welcome').hidden).toBe(false);
    expect(qs('view-manage').hidden).toBe(true);
  });
});
