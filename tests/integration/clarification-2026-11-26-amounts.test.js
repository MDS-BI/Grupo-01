import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderPurchaseList } from '../../src/components/invoice-purchase-list.js';
import { renderSaleList } from '../../src/components/invoice-sale-list.js';
import { getConfig } from '../../src/module-config.js';
import { addDocument, addEntity } from '../../src/storage.js';
import { loadAppMarkup } from '../setup/domFixture.js';

const config = getConfig();
const css = fs.readFileSync(
  path.resolve(process.cwd(), 'src/styles.css'),
  'utf8'
);

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('Clarificación 2026-11-26 - montos en facturas', () => {
  it('usa formatCurrencyCLP en facturas de venta y compra', () => {
    const cliente = addEntity(
      {
        name: 'Cliente Montos',
        code: 'CL-MO',
        customFields: { tipoTercero: 'cliente' },
      },
      config
    );
    const proveedor = addEntity(
      {
        name: 'Proveedor Montos',
        code: 'PV-MO',
        customFields: { tipoTercero: 'proveedor' },
      },
      config
    );
    const venta = addDocument(
      {
        entity_id: cliente.entity_id,
        series: 'A',
        folio: 1,
        startDate: '2026-11-01',
        endDate: '2026-11-25',
        totalAmount: 250000,
        currency: 'CLP',
        customFields: { tipoFactura: 'venta' },
      },
      config
    );
    const compra = addDocument(
      {
        entity_id: proveedor.entity_id,
        series: 'B',
        folio: 2,
        startDate: '2026-11-01',
        endDate: '2026-11-25',
        totalAmount: 250000,
        currency: 'CLP',
        customFields: { tipoFactura: 'compra' },
      },
      config
    );
    const entities = new Map([
      [cliente.entity_id, cliente.name],
      [proveedor.entity_id, proveedor.name],
    ]);
    const saleContainer = document.createElement('div');
    const purchaseContainer = document.createElement('div');

    renderSaleList(saleContainer, [venta], entities, {
      readOnlyIds: new Set(),
    });
    renderPurchaseList(purchaseContainer, [compra], entities, {
      readOnlyIds: new Set(),
    });

    for (const container of [saleContainer, purchaseContainer]) {
      const total = container.querySelector('td.invoice-total');
      expect(total).toBeTruthy();
      expect(total.textContent).toBe('$250.000');
      expect(container.textContent).not.toContain('250000 CLP');
    }
    expect(css).toMatch(/\.invoice-total\s*\{[^}]*text-align:\s*right;/);
  });
});
