import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appState, initApp } from '../../src/app.js';
import { loadAccessRecords } from '../../src/access-storage.js';
import { normalizeRut } from '../../src/auth.js';
import { userConfig } from '../../src/module-config.js';
import { loadSession } from '../../src/session.js';
import { loadEntities, loadPayrollSettlements } from '../../src/storage.js';
import { loadAppMarkup, submit } from '../setup/domFixture.js';

function visibleViews() {
  return Array.from(document.querySelectorAll('main .view'))
    .filter((view) => !view.hidden)
    .map((view) => view.id);
}

function loadDemoFromLogin() {
  const button = document.getElementById('login-demo-load');
  expect(button).not.toBeNull();
  button?.click();
}

function login(rut, password) {
  document.getElementById('login-rut').value = rut;
  document.getElementById('login-password').value = password;
  submit('login-form');
}

function logout() {
  document.getElementById('nav-logout').click();
}

let originalConfirm;

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
  originalConfirm = window.confirm;
  window.confirm = () => true;
});

afterEach(() => {
  window.confirm = originalConfirm;
});

describe('US6 - demostración cargada desde la pantalla de acceso', () => {
  it('permanece en el acceso, sin sesión, lateral ni datos de negocio visibles', () => {
    initApp(userConfig);

    loadDemoFromLogin();

    expect(visibleViews()).toEqual(['view-login']);
    expect(loadSession()).toBeNull();
    expect(appState.session).toBeNull();
    expect(document.getElementById('sidebar').hidden).toBe(true);
    expect(
      document.getElementById('app').classList.contains('login-screen')
    ).toBe(true);
    expect(loadAccessRecords()).toHaveLength(4);
    expect(loadEntities().length).toBeGreaterThan(0);
    expect(loadPayrollSettlements()).toHaveLength(13);
  });

  it('los accesos de administrador y finanzas funcionan después de la carga', () => {
    initApp(userConfig);
    loadDemoFromLogin();

    for (const caso of [
      {
        rut: '88.888.888-8',
        password: '8888',
        role: 'administrador',
        label: 'Recursos Humanos',
      },
      {
        rut: '55.555.555-5',
        password: '5555',
        role: 'finanzas',
        label: 'Finanzas',
      },
    ]) {
      login(caso.rut, caso.password);

      expect(appState.session).toMatchObject({
        accessId: normalizeRut(caso.rut),
        role: caso.role,
      });
      expect(document.getElementById('session-role').textContent).toBe(
        `Rol: ${caso.label}`
      );
      expect(document.getElementById('view-dashboard').hidden).toBe(false);
      expect(document.getElementById('view-login').hidden).toBe(true);

      logout();
      expect(loadSession()).toBeNull();
      expect(visibleViews()).toEqual(['view-login']);
    }
  });

  it('los dos trabajadores ven únicamente su liquidación después de la carga', () => {
    initApp(userConfig);
    loadDemoFromLogin();

    for (const caso of [
      {
        rut: '22.222.222-2',
        password: '2222',
        name: 'Ana Pérez Soto',
        taxId: '22.222.222-2',
      },
      {
        rut: '45.000.000-0',
        password: '4500',
        name: 'Bruno Soto Vega',
        taxId: '45.000.000-0',
      },
    ]) {
      login(caso.rut, caso.password);

      expect(appState.session).toMatchObject({
        accessId: normalizeRut(caso.rut),
        role: 'trabajador',
      });
      expect(document.getElementById('session-role').textContent).toBe(
        'Rol: Trabajador'
      );
      expect(document.getElementById('view-payroll-worker').hidden).toBe(false);
      expect(document.getElementById('view-dashboard').hidden).toBe(true);
      expect(document.getElementById('payroll-worker-name').textContent).toBe(
        caso.name
      );
      expect(document.getElementById('payroll-worker-rut').textContent).toBe(
        caso.taxId
      );
      expect(
        document.getElementById('payroll-worker-base-salary').textContent
      ).toContain('Sueldo base');
      const historyRows = Array.from(
        document.getElementById('payroll-worker-history').querySelectorAll('tr')
      );
      expect(historyRows.length).toBeGreaterThanOrEqual(2);
      expect(
        new Set(historyRows.map((row) => row.cells[0].textContent)).size
      ).toBeGreaterThanOrEqual(2);

      logout();
      expect(loadSession()).toBeNull();
      expect(visibleViews()).toEqual(['view-login']);
    }
  });
});
