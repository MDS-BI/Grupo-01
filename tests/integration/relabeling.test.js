import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';

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
});

afterEach(() => {
  dom.window.close();
});

async function bootWith(configOverride){
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(normalizeConfig(configOverride));
}

describe('User Story 6 - relabel screens from configuration', () => {
  it('shows default Entity/Document terms when no mappings are provided', async () => {
    await bootWith(undefined);
    expect(qs('welcome-manage').textContent).toBe('Manage Entities & Documents');
    qs('welcome-manage').click();
    expect([...qs('view-manage').querySelectorAll('.nav-tabs .tab-button')].map(b => b.textContent)).toEqual(['Entities', 'Documents', 'Home']);
  });

  it('uses configured terms on every screen without altering navigation behavior', async () => {
    await bootWith({
      moduleName: 'Sales',
      labels: { entity: 'Customer', entities: 'Customers', document: 'Sales Order', documents: 'Sales Orders' }
    });
    expect(document.title).toBe('Sales');
    expect(qs('welcome-heading').textContent).toBe('Sales');
    expect(qs('welcome-manage').textContent).toBe('Manage Customers & Sales Orders');
    expect(qs('welcome-search').textContent).toBe('Search Customers');

    qs('welcome-manage').click();
    const tabs = [...qs('view-manage').querySelectorAll('.nav-tabs .tab-button')].map(b => b.textContent);
    expect(tabs).toEqual(['Customers', 'Sales Orders', 'Home']);
    expect(qs('entity-form-heading').textContent).toBe('Add / Edit Customer');
    expect(qs('document-form-heading').textContent).toBe('Add / Edit Sales Order');
    expect(qs('delete-entity').textContent).toBe('Delete selected customer');

    qs('tab-home').click();
    qs('welcome-search').click();
    expect(qs('search-view-heading').textContent).toBe('Search Customers');
    expect(qs('search-empty').textContent).toContain('customers');
  });

  it('keeps navigation behavior unchanged after relabeling', async () => {
    await bootWith({ labels: { entity: 'Product', entities: 'Products', document: 'Order', documents: 'Orders' } });
    qs('welcome-manage').click();
    expect(qs('view-manage').hidden).toBe(false);
    const tabButtons = [...qs('view-manage').querySelectorAll('.nav-tabs .tab-button')];
    tabButtons[1].click();
    expect(qs('panel-entities').hidden).toBe(true);
    expect(qs('panel-documents').hidden).toBe(false);
    tabButtons[2].click();
    expect(qs('view-welcome').hidden).toBe(false);
  });
});
