import { describe, expect, it } from 'vitest';
import {
  BASE_FIELD_KEYS,
  getConfig,
  normalizeConfig,
  userConfig,
  validateConfig,
} from '../../src/module-config.js';
import { allowedNextStatuses } from '../../src/validation.js';

describe('configuración fundacional de facturación', () => {
  it('carga las etiquetas del módulo sin errores ni colisiones', () => {
    expect(validateConfig(userConfig)).toEqual([]);
    const config = getConfig();
    expect(config.moduleName).toBe(
      'Contabilidad y Finanzas: Facturación y Pagos'
    );
    expect(config.labels).toMatchObject({
      entity: 'Tercero',
      entities: 'Terceros',
      document: 'Factura',
      documents: 'Facturas',
    });
    expect(config.customFields).toEqual([
      {
        target: 'entity',
        key: 'tipoTercero',
        label: 'Tipo de tercero',
        type: 'select',
        required: true,
        options: ['cliente', 'proveedor', 'personal'],
      },
      {
        target: 'entity',
        key: 'referenciaOtroModulo',
        label: 'Referencia a otro módulo',
        type: 'text',
        required: false,
      },
      {
        target: 'document',
        key: 'tipoFactura',
        label: 'Tipo de factura',
        type: 'select',
        required: true,
        options: ['venta', 'compra'],
      },
      {
        target: 'document',
        key: 'montoPagado',
        label: 'Monto pagado',
        type: 'number',
        required: false,
      },
      {
        target: 'document',
        key: 'fechaPago',
        label: 'Fecha de pago',
        type: 'date',
        required: false,
      },
      {
        target: 'document',
        key: 'centroCosto',
        label: 'Centro de costo',
        type: 'select',
        required: false,
        options: ['Activo', 'Consumible'],
      },
      {
        target: 'document',
        key: 'periodoLiquidacion',
        label: 'Período de liquidación',
        type: 'text',
        required: false,
      },
      {
        target: 'document',
        key: 'salesOrderId',
        label: 'Referencia de orden de venta',
        type: 'text',
        required: false,
      },
      {
        target: 'document',
        key: 'referenciaOtroModulo',
        label: 'Referencia a otro módulo',
        type: 'text',
        required: false,
      },
    ]);
    for (const field of config.customFields) {
      expect(BASE_FIELD_KEYS).not.toContain(field.key);
    }
  });

  it('declara solamente Borrador → Emitida → Pagada, sin salidas desde Pagada', () => {
    const { statusLifecycle } = getConfig();
    expect(statusLifecycle).toEqual({
      statuses: ['Borrador', 'Emitida', 'Pagada'],
      transitions: { Borrador: ['Emitida'], Emitida: ['Pagada'], Pagada: [] },
    });
    expect(allowedNextStatuses(statusLifecycle, 'Borrador')).toEqual([
      'Borrador',
      'Emitida',
    ]);
    expect(allowedNextStatuses(statusLifecycle, 'Emitida')).toEqual([
      'Emitida',
      'Pagada',
    ]);
    expect(allowedNextStatuses(statusLifecycle, 'Pagada')).toEqual(['Pagada']);
  });
});

describe('configuración de la Revisión 3', () => {
  it('declara personal como tipo de tercero disponible', () => {
    const tipoTercero = getConfig().customFields.find(
      (field) => field.key === 'tipoTercero'
    );
    expect(tipoTercero.options).toEqual(['cliente', 'proveedor', 'personal']);
  });

  it('declara centro costo, período de liquidación y salesOrderId sin colisión', () => {
    const keys = getConfig().customFields.map((field) => field.key);
    expect(keys).toEqual([
      'tipoTercero',
      'referenciaOtroModulo',
      'tipoFactura',
      'montoPagado',
      'fechaPago',
      'centroCosto',
      'periodoLiquidacion',
      'salesOrderId',
      'referenciaOtroModulo',
    ]);
    for (const key of keys) {
      expect(BASE_FIELD_KEYS).not.toContain(key);
    }
    const centroCosto = getConfig().customFields.find(
      (field) => field.key === 'centroCosto'
    );
    expect(centroCosto.options).toEqual(['Activo', 'Consumible']);
  });
});

describe('normalización de configuración', () => {
  it('aplica una configuración completa válida', () => {
    const { config, errors } = normalizeConfig({
      moduleName: 'Ventas',
      labels: {
        entity: 'Cliente',
        entities: 'Clientes',
        document: 'Pedido',
        documents: 'Pedidos',
      },
      customFields: [
        {
          target: 'entity',
          key: 'segment',
          label: 'Segmento',
          type: 'select',
          options: ['A', 'B'],
        },
      ],
      statusLifecycle: {
        statuses: ['Borrador', 'Aprobado'],
        transitions: { Borrador: ['Aprobado'] },
      },
      theme: { accentColor: '#0f62fe' },
    });
    expect(errors).toEqual([]);
    expect(config.moduleName).toBe('Ventas');
    expect(config.labels.entity).toBe('Cliente');
    expect(config.customFields[0].options).toEqual(['A', 'B']);
    expect(config.statusLifecycle.statuses).toEqual(['Borrador', 'Aprobado']);
    expect(config.theme.accentColor).toBe('#0f62fe');
  });

  it('usa valores por defecto con configuración ausente', () => {
    const { config, errors } = normalizeConfig(undefined);
    expect(errors.length).toBeGreaterThan(0);
    expect(config.moduleName).toBe('ERP Base');
    expect(config.labels.entity).toBe('Entidad');
    expect(config.statusLifecycle).toBeNull();
  });

  it('completa etiquetas parciales con los valores por defecto', () => {
    const { config } = normalizeConfig({
      moduleName: 'Ventas',
      labels: { entity: 'Cliente' },
    });
    expect(config.labels.entity).toBe('Cliente');
    expect(config.labels.entities).toBe('Entidades');
    expect(config.labels.document).toBe('Documento');
  });

  it('detecta colisión de clave con campos base', () => {
    const errors = validateConfig({
      moduleName: 'X',
      customFields: [
        { target: 'entity', key: 'name', label: 'Nombre', type: 'text' },
      ],
    });
    expect(errors.some((error) => error.code === 'CUSTOM_KEY_CONFLICT')).toBe(
      true
    );
  });

  it('detecta select sin opciones', () => {
    const errors = validateConfig({
      moduleName: 'X',
      customFields: [
        {
          target: 'entity',
          key: 'segment',
          label: 'Segmento',
          type: 'select',
          options: [],
        },
      ],
    });
    expect(
      errors.some((error) => error.code === 'INVALID_SELECT_OPTIONS')
    ).toBe(true);
  });

  it('ignora un color de acento inválido y aplica fallback', () => {
    const { config, errors } = normalizeConfig({
      moduleName: 'X',
      theme: { accentColor: 'not-a-color' },
    });
    expect(config.theme.accentColor).toBeNull();
    expect(errors.some((error) => error.code === 'INVALID_ACCENT_COLOR')).toBe(
      true
    );
  });

  it('ignora un ciclo de vida inválido', () => {
    const { config, errors } = normalizeConfig({
      moduleName: 'X',
      statusLifecycle: { statuses: ['A'], transitions: { A: ['Desconocido'] } },
    });
    expect(config.statusLifecycle).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });
});
