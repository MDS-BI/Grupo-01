import { beforeEach, describe, expect, it } from 'vitest';
import * as movementsModule from '../../src/movements.js';
import { getConfig, userConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  clearAll,
  deleteDocument,
  deleteDocumentsForEntity,
  updateDocument,
} from '../../src/storage.js';
import { loadMovements } from '../../src/movements.js';
import { loadAppMarkup } from '../setup/domFixture.js';

beforeEach(() => {
  loadAppMarkup();
  clearAll();
  movementsModule.clearMovements();
});

const config = getConfig();

function cliente() {
  return addEntity(
    {
      name: 'Cliente Sur',
      code: 'CL-IS',
      customFields: { tipoTercero: 'cliente' },
    },
    config
  );
}

function crearVenta(entity, folio, total) {
  const borrador = addDocument(
    {
      entity_id: entity.entity_id,
      folio,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      totalAmount: total,
      customFields: { tipoFactura: 'venta' },
    },
    config
  );
  updateDocument(borrador.document_id, { status: 'Emitida' }, config);
  return borrador;
}

describe('T061 - movimientos financieros vía operaciones de almacenamiento (FR-019)', () => {
  it('genera movimientos al emitir y al pagar con addDocument/updateDocument', () => {
    const entity = cliente();
    const factura = crearVenta(entity, 1, 300);
    let movement = loadMovements().at(-1);
    expect(movement).toMatchObject({
      document_id: factura.document_id,
      entity_id: entity.entity_id,
      tipo: 'cargo',
      monto: 300,
      fecha: '2026-10-01',
    });

    updateDocument(
      factura.document_id,
      {
        status: 'Pagada',
        customFields: {
          tipoFactura: 'venta',
          montoPagado: 300,
          fechaPago: '2026-10-20',
        },
      },
      config
    );
    movement = loadMovements().at(-1);
    expect(movement).toMatchObject({
      document_id: factura.document_id,
      tipo: 'pago',
      fecha: '2026-10-20',
    });
  });

  it('elimina en cascada los movimientos con deleteDocument', () => {
    const entity = cliente();
    const factura = crearVenta(entity, 2, 120);
    expect(loadMovements()).toHaveLength(1);

    deleteDocument(factura.document_id, config);
    expect(loadMovements()).toEqual([]);
  });

  it('elimina en cascada los movimientos con deleteDocumentsForEntity', () => {
    const entity = cliente();
    const venta = crearVenta(entity, 3, 200);
    const venta2 = crearVenta(entity, 4, 90);
    expect(loadMovements()).toHaveLength(2);

    deleteDocumentsForEntity(entity.entity_id, config);
    expect(loadMovements()).toEqual([]);
    void venta;
    void venta2;
  });

  it('no expone operaciones para editar o eliminar movimientos manualmente', () => {
    const exportaciones = Object.keys(movementsModule);
    expect(exportaciones.sort()).toEqual(
      [
        'MOVEMENTS_KEY',
        'buildMovement',
        'clearMovements',
        'deleteMovementsForDocument',
        'deleteMovementsForEntity',
        'loadMovements',
        'movementsForTransition',
        'rebuildMovements',
        'saveMovements',
      ].sort()
    );
    for (const nombre of exportaciones) {
      expect(nombre).not.toMatch(/edit|update|remove|set/i);
    }
  });

  it('los movimientos persistidos solo llevan campos del contrato, sin CRUD manual', () => {
    const entity = cliente();
    crearVenta(entity, 5, 500);

    const raw = JSON.parse(localStorage.getItem('erp.movements'));
    expect(raw).toHaveLength(1);
    for (const movement of raw) {
      for (const clave of Object.keys(movement)) {
        expect([
          'id',
          'document_id',
          'entity_id',
          'fecha',
          'tipo',
          'monto',
          'centroCosto',
          'salesOrderId',
        ]).toContain(clave);
      }
      expect(movement.tipo).toBe('cargo');
      expect(movement.monto).toBe(500);
    }
  });
});

describe('T061 - control de acceso a la capa de almacenamiento (FR-019)', () => {
  it('loadMovements devuelve datos del almacenamiento: mutar la copia no altera lo persistido', () => {
    const entity = cliente();
    crearVenta(entity, 6, 80);

    const copia = loadMovements();
    expect(copia).toHaveLength(1);
    copia[0].monto = 999999;
    copia.pop();

    expect(loadMovements()).toHaveLength(1);
    expect(loadMovements()[0].monto).toBe(80);
  });
});
