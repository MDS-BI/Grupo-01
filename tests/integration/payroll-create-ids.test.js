import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { loadAppMarkup, setupAdminSession } from '../setup/domFixture.js';

// T055 (spec 003, Session 2026-11-25): ids propios con prefijo
// `payroll-create-field-` y ningún id repetido en la página.
const PREFIX = 'payroll-create-field-';

function byId(id) {
  return document.getElementById(id);
}

describe('payroll-create: ids únicos y propios (T055)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
    setupAdminSession();
    initApp(userConfig);
    byId('nav-payroll-create').click();
  });

  it('no hay ids duplicados en el documento', () => {
    const ids = [...document.querySelectorAll('[id]')].map(
      (element) => element.id
    );
    const duplicated = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicated).toEqual([]);
  });

  it('los ids con prefijo propio viven solo dentro de la vista de creación', () => {
    const view = byId('view-payroll-create');
    const prefixed = document.querySelectorAll(`[id^="${PREFIX}"]`);
    expect(prefixed.length).toBeGreaterThan(0);
    for (const element of prefixed) {
      expect(view.contains(element), element.id).toBe(true);
    }
  });

  it('cada campo visible del formulario usa el prefijo propio', () => {
    const form = byId('payroll-create-form');
    const fields = [...form.querySelectorAll('input, select, textarea')].filter(
      (input) => !input.closest('[hidden]') && input.type !== 'hidden'
    );
    expect(fields.length).toBe(10);
    for (const field of fields) {
      expect(field.id.startsWith(PREFIX), field.id).toBe(true);
    }
  });

  it('la vista no contiene ids del formulario de facturas de compra', () => {
    const view = byId('view-payroll-create');
    expect(view.querySelector('[id^="invoice-purchase-field-"]')).toBeNull();
  });
});
