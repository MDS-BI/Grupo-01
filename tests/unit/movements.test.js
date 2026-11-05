import { beforeEach, describe, expect, it } from 'vitest';
import { getConfig } from '../../src/module-config.js';
import {
  addDocument,
  updateDocument,
  deleteDocument,
  loadDocuments,
  deleteEntity,
  addEntity,
  clearAll,
} from '../../src/storage.js';
import {
  loadMovements,
  clearMovements,
  rebuildMovements,
} from '../../src/movements.js';
import { loadAppMarkup } from '../setup/domFixture.js';

beforeEach(() => {
  loadAppMarkup();
  clearAll();
});

const config = getConfig();

function tercero(tipo) {
  return addEntity(
    {
      name: `Entidad ${tipo}`,
      code: `COD_${tipo}`,
      customFields: { tipoTercero: tipo },
    },
    config
  );
}

describe('movements: granularidad por evento (FR-017)', () => {
  it('genera un cargo por emisión de venta y nada por el alta en Borrador', () => {
    const entity = tercero('cliente');
    const borrador = addDocument(
      {
        entity_id: entity.entity_id,
        folio: 1,
        series: 'A',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        totalAmount: 100,
        customFields: { tipoFactura: 'venta', salesOrderId: 'PED-001' },
      },
      config
    );
    expect(loadMovements()).toEqual([]);

    updateDocument(borrador.document_id, { status: 'Emitida' }, config);
    let movements = loadMovements();
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      document_id: borrador.document_id,
      entity_id: entity.entity_id,
      fecha: '2026-01-01',
      tipo: 'cargo',
      monto: 100,
      salesOrderId: 'PED-001',
    });
  });

  it('genera un abono con centro de costo por emisión de compra', () => {
    const entity = tercero('proveedor');
    const borrador = addDocument(
      {
        entity_id: entity.entity_id,
        folio: 2,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        totalAmount: 250,
        customFields: { tipoFactura: 'compra' },
      },
      config
    );
    updateDocument(
      borrador.document_id,
      {
        status: 'Emitida',
        customFields: { tipoFactura: 'compra', centroCosto: 'Activo' },
      },
      config
    );
    const [movement] = loadMovements();
    expect(movement).toMatchObject({
      tipo: 'abono',
      monto: 250,
      centroCosto: 'Activo',
      fecha: '2026-02-01',
    });
  });
});

describe('movements: contrapartida y solo lectura (FR-016, FR-019)', () => {
  it('genera el movimiento de pago al pasar a Pagada con la fecha de pago', () => {
    const entity = tercero('cliente');
    let borrador = addDocument(
      {
        entity_id: entity.entity_id,
        folio: 3,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        totalAmount: 300,
        customFields: { tipoFactura: 'venta' },
      },
      config
    );
    updateDocument(borrador.document_id, { status: 'Emitida' }, config);
    updateDocument(
      borrador.document_id,
      {
        status: 'Pagada',
        customFields: {
          tipoFactura: 'venta',
          montoPagado: 300,
          fechaPago: '2026-03-10',
        },
      },
      config
    );
    const movements = loadMovements();
    expect(movements).toHaveLength(2);
    expect(movements[1]).toMatchObject({
      tipo: 'pago',
      monto: 300,
      fecha: '2026-03-10',
    });
  });
});

describe('movements: cascada con tercero y factura (FR-005)', () => {
  it('elimina los movimientos al eliminar la factura', () => {
    const entity = tercero('cliente');
    const borrador = addDocument(
      {
        entity_id: entity.entity_id,
        folio: 4,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        totalAmount: 50,
        customFields: { tipoFactura: 'venta' },
      },
      config
    );
    updateDocument(borrador.document_id, { status: 'Emitida' }, config);
    expect(loadMovements()).toHaveLength(1);

    deleteDocument(borrador.document_id, config);
    expect(loadMovements()).toEqual([]);
    expect(loadDocuments()).toEqual([]);
  });

  it('elimina los movimientos al eliminar el tercero con sus facturas', () => {
    const entity = tercero('cliente');
    const borrador = addDocument(
      {
        entity_id: entity.entity_id,
        folio: 9,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        totalAmount: 80,
        customFields: { tipoFactura: 'venta' },
      },
      config
    );
    updateDocument(borrador.document_id, { status: 'Emitida' }, config);
    expect(loadMovements()).toHaveLength(1);

    deleteEntity(entity.entity_id, config);
    expect(loadDocuments()).toEqual([]);
    expect(loadMovements()).toEqual([]);
  });
});

describe('movements: regenerable desde erp.documents (contrato)', () => {
  it('reconstruye los movimientos desde las facturas almacenadas', () => {
    const entity = tercero('cliente');
    const facturaA = addDocument(
      {
        entity_id: entity.entity_id,
        folio: 5,
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        totalAmount: 700,
        customFields: { tipoFactura: 'venta' },
      },
      config
    );
    updateDocument(facturaA.document_id, { status: 'Emitida' }, config);
    updateDocument(
      facturaA.document_id,
      {
        status: 'Pagada',
        customFields: {
          tipoFactura: 'venta',
          montoPagado: 700,
          fechaPago: '2026-05-15',
        },
      },
      config
    );

    clearMovements();
    expect(loadMovements()).toEqual([]);
    const documents = JSON.parse(localStorage.getItem('erp.documents'));
    const movements = rebuildMovements(documents);
    expect(movements).toHaveLength(2);
    expect(movements[0]).toMatchObject({ tipo: 'cargo', monto: 700 });
    expect(movements[1]).toMatchObject({ tipo: 'pago', fecha: '2026-05-15' });
  });
});
