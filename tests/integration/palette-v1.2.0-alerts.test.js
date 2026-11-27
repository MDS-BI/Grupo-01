import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { getConfig } from '../../src/module-config.js';
import { addDocument, addEntity, updateDocument } from '../../src/storage.js';
import { loadAppMarkup, setupFinanzasSession } from '../setup/domFixture.js';

const css = fs
  .readFileSync(path.resolve(process.cwd(), 'src/styles.css'), 'utf8')
  .toLowerCase();

function ruleFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(
    css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')),
    (match) => match[1]
  ).join(' ');
}

function seedAlerts() {
  const config = getConfig();
  const proveedor = addEntity(
    {
      name: 'Proveedor Alertas',
      code: 'PV-AL',
      customFields: { tipoTercero: 'proveedor' },
    },
    config
  );
  const paid = addDocument(
    {
      entity_id: proveedor.entity_id,
      series: 'P',
      folio: 1,
      startDate: '2026-01-10',
      endDate: '2026-02-10',
      totalAmount: 1000,
      customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
    },
    config
  );
  updateDocument(
    paid.document_id,
    {
      status: 'Emitida',
      customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
    },
    config
  );
  updateDocument(
    paid.document_id,
    {
      status: 'Pagada',
      customFields: {
        tipoFactura: 'compra',
        centroCosto: 'Consumible',
        fechaPago: '2026-01-15',
        montoPagado: 1000,
      },
    },
    config
  );
  const overdue = addDocument(
    {
      entity_id: proveedor.entity_id,
      series: 'P',
      folio: 2,
      startDate: '2026-01-10',
      endDate: '2026-02-10',
      totalAmount: 500,
      customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
    },
    config
  );
  updateDocument(
    overdue.document_id,
    {
      status: 'Emitida',
      customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
    },
    config
  );
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
  setupFinanzasSession();
});

describe('paleta v1.2.0 - alertas del panel', () => {
  it('vincula caja negativa a flujo y vencidas a seguimiento con crítico v1.2.0', () => {
    seedAlerts();
    initApp(getConfig());

    const negative = document.querySelector(
      '[data-alert="negative-cash"] button'
    );
    const overdue = document.querySelector(
      '[data-alert="overdue-invoices"] button'
    );
    expect(negative.textContent).toContain('Caja en negativo');
    expect(overdue.textContent).toContain('vencida');

    negative.click();
    expect(document.getElementById('view-cashflow').hidden).toBe(false);
    document.getElementById('nav-dashboard').click();
    document.querySelector('[data-alert="overdue-invoices"] button').click();
    expect(document.getElementById('view-tracking').hidden).toBe(false);

    for (const selector of [
      '.alert-item--negative .alert-link',
      '.alert-item--action .alert-link',
    ]) {
      const declaration = ruleFor(selector);
      expect(declaration).toContain('#a84f00');
      expect(declaration).toContain('#fb8500');
      expect(declaration).not.toContain('#ffb703');
    }
  });

  it('mantiene neutro el estado sin alertas', () => {
    initApp(getConfig());

    expect(document.querySelector('[data-alert]')).toBeNull();
    expect(document.getElementById('dashboard-alerts').textContent).toContain(
      'Sin alertas'
    );
    expect(ruleFor('.alert-item--ok')).not.toContain('#ffb703');
  });
});
