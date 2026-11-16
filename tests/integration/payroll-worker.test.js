import { beforeEach, describe, expect, it } from 'vitest';
import { initApp, appState } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import {
  addEntity,
  addDocument as storageAddDocument,
  updateDocument,
} from '../../src/storage.js';
import {
  createAccessRecord,
  loadDevNotifications,
} from '../../src/access-storage.js';
import { saveSession } from '../../src/session.js';
import { loadAppMarkup } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

function worker(accessId, code, name) {
  return addEntity(
    {
      name,
      code,
      taxId: accessId,
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
}

function settlement(
  entity,
  { period, amount, status = 'Pagada', folio = 1 } = {}
) {
  return {
    entity_id: entity.entity_id,
    folio,
    series: 'LIQ',
    startDate: `${period}-01`,
    endDate: `${period}-28`,
    totalAmount: amount,
    status,
    customFields: {
      tipoFactura: 'compra',
      centroCosto: 'Consumible',
      periodoLiquidacion: period,
      ...(status === 'Pagada'
        ? { montoPagado: amount, fechaPago: `${period}-15` }
        : {}),
    },
  };
}

function signIn(entity, accessId) {
  const access = createAccessRecord(
    {
      accessId,
      role: 'trabajador',
      entityId: entity.entity_id,
      password: accessId.slice(0, 4),
    },
    { entities: [entity], records: [] }
  );
  saveSession({
    accessId: access.accessId,
    role: 'trabajador',
    entityId: entity.entity_id,
    startedAt: new Date().toISOString(),
  });
}

function addSettlement(record) {
  const { status, customFields, ...input } = record;
  const created = storageAddDocument(
    { ...input, status: 'Borrador', customFields },
    userConfig
  );
  if (status === 'Emitida' || status === 'Pagada') {
    updateDocument(created.document_id, { status: 'Emitida' }, userConfig);
  }
  if (status === 'Pagada') {
    updateDocument(
      created.document_id,
      { status: 'Pagada', customFields },
      userConfig
    );
  }
  return created;
}

describe('US3 - mi liquidación del trabajador', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
  });

  it('muestra únicamente la liquidación vigente del trabajador', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    addSettlement(
      settlement(ana, { period: '2026-09', amount: 500000, folio: 1 })
    );
    addSettlement(
      settlement(ana, { period: '2026-10', amount: 700000, folio: 2 })
    );
    signIn(ana, '22222222-2');

    initApp(userConfig);

    expect(byId('view-payroll-worker').hidden).toBe(false);
    expect(byId('payroll-worker-period').textContent).toBe('2026-10');
    expect(byId('payroll-worker-name').textContent).toBe('Ana Pérez Soto');
    expect(byId('payroll-worker-amount').textContent).toContain('700');
    expect(byId('payroll-worker-paid-at').textContent).toContain('2026-10-15');
    expect(byId('payroll-worker-empty').hidden).toBe(true);
  });

  it('muestra el estado vacío sin liquidación', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    signIn(ana, '22222222-2');

    initApp(userConfig);

    expect(byId('payroll-worker-card').hidden).toBe(true);
    expect(byId('payroll-worker-empty').hidden).toBe(false);
  });

  it('no ofrece acciones de edición, eliminación ni creación', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    addSettlement(settlement(ana, { period: '2026-10', amount: 700000 }));
    signIn(ana, '22222222-2');

    initApp(userConfig);

    const html = byId('view-payroll-worker').innerHTML;
    expect(html).not.toMatch(/data-action="(edit|delete)"/);
    expect(html).not.toContain('Editar');
  });

  it('aísla a dos trabajadores y bloquea las vistas administrativas', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    const bruno = worker('45000000-0', 'PE-002', 'Bruno Soto Vega');
    addSettlement(settlement(ana, { period: '2026-10', amount: 700000 }));
    addSettlement(
      settlement(bruno, { period: '2026-09', amount: 620000, folio: 2 })
    );
    signIn(ana, '22222222-2');

    initApp(userConfig);
    expect(byId('payroll-worker-amount').textContent).toContain('700');
    expect(byId('payroll-worker-amount').textContent).not.toContain('620');

    byId('nav-invoice-sale').click();
    expect(byId('view-payroll-worker').hidden).toBe(false);
    expect(byId('view-invoice-sale').hidden).toBe(true);
  });

  it('cierra la sesión y notifica cuando el vínculo del trabajador está roto', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    signIn(ana, '22222222-2');
    initApp(userConfig);

    localStorage.removeItem('erp.entities');
    byId('nav-payroll-worker').click();

    expect(byId('view-login').hidden).toBe(false);
    expect(byId('login-error').textContent).toContain(
      'trabajador asociado válido'
    );
    expect(
      loadDevNotifications().some(
        (note) => note.reason === 'BROKEN_ENTITY_LINK'
      )
    ).toBe(true);
  });
});
