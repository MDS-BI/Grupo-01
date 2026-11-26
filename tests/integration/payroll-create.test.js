import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { initialPassword } from '../../src/auth.js';
import {
  createAccessRecord,
  loadAccessRecords,
  loadDevNotifications,
} from '../../src/access-storage.js';
import {
  addEntity,
  loadEntities,
  loadPayrollSettlements,
  loadPurchaseInvoices,
} from '../../src/storage.js';
import { loadDemoData } from '../../src/demo-data.js';
import { userConfig } from '../../src/module-config.js';
import {
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

function setField(key, value) {
  const input = byId(`payroll-create-field-${key}`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// Formulario propio (T056): desglose de 600.000 + 150.000 − 50.000 = 700.000.
function fillPayrollForm() {
  setField('rut', RUT);
  setField('nombreCompleto', NOMBRE);
  setField('periodoLiquidacion', '2026-10');
  setField('sueldoBase', '600000');
  setField('bonos', '150000');
  setField('descuentos', '50000');
  setField('startDate', '2026-10-01');
  setField('endDate', '2026-10-31');
  setField('folio', '20261001');
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
    sueldoBase: 600000,
    bonos: 150000,
    descuentos: 50000,
  });
}

describe('payroll-create: alta integral de liquidaciones', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
    window.confirm = () => true;
    setupAdminSession();
    initApp(userConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra el formulario propio con RUT y nombre completo al abrir la pestaña', () => {
    byId('nav-payroll-create').click();

    expect(byId('view-payroll-create').hidden).toBe(false);
    expect(byId('payroll-create-form')).not.toBeNull();
    expect(byId('payroll-create-field-startDate')).not.toBeNull();
    expect(byId('payroll-create-field-folio')).not.toBeNull();
    expect(byId('payroll-create-form-title').textContent.trim()).toBe(
      'Crear liquidación de sueldo'
    );

    const rutField = byId('payroll-create-field-rut');
    const nameField = byId('payroll-create-field-nombreCompleto');
    expect(rutField.required).toBe(true);
    expect(nameField.required).toBe(true);
    const form = byId('payroll-create-form');
    expect(form.textContent).toContain('RUT');
    expect(form.textContent).toContain('Nombre completo');
  });

  it('no muestra el selector de tercero en la vista de creación', () => {
    byId('nav-payroll-create').click();

    expect(
      byId('payroll-create-form').querySelector('[data-field="entity_id"]')
    ).toBeNull();
    expect(byId('payroll-create-filter')).toBeNull();
  });

  it('no muestra facturas de compra a proveedores en la lista de la vista de creación', () => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
    expect(loadDemoData(userConfig).ok).toBe(true);
    setupAdminSession();
    initApp(userConfig);
    byId('nav-payroll-create').click();

    const text = byId('payroll-create-list').textContent;
    expect(text).toContain('Ana Pérez Soto');
    expect(text).toContain('Bruno Soto Vega');
    expect(text).not.toContain('Proveedores del Sur S.A.');
  });

  it('crea liquidación, tercero personal y acceso trabajador con la contraseña inicial', () => {
    byId('nav-payroll-create').click();
    fillPayrollForm();

    submit('payroll-create-form');

    expectCreatedRecords();
    expect(loadDevNotifications()).toEqual([]);
    expect(
      byId('view-payroll-create').querySelector('[data-invoice-feedback]')
        .textContent
    ).toContain('Liquidación guardada');
    expect(byId('payroll-create-field-rut').value).toBe('');
  });

  it('el trabajador creado ingresa y ve únicamente su liquidación', () => {
    byId('nav-payroll-create').click();
    fillPayrollForm();
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
    expect(byId('payroll-worker-period').textContent).toContain('octubre 2026');
    expect(byId('payroll-worker-amount').textContent).toContain('700');
    const session = JSON.parse(sessionStorage.getItem('erp.session'));
    expect(session).toMatchObject({
      accessId: NORMALIZED_RUT,
      role: 'trabajador',
      entityId: expect.any(String),
    });
  });

  it('confirma el alta del trabajador con RUT y contraseña inicial antes de guardar', () => {
    byId('nav-payroll-create').click();
    fillPayrollForm();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    submit('payroll-create-form');

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    const message = confirmSpy.mock.calls[0][0];
    expect(message).toContain('Se creará');
    expect(message).toContain(RUT);
    expect(message).toContain(initialPassword(RUT));
    expectCreatedRecords();
  });

  it('no persiste registros al cancelar la confirmación de alta con RUT nuevo', () => {
    byId('nav-payroll-create').click();
    fillPayrollForm();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    submit('payroll-create-form');

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(loadPayrollSettlements()).toEqual([]);
    expect(
      loadEntities().some((item) => item.customFields?.rut === NORMALIZED_RUT)
    ).toBe(false);
    expect(
      loadAccessRecords().some((item) => item.accessId === NORMALIZED_RUT)
    ).toBe(false);
    expect(
      loadPurchaseInvoices().some(
        (item) => item.customFields?.rut === NORMALIZED_RUT
      )
    ).toBe(false);
  });

  it('no pide confirmación cuando el RUT ya existe como tercero personal', () => {
    const worker = addEntity(
      {
        name: NOMBRE,
        code: 'PE-001',
        taxId: NORMALIZED_RUT,
        customFields: { tipoTercero: 'personal', rut: NORMALIZED_RUT },
      },
      userConfig
    );
    createAccessRecord(
      {
        accessId: NORMALIZED_RUT,
        role: 'trabajador',
        entityId: worker.entity_id,
        password: initialPassword(RUT),
      },
      { entities: [worker], records: loadAccessRecords() }
    );
    byId('nav-payroll-create').click();
    fillPayrollForm();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    submit('payroll-create-form');

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(loadPayrollSettlements()).toHaveLength(1);
    expect(loadEntities()).toHaveLength(1);
    expect(
      loadAccessRecords().filter((item) => item.accessId === NORMALIZED_RUT)
    ).toHaveLength(1);
  });
});
