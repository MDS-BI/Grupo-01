import { describe, expect, it } from 'vitest';
import { validateDocument, validateEntity } from '../../src/validation.js';
import { getConfig } from '../../src/module-config.js';
import { isValidRutChileno } from '../../src/validation.js';

const config = { customFields: [], statusLifecycle: null };

describe('validación de entidades', () => {
  it('exige nombre y código', () => {
    const errors = validateEntity({ name: '', code: '  ' }, { config });
    expect(errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['name', 'code'])
    );
  });

  it('valida email, crédito y fecha objetivo', () => {
    const errors = validateEntity(
      {
        name: 'Acme',
        code: 'AC-1',
        email: 'nope',
        creditLimit: -1,
        targetDate: '2026-13-01',
      },
      { config }
    );
    const codes = errors.map((error) => error.code);
    expect(codes).toContain('INVALID_EMAIL');
    expect(codes).toContain('NEGATIVE_NOT_ALLOWED');
    expect(codes).toContain('INVALID_DATE');
  });

  it('detecta código duplicado', () => {
    const errors = validateEntity(
      { name: 'Acme', code: 'AC-1' },
      { config, existing: [{ entity_id: 'other', code: 'ac-1' }] }
    );
    expect(errors.some((error) => error.code === 'DUPLICATE_CODE')).toBe(true);
  });
});

describe('validación de terceros del módulo (HU1)', () => {
  const financialConfig = getConfig();

  const tercero = (tipoTercero, extra = {}) => ({
    name: 'Tercero',
    code: 'TR-1',
    customFields: { tipoTercero },
    ...extra,
  });

  it('rechaza un RUT con formato o dígito verificador incorrecto', () => {
    const errors = validateEntity(
      tercero('cliente', { taxId: '11.111.111-2' }),
      {
        config: financialConfig,
      }
    );
    expect(errors.some((error) => error.code === 'INVALID_FORMAT')).toBe(true);

    const sinFormato = validateEntity(
      tercero('cliente', { taxId: '123456785' }),
      { config: financialConfig }
    );
    expect(sinFormato.some((error) => error.code === 'INVALID_FORMAT')).toBe(
      true
    );
  });

  it('acepta un RUT chileno válido con módulo 11 y permite K', () => {
    const errors = validateEntity(
      tercero('personal', { taxId: '18.557.900-K' }),
      { config: financialConfig }
    );
    expect(
      errors.some(
        (error) => error.field === 'taxId' && error.code !== 'INVALID_FORMAT'
      )
    ).toBe(false);
  });

  it('no exige unicidad del RUT entre terceros', () => {
    const errors = validateEntity(
      tercero('cliente', { taxId: '12.345.678-5', code: 'OTRO' }),
      {
        config: financialConfig,
        existing: [
          {
            entity_id: 'otro',
            code: 'DISTINTO',
            taxId: '12.345.678-5',
          },
        ],
      }
    );
    expect(errors.some((error) => error.field === 'taxId')).toBe(false);
  });

  it('permite límite de crédito solo a clientes', () => {
    const ok = validateEntity(tercero('cliente', { creditLimit: 100 }), {
      config: financialConfig,
    });
    expect(ok.some((error) => error.code === 'CREDIT_LIMIT_NOT_ALLOWED')).toBe(
      false
    );

    for (const tipo of ['proveedor', 'personal']) {
      const errors = validateEntity(tercero(tipo, { creditLimit: 100 }), {
        config: financialConfig,
      });
      expect(
        errors.some((error) => error.code === 'CREDIT_LIMIT_NOT_ALLOWED')
      ).toBe(true);
    }
  });
});

describe('validación de documentos', () => {
  const entities = [{ entity_id: 'ent_1' }];

  it('valida folio y fechas obligatorias', () => {
    const errors = validateDocument(
      { entity_id: 'ent_1', folio: 0 },
      { config, entities }
    );
    const fields = errors.map((error) => error.field);
    expect(fields).toContain('folio');
    expect(fields).toContain('startDate');
    expect(fields).toContain('endDate');
  });

  it('detecta fecha final anterior a la inicial', () => {
    const errors = validateDocument(
      {
        entity_id: 'ent_1',
        folio: 1,
        startDate: '2026-02-01',
        endDate: '2026-01-01',
      },
      { config, entities }
    );
    expect(errors.some((error) => error.code === 'END_BEFORE_START')).toBe(
      true
    );
  });

  it('detecta descuento mayor que el subtotal', () => {
    const errors = validateDocument(
      {
        entity_id: 'ent_1',
        folio: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-02',
        subtotal: 10,
        discount: 20,
      },
      { config, entities }
    );
    expect(
      errors.some((error) => error.code === 'DISCOUNT_EXCEEDS_SUBTOTAL')
    ).toBe(true);
  });

  it('detecta entidad inexistente', () => {
    const errors = validateDocument(
      {
        entity_id: 'missing',
        folio: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      },
      { config, entities }
    );
    expect(errors.some((error) => error.code === 'MISSING_ENTITY_REF')).toBe(
      true
    );
  });
});
