import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { loadPurchaseInvoices } from '../../src/storage.js';
import { userConfig } from '../../src/module-config.js';
import {
  loadAppMarkup,
  setupAdminSession,
  submit,
} from '../setup/domFixture.js';

// T065 (spec 003, 26-11-2026): una liquidación creada con el formulario propio
// debe poder emitirse. La factura de compra que se crea por detrás lleva el
// centro de costo «Consumible», igual que las liquidaciones de demostración.
function byId(id) {
  return document.getElementById(id);
}

function setField(key, value) {
  const input = byId(`payroll-create-field-${key}`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('payroll-create: la liquidación creada se puede emitir (T065)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
    window.confirm = () => true;
    setupAdminSession();
    initApp(userConfig);
    byId('nav-payroll-create').click();
    setField('rut', '11.111.111-1');
    setField('nombreCompleto', 'Ana Pérez Soto');
    setField('periodoLiquidacion', '2026-12');
    setField('sueldoBase', '500000');
    setField('bonos', '100000');
    setField('descuentos', '50000');
    setField('startDate', '2026-12-01');
    setField('endDate', '2026-12-31');
    setField('folio', '20261201');
    submit('payroll-create-form');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('la factura de compra creada lleva centro de costo «Consumible»', () => {
    const [document] = loadPurchaseInvoices();
    expect(document.customFields.centroCosto).toBe('Consumible');
  });

  it('el administrador puede cambiarla a Emitida sin error de centro de costo', () => {
    byId('nav-payroll-admin').click();
    const editButton = byId('view-payroll-admin').querySelector(
      '[data-action="edit"]'
    );
    expect(editButton).not.toBeNull();
    editButton.click();

    const status = byId('payroll-field-status');
    status.value = 'Emitida';
    status.dispatchEvent(new Event('change', { bubbles: true }));
    submit('payroll-form');

    expect(byId('payroll-form-errors').textContent).not.toContain(
      'centro de costo'
    );
    expect(loadPurchaseInvoices()[0].status).toBe('Emitida');
  });
});
