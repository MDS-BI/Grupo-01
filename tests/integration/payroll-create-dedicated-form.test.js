import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { loadAppMarkup, setupAdminSession } from '../setup/domFixture.js';

// T053 (spec 003, Session 2026-11-25): la vista «Crear liquidación de sueldo»
// usa un formulario propio con solo los diez campos acordados.
const EXPECTED_FIELDS = [
  ['rut', 'RUT'],
  ['nombreCompleto', 'Nombre completo'],
  ['periodoLiquidacion', 'Período'],
  ['sueldoBase', 'Sueldo base'],
  ['bonos', 'Bonos'],
  ['descuentos', 'Descuentos'],
  ['startDate', 'Fecha de emisión'],
  ['endDate', 'Fecha de vencimiento'],
  ['series', 'Serie'],
  ['folio', 'Folio'],
];

const FORBIDDEN_FIELDS = [
  'entity_id',
  'quantity',
  'taxAmount',
  'currency',
  'paymentTerms',
  'centroCosto',
  'montoPagado',
  'fechaPago',
  'status',
];

function byId(id) {
  return document.getElementById(id);
}

function visibleFields(form) {
  return [...form.querySelectorAll('input, select, textarea')].filter(
    (input) => !input.closest('[hidden]') && input.type !== 'hidden'
  );
}

describe('payroll-create: formulario propio de liquidación (T053)', () => {
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

  it('contiene solo los diez campos acordados, con ids propios', () => {
    const form = byId('payroll-create-form');
    const ids = visibleFields(form).map((input) => input.id);

    expect(ids).toEqual(
      EXPECTED_FIELDS.map(([key]) => `payroll-create-field-${key}`)
    );
  });

  it('no incluye campos de factura de compra', () => {
    const form = byId('payroll-create-form');
    for (const key of FORBIDDEN_FIELDS) {
      expect(form.querySelector(`[data-field="${key}"]`)).toBeNull();
    }
  });

  it('usa las etiquetas acordadas para cada campo', () => {
    const form = byId('payroll-create-form');
    for (const [key, label] of EXPECTED_FIELDS) {
      const element = form.querySelector(
        `label[for="payroll-create-field-${key}"]`
      );
      expect(element, `etiqueta de ${key}`).not.toBeNull();
      expect(element.textContent.replace(/\s*\*\s*$/, '').trim()).toMatch(
        new RegExp(`^${label}`)
      );
    }
  });

  it('mantiene el título de la vista', () => {
    expect(byId('view-payroll-create').hidden).toBe(false);
    expect(byId('payroll-create-form-title').textContent.trim()).toBe(
      'Crear liquidación de sueldo'
    );
  });
});
