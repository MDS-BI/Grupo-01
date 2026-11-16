import { beforeEach, describe, expect, it } from 'vitest';
import { initApp, appState } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addDocument, addEntity, updateDocument } from '../../src/storage.js';
import { saveSession } from '../../src/session.js';
import {
  createAccessRecord,
  loadAccessRecords,
} from '../../src/access-storage.js';
import { loadAppMarkup, setupAdminSession } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

function worker(taxId, code, name) {
  return addEntity(
    {
      name,
      code,
      taxId,
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
}

function settlement(entity, period, amount, folio) {
  const customFields = {
    tipoFactura: 'compra',
    centroCosto: 'Consumible',
    periodoLiquidacion: period,
  };
  const created = addDocument(
    {
      entity_id: entity.entity_id,
      folio,
      series: 'LIQ',
      startDate: `${period}-01`,
      endDate: `${period}-28`,
      totalAmount: amount,
      customFields,
    },
    userConfig
  );
  updateDocument(created.document_id, { status: 'Emitida' }, userConfig);
  return created;
}

describe('US4 - liquidaciones del administrador', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
    setupAdminSession();
  });

  it('lista todas las liquidaciones con trabajador, RUT, período, monto y estado', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    const bruno = worker('45000000-0', 'PE-002', 'Bruno Soto Vega');
    settlement(ana, '2026-10', 700000, 1);
    settlement(bruno, '2026-09', 620000, 2);

    initApp(userConfig);
    byId('nav-payroll-admin').click();

    const text = byId('payroll-admin-list').textContent;
    expect(text).toContain('Ana Pérez Soto');
    expect(text).toContain('22222222-2');
    expect(text).toContain('2026-10');
    expect(text).toContain('Emitida');
    expect(text).toContain('Bruno Soto Vega');
  });

  it('filtra por trabajador/RUT y por período', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    const bruno = worker('45000000-0', 'PE-002', 'Bruno Soto Vega');
    settlement(ana, '2026-10', 700000, 1);
    settlement(bruno, '2026-09', 620000, 2);
    initApp(userConfig);
    byId('nav-payroll-admin').click();

    byId('payroll-filter-worker').value = 'Bruno';
    byId('payroll-filter-worker').dispatchEvent(new Event('input'));
    expect(byId('payroll-admin-list').textContent).toContain('Bruno Soto Vega');
    expect(byId('payroll-admin-list').textContent).not.toContain(
      'Ana Pérez Soto'
    );

    byId('payroll-filter-worker').value = '';
    byId('payroll-filter-period').value = '2026-10';
    byId('payroll-filter-period').dispatchEvent(new Event('input'));
    expect(byId('payroll-admin-list').textContent).toContain('Ana Pérez Soto');
    expect(byId('payroll-admin-list').textContent).not.toContain(
      'Bruno Soto Vega'
    );
  });

  it('edita una liquidación y rechaza un período inválido', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    settlement(ana, '2026-10', 700000, 1);
    initApp(userConfig);
    byId('nav-payroll-admin').click();

    byId('payroll-admin-list').querySelector('[data-action="edit"]').click();
    const periodInput = byId('payroll-field-periodoLiquidacion');
    expect(periodInput.value).toBe('2026-10');

    periodInput.value = '2026-13';
    periodInput.dispatchEvent(new Event('input'));
    byId('payroll-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    expect(byId('payroll-form-errors').textContent).toContain('AAAA-MM');
  });

  it('asocia un acceso de trabajador cuando el RUT coincide', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    settlement(ana, '2026-10', 700000, 1);
    initApp(userConfig);
    byId('nav-payroll-admin').click();

    const text = byId('payroll-admin-list').textContent;
    expect(text).toContain('no tiene un acceso de trabajador activo');

    byId('payroll-admin-list')
      .querySelector('[data-action="associate"]')
      .click();

    const access = loadAccessRecords().find(
      (item) => item.entityId === ana.entity_id
    );
    expect(access).toMatchObject({
      accessId: '22222222-2',
      role: 'trabajador',
      password: '2222',
    });
  });

  it('el cambio del administrador se refleja en la vista del trabajador', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    const liquidacion = settlement(ana, '2026-10', 700000, 1);
    createWorkerAccess(ana);
    saveSession({
      accessId: '22222222-2',
      role: 'trabajador',
      entityId: ana.entity_id,
      startedAt: new Date().toISOString(),
    });
    initApp(userConfig);
    expect(byId('payroll-worker-amount').textContent).toContain('700');

    updateDocument(
      liquidacion.document_id,
      { totalAmount: 750000 },
      userConfig
    );
    byId('nav-payroll-worker').click();
    expect(byId('payroll-worker-amount').textContent).toContain('750');
  });
});

function createWorkerAccess(entity) {
  createAccessRecord(
    {
      accessId: '22222222-2',
      role: 'trabajador',
      entityId: entity.entity_id,
      password: '2222',
    },
    { entities: [entity], records: loadAccessRecords() }
  );
}
