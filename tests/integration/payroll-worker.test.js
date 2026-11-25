import { beforeEach, describe, expect, it } from 'vitest';
import { initApp, appState } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addEntity, savePayrollSettlements } from '../../src/storage.js';
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
  {
    id = 'set_1',
    documentId = 'doc_1',
    period = '2026-10',
    amount = 700000,
    status = 'Pagada',
    fechaPago = `${period}-15`,
    sueldoBase = 500000,
    descuentos = 20000,
    bonos = 220000,
  } = {}
) {
  return {
    settlementId: id,
    documentId,
    entityId: entity.entity_id,
    periodo: period,
    sueldoBase,
    descuentos,
    bonos,
    monto: amount,
    estado: status,
    fechaPago,
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

describe('US3 - mi liquidación del trabajador', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
  });

  it('muestra el desglose de la última liquidación del trabajador', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    savePayrollSettlements([
      settlement(ana, {
        id: 'set_sep',
        documentId: 'doc_sep',
        period: '2026-09',
        amount: 500000,
        sueldoBase: 400000,
        descuentos: 10000,
        bonos: 110000,
      }),
      settlement(ana, {
        id: 'set_oct',
        documentId: 'doc_oct',
        period: '2026-10',
        amount: 700000,
        sueldoBase: 500000,
        descuentos: 20000,
        bonos: 220000,
      }),
    ]);
    signIn(ana, '22222222-2');

    initApp(userConfig);

    expect(byId('view-payroll-worker').hidden).toBe(false);
    expect(byId('payroll-worker-period').textContent).toBe('octubre 2026');
    expect(byId('payroll-worker-name').textContent).toBe('Ana Pérez Soto');
    expect(byId('payroll-worker-base-salary').textContent).toContain('500');
    expect(byId('payroll-worker-discounts').textContent).toContain('20');
    expect(byId('payroll-worker-bonuses').textContent).toContain('220');
    expect(byId('payroll-worker-amount').textContent).toContain('700');
    expect(byId('payroll-worker-paid-at').textContent).toContain('2026-10-15');
    expect(byId('payroll-worker-empty').hidden).toBe(true);
  });

  it('muestra solo pagos pagados con fecha, ordenados de más reciente a más antiguo', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    savePayrollSettlements([
      settlement(ana, {
        id: 'set_old',
        documentId: 'doc_old',
        period: '2026-08',
        fechaPago: '2026-08-15',
      }),
      settlement(ana, {
        id: 'set_new',
        documentId: 'doc_new',
        period: '2026-11',
        fechaPago: '2026-11-15',
      }),
      settlement(ana, {
        id: 'set_same_day',
        documentId: 'doc_same_day',
        period: '2026-12',
        fechaPago: '2026-11-15',
      }),
      settlement(ana, {
        id: 'set_draft',
        documentId: 'doc_draft',
        period: '2026-09',
        status: 'Borrador',
        fechaPago: null,
      }),
      settlement(ana, {
        id: 'set_emitted',
        documentId: 'doc_emitted',
        period: '2026-10',
        status: 'Emitida',
        fechaPago: '2026-10-15',
      }),
    ]);
    signIn(ana, '22222222-2');

    initApp(userConfig);

    const rows = [...byId('payroll-worker-history').querySelectorAll('tr')];
    expect(rows.map((row) => row.cells[1].textContent)).toEqual([
      'diciembre 2026',
      'noviembre 2026',
      'agosto 2026',
    ]);
    expect(byId('payroll-worker-history-empty').hidden).toBe(true);
    expect(byId('payroll-worker-history-table').hidden).toBe(false);
    expect(byId('payroll-worker-history').textContent).not.toContain(
      'Sueldo base'
    );
  });

  it('muestra estados vacíos sin liquidación ni pagos', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    signIn(ana, '22222222-2');

    initApp(userConfig);

    expect(byId('payroll-worker-card').hidden).toBe(true);
    expect(byId('payroll-worker-empty').hidden).toBe(false);
    expect(byId('payroll-worker-history-table').hidden).toBe(true);
    expect(byId('payroll-worker-history-empty').hidden).toBe(false);
  });

  it('no ofrece acciones de edición, eliminación ni creación', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    savePayrollSettlements([settlement(ana)]);
    signIn(ana, '22222222-2');

    initApp(userConfig);

    const html = byId('view-payroll-worker').innerHTML;
    expect(html).not.toMatch(/data-action="(edit|delete)"/);
    expect(html).not.toContain('Editar');
  });

  it('aísla a dos trabajadores y bloquea las vistas administrativas', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    const bruno = worker('45000000-0', 'PE-002', 'Bruno Soto Vega');
    savePayrollSettlements([
      settlement(ana, {
        id: 'set_ana',
        documentId: 'doc_ana',
        amount: 700000,
      }),
      settlement(bruno, {
        id: 'set_bruno',
        documentId: 'doc_bruno',
        amount: 620000,
        period: '2026-09',
      }),
    ]);
    signIn(ana, '22222222-2');

    initApp(userConfig);

    expect(byId('payroll-worker-amount').textContent).toContain('700');
    expect(byId('payroll-worker-amount').textContent).not.toContain('620');
    expect(byId('payroll-worker-history').textContent).not.toContain('620');

    byId('nav-invoice-sale').click();
    expect(byId('view-payroll-worker').hidden).toBe(false);
    expect(byId('view-invoice-sale').hidden).toBe(true);
  });

  it('muestra como vigente una liquidación en Borrador o Emitida', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    savePayrollSettlements([
      settlement(ana, {
        id: 'set_draft',
        documentId: 'doc_draft',
        period: '2026-11',
        status: 'Borrador',
        fechaPago: null,
        amount: 800000,
      }),
    ]);
    signIn(ana, '22222222-2');

    initApp(userConfig);

    expect(byId('payroll-worker-period').textContent).toBe('noviembre 2026');
    expect(byId('payroll-worker-status').textContent).toContain('Borrador');
    expect(byId('payroll-worker-paid-at').textContent).toContain('Sin pago');
    expect(byId('payroll-worker-history-empty').hidden).toBe(false);
  });

  it('excluye pagos parciales del historial', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    savePayrollSettlements([
      settlement(ana, {
        id: 'set_partial',
        documentId: 'doc_partial',
        status: 'Emitida',
        fechaPago: '2026-10-15',
      }),
      settlement(ana, {
        id: 'set_paid',
        documentId: 'doc_paid',
        period: '2026-09',
        fechaPago: '2026-09-15',
      }),
    ]);
    signIn(ana, '22222222-2');

    initApp(userConfig);

    expect(byId('payroll-worker-history').querySelectorAll('tr')).toHaveLength(
      1
    );
    expect(byId('payroll-worker-history').textContent).toContain(
      'septiembre 2026'
    );
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
  it('destaca el monto líquido con $ y muestra el período legible (HU6)', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    savePayrollSettlements([
      settlement(ana, {
        period: '2026-10',
        amount: 700000,
        sueldoBase: 500000,
        descuentos: 20000,
        bonos: 220000,
      }),
    ]);
    signIn(ana, '22222222-2');
    initApp(userConfig);

    expect(byId('payroll-worker-amount').textContent).toBe('$700.000');
    expect(
      byId('payroll-worker-amount').classList.contains('worker-amount')
    ).toBe(true);
    expect(byId('payroll-worker-period').textContent).toBe('octubre 2026');
    expect(byId('payroll-worker-greeting').textContent).toBe('Hola, Ana');
    expect(byId('payroll-worker-breakdown').hidden).toBe(false);
    expect(byId('payroll-worker-base-salary').textContent).toContain(
      '$500.000'
    );
    expect(byId('payroll-worker-history').textContent).toContain('$');
    expect(byId('payroll-worker-history').textContent).not.toMatch(
      /\d{4}-\d{2}(?!-)/
    );
  });

  it('oculta la tabla de desglose cuando no tiene valores (HU6)', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    savePayrollSettlements([
      settlement(ana, {
        amount: 400000,
        sueldoBase: 0,
        descuentos: 0,
        bonos: 0,
      }),
    ]);
    signIn(ana, '22222222-2');
    initApp(userConfig);

    expect(byId('payroll-worker-breakdown').hidden).toBe(true);
    expect(byId('payroll-worker-amount').textContent).toBe('$400.000');
  });

  it('muestra el banner de la guía al trabajador y su descarte se mantiene en la sesión (HU5)', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    savePayrollSettlements([settlement(ana)]);
    signIn(ana, '22222222-2');
    initApp(userConfig);

    expect(byId('guide-banner-worker').hidden).toBe(false);
    byId('guide-dismiss-worker').click();
    expect(byId('guide-banner-worker').hidden).toBe(true);

    initApp(userConfig);
    expect(byId('guide-banner-worker').hidden).toBe(true);
  });
});
