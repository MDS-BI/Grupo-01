import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  deleteDocument,
  deleteDocumentsForEntity,
  loadDocuments,
  loadPurchaseInvoices,
  loadSaleInvoices,
  loadUnclassifiedDocuments,
  updateDocument,
} from '../../src/storage.js';

const config = normalizeConfig({
  moduleName: 'ERP Base',
  customFields: [
    {
      target: 'entity',
      key: 'tipoTercero',
      label: 'Tipo de tercero',
      type: 'select',
      required: true,
      options: ['cliente', 'proveedor', 'personal'],
    },
    {
      target: 'document',
      key: 'tipoFactura',
      label: 'Tipo de factura',
      type: 'select',
      required: true,
      options: ['venta', 'compra'],
    },
  ],
}).config;

function createThirdParty(tipoTercero, code) {
  return addEntity(
    { name: `Tercero ${tipoTercero}`, code, customFields: { tipoTercero } },
    config
  );
}

function factura(entityId, tipoFactura, folio, extra = {}) {
  return {
    entity_id: entityId,
    folio,
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    totalAmount: 1500,
    customFields: { tipoFactura, ...extra },
  };
}

describe('separación física de facturas de venta y compra', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda las ventas en erp.salesInvoices y las compras en erp.purchaseInvoices', () => {
    const cliente = createThirdParty('cliente', 'CLI-1');
    const proveedor = createThirdParty('proveedor', 'PROV-1');

    const venta = addDocument(factura(cliente.entity_id, 'venta', 1), config);
    const compra = addDocument(
      factura(proveedor.entity_id, 'compra', 2, { centroCosto: 'Activo' }),
      config
    );

    expect(localStorage.getItem('erp.salesInvoices')).toContain('venta');
    expect(localStorage.getItem('erp.purchaseInvoices')).toContain('compra');
    expect(localStorage.getItem('erp.unclassifiedDocuments')).toBeNull();

    expect(loadDocuments()).toHaveLength(2);
    expect(loadSaleInvoices()).toHaveLength(1);
    expect(loadPurchaseInvoices()).toHaveLength(1);
    expect(loadSaleInvoices()[0]).toEqual(venta);
    expect(loadPurchaseInvoices()[0]).toEqual(compra);
    expect(loadUnclassifiedDocuments()).toEqual([]);
  });

  it('actualiza una factura de venta sin moverla a otra colección', () => {
    const cliente = createThirdParty('cliente', 'CLI-2');
    const venta = addDocument(factura(cliente.entity_id, 'venta', 3), config);
    updateDocument(venta.document_id, { status: 'Emitida' }, config);
    expect(localStorage.getItem('erp.salesInvoices')).toContain('venta');
    expect(localStorage.getItem('erp.purchaseInvoices')).toBeNull();
    expect(loadSaleInvoices()).toHaveLength(1);
  });

  it('elimina la factura de la colección correspondiente', () => {
    const proveedor = createThirdParty('proveedor', 'PROV-3');
    const compra = addDocument(
      factura(proveedor.entity_id, 'compra', 4, { centroCosto: 'Consumible' }),
      config
    );
    deleteDocument(compra.document_id, config);
    expect(loadDocuments()).toEqual([]);
    expect(JSON.parse(localStorage.getItem('erp.purchaseInvoices'))).toEqual(
      []
    );
  });

  it('elimina en cascada los documentos de una entidad en ambas colecciones', () => {
    const proveedor = createThirdParty('proveedor', 'PROV-4');
    addDocument(
      factura(proveedor.entity_id, 'compra', 5, { centroCosto: 'Activo' }),
      config
    );
    deleteDocumentsForEntity(proveedor.entity_id, config);
    expect(loadDocuments()).toEqual([]);
  });
});
