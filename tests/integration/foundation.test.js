import { describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  loadDocuments,
  loadEntities,
  updateDocument,
  ValidationFailure,
} from '../../src/storage.js';
import { loadAppMarkup, submit } from '../setup/domFixture.js';

function tercero(tipoTercero) {
  return addEntity({
    name: `Tercero ${tipoTercero}`,
    code: tipoTercero,
    customFields: { tipoTercero },
  });
}

function factura(entity_id, tipoFactura, extra = {}) {
  return {
    entity_id,
    folio: 1,
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    customFields: { tipoFactura },
    ...extra,
  };
}

describe('fase fundacional de facturación', () => {
  it('main carga userConfig en el arranque y muestra sus campos y etiquetas', async () => {
    loadAppMarkup();
    vi.resetModules();
    await import('../../src/main.js');
    expect(document.title).toBe(userConfig.moduleName);
    expect(document.getElementById('entities-title').textContent).toBe(
      'Terceros'
    );
    expect(document.getElementById('documents-title').textContent).toBe(
      'Facturas'
    );
    expect(document.getElementById('config-banner').hidden).toBe(true);
    expect(document.getElementById('custom-entity-tipoTercero')).not.toBeNull();
    expect(
      document.getElementById('custom-document-tipoFactura')
    ).not.toBeNull();
    expect(document.getElementById('custom-document-montoPagado').type).toBe(
      'number'
    );
    expect(document.getElementById('custom-document-fechaPago').type).toBe(
      'date'
    );
  });

  it.each([
    ['venta', 'cliente'],
    ['compra', 'proveedor'],
  ])(
    'guarda %s de %s en Borrador desde formulario y al recargar',
    (tipoFactura, tipoTercero) => {
      const entity = tercero(tipoTercero);
      loadAppMarkup();
      initApp(userConfig);
      expect(
        Array.from(
          document.getElementById('status').options,
          (option) => option.value
        )
      ).toEqual(['Borrador']);
      document.getElementById('document-entity').value = entity.entity_id;
      document.getElementById('folio').value = '1';
      document.getElementById('startDate').value = '2026-11-01';
      document.getElementById('endDate').value = '2026-11-30';
      document.getElementById('custom-document-tipoFactura').value =
        tipoFactura;
      submit('document-form');
      expect(loadDocuments()).toHaveLength(1);
      expect(loadDocuments()[0]).toMatchObject({
        entity_id: entity.entity_id,
        status: 'Borrador',
        customFields: { tipoFactura },
      });
      loadAppMarkup();
      initApp(userConfig);
      expect(loadDocuments()[0].status).toBe('Borrador');
      expect(document.getElementById('document-list').textContent).toContain(
        'Borrador'
      );
    }
  );

  it.each([undefined, '', 'Borrador'])(
    'inicia en Borrador desde almacenamiento con estado %s',
    (status) => {
      const entity = tercero('cliente');
      expect(
        addDocument(factura(entity.entity_id, 'venta', { status })).status
      ).toBe('Borrador');
    }
  );

  it.each(['Emitida', 'Pagada', 'Otro'])(
    'rechaza un alta directa en %s sin guardar',
    (status) => {
      const entity = tercero('cliente');
      expect(() =>
        addDocument(factura(entity.entity_id, 'venta', { status }))
      ).toThrow(ValidationFailure);
      expect(loadDocuments()).toEqual([]);
    }
  );

  it.each([
    ['venta', 'proveedor'],
    ['compra', 'cliente'],
  ])(
    'rechaza %s de %s en alta y edición sin alterar datos',
    (tipoFactura, tipoTercero) => {
      const incompatible = tercero(tipoTercero);
      expect(() =>
        addDocument(factura(incompatible.entity_id, tipoFactura))
      ).toThrow(ValidationFailure);
      expect(loadDocuments()).toEqual([]);
      const compatible = tercero(
        tipoTercero === 'cliente' ? 'proveedor' : 'cliente'
      );
      const created = addDocument(factura(compatible.entity_id, tipoFactura));
      expect(() =>
        updateDocument(created.document_id, {
          entity_id: incompatible.entity_id,
        })
      ).toThrow(ValidationFailure);
      expect(loadDocuments()).toEqual([created]);
      expect(() =>
        updateDocument(created.document_id, {
          customFields: {
            tipoFactura: tipoFactura === 'venta' ? 'compra' : 'venta',
          },
        })
      ).toThrow(ValidationFailure);
      expect(loadDocuments()).toEqual([created]);
    }
  );

  it('muestra el error de asociación en el formulario y no persiste la factura', () => {
    const entity = tercero('proveedor');
    loadAppMarkup();
    initApp(userConfig);
    document.getElementById('document-entity').value = entity.entity_id;
    document.getElementById('folio').value = '1';
    document.getElementById('startDate').value = '2026-11-01';
    document.getElementById('endDate').value = '2026-11-30';
    document.getElementById('custom-document-tipoFactura').value = 'venta';
    submit('document-form');
    expect(
      document.getElementById('error-document-entity').textContent
    ).toContain('cliente');
    expect(
      document.getElementById('document-entity').getAttribute('aria-invalid')
    ).toBe('true');
    expect(loadDocuments()).toEqual([]);
  });

  it('exige los tipos y mantiene la referencia a un tercero existente', () => {
    expect(() => addEntity({ name: 'Sin tipo', code: 'SIN' })).toThrow(
      ValidationFailure
    );
    expect(loadEntities()).toEqual([]);
    const entity = tercero('cliente');
    for (const tipoFactura of [undefined, 'otro']) {
      expect(() => addDocument(factura(entity.entity_id, tipoFactura))).toThrow(
        ValidationFailure
      );
    }
    expect(() => addDocument(factura('inexistente', 'venta'))).toThrow(
      ValidationFailure
    );
    expect(loadDocuments()).toEqual([]);
  });
});
