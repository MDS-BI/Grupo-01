import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadEntities } from '../../src/storage.js';

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

describe('User Story 1 - create and organize entities', () => {
  it('creates a new entity that appears in storage and the edit selector', () => {
    qs('welcome-manage').click();
    expect(qs('view-manage').hidden).toBe(false);
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    const all = loadEntities();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Acme');
    expect(all[0].code).toBe('AC-001');
    expect(all[0].entity_id).toBeDefined();
    const select = qs('edit-entity');
    expect([...select.options].map(o => o.textContent)).toContain('Acme — AC-001');
  });

  it('prevents saving when required information is blank and explains what is needed', () => {
    qs('welcome-manage').click();
    qs('name').value = '';
    qs('code').value = '';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(loadEntities().length).toBe(0);
    expect(qs('error-name').textContent).toContain('required');
    expect(qs('error-code').textContent).toContain('required');
  });
});
