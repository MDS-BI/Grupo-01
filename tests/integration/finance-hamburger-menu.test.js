import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { loadAppMarkup, setupFinanzasSession } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

const FINANCE_MENU_ITEMS = [
  {
    id: 'menu-nav-entities',
    module: 'entities',
    label: 'Terceros',
    view: 'view-entities',
  },
  {
    id: 'menu-nav-invoice-sale',
    module: 'invoice-sale',
    label: 'Facturas de venta',
    view: 'view-invoice-sale',
  },
  {
    id: 'menu-nav-invoice-purchase',
    module: 'invoice-purchase',
    label: 'Facturas de compra',
    view: 'view-invoice-purchase',
  },
  {
    id: 'menu-nav-movements',
    module: 'movements',
    label: 'Movimientos financieros',
    view: 'view-movements',
  },
  {
    id: 'menu-nav-cashflow',
    module: 'cashflow',
    label: 'Flujo de caja',
    view: 'view-cashflow',
  },
  {
    id: 'menu-nav-tracking',
    module: 'tracking',
    label: 'Seguimiento',
    view: 'view-tracking',
  },
  {
    id: 'menu-nav-payroll-admin',
    module: 'payroll-admin',
    label: 'Liquidaciones de sueldo',
    view: 'view-payroll-admin',
  },
  {
    id: 'menu-nav-search',
    module: 'search',
    label: 'Buscar',
    view: 'view-search',
  },
];

function visibleMenuIds() {
  return Array.from(byId('utilities-menu').querySelectorAll('.menu-item'))
    .filter((item) => !item.hidden)
    .map((item) => item.id);
}

describe('T037 - menú ☰ de finanzas', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    setupFinanzasSession();
    initApp(userConfig);
  });

  it('muestra la navegación antes de Guía de uso en el orden acordado', () => {
    expect(visibleMenuIds()).toEqual([
      ...FINANCE_MENU_ITEMS.map((item) => item.id),
      'menu-guide',
      'menu-logout',
    ]);

    const menuChildren = Array.from(byId('utilities-menu').children);
    expect(menuChildren.indexOf(byId('finance-menu-navigation'))).toBeLessThan(
      menuChildren.indexOf(byId('menu-guide'))
    );

    for (const item of FINANCE_MENU_ITEMS) {
      const button = byId(item.id);
      expect(button.textContent.trim()).toBe(item.label);
      expect(button.dataset.module).toBe(item.module);
    }
  });

  it('abre cada vista desde el menú y alcanza Registrar pago', () => {
    for (const item of FINANCE_MENU_ITEMS) {
      byId(item.id).click();
      expect(byId(item.view).hidden).toBe(false);
      expect(byId('view-dashboard').hidden).toBe(true);
    }

    const payrollSubmit = byId('view-payroll-admin').querySelector(
      '#payroll-payment-submit'
    );
    expect(payrollSubmit?.textContent.trim()).toBe('Registrar pago');
  });
});
