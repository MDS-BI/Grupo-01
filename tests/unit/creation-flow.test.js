import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handlePayrollCreateSubmit } from '../../src/app.js';
import { initialPassword } from '../../src/auth.js';
import { userConfig } from '../../src/module-config.js';
import { ValidationFailure } from '../../src/storage.js';

const RUT = '11.111.111-1';
const NORMALIZED_RUT = '11111111-1';

const values = {
  entity_id: '',
  series: 'LIQ',
  folio: '1',
  startDate: '2026-10-01',
  endDate: '2026-10-31',
  totalAmount: '700000',
  status: 'Borrador',
  customFields: {
    tipoFactura: 'compra',
    centroCosto: 'Consumible',
    periodoLiquidacion: '2026-10',
  },
};

const extras = { rut: RUT, nombreCompleto: 'Ana Pérez Soto' };

function workerEntity(id = 'ent_nuevo') {
  return {
    entity_id: id,
    name: extras.nombreCompleto,
    code: 'RUT-11111111',
    taxId: NORMALIZED_RUT,
    customFields: { tipoTercero: 'personal', rut: NORMALIZED_RUT },
  };
}

function workerAccess(entityId = 'ent_nuevo', active = true) {
  return {
    accessId: NORMALIZED_RUT,
    role: 'trabajador',
    entityId,
    password: initialPassword(RUT),
    active,
    createdAt: '2026-11-24T12:00:00.000Z',
    updatedAt: '2026-11-24T12:00:00.000Z',
  };
}

function makeDeps(overrides = {}) {
  return {
    config: userConfig,
    entities: [],
    accessRecords: [],
    documents: [],
    addEntity: vi.fn(() => workerEntity()),
    createAccessRecord: vi.fn((record) => record),
    addDocument: vi.fn((document) => ({
      ...document,
      document_id: 'doc_nuevo',
    })),
    appendDevNotification: vi.fn((notification) => notification),
    ...overrides,
  };
}

describe('creation-flow: alta atómica de liquidaciones', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('crea tercero personal y acceso para un RUT nuevo', () => {
    const deps = makeDeps();

    const result = handlePayrollCreateSubmit(values, extras, deps);

    expect(deps.addEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Pérez Soto',
        taxId: NORMALIZED_RUT,
        customFields: expect.objectContaining({
          tipoTercero: 'personal',
          rut: NORMALIZED_RUT,
        }),
      }),
      userConfig
    );
    expect(deps.createAccessRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        accessId: NORMALIZED_RUT,
        role: 'trabajador',
        entityId: 'ent_nuevo',
        password: initialPassword(RUT),
      }),
      expect.objectContaining({ records: [] })
    );
    expect(deps.addDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_id: 'ent_nuevo',
        customFields: expect.objectContaining({ tipoFactura: 'compra' }),
      }),
      userConfig
    );
    expect(result.document.document_id).toBe('doc_nuevo');
  });

  it('reutiliza tercero y acceso de un RUT ya existente', () => {
    const deps = makeDeps({
      entities: [workerEntity('ent_existente')],
      accessRecords: [workerAccess('ent_existente')],
    });

    const result = handlePayrollCreateSubmit(values, extras, deps);

    expect(deps.addEntity).not.toHaveBeenCalled();
    expect(deps.createAccessRecord).not.toHaveBeenCalled();
    expect(deps.addDocument).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: 'ent_existente' }),
      userConfig
    );
    expect(result.reusedEntity).toBe(true);
    expect(result.reusedAccess).toBe(true);
  });

  it('rechaza un RUT con dígito verificador inválido sin persistir', () => {
    const deps = makeDeps();

    expect(() =>
      handlePayrollCreateSubmit(
        values,
        { ...extras, rut: '11.111.111-2' },
        deps
      )
    ).toThrow(ValidationFailure);
    expect(deps.addEntity).not.toHaveBeenCalled();
    expect(deps.createAccessRecord).not.toHaveBeenCalled();
    expect(deps.addDocument).not.toHaveBeenCalled();
  });

  it('rechaza campos obligatorios vacíos sin persistir', () => {
    const deps = makeDeps();

    expect(() =>
      handlePayrollCreateSubmit(
        values,
        { ...extras, nombreCompleto: '  ' },
        deps
      )
    ).toThrow(ValidationFailure);
    expect(deps.addEntity).not.toHaveBeenCalled();
    expect(deps.createAccessRecord).not.toHaveBeenCalled();
    expect(deps.addDocument).not.toHaveBeenCalled();
  });

  it('rechaza un RUT asociado a un tercero no personal y notifica la incidencia', () => {
    const deps = makeDeps({
      entities: [
        {
          entity_id: 'ent_cliente',
          name: 'Cliente del Sur',
          code: 'CLI-1',
          taxId: NORMALIZED_RUT,
          customFields: { tipoTercero: 'cliente', rut: NORMALIZED_RUT },
        },
      ],
    });

    expect(() => handlePayrollCreateSubmit(values, extras, deps)).toThrow(
      ValidationFailure
    );
    expect(deps.appendDevNotification).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'payroll-create' })
    );
    expect(deps.addEntity).not.toHaveBeenCalled();
    expect(deps.createAccessRecord).not.toHaveBeenCalled();
    expect(deps.addDocument).not.toHaveBeenCalled();
  });

  it('rechaza un acceso inactivo sin registros parciales y notifica la incidencia', () => {
    const deps = makeDeps({
      entities: [workerEntity('ent_existente')],
      accessRecords: [workerAccess('ent_existente', false)],
    });

    expect(() => handlePayrollCreateSubmit(values, extras, deps)).toThrow(
      ValidationFailure
    );
    expect(deps.appendDevNotification).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'payroll-create' })
    );
    expect(deps.addEntity).not.toHaveBeenCalled();
    expect(deps.createAccessRecord).not.toHaveBeenCalled();
    expect(deps.addDocument).not.toHaveBeenCalled();
  });
});
