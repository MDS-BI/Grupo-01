import { beforeEach, describe, expect, it } from 'vitest';
import { initApp, registerPayrollPayment } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  loadPayrollSettlements,
  loadPurchaseInvoices,
  savePayrollSettlements,
  updateDocument,
  ValidationFailure,
} from '../../src/storage.js';
import {
  loadAppMarkup,
  setupFinanzasSession,
  submit,
} from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);
const PAYMENT_DATE = '2026-11-24';
const RUTS = ['22.222.222-2', '45.000.000-0', '12.345.678-5', '76.123.456-0'];

function makeSettlement({ folio, status, amount = 700000 }, index) {
  const worker = addEntity(
    {
      name: `Trabajador ${folio}`,
      code: `PE-${folio}`,
      taxId: RUTS[index],
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
  const created = addDocument(
    {
      entity_id: worker.entity_id,
      folio,
      series: 'LIQ',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      totalAmount: amount,
      customFields: {
        tipoFactura: 'compra',
        centroCosto: 'Consumible',
        periodoLiquidacion: '2026-11',
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
          fechaPago: '2026-11-10',
        },
      },
      userConfig
    );
  }
  const record = {
    settlementId: `set_${folio}`,
    documentId: created.document_id,
    entityId: worker.entity_id,
    periodo: '2026-11',
    sueldoBase: Math.round(amount * 0.7),
    descuentos: 10000,
    bonos: Math.round(amount * 0.3),
    monto: amount,
    estado: status,
    fechaPago: status === 'Pagada' ? '2026-11-10' : null,
  };
  return { document: created, record };
}

function seedSettlements(specs) {
  const entries = specs.map((spec, index) => makeSettlement(spec, index));
  savePayrollSettlements(entries.map(({ record }) => record));
  return entries;
}

function findDocument(documentId) {
  return loadPurchaseInvoices().find((item) => item.document_id === documentId);
}

function findSettlement(settlementId) {
  return loadPayrollSettlements().find(
    (item) => item.settlementId === settlementId
  );
}

describe('finanzas - registro de pago de liquidaciones', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
  });

  it('ofrece solo Registrar pago y guarda el pago de una liquidación Emitida', () => {
    const [{ document: beforeDocument, record: beforeSettlement }] =
      seedSettlements([{ folio: 11, status: 'Emitida' }]);
    setupFinanzasSession();
    initApp(userConfig);

    byId('nav-payroll-admin').click();
    const row = byId('payroll-admin-list').querySelector(
      `tr[data-document-id="${beforeDocument.document_id}"]`
    );
    expect(row).not.toBeNull();
    const actions = Array.from(
      row.querySelectorAll('button[data-action]'),
      (button) => button.dataset.action
    );
    expect(actions).toEqual(['register-payment']);
    expect(actions).not.toContain('edit');
    expect(actions).not.toContain('associate');

    row.querySelector('[data-action="register-payment"]').click();
    expect(byId('payroll-payment-form').hidden).toBe(false);
    byId('payroll-payment-fechaPago').value = PAYMENT_DATE;
    submit('payroll-payment-form');

    const afterDocument = findDocument(beforeDocument.document_id);
    const afterSettlement = findSettlement(beforeSettlement.settlementId);
    expect(afterDocument.status).toBe('Pagada');
    expect(afterDocument.customFields.montoPagado).toBe(
      afterDocument.totalAmount
    );
    expect(afterDocument.customFields.fechaPago).toBe(PAYMENT_DATE);
    expect(afterSettlement).toMatchObject({
      estado: 'Pagada',
      fechaPago: PAYMENT_DATE,
    });
    expect(afterDocument.totalAmount).toBe(beforeDocument.totalAmount);
    expect(afterDocument.customFields.periodoLiquidacion).toBe(
      beforeDocument.customFields.periodoLiquidacion
    );
    expect(afterSettlement).toMatchObject({
      sueldoBase: beforeSettlement.sueldoBase,
      descuentos: beforeSettlement.descuentos,
      bonos: beforeSettlement.bonos,
      periodo: beforeSettlement.periodo,
      entityId: beforeSettlement.entityId,
      documentId: beforeSettlement.documentId,
      monto: beforeSettlement.monto,
    });
  });

  it('rechaza pagos en estados distintos de Emitida y con monto distinto del total', () => {
    const [draft, paid, emitted] = seedSettlements([
      { folio: 21, status: 'Borrador' },
      { folio: 22, status: 'Pagada' },
      { folio: 23, status: 'Emitida' },
    ]);
    setupFinanzasSession();
    initApp(userConfig);

    byId('nav-payroll-admin').click();
    const rows = byId('payroll-admin-list').querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    for (const item of [draft, paid]) {
      const row = byId('payroll-admin-list').querySelector(
        `tr[data-document-id="${item.record.documentId}"]`
      );
      expect(row.querySelector('[data-action="register-payment"]')).toBeNull();
    }
    expect(
      byId('payroll-admin-list')
        .querySelector(`tr[data-document-id="${emitted.record.documentId}"]`)
        .querySelector('[data-action="register-payment"]')
    ).not.toBeNull();

    const documentsBefore = loadPurchaseInvoices();
    const settlementsBefore = loadPayrollSettlements();
    expect(() =>
      registerPayrollPayment(draft.record.documentId, {
        fechaPago: PAYMENT_DATE,
      })
    ).toThrow(ValidationFailure);
    expect(() =>
      registerPayrollPayment(paid.record.documentId, {
        fechaPago: PAYMENT_DATE,
      })
    ).toThrow(ValidationFailure);
    expect(() =>
      registerPayrollPayment(emitted.record.documentId, {
        montoPagado: 1,
        fechaPago: PAYMENT_DATE,
      })
    ).toThrow(ValidationFailure);

    expect(loadPurchaseInvoices()).toEqual(documentsBefore);
    expect(loadPayrollSettlements()).toEqual(settlementsBefore);
  });
});
