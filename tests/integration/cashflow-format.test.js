import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { getConfig } from '../../src/module-config.js';
import { addDocument, addEntity, updateDocument } from '../../src/storage.js';
import { loadAppMarkup, setupFinanzasSession } from '../setup/domFixture.js';

const config = getConfig();

function createInvoice({ entity, tipoFactura, folio, total }) {
  const customFields = {
    tipoFactura,
    ...(tipoFactura === 'compra' ? { centroCosto: 'Consumible' } : {}),
  };
  const document = addDocument(
    {
      entity_id: entity.entity_id,
      series: 'A',
      folio,
      startDate: '2026-01-10',
      endDate: '2026-02-10',
      totalAmount: total,
      customFields,
    },
    config
  );

  updateDocument(
    document.document_id,
    { status: 'Emitida', customFields },
    config
  );
  updateDocument(
    document.document_id,
    {
      status: 'Pagada',
      customFields: {
        ...customFields,
        montoPagado: total,
        fechaPago: '2026-02-05',
      },
    },
    config
  );
}

function text(id) {
  return document.getElementById(id).textContent;
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  setupFinanzasSession();
});

describe('T100 - formato CLP del Flujo de caja', () => {
  it('formatea totales y montos con separador de miles y signo negativo delante del peso', () => {
    const cliente = addEntity(
      {
        name: 'Cliente Flujo',
        code: 'CL-FL',
        customFields: { tipoTercero: 'cliente' },
      },
      config
    );
    const proveedor = addEntity(
      {
        name: 'Proveedor Flujo',
        code: 'PV-FL',
        customFields: { tipoTercero: 'proveedor' },
      },
      config
    );

    createInvoice({
      entity: cliente,
      tipoFactura: 'venta',
      folio: 1,
      total: 1240000,
    });
    createInvoice({
      entity: proveedor,
      tipoFactura: 'compra',
      folio: 2,
      total: 2430000,
    });

    initApp(config);
    document.getElementById('qa-cashflow').click();

    expect(text('cashflow-ingresos')).toBe('$1.240.000');
    expect(text('cashflow-egresos')).toBe('$2.430.000');
    expect(text('cashflow-neto')).toBe('-$1.190.000');

    const montos = Array.from(
      document.getElementById('cashflow-table').querySelectorAll('tbody tr')
    ).map((row) => row.cells[5].textContent);
    expect(montos).toContain('$1.240.000');
    expect(montos).toContain('-$2.430.000');
  });
});

describe('T068 - colores del Flujo de caja', () => {
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

  it('usa texto favorable y crítico de la paleta v1.2.0', () => {
    expect(
      ruleFor(".cashflow-table tr[data-tipo='ingreso'] td:last-child")
    ).toContain('#126782');
    expect(
      ruleFor(".cashflow-table tr[data-tipo='egreso'] td:last-child")
    ).toContain('#a84f00');
  });
});
