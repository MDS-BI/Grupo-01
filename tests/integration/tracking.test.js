import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { getConfig, userConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  clearAll,
  updateDocument,
} from '../../src/storage.js';
import { loadAppMarkup } from '../setup/domFixture.js';
import { clearMovements } from '../../src/movements.js';

beforeEach(() => {
  loadAppMarkup();
  clearAll();
  clearMovements();
});

const config = getConfig();

function tercero(tipo, code) {
  return addEntity(
    {
      name: `Entidad ${code}`,
      code,
      customFields: { tipoTercero: tipo },
    },
    config
  );
}

function emitirVenta(
  entity,
  { folio, endDate, total, statusAfter = 'Emitida' }
) {
  const borrador = addDocument(
    {
      entity_id: entity.entity_id,
      folio,
      startDate: '2026-10-01',
      endDate,
      totalAmount: total,
      customFields: { tipoFactura: 'venta' },
    },
    config
  );
  if (statusAfter === 'Borrador') return borrador;
  updateDocument(borrador.document_id, { status: 'Emitida' }, config);
  return borrador;
}

describe('HU5 - vista de seguimiento', () => {
  it('muestra los totales por tercero y las facturas vencidas', () => {
    const cliente = tercero('cliente', 'C_1');
    const pago = tercero('proveedor', 'P_1');

    const hoy = new Date().toISOString().slice(0, 10);
    const [y, m, d] = hoy.split('-').map(Number);
    const dateAt = (delta) => {
      const date = new Date(Date.UTC(y, m - 1, d + delta));
      return date.toISOString().slice(0, 10);
    };

    emitirVenta(cliente, { folio: 1, endDate: dateAt(10), total: 400 });
    emitirVenta(cliente, { folio: 2, endDate: dateAt(-5), total: 120 });
    emitirVenta(cliente, {
      folio: 3,
      endDate: dateAt(-2),
      total: 60,
      statusAfter: 'Borrador',
    });

    const compra = addDocument(
      {
        entity_id: pago.entity_id,
        folio: 10,
        startDate: '2026-10-01',
        endDate: dateAt(3),
        totalAmount: 250,
        customFields: { tipoFactura: 'compra' },
      },
      config
    );
    updateDocument(
      compra.document_id,
      {
        status: 'Emitida',
        customFields: { tipoFactura: 'compra', centroCosto: 'Activo' },
      },
      config
    );

    initApp(userConfig);
    document.getElementById('nav-tracking').click();

    expect(document.getElementById('tracking-cobrar').textContent).toBe('520');
    expect(document.getElementById('tracking-pagar').textContent).toBe('250');
    expect(document.getElementById('tracking-vencidas').textContent).toBe('1');

    const trackingText =
      document.getElementById('tracking-by-entity').textContent;
    expect(trackingText).toContain('Entidad C_1');
    expect(trackingText).toContain('Total por cobrar: 520');
    expect(trackingText).toContain('Facturas vencidas: 1');
    expect(trackingText).toContain('Entidad P_1');
    expect(trackingText).toContain('Total por pagar: 250');
  });
});
