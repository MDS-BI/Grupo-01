import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { userConfig, getConfig } from '../../src/module-config.js';
import {
  addEntity,
  loadEntities,
  loadDocuments,
  updateEntity,
} from '../../src/storage.js';
import { loadMovements } from '../../src/movements.js';
import { loadDemoData, hasStoredRecords } from '../../src/demo-data.js';
import { loadAppMarkup } from '../setup/domFixture.js';

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  localStorage.removeItem('erp.movements');
});

const config = getConfig();

describe('HU6 - carga de datos de demostración', () => {
  it('carga terceros de los tres tipos y facturas en distintos estados con movimientos', () => {
    const result = loadDemoData(config);
    expect(result.ok).toBe(true);

    const entities = loadEntities();
    const documentos = loadDocuments();
    const tipos = entities.map((entity) => entity.customFields.tipoTercero);
    expect(tipos).toContain('cliente');
    expect(tipos).toContain('proveedor');
    expect(tipos).toContain('personal');

    const estados = documentos.map((document) => document.status);
    expect(estados).toContain('Borrador');
    expect(estados).toContain('Emitida');
    expect(estados).toContain('Pagada');

    const vencidas = documentos.filter(
      (document) =>
        document.status === 'Emitida' &&
        document.endDate < new Date().toISOString().slice(0, 10)
    );
    expect(vencidas.length).toBeGreaterThan(0);

    const ventas = documentos.filter(
      (document) => document.customFields.tipoFactura === 'venta'
    );
    const compras = documentos.filter(
      (document) => document.customFields.tipoFactura === 'compra'
    );
    expect(ventas.length).toBeGreaterThan(0);
    expect(compras.length).toBeGreaterThan(0);

    const comprasConCentro = compras.filter(
      (document) =>
        document.status !== 'Borrador' &&
        document.customFields.centroCosto !== undefined
    );
    expect(comprasConCentro.length).toBeGreaterThan(0);

    const personalFactura = compras.find(
      (document) =>
        document.customFields.tipoFactura === 'compra' &&
        document.customFields.periodoLiquidacion !== undefined
    );
    expect(personalFactura).toBeTruthy();

    for (const document of documentos.filter(
      (document) => document.status === 'Pagada'
    )) {
      expect(document.customFields.montoPagado).toBe(document.totalAmount);
      expect(document.customFields.fechaPago).toBeTruthy();
    }

    expect(loadMovements().length).toBeGreaterThan(0);
  });

  it('conserva registros y relaciones al recargar la página', () => {
    loadDemoData(config);
    const primeros = loadDocuments().map((document) => document.document_id);
    const movimientosPrevios = loadMovements().map((mov) => mov.document_id);

    loadAppMarkup();
    initApp(userConfig);

    expect(loadEntities().length).toBeGreaterThan(0);
    expect(loadDocuments().length).toBeGreaterThan(0);
    expect(loadDocuments().map((document) => document.document_id)).toEqual(
      primeros
    );
    expect(loadMovements().map((mov) => mov.document_id)).toEqual(
      movimientosPrevios
    );
  });

  it('no duplica registros si se carga dos veces', () => {
    loadDemoData(config);
    const entidadesPrevias = loadEntities().length;
    const facturasPrevias = loadDocuments().length;

    const result = loadDemoData(config);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('EXISTS');
    expect(loadEntities().length).toBe(entidadesPrevias);
    expect(loadDocuments().length).toBe(facturasPrevias);
  });

  it('rechaza la carga cuando hay registros propios y los conserva', () => {
    addEntity(
      {
        name: 'Registro propio',
        code: 'PROPIO-1',
        customFields: { tipoTercero: 'cliente' },
      },
      config
    );
    const result = loadDemoData(config);
    expect(result.ok).toBe(false);
    expect(loadEntities()).toHaveLength(1);
    expect(loadEntities()[0].name).toBe('Registro propio');
    expect(loadDocuments()).toEqual([]);
  });

  it('las referencias a otros módulos se persisten y sobreviven a una edición', () => {
    loadDemoData(config);
    const entity = loadEntities().find(
      (entry) => entry.customFields.referenciaOtroModulo
    );
    expect(entity).toBeTruthy();

    updateEntity(entity.id, {
      customFields: entity.customFields,
    });
    const after = loadEntities().find((entry) => entry.code === entity.code);
    expect(after.customFields.referenciaOtroModulo).toBe(
      entity.customFields.referenciaOtroModulo
    );
  });
});
