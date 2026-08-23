import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { loadEntities, searchEntities } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

const configWithFields = {
  customFields: [
    { target: 'entity', key: 'creditLimit', label: 'Credit limit', type: 'number', required: true },
    { target: 'entity', key: 'region', label: 'Region', type: 'select', options: ['EMEA', 'APAC'] }
  ]
};

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
});

afterEach(() => {
  dom.window.close();
});

async function bootWith(configOverride){
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(normalizeConfig(configOverride ?? configWithFields));
}

describe('User Story 7 - declare custom fields for records', () => {
  it('renders declared fields with the correct input types on the entity form', async () => {
    await bootWith();
    qs('welcome-manage').click();
    const numberInput = qs('cf-creditLimit');
    expect(numberInput).not.toBeNull();
    expect(numberInput.getAttribute('type')).toBe('number');
    expect(numberInput.closest('.custom-field').querySelector('label').textContent).toBe('Credit limit *');
    const select = qs('cf-region');
    expect(select.tagName).toBe('SELECT');
    expect([...select.options].map(o => o.value)).toEqual(['', 'EMEA', 'APAC']);
  });

  it('blocks saving when a required custom field is blank and explains why', async () => {
    await bootWith();
    qs('welcome-manage').click();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadEntities().length).toBe(0);
    expect(qs('error-cf-creditLimit').textContent).toContain('required');
  });

  it('persists custom values and displays them in search results with labels', async () => {
    await bootWith();
    qs('welcome-manage').click();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('cf-creditLimit').value = '5000';
    qs('cf-region').value = 'EMEA';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    const saved = loadEntities()[0];
    expect(saved.creditLimit).toBe(5000);
    expect(saved.region).toBe('EMEA');

    qs('welcome-search').click();
    qs('search-input').value = 'emea';
    qs('search-input').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    const items = [...qs('search-results-list').querySelectorAll('.entity-item')];
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Region: EMEA');
  });

  it('renders document select custom fields from configuration', async () => {
    await bootWith({
      customFields: [
        { target: 'document', key: 'paymentTerms', label: 'Payment terms', type: 'select', options: ['net30', 'net60'] }
      ]
    });
    qs('welcome-manage').click();
    qs('tab-documents').click();
    const select = qs('cf-paymentTerms');
    expect(select).not.toBeNull();
    expect(select.tagName).toBe('SELECT');
    expect([...select.options].map(o => o.textContent)).toEqual(['--', 'net30', 'net60']);
  });

  it('behaves identically to the unmodified base when no fields are declared', async () => {
    await bootWith({});
    qs('welcome-manage').click();
    expect(qs('entity-custom-fields').hidden).toBe(true);
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadEntities().length).toBe(1);
    expect(searchEntities('acme').length).toBe(1);
  });

  it('populates custom field values when editing an existing entity', async () => {
    await bootWith();
    qs('welcome-manage').click();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('cf-creditLimit').value = '750';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));

    const select = qs('edit-entity');
    select.value = select.options[1].value;
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('cf-creditLimit').value).toBe('750');

    qs('cf-creditLimit').value = '900';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadEntities()[0].creditLimit).toBe(900);
  });
});
