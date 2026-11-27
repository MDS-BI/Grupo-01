import { beforeEach, describe, expect, it } from 'vitest';
import { appState, canAccess, initApp, resolveRoute } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  loadEntities,
  loadPurchaseInvoices,
  loadSaleInvoices,
  savePayrollSettlements,
  updateDocument,
} from '../../src/storage.js';
import { saveAccessRecords } from '../../src/access-storage.js';
import { loadAppMarkup, submit } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

const FINANCE_MODULES = [
  'dashboard',
  'entities',
  'invoice-sale',
  'invoice-purchase',
  'payroll-admin',
  'movements',
  'cashflow',
  'tracking',
  'search',
];

const DENIED_MODULES = [
  'access',
  'dev-notifications',
  'payroll-create',
  'payroll-worker',
];

function seedFinanceAccess() {
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
}

function signInFinance() {
  seedFinanceAccess();
  initApp(userConfig);
  byId('login-rut').value = '55.555.555-5';
  byId('login-password').value = '5555';
  submit('login-form');
  return appState.session;
}

function makeEntity({ name, code, taxId, tipo }) {
  return addEntity(
    { name, code, taxId, customFields: { tipoTercero: tipo } },
    userConfig
  );
}

function makeInvoice(thirdParty, { tipo, folio, series, total, customFields }) {
  return addDocument(
    {
      entity_id: thirdParty.entity_id,
      folio,
      series,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      totalAmount: total,
      customFields: { tipoFactura: tipo, ...customFields },
    },
    userConfig
  );
}

function payInvoice(invoice) {
  updateDocument(invoice.document_id, { status: 'Emitida' }, userConfig);
  return updateDocument(
    invoice.document_id,
    {
      status: 'Pagada',
      customFields: {
        ...invoice.customFields,
        montoPagado: invoice.totalAmount,
        fechaPago: '2026-10-15',
      },
    },
    userConfig
  );
}

describe('US7 - permisos del rol finanzas', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
  });

  it('entra con 55.555.555-5 y muestra exactamente los módulos permitidos y denegados', () => {
    const session = signInFinance();

    expect(session?.role).toBe('finanzas');
    expect(byId('view-dashboard').hidden).toBe(false);
    expect(byId('session-role').textContent).toBe('Rol: Finanzas');

    for (const module of FINANCE_MODULES) {
      expect(canAccess(module, session)).toBe(true);
      expect(byId(`nav-${module}`).hidden).toBe(false);
    }
    for (const module of DENIED_MODULES) {
      expect(canAccess(module, session)).toBe(false);
      if (module === 'dev-notifications') {
        expect(byId('nav-dev-notifications')).toBeNull();
      } else {
        expect(byId(`nav-${module}`).hidden).toBe(true);
      }
    }

    expect(resolveRoute('access', session)).toBe('dashboard');
    expect(resolveRoute('dev-notifications', session)).toBe('dashboard');
    expect(resolveRoute('payroll-create', session)).toBe('dashboard');
    expect(resolveRoute('payroll-worker', session)).toBe('payroll-admin');
  });

  it('bloquea access, dev-notifications y payroll-worker al intentar abrirlos', () => {
    signInFinance();

    byId('nav-access').click();
    expect(byId('view-access').hidden).toBe(true);
    expect(byId('view-dashboard').hidden).toBe(false);

    expect(byId('nav-dev-notifications')).toBeNull();
    expect(canAccess('dev-notifications', appState.session)).toBe(false);
    expect(resolveRoute('dev-notifications', appState.session)).toBe(
      'dashboard'
    );
    expect(byId('view-dev-notifications').hidden).toBe(true);
    expect(byId('view-dashboard').hidden).toBe(false);

    byId('nav-payroll-worker').click();
    expect(byId('view-payroll-worker').hidden).toBe(true);
    expect(byId('view-payroll-admin').hidden).toBe(false);
  });

  it('busca liquidaciones por RUT en modo solo lectura', () => {
    const worker = makeEntity({
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      taxId: '22.222.222-2',
      tipo: 'personal',
    });
    const invoice = makeInvoice(worker, {
      tipo: 'compra',
      folio: 11,
      series: 'LIQ',
      total: 700000,
      customFields: {
        periodoLiquidacion: '2026-10',
        centroCosto: 'Consumible',
      },
    });
    savePayrollSettlements([
      {
        settlementId: 'set_finanzas',
        documentId: invoice.document_id,
        entityId: worker.entity_id,
        periodo: '2026-10',
        sueldoBase: 490000,
        descuentos: 0,
        bonos: 210000,
        monto: 700000,
        estado: 'Emitida',
        fechaPago: null,
      },
    ]);
    signInFinance();

    byId('nav-payroll-admin').click();
    byId('payroll-filter-rut').value = '22.222';
    byId('payroll-filter-rut').dispatchEvent(new Event('input'));

    const list = byId('payroll-admin-list');
    expect(list.textContent).toContain('Ana Pérez Soto');
    expect(list.querySelector('[data-action="edit"]')).toBeNull();
    expect(list.querySelector('[data-action="associate"]')).toBeNull();
    expect(canAccess('payroll-create', appState.session)).toBe(false);
    expect(canAccess('access', appState.session)).toBe(false);
    expect(resolveRoute('payroll-create', appState.session)).toBe('dashboard');
    expect(resolveRoute('access', appState.session)).toBe('dashboard');
  });

  it('puede editar terceros y facturas de venta y compra', () => {
    const client = makeEntity({
      name: 'Comercial Ejemplo',
      code: 'CLI-001',
      taxId: '12.345.678-5',
      tipo: 'cliente',
    });
    const supplier = makeEntity({
      name: 'Suministros Ejemplo',
      code: 'PRO-001',
      taxId: '76.123.456-0',
      tipo: 'proveedor',
    });
    const sale = makeInvoice(client, {
      tipo: 'venta',
      folio: 1,
      series: 'FV',
      total: 100000,
      customFields: { salesOrderId: 'OC-001' },
    });
    const purchase = makeInvoice(supplier, {
      tipo: 'compra',
      folio: 2,
      series: 'FC',
      total: 200000,
      customFields: { centroCosto: 'Activo' },
    });
    signInFinance();

    byId('nav-entities').click();
    byId('entity-list').querySelector('[data-action="edit"]').click();
    expect(byId('name').value).toBe('Comercial Ejemplo');
    byId('name').value = 'Comercial Editada';
    submit('entity-form');
    expect(
      loadEntities().find((item) => item.entity_id === client.entity_id).name
    ).toBe('Comercial Editada');

    byId('nav-invoice-sale').click();
    byId('invoice-sale-list').querySelector('[data-action="edit"]').click();
    byId('invoice-sale-field-notes').value = 'Revisado por finanzas';
    submit('invoice-sale-form');
    expect(
      loadSaleInvoices().find((item) => item.document_id === sale.document_id)
        .notes
    ).toBe('Revisado por finanzas');

    byId('nav-invoice-purchase').click();
    byId('invoice-purchase-list').querySelector('[data-action="edit"]').click();
    byId('invoice-purchase-field-notes').value = 'Validado por finanzas';
    submit('invoice-purchase-form');
    expect(
      loadPurchaseInvoices().find(
        (item) => item.document_id === purchase.document_id
      ).notes
    ).toBe('Validado por finanzas');
  });

  it('ve liquidaciones en solo lectura y consulta movimientos y flujo de caja', () => {
    const supplier = makeEntity({
      name: 'Suministros Ejemplo',
      code: 'PRO-001',
      taxId: '76.123.456-0',
      tipo: 'proveedor',
    });
    const worker = makeEntity({
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      taxId: '22.222.222-2',
      tipo: 'personal',
    });
    const paid = payInvoice(
      makeInvoice(supplier, {
        tipo: 'compra',
        folio: 10,
        series: 'FC',
        total: 250000,
        customFields: { centroCosto: 'Activo' },
      })
    );
    const settlement = makeInvoice(worker, {
      tipo: 'compra',
      folio: 11,
      series: 'LIQ',
      total: 700000,
      customFields: {
        periodoLiquidacion: '2026-10',
        centroCosto: 'Consumible',
      },
    });
    signInFinance();

    byId('nav-payroll-admin').click();
    expect(byId('view-payroll-admin').hidden).toBe(false);
    const list = byId('payroll-admin-list');
    expect(list.textContent).toContain('Ana Pérez Soto');
    expect(list.querySelector('[data-action="edit"]')).toBeNull();
    expect(list.querySelector('[data-action="associate"]')).toBeNull();
    expect(
      loadPurchaseInvoices().find(
        (item) => item.document_id === settlement.document_id
      ).totalAmount
    ).toBe(700000);

    byId('nav-movements').click();
    expect(byId('view-movements').hidden).toBe(false);
    expect(byId('movements-list').textContent).toContain('Compra FC #10');
    expect(byId('movements-list').textContent).not.toContain(paid.document_id);

    byId('nav-cashflow').click();
    expect(byId('view-cashflow').hidden).toBe(false);
    expect(byId('cashflow-content').textContent).toContain('Factura de compra');
  });
});
