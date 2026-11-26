import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { loadDemoData } from '../../src/demo-data.js';
import { userConfig } from '../../src/module-config.js';
import { loadAppMarkup, setupAdminSession } from '../setup/domFixture.js';

// T057 (spec 003, Session 2026-11-25): el listado de la vista de creación
// muestra solo liquidaciones y su propio mensaje de vacío.
function byId(id) {
  return document.getElementById(id);
}

function openCreateView({ withDemo }) {
  localStorage.clear();
  sessionStorage.clear();
  loadAppMarkup();
  if (withDemo) expect(loadDemoData(userConfig).ok).toBe(true);
  setupAdminSession();
  initApp(userConfig);
  byId('nav-payroll-create').click();
  return byId('payroll-create-list');
}

describe('payroll-create: listado exclusivo de liquidaciones (T057)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('con datos de demostración lista solo liquidaciones de trabajadores', () => {
    const list = openCreateView({ withDemo: true });

    expect(list.textContent).toContain('Ana Pérez Soto');
    expect(list.textContent).toContain('Bruno Soto Vega');
    expect(list.textContent).not.toContain('Proveedores del Sur S.A.');
    expect(list.querySelector('[data-action="edit"]')).toBeNull();
    expect(list.querySelector('[data-action="delete"]')).toBeNull();
    expect(list.querySelector('[data-action="associate"]')).toBeNull();
    expect(list.querySelector('[data-action="register-payment"]')).toBeNull();
  });

  it('sin registros muestra el mensaje propio de liquidaciones', () => {
    const list = openCreateView({ withDemo: false });

    expect(list.textContent.trim()).toBe('No hay liquidaciones registradas');
    expect(list.textContent).not.toContain(
      'No hay facturas de compra registradas'
    );
  });
});
