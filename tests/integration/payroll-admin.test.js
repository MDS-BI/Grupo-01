import { beforeEach, describe, expect, it } from 'vitest';
import { initApp, appState } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { renderPayrollList } from '../../src/components/payroll-list.js';
import {
  addDocument,
  addEntity,
  loadPayrollSettlements,
  savePayrollSettlements,
  updateDocument,
} from '../../src/storage.js';
import { saveSession } from '../../src/session.js';
import {
  createAccessRecord,
  loadAccessRecords,
  saveAccessRecords,
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

function addSettlement(entity, period, amount, folio, status = 'Emitida') {
  const created = addDocument(
    {
      entity_id: entity.entity_id,
      folio,
      series: 'LIQ',
      startDate: `${period}-01`,
      endDate: `${period}-28`,
      totalAmount: amount,
      customFields: {
        tipoFactura: 'compra',
        centroCosto: 'Consumible',
        periodoLiquidacion: period,
      },
    },
    userConfig
  );
  if (status === 'Emitida' || status === 'Pagada') {
    updateDocument(created.document_id, { status: 'Emitida' }, userConfig);
  }
  if (status === 'Pagada') {
    updateDocument(
      created.document_id,
      {
        status: 'Pagada',
        customFields: {
          ...created.customFields,
          montoPagado: amount,
          fechaPago: `${period}-15`,
        },
      },
      userConfig
    );
  }
  const record = {
    settlementId: `set_${folio}`,
    documentId: created.document_id,
    entityId: entity.entity_id,
    periodo: period,
    sueldoBase: Math.round(amount * 0.7),
    descuentos: Math.round(amount * 0.03),
    bonos: Math.round(amount * 0.3),
    monto: amount,
    estado: status,
    fechaPago: status === 'Pagada' ? `${period}-15` : null,
  };
  savePayrollSettlements([record]);
  return record;
}

function setupFinanceSession() {
  const now = new Date().toISOString();
  saveAccessRecords([
    {
      accessId: '55555555-5',
      role: 'finanzas',
      entityId: null,
      password: '5555',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  saveSession({
    accessId: '55555555-5',
    role: 'finanzas',
    entityId: null,
    startedAt: now,
  });
}

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

describe('US4/US7 - liquidaciones del administrador y de finanzas', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
  });

  for (const role of ['administrador', 'finanzas']) {
    describe(`sesión de ${role}`, () => {
      beforeEach(() => {
        if (role === 'administrador') setupAdminSession();
        else setupFinanceSession();
      });

      it('lista liquidaciones con trabajador, RUT, período legible, monto, estado y factura de compra', () => {
        const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
        const bruno = worker('45000000-0', 'PE-002', 'Bruno Soto Vega');
        addSettlement(ana, '2026-10', 700000, 1);
        addSettlement(bruno, '2026-09', 620000, 2);

        initApp(userConfig);
        byId('nav-payroll-admin').click();

        const table = byId('payroll-admin-list');
        expect(table.textContent).toContain('Ana Pérez Soto');
        expect(table.textContent).toContain('22222222-2');
        expect(table.textContent).toContain('octubre 2026');
        expect(table.textContent).toContain('Emitida');
        expect(table.textContent).toContain('Compra LIQ-1');
        expect(table.textContent).not.toMatch(/doc_[0-9a-f-]{8}/);
        expect(table.textContent).toContain('Bruno Soto Vega');
      });

      it('filtra por trabajador/RUT y por período', () => {
        const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
        const bruno = worker('45000000-0', 'PE-002', 'Bruno Soto Vega');
        addSettlement(ana, '2026-10', 700000, 1);
        addSettlement(bruno, '2026-09', 620000, 2);
        initApp(userConfig);
        byId('nav-payroll-admin').click();

        byId('payroll-filter-worker').value = 'Bruno';
        byId('payroll-filter-worker').dispatchEvent(new Event('input'));
        expect(byId('payroll-admin-list').textContent).toContain(
          'Bruno Soto Vega'
        );
        expect(byId('payroll-admin-list').textContent).not.toContain(
          'Ana Pérez Soto'
        );

        byId('payroll-filter-worker').value = '';
        byId('payroll-filter-period').value = '2026-10';
        byId('payroll-filter-period').dispatchEvent(new Event('input'));
        expect(byId('payroll-admin-list').textContent).toContain(
          'Ana Pérez Soto'
        );
        expect(byId('payroll-admin-list').textContent).not.toContain(
          'Bruno Soto Vega'
        );
      });

      it('filtra en vivo por RUT sin botón y conserva el texto sin resultados', () => {
        const ana = worker('22.222.222-2', 'PE-001', 'Ana Pérez Soto');
        const bruno = worker('45.000.000-0', 'PE-002', 'Bruno Soto Vega');
        addSettlement(ana, '2026-10', 700000, 1);
        addSettlement(bruno, '2026-09', 620000, 2);
        initApp(userConfig);
        byId('nav-payroll-admin').click();

        const filter = byId('payroll-filter-rut');
        expect(filter).not.toBeNull();
        expect(filter?.parentElement?.textContent).toContain('Buscar por RUT');

        filter.value = '45.000';
        filter.dispatchEvent(new Event('input'));
        expect(byId('payroll-admin-list').textContent).toContain(
          'Bruno Soto Vega'
        );
        expect(byId('payroll-admin-list').textContent).not.toContain(
          'Ana Pérez Soto'
        );

        filter.value = '99.999';
        filter.dispatchEvent(new Event('input'));
        expect(byId('payroll-admin-list').textContent).not.toContain(
          'Bruno Soto Vega'
        );
        expect(byId('payroll-admin-empty').hidden).toBe(false);
        expect(byId('payroll-admin-empty').textContent).toContain('99.999');

        filter.value = '';
        filter.dispatchEvent(new Event('input'));
        expect(byId('payroll-admin-empty').hidden).toBe(true);
        expect(byId('payroll-admin-list').textContent).toContain(
          'Ana Pérez Soto'
        );
        expect(byId('payroll-admin-list').textContent).toContain(
          'Bruno Soto Vega'
        );

        if (role === 'finanzas') {
          expect(
            byId('payroll-admin-list').querySelector('[data-action="edit"]')
          ).toBeNull();
          return;
        }

        const editedId =
          byId('payroll-admin-list').querySelector('tbody tr')?.dataset.id;
        byId('payroll-admin-list')
          .querySelector('[data-action="edit"]')
          .click();
        byId('payroll-field-sueldoBase').value = '510000';
        byId('payroll-field-sueldoBase').dispatchEvent(new Event('input'));
        byId('payroll-form').dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
        expect(
          loadPayrollSettlements().find(
            (item) => item.settlementId === editedId
          ).sueldoBase
        ).toBe(510000);
      });

      it('edita el desglose (admin) o lo oculta (finanzas) y valida el período', () => {
        const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
        addSettlement(ana, '2026-10', 700000, 1);
        initApp(userConfig);
        byId('nav-payroll-admin').click();

        if (role === 'finanzas') {
          expect(
            byId('payroll-admin-list').querySelector('[data-action="edit"]')
          ).toBeNull();
          return;
        }

        byId('payroll-admin-list')
          .querySelector('[data-action="edit"]')
          .click();
        expect(byId('payroll-field-periodoLiquidacion').value).toBe('2026-10');
        expect(byId('payroll-field-sueldoBase').value).toBe('490000');

        byId('payroll-field-sueldoBase').value = '510000';
        byId('payroll-field-sueldoBase').dispatchEvent(new Event('input'));
        byId('payroll-form').dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
        expect(
          loadPayrollSettlements().find((item) => item.settlementId === 'set_1')
            .sueldoBase
        ).toBe(510000);

        const periodInput = byId('payroll-field-periodoLiquidacion');
        periodInput.value = '2026-13';
        periodInput.dispatchEvent(new Event('input'));
        byId('payroll-form').dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
        expect(byId('payroll-form-errors').textContent).toContain('AAAA-MM');
      });

      it('sincroniza el espejo al editar la factura de compra vinculada', () => {
        const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
        const record = addSettlement(ana, '2026-10', 700000, 1, 'Borrador');
        initApp(userConfig);
        byId('nav-invoice-purchase').click();

        const select = byId('invoice-purchase-edit');
        select.value = record.documentId;
        select.dispatchEvent(new Event('change'));
        byId('view-invoice-purchase')
          .querySelector('[data-load-invoice]')
          .click();
        if (role === 'finanzas') {
          const row = byId('invoice-purchase-list').querySelector(
            `tr[data-id="${record.documentId}"]`
          );
          expect(row.querySelector('[data-action="edit"]')).toBeNull();
          expect(row.textContent.toLowerCase()).toContain('solo lectura');
          expect(
            byId('view-invoice-purchase').querySelector(
              '[data-invoice-feedback]'
            ).textContent
          ).toContain('solo lectura para finanzas');
          expect(
            loadPayrollSettlements().find(
              (item) => item.settlementId === record.settlementId
            ).monto
          ).toBe(700000);
          return;
        }
        const amountInput = byId('invoice-purchase-form').querySelector(
          '[name="totalAmount"]'
        );
        amountInput.value = '750000';
        amountInput.dispatchEvent(new Event('input'));
        const statusInput = byId('invoice-purchase-form').querySelector(
          '[data-field="status"]'
        );
        statusInput.value = 'Emitida';
        statusInput.dispatchEvent(new Event('change'));
        byId('invoice-purchase-form').dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );

        const updated = loadPayrollSettlements().find(
          (item) => item.settlementId === record.settlementId
        );
        expect(updated.monto).toBe(750000);
        expect(updated.estado).toBe('Emitida');
        expect(updated.fechaPago).toBeNull();
      });
    });
  }

  describe('asociación de un acceso por RUT', () => {
    it('el administrador asocia un acceso de trabajador usando entityId de la liquidación', () => {
      setupAdminSession();
      const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
      addSettlement(ana, '2026-10', 700000, 1);
      initApp(userConfig);
      byId('nav-payroll-admin').click();

      expect(byId('payroll-admin-list').textContent).toContain(
        'no tiene un acceso de trabajador activo'
      );
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

    it('finanzas ve liquidaciones en solo lectura y no puede asociar un acceso por RUT', () => {
      const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
      addSettlement(ana, '2026-10', 700000, 1);
      setupFinanceSession();
      initApp(userConfig);
      byId('nav-payroll-admin').click();

      const list = byId('payroll-admin-list');
      expect(list.textContent).toContain('Ana Pérez Soto');
      expect(list.querySelector('[data-action="associate"]')).toBeNull();
      expect(
        loadAccessRecords().some((item) => item.entityId === ana.entity_id)
      ).toBe(false);

      expect(list.querySelector('[data-action="edit"]')).toBeNull();
      expect(
        loadPayrollSettlements().find((item) => item.entityId === ana.entity_id)
          .periodo
      ).toBe('2026-10');
    });
  });

  it('el cambio del administrador se refleja en la vista del trabajador', () => {
    setupAdminSession();
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    const liquidacion = addSettlement(ana, '2026-10', 700000, 1, 'Borrador');
    createWorkerAccess(ana);
    initApp(userConfig);
    byId('nav-invoice-purchase').click();

    const select = byId('invoice-purchase-edit');
    select.value = liquidacion.documentId;
    select.dispatchEvent(new Event('change'));
    byId('view-invoice-purchase').querySelector('[data-load-invoice]').click();
    const form = byId('invoice-purchase-form');
    const amountInput = form.querySelector('[name="totalAmount"]');
    amountInput.value = '750000';
    amountInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    saveSession({
      accessId: '22222222-2',
      role: 'trabajador',
      entityId: ana.entity_id,
      startedAt: new Date().toISOString(),
    });
    initApp(userConfig);
    expect(byId('payroll-worker-amount').textContent).toContain('750');
  });
});

describe('renderPayrollList - bandera canEdit', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('oculta Editar con canEdit false y lo muestra por defecto', () => {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    const settlement = {
      settlementId: 'set_readonly',
      documentId: 'doc_readonly',
      entityId: ana.entity_id,
      periodo: '2026-10',
      monto: 700000,
      estado: 'Emitida',
      fechaPago: null,
    };
    const host = byId('payroll-admin-list');

    renderPayrollList(host, {
      settlements: [settlement],
      entities: [ana],
      records: [],
      canEdit: false,
      canAssociate: false,
    });
    expect(host.querySelector('[data-action="edit"]')).toBeNull();

    renderPayrollList(host, {
      settlements: [settlement],
      entities: [ana],
      records: [],
      canAssociate: false,
    });
    expect(host.querySelector('[data-action="edit"]')).not.toBeNull();
  });
});

describe('HU7 (spec 004) - formulario de edición de liquidaciones', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    setupAdminSession();
  });

  function openEditor() {
    const ana = worker('22222222-2', 'PE-001', 'Ana Pérez Soto');
    addSettlement(ana, '2026-10', 700000, 1);
    initApp(userConfig);
    byId('nav-payroll-admin').click();
  }

  it('el formulario solo aparece al pulsar Editar y se cierra con Cancelar', () => {
    openEditor();
    expect(byId('payroll-form').hidden).toBe(true);

    byId('payroll-admin-list').querySelector('[data-action="edit"]').click();
    expect(byId('payroll-form').hidden).toBe(false);
    expect(byId('payroll-form-subtitle').textContent).toContain(
      'Ana Pérez Soto'
    );

    byId('payroll-form-cancel').click();
    expect(byId('payroll-form').hidden).toBe(true);
  });

  it('muestra solo los campos de la liquidación y el estado como lista', () => {
    openEditor();
    byId('payroll-admin-list').querySelector('[data-action="edit"]').click();

    expect(byId('payroll-field-status').tagName).toBe('SELECT');
    expect(byId('payroll-field-status').value).toBe('Emitida');
    for (const removed of [
      'payroll-field-startDate',
      'payroll-field-endDate',
      'payroll-field-centroCosto',
      'payroll-field-montoPagado',
    ]) {
      expect(byId(removed)).toBeNull();
    }
    expect(byId('payroll-field-fechaPago-wrapper').hidden).toBe(true);
  });

  it('calcula el monto líquido desde el desglose y lo guarda', () => {
    openEditor();
    byId('payroll-admin-list').querySelector('[data-action="edit"]').click();

    for (const [field, value] of [
      ['sueldoBase', '500000'],
      ['bonos', '220000'],
      ['descuentos', '20000'],
    ]) {
      byId(`payroll-field-${field}`).value = value;
      byId(`payroll-field-${field}`).dispatchEvent(new Event('input'));
    }
    expect(byId('payroll-field-totalAmount').textContent).toBe('$700.000');

    byId('payroll-field-bonos').value = '250000';
    byId('payroll-field-bonos').dispatchEvent(new Event('input'));
    expect(byId('payroll-field-totalAmount').textContent).toBe('$730.000');

    byId('payroll-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    const saved = loadPayrollSettlements().find(
      (item) => item.settlementId === 'set_1'
    );
    expect(saved.monto).toBe(730000);
    expect(saved.bonos).toBe(250000);
  });

  it('al marcar Pagada pide la fecha de pago y registra el monto pagado', () => {
    openEditor();
    byId('payroll-admin-list').querySelector('[data-action="edit"]').click();

    const status = byId('payroll-field-status');
    status.value = 'Pagada';
    status.dispatchEvent(new Event('change'));
    expect(byId('payroll-field-fechaPago-wrapper').hidden).toBe(false);

    byId('payroll-field-fechaPago').value = '2026-10-30';
    byId('payroll-field-fechaPago').dispatchEvent(new Event('input'));
    byId('payroll-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    const saved = loadPayrollSettlements().find(
      (item) => item.settlementId === 'set_1'
    );
    expect(saved.estado).toBe('Pagada');
    expect(saved.fechaPago).toBe('2026-10-30');
    expect(byId('payroll-admin-list').textContent).toContain('30-10-2026');
  });
});
