import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { loadPayrollSettlements } from '../../src/storage.js';
import { loadAppMarkup, submit } from '../setup/domFixture.js';

// T064 (spec 003, Session 2026-11-25): el listado se actualiza al navegar a
// payroll-create, incluso si la demostración se cargó después de iniciar la app.
function byId(id) {
  return document.getElementById(id);
}

describe('payroll-create: listado al navegar tras cargar demostración (T064)', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('muestra las liquidaciones de Ana y Bruno al abrir la vista, sin guardar ni recargar', () => {
    initApp(userConfig);
    byId('login-demo-load').click();
    expect(loadPayrollSettlements()).toHaveLength(13);

    const list = byId('payroll-create-list');
    expect(list.textContent).toContain('No hay liquidaciones registradas');

    byId('login-rut').value = '88.888.888-8';
    byId('login-password').value = '8888';
    submit('login-form');
    expect(byId('view-dashboard').hidden).toBe(false);

    byId('nav-payroll-create').click();

    expect(byId('view-payroll-create').hidden).toBe(false);
    expect(list.textContent).toContain('Ana Pérez Soto');
    expect(list.textContent).toContain('Bruno Soto Vega');
    expect(list.textContent).toContain('Camila Rojas Fuentes');
    expect(list.textContent).not.toContain('No hay liquidaciones registradas');
  });
});
