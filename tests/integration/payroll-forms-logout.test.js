import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { loadDemoData } from '../../src/demo-data.js';
import { userConfig } from '../../src/module-config.js';
import { loadAppMarkup, setupAdminSession } from '../setup/domFixture.js';

// T066 (spec 003, 26-11-2026): al cerrar sesión se cierran los formularios de
// «Editar liquidación» y «Registrar pago», para que el siguiente rol que
// ingrese en el mismo navegador no vea datos del rol anterior.
function byId(id) {
  return document.getElementById(id);
}

describe('payroll-admin: formularios cerrados al cerrar sesión (T066)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
    expect(loadDemoData(userConfig).ok).toBe(true);
    window.confirm = () => true;
    setupAdminSession();
    initApp(userConfig);
  });

  it('cierra «Editar liquidación» al cerrar sesión', () => {
    byId('nav-payroll-admin').click();
    byId('view-payroll-admin').querySelector('[data-action="edit"]').click();
    expect(byId('payroll-form').hidden).toBe(false);

    byId('menu-logout').click();

    expect(byId('payroll-form').hidden).toBe(true);
  });

  it('cierra «Registrar pago» al cerrar sesión', () => {
    const paymentForm = byId('payroll-payment-form');
    paymentForm.hidden = false;

    byId('menu-logout').click();

    expect(paymentForm.hidden).toBe(true);
  });
});
