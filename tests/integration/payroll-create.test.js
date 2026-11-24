import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { initialPassword } from '../../src/auth.js';
import {
  loadAccessRecords,
  loadDevNotifications,
} from '../../src/access-storage.js';
import {
  loadEntities,
  loadPayrollSettlements,
  loadPurchaseInvoices,
} from '../../src/storage.js';
import { loadDemoData } from '../../src/demo-data.js';
import { userConfig } from '../../src/module-config.js';
import {
  invoiceField,
  loadAppMarkup,
  setupAdminSession,
  submit,
} from '../setup/domFixture.js';

const RUT = '11.111.111-1';
const NORMALIZED_RUT = '11111111-1';
const NOMBRE = 'Ana Pérez Soto';

function byId(id) {
  return document.getElementById(id);
}

function fillInvoiceForm() {
  invoiceField('payroll-create', 'folio').value = '20261001';
  invoiceField('payroll-create', 'startDate').value = '2026-10-01';
  invoiceField('payroll-create', 'endDate').value = '2026-10-31';
  invoiceField('payroll-create', 'totalAmount').value = '700000';
  invoiceField('payroll-create', 'status').value = 'Borrador';
  const centroCosto = invoiceField('payroll-create', 'centroCosto');
  if (centroCosto) centroCosto.value = 'Consumible';

  const form = byId('payroll-create-form');
  form.querySelector('[data-extra-field="rut"]').value = RUT;
  form.querySelector('[data-extra-field="nombreCompleto"]').value = NOMBRE;
}

function expectCreatedRecords() {
  const entity = loadEntities().find(
    (item) => item.customFields?.rut === NORMALIZED_RUT
  );
  expect(entity).toMatchObject({
    name: NOMBRE,
    taxId: NORMALIZED_RUT,
    customFields: { tipoTercero: 'personal', rut: NORMALIZED_RUT },
  });

  const access = loadAccessRecords().find(
    (item) => item.accessId === NORMALIZED_RUT
  );
  expect(access).toMatchObject({
    role: 'trabajador',
    entityId: entity.entity_id,
    password: initialPassword(RUT),
    active: true,
  });

  const invoice = loadPurchaseInvoices().find(
    (item) => item.entity_id === entity.entity_id
  );
  expect(invoice).toMatchObject({
    folio: 20261001,
    customFields: {
      tipoFactura: 'compra',
      periodoLiquidacion: '2026-10',
    },
  });

  const settlement = loadPayrollSettlements().find(
    (item) => item.documentId === invoice.document_id
  );
  expect(settlement).toMatchObject({
    entityId: entity.entity_id,
    periodo: '2026-10',
    monto: 700000,
  });
}

describe('payroll-create: alta integral de liquidaciones', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
    setupAdminSession();
    initApp(userConfig);
  });

  it('muestra el formulario de compra con RUT y nombre completo al abrir la pestaña', () => {
    byId('nav-payroll-create').click();

    expect(byId('view-payroll-create').hidden).toBe(false);
    expect(byId('payroll-create-form')).not.toBeNull();
    expect(invoiceField('payroll-create', 'startDate')).not.toBeNull();
    expect(invoiceField('payroll-create', 'folio')).not.toBeNull();
    expect(byId('payroll-create-form-title').textContent).toBe(
      'Crear liquidación de sueldo'
    );

    const form = byId('payroll-create-form');
    const rutField = form.querySelector('[data-extra-field="rut"]');
    const nameField = form.querySelector('[data-extra-field="nombreCompleto"]');
    expect(rutField).not.toBeNull();
    expect(nameField).not.toBeNull();
    expect(rutField.required).toBe(true);
    expect(nameField.required).toBe(true);
    expect(form.textContent).toContain('RUT');
    expect(form.textContent).toContain('Nombre completo');
  });

  it('no muestra el selector de tercero en la vista de creación', () => {
    byId('nav-payroll-create').click();

    const thirdParty = byId('payroll-create-form').querySelector(
      '[data-field="entity_id"]'
    );
    expect(thirdParty).not.toBeNull();
    expect(thirdParty.closest('.form-field').hidden).toBe(true);
    expect(byId('payroll-create-filter').closest('.form-field').hidden).toBe(
      true
    );
  });

  it('no muestra facturas de compra a proveedores en la lista de la vista de creación', () => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
    expect(loadDemoData(userConfig).ok).toBe(true);
    setupAdminSession();
    initApp(userConfig);
    byId('nav-payroll-create').click();

    const captions = Array.from(
      byId('payroll-create-list').querySelectorAll('caption'),
      (caption) => caption.textContent
    );
    expect(captions).toContain('Ana Pérez Soto');
    expect(captions).toContain('Bruno Soto Vega');
    expect(captions).not.toContain('Proveedores del Sur S.A.');
  });

  it('crea liquidación, tercero personal y acceso trabajador con la contraseña inicial', () => {
    byId('nav-payroll-create').click();
    fillInvoiceForm();

    submit('payroll-create-form');

    expectCreatedRecords();
    expect(loadDevNotifications()).toEqual([]);
    expect(
      byId('view-payroll-create').querySelector('[data-invoice-feedback]')
        .textContent
    ).toContain('Liquidación guardada');
    expect(
      byId('payroll-create-form').querySelector('[data-extra-field="rut"]')
        .value
    ).toBe('');
  });

  it('el trabajador creado ingresa y ve únicamente su liquidación', () => {
    byId('nav-payroll-create').click();
    fillInvoiceForm();
    submit('payroll-create-form');
    expectCreatedRecords();

    sessionStorage.clear();
    initApp(userConfig);
    byId('login-rut').value = RUT;
    byId('login-password').value = initialPassword(RUT);
    submit('login-form');

    expect(byId('view-payroll-worker').hidden).toBe(false);
    for (const view of document.querySelectorAll('section.view')) {
      if (view.id === 'view-payroll-worker') continue;
      expect(view.hidden).toBe(true);
    }
    expect(byId('payroll-worker-period').textContent).toContain('2026-10');
    expect(byId('payroll-worker-amount').textContent).toContain('700');
    const session = JSON.parse(sessionStorage.getItem('erp.session'));
    expect(session).toMatchObject({
      accessId: NORMALIZED_RUT,
      role: 'trabajador',
      entityId: expect.any(String),
    });
  });
});
