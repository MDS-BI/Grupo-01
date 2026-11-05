import { describe, expect, it } from 'vitest';
import { validateDocument } from '../../src/validation.js';
import { getConfig } from '../../src/module-config.js';

const config = { customFields: [], statusLifecycle: null };
const entities = [{ entity_id: 'ent_1' }];
const base = {
  entity_id: 'ent_1',
  folio: 10,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
};

describe('asociaciÃ³n de facturas y terceros', () => {
  it.each([
    ['venta', 'cliente', true],
    ['venta', 'proveedor', false],
    ['compra', 'cliente', false],
    ['compra', 'proveedor', true],
    ['venta', undefined, false],
    ['compra', undefined, false],
  ])('valida %s con tercero %s', (tipoFactura, tipoTercero, valid) => {
    const errors = validateDocument(
      { ...base, status: 'Borrador', customFields: { tipoFactura } },
      {
        config: getConfig(),
        entities: [{ entity_id: 'ent_1', customFields: { tipoTercero } }],
      }
    );
    if (valid) {
      expect(errors).toEqual([]);
    } else {
      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'entity_id',
          code: 'INCOMPATIBLE_ENTITY_TYPE',
        })
      );
    }
  });
});

describe('validaciÃ³n detallada de documentos', () => {
  it('acepta un documento vÃ¡lido', () => {
    const errors = validateDocument(
      {
        ...base,
        quantity: 2,
        subtotal: 100,
        discount: 10,
        taxAmount: 5,
        totalAmount: 95,
      },
      { config, entities }
    );
    expect(errors).toEqual([]);
  });

  it('exige folio entero positivo', () => {
    expect(
      validateDocument({ ...base, folio: 1.5 }, { config, entities }).some(
        (error) => error.code === 'INVALID_FOLIO'
      )
    ).toBe(true);
    expect(
      validateDocument({ ...base, folio: 'abc' }, { config, entities }).some(
        (error) => error.code === 'INVALID_FOLIO'
      )
    ).toBe(true);
  });

  it('exige cantidad entera positiva cuando estÃ¡ presente', () => {
    expect(
      validateDocument({ ...base, quantity: 0 }, { config, entities }).some(
        (error) => error.code === 'INTEGER_REQUIRED'
      )
    ).toBe(true);
    expect(
      validateDocument({ ...base, quantity: 2.5 }, { config, entities }).some(
        (error) => error.code === 'INTEGER_REQUIRED'
      )
    ).toBe(true);
  });

  it('rechaza importes negativos y no numÃ©ricos', () => {
    const negative = validateDocument(
      { ...base, subtotal: -1 },
      { config, entities }
    );
    expect(
      negative.some((error) => error.code === 'NEGATIVE_NOT_ALLOWED')
    ).toBe(true);
    const invalid = validateDocument(
      { ...base, totalAmount: 'abc' },
      { config, entities }
    );
    expect(invalid.some((error) => error.code === 'INVALID_NUMBER')).toBe(true);
  });

  it('rechaza fechas con formato invÃ¡lido', () => {
    const errors = validateDocument(
      { ...base, startDate: '2026-02-30' },
      { config, entities }
    );
    expect(errors.some((error) => error.code === 'INVALID_DATE')).toBe(true);
  });
});

describe('reglas del mÃ³dulo (RevisiÃ³n 3)', () => {
  const configFinanciero = getConfig();
  const cliente = {
    entity_id: 'ent_1',
    customFields: { tipoTercero: 'cliente' },
  };
  const proveedor = {
    entity_id: 'ent_2',
    customFields: { tipoTercero: 'proveedor' },
  };
  const personal = {
    entity_id: 'ent_3',
    customFields: { tipoTercero: 'personal' },
  };
  const entities = [cliente, proveedor, personal];

  it('acepta compra de un tercero de tipo personal (FR-012)', () => {
    const errors = validateDocument(
      {
        ...base,
        entity_id: 'ent_3',
        status: 'Borrador',
        totalAmount: 100,
        customFields: { tipoFactura: 'compra', periodoLiquidacion: '2026-01' },
      },
      { config: configFinanciero, entities }
    );
    expect(errors).toEqual([]);
  });

  it('exige total mayor que cero al emitir y lo admite en Borrador (FR-008)', () => {
    const borradorSinTotal = validateDocument(
      {
        ...base,
        status: 'Borrador',
        customFields: { tipoFactura: 'venta' },
      },
      { config: configFinanciero, entities }
    );
    expect(
      borradorSinTotal.some((error) => error.field === 'totalAmount')
    ).toBe(false);

    const emitidaSinTotal = validateDocument(
      {
        ...base,
        status: 'Emitida',
        customFields: { tipoFactura: 'venta' },
      },
      { config: configFinanciero, entities }
    );
    expect(
      emitidaSinTotal.some(
        (error) => error.field === 'totalAmount' && error.code === 'REQUIRED'
      )
    ).toBe(true);

    const emitidaCero = validateDocument(
      {
        ...base,
        status: 'Emitida',
        totalAmount: 0,
        customFields: { tipoFactura: 'venta' },
      },
      { config: configFinanciero, entities }
    );
    expect(
      emitidaCero.some((error) => error.code === 'TOTAL_NOT_POSITIVE')
    ).toBe(true);
  });

  it('exige centro de costo al emitir una compra y lo admite indefinido en Borrador (FR-014)', () => {
    const borrador = validateDocument(
      {
        ...base,
        entity_id: 'ent_2',
        status: 'Borrador',
        totalAmount: 100,
        customFields: { tipoFactura: 'compra' },
      },
      { config: configFinanciero, entities }
    );
    expect(
      borrador.some((error) => error.field === 'customFields.centroCosto')
    ).toBe(false);

    const emitida = validateDocument(
      {
        ...base,
        entity_id: 'ent_2',
        status: 'Emitida',
        totalAmount: 100,
        customFields: { tipoFactura: 'compra' },
      },
      { config: configFinanciero, entities }
    );
    expect(
      emitida.some(
        (error) =>
          error.field === 'customFields.centroCosto' &&
          error.code === 'REQUIRED'
      )
    ).toBe(true);

    const conOpciones = validateDocument(
      {
        ...base,
        entity_id: 'ent_2',
        status: 'Emitida',
        totalAmount: 100,
        customFields: { tipoFactura: 'compra', centroCosto: 'X' },
      },
      { config: configFinanciero, entities }
    );
    expect(
      conOpciones.some(
        (error) =>
          error.field === 'customFields.centroCosto' &&
          error.code === 'INVALID_FORMAT'
      )
    ).toBe(true);
  });

  it('exige perÃ­odo de liquidaciÃ³n YYYY-MM para personal y lo rechaza para proveedor (FR-015)', () => {
    const faltaPeriodo = validateDocument(
      {
        ...base,
        entity_id: 'ent_3',
        status: 'Emitida',
        totalAmount: 100,
        customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
      },
      { config: configFinanciero, entities }
    );
    expect(
      faltaPeriodo.some(
        (error) =>
          error.field === 'customFields.periodoLiquidacion' &&
          error.code === 'REQUIRED'
      )
    ).toBe(true);

    const formatoMalo = validateDocument(
      {
        ...base,
        entity_id: 'ent_3',
        status: 'Emitida',
        totalAmount: 100,
        customFields: {
          tipoFactura: 'compra',
          centroCosto: 'Consumible',
          periodoLiquidacion: '2026-13',
        },
      },
      { config: configFinanciero, entities }
    );
    expect(
      formatoMalo.some(
        (error) =>
          error.field === 'customFields.periodoLiquidacion' &&
          error.code === 'INVALID_FORMAT'
      )
    ).toBe(true);

    const posterior = validateDocument(
      {
        ...base,
        entity_id: 'ent_3',
        status: 'Emitida',
        totalAmount: 100,
        customFields: {
          tipoFactura: 'compra',
          centroCosto: 'Consumible',
          periodoLiquidacion: '2026-02',
        },
      },
      { config: configFinanciero, entities }
    );
    expect(
      posterior.some(
        (error) =>
          error.field === 'customFields.periodoLiquidacion' &&
          error.code === 'PERIODO_AFTER_START'
      )
    ).toBe(true);

    const periodoVigente = validateDocument(
      {
        ...base,
        entity_id: 'ent_3',
        status: 'Emitida',
        totalAmount: 100,
        customFields: {
          tipoFactura: 'compra',
          centroCosto: 'Consumible',
          periodoLiquidacion: '2026-01',
        },
      },
      { config: configFinanciero, entities }
    );
    expect(
      periodoVigente.filter(
        (error) => error.field === 'customFields.periodoLiquidacion'
      )
    ).toEqual([]);

    const enProveedor = validateDocument(
      {
        ...base,
        entity_id: 'ent_2',
        status: 'Emitida',
        totalAmount: 100,
        customFields: {
          tipoFactura: 'compra',
          centroCosto: 'Activo',
          periodoLiquidacion: '2026-01',
        },
      },
      { config: configFinanciero, entities }
    );
    expect(
      enProveedor.some(
        (error) =>
          error.field === 'customFields.periodoLiquidacion' &&
          error.code === 'NOT_APPLICABLE'
      )
    ).toBe(true);
  });

  it('valida salesOrderId de venta: opcional y no vacÃ­o cuando se ingresa (FR-009)', () => {
    const vacio = validateDocument(
      {
        ...base,
        status: 'Borrador',
        totalAmount: 100,
        customFields: { tipoFactura: 'venta', salesOrderId: '   ' },
      },
      { config: configFinanciero, entities }
    );
    expect(
      vacio.some(
        (error) =>
          error.field === 'customFields.salesOrderId' &&
          error.code === 'INVALID_FORMAT'
      )
    ).toBe(true);

    const conReferencia = validateDocument(
      {
        ...base,
        status: 'Borrador',
        totalAmount: 100,
        customFields: { tipoFactura: 'venta', salesOrderId: 'PED-035' },
      },
      { config: configFinanciero, entities }
    );
    expect(
      conReferencia.filter(
        (error) => error.field === 'customFields.salesOrderId'
      )
    ).toEqual([]);
  });

  describe('reglas del pago (FR-016)', () => {
    const emitida = (customFields) => ({
      ...base,
      status: 'Emitida',
      totalAmount: 100,
      customFields: { tipoFactura: 'venta', ...customFields },
    });

    it('exige monto pagado igual al total y fecha de pago al pasar a Pagada', () => {
      const porPagada = validateDocument(
        { ...emitida(), status: 'Pagada' },
        { config: configFinanciero, entities }
      );
      expect(
        porPagada.some(
          (error) =>
            error.field === 'customFields.montoPagado' &&
            error.code === 'REQUIRED'
        )
      ).toBe(true);
      expect(
        porPagada.some(
          (error) =>
            error.field === 'customFields.fechaPago' &&
            error.code === 'REQUIRED'
        )
      ).toBe(true);

      const montoErroneo = validateDocument(
        {
          ...emitida({ montoPagado: 90, fechaPago: '2026-01-02' }),
          status: 'Pagada',
        },
        { config: configFinanciero, entities }
      );
      expect(
        montoErroneo.some((error) => error.code === 'PAYMENT_AMOUNT_MISMATCH')
      ).toBe(true);

      const montoCorrecto = validateDocument(
        {
          ...emitida({ montoPagado: 100, fechaPago: '2026-01-02' }),
          status: 'Pagada',
        },
        { config: configFinanciero, entities }
      );
      expect(
        montoCorrecto.filter(
          (error) =>
            error.field === 'customFields.montoPagado' ||
            error.field === 'customFields.fechaPago'
        )
      ).toEqual([]);
    });
  });

  describe('unicidad (tipo de documento, serie, folio) (FR-030)', () => {
    const facturaAlEmitir = (customFields, folio) => ({
      ...base,
      status: 'Emitida',
      totalAmount: 10,
      folio,
      customFields,
    });

    it('rechaza duplicado dentro del mismo tipo y admite el mismo folio en el otro tipo', () => {
      const existentes = [
        {
          document_id: 'd1',
          folio: 10,
          series: '',
          customFields: { tipoFactura: 'venta' },
        },
      ];

      const duplicado = validateDocument(
        facturaAlEmitir({ tipoFactura: 'venta' }, 10),
        { config: configFinanciero, entities, documents: existentes }
      );
      expect(duplicado.some((error) => error.code === 'DUPLICATE_FOLIO')).toBe(
        true
      );

      const otroTipo = validateDocument(
        {
          ...facturaAlEmitir({ tipoFactura: 'compra' }, 10),
          entity_id: 'ent_2',
        },
        { config: configFinanciero, entities, documents: existentes }
      );
      expect(otroTipo.some((error) => error.code === 'DUPLICATE_FOLIO')).toBe(
        false
      );

      const serieDiferente = validateDocument(
        { ...facturaAlEmitir({ tipoFactura: 'venta' }, 10), series: 'B' },
        { config: configFinanciero, entities, documents: existentes }
      );
      expect(
        serieDiferente.some((error) => error.code === 'DUPLICATE_FOLIO')
      ).toBe(false);
    });
  });
});
