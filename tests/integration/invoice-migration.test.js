import { beforeEach, describe, expect, it } from 'vitest';
import { migrateLegacyDocuments, loadDocuments } from '../../src/storage.js';

describe('migración de erp.documents a colecciones separadas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migra ventas y compras a sus colecciones y elimina el legado', () => {
    localStorage.setItem(
      'erp.documents',
      JSON.stringify([
        {
          document_id: 'd1',
          entity_id: 'ent1',
          folio: 1,
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          totalAmount: 100,
          status: 'Borrador',
          customFields: { tipoFactura: 'venta' },
        },
        {
          document_id: 'd2',
          entity_id: 'ent2',
          folio: 2,
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          totalAmount: 200,
          status: 'Borrador',
          customFields: { tipoFactura: 'compra', centroCosto: 'Activo' },
        },
      ])
    );

    const result = migrateLegacyDocuments();

    expect(result.ok).toBe(true);
    expect(result.migrated).toEqual({
      sales: 1,
      purchases: 1,
      unclassified: 0,
    });
    expect(result.legacyRemoved).toBe(true);
    expect(localStorage.getItem('erp.documents')).toBeNull();
    expect(localStorage.getItem('erp.migration.invoiceSplit')).toBe('done');
    expect(localStorage.getItem('erp.schemaVersion')).toBe('2.0.0');
    expect(loadDocuments()).toHaveLength(2);
  });

  it('es idempotente y no duplica documentos al ejecutarla dos veces', () => {
    localStorage.setItem(
      'erp.documents',
      JSON.stringify([
        {
          document_id: 'd1',
          entity_id: 'ent1',
          folio: 1,
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          totalAmount: 100,
          status: 'Borrador',
          customFields: { tipoFactura: 'venta' },
        },
      ])
    );

    const first = migrateLegacyDocuments();
    const second = migrateLegacyDocuments();

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.legacyRemoved).toBe(false);
    expect(loadDocuments()).toHaveLength(1);
  });

  it('envía los documentos sin tipo a unclassifiedDocuments', () => {
    localStorage.setItem(
      'erp.documents',
      JSON.stringify([
        {
          document_id: 'd3',
          entity_id: 'ent1',
          folio: 3,
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          totalAmount: 300,
          status: 'Borrador',
          customFields: {},
        },
      ])
    );

    const result = migrateLegacyDocuments();

    expect(result.ok).toBe(true);
    expect(result.migrated).toEqual({
      sales: 0,
      purchases: 0,
      unclassified: 1,
    });
    expect(loadDocuments()).toEqual([]);
  });
});
