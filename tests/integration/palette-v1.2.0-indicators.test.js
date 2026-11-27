import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { describeVariation } from '../../src/finance.js';
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

function seedNegativeCashAndOverdue() {
  const config = getConfig();
  const proveedor = addEntity(
    {
      name: 'Proveedor Indicadores',
      code: 'PV-IND',
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

describe('paleta v1.2.0 - indicadores financieros', () => {
  it('resalta caja negativa y vencidas con crítico sin fondo de acción', () => {
    seedNegativeCashAndOverdue();
    initApp(getConfig());

    expect(document.getElementById('finance-indicators-section').hidden).toBe(
      false
    );
    expect(
      document
        .getElementById('indicator-cash')
        .classList.contains('is-negative')
    ).toBe(true);
    expect(
      document
        .getElementById('indicator-overdue')
        .classList.contains('is-action')
    ).toBe(true);
    expect(document.getElementById('kpi-vencidas').textContent).toBe('1');

    const negative = ruleFor('.indicator-card.is-negative');
    const action = ruleFor('.indicator-card.is-action');
    for (const declaration of [negative, action]) {
      expect(declaration).toContain('#a84f00');
      expect(declaration).toContain('#fb8500');
      expect(declaration).not.toContain('#ffb703');
    }
    expect(ruleFor('.indicator-card.is-negative .indicator-value')).toContain(
      '#a84f00'
    );
  });

  it('usa favorecido/desfavorable v1.2.0 y conserva señales no cromáticas', () => {
    expect(ruleFor(".indicator-variation[data-tone='favorable']")).toMatch(
      /#219ebc|#126782/
    );
    expect(ruleFor(".indicator-variation[data-tone='unfavorable']")).toContain(
      '#a84f00'
    );
    expect(describeVariation(1, null).text).toBe('sin dato anterior');
    expect(describeVariation(2, 1).text).toContain('▲');
    expect(describeVariation(1, 2).text).toContain('▼');
  });
});
