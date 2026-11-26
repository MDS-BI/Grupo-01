import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { formatCurrencyCLP } from '../../src/format.js';
import { loadPayrollSettlements } from '../../src/storage.js';
import { userConfig } from '../../src/module-config.js';
import {
  loadAppMarkup,
  setupAdminSession,
  submit,
} from '../setup/domFixture.js';

// T054 (spec 003, Session 2026-11-25): el total se calcula como
// sueldo base + bonos − descuentos y no se escribe a mano.
const SETTLEMENT_KEYS = [
  'settlementId',
  'documentId',
  'entityId',
  'periodo',
  'sueldoBase',
  'descuentos',
  'bonos',
  'monto',
  'estado',
  'fechaPago',
  'createdAt',
  'updatedAt',
];

function byId(id) {
  return document.getElementById(id);
}

function setField(key, value) {
  const input = byId(`payroll-create-field-${key}`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillForm() {
  setField('rut', '11.111.111-1');
  setField('nombreCompleto', 'Ana Pérez Soto');
  setField('periodoLiquidacion', '2026-10');
  setField('sueldoBase', '500000');
  setField('bonos', '100000');
  setField('descuentos', '50000');
  setField('startDate', '2026-10-01');
  setField('endDate', '2026-10-31');
  setField('folio', '20261001');
}

describe('payroll-create: total calculado (T054)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
    window.confirm = () => true;
    setupAdminSession();
    initApp(userConfig);
    byId('nav-payroll-create').click();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra el total derivado del desglose en una salida de solo lectura', () => {
    fillForm();

    const total = byId('payroll-create-field-totalAmount');
    expect(total).not.toBeNull();
    expect(['INPUT', 'SELECT', 'TEXTAREA']).not.toContain(total.tagName);
    expect(total.textContent.trim()).toBe(formatCurrencyCLP(550000));
  });

  it('guarda el desglose y el monto calculado sin propiedades nuevas', () => {
    fillForm();

    submit('payroll-create-form');

    const settlements = loadPayrollSettlements();
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toMatchObject({
      periodo: '2026-10',
      monto: 550000,
      sueldoBase: 500000,
      bonos: 100000,
      descuentos: 50000,
    });
    for (const key of Object.keys(settlements[0])) {
      expect(SETTLEMENT_KEYS).toContain(key);
    }
  });
});
