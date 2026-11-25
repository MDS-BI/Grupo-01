import { beforeEach, describe, expect, it } from 'vitest';
import { canAccess, initApp, resolveRoute } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';
import { saveAccessRecords } from '../../src/access-storage.js';
import { loadSession, saveSession } from '../../src/session.js';
import {
  loadAppMarkup,
  setupAdminSession,
  setupFinanzasSession,
} from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

const PANEL_ACTIONS = [
  'qa-manage-entities',
  'qa-new-invoice-sale',
  'qa-new-invoice-purchase',
  'qa-new-payroll',
  'qa-tracking',
  'qa-cashflow',
  'qa-movements',
  'qa-search',
];

function setupSession({ role, accessId, entityId = null, password = '1234' }) {
  const now = new Date().toISOString();
  saveAccessRecords([
    {
      accessId,
      role,
      entityId,
      password,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  saveSession({ accessId, role, entityId, startedAt: now });
}

function setupWorkerSession() {
  const worker = addEntity(
    {
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      taxId: '22.222.222-2',
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
  setupSession({
    role: 'trabajador',
    accessId: '22.222.222-2',
    entityId: worker.entity_id,
    password: '2222',
  });
}

function visibleMenuIds() {
  return Array.from(byId('utilities-menu').querySelectorAll('.menu-item'))
    .filter((item) => !item.hidden)
    .map((item) => item.id);
}

function visibleNavModules() {
  return Array.from(
    document.querySelectorAll('.sidebar .nav-item[data-module]')
  )
    .filter((button) => !button.hidden)
    .map((button) => button.dataset.module);
}

function visibleQuickActionIds() {
  return Array.from(
    byId('view-dashboard').querySelectorAll('.quick-actions button')
  )
    .filter((button) => !button.hidden && !button.closest('[hidden]'))
    .map((button) => button.id);
}

function waitForClose() {
  return new Promise((resolve) => {
    setTimeout(resolve, 220);
  });
}

describe('T147 - menú de utilidades y grilla del Panel', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('muestra el menú de administrador con cerrar sesión como última opción', () => {
    setupAdminSession();
    initApp(userConfig);

    expect(byId('utilities-menu-title').textContent.trim()).toBe(
      'Utilidades & Sesión'
    );
    expect(byId('menu-toggle').hidden).toBe(false);
    expect(byId('menu-toggle').getAttribute('aria-expanded')).toBe('false');
    expect(byId('utilities-menu').hidden).toBe(true);
    expect(byId('menu-separator').hidden).toBe(false);
    expect(visibleMenuIds()).toEqual([
      'menu-guide',
      'menu-access',
      'menu-logout',
    ]);
    expect(byId('menu-access').textContent.trim()).toBe('Control de accesos');
    expect(byId('menu-logout').textContent.trim()).toBe('Cerrar sesión');
    expect(visibleMenuIds().at(-1)).toBe('menu-logout');
  });

  it('oculta las opciones de administrador para finanzas y trabajador', () => {
    for (const setup of [setupFinanzasSession, setupWorkerSession]) {
      loadAppMarkup();
      localStorage.clear();
      sessionStorage.clear();
      setup();
      initApp(userConfig);

      expect(byId('menu-toggle').hidden).toBe(false);
      expect(byId('menu-access').hidden).toBe(true);
      expect(byId('menu-dev-notifications')).toBeNull();
      expect(byId('menu-separator').hidden).toBe(true);
      expect(visibleMenuIds()).toEqual(['menu-guide', 'menu-logout']);
      expect(byId('menu-logout').textContent.trim()).toBe('Cerrar sesión');
    }
  });

  it('abre y cierra el menú con aria-expanded, foco y Escape', async () => {
    setupAdminSession();
    initApp(userConfig);

    const toggle = byId('menu-toggle');
    toggle.click();

    expect(byId('utilities-menu').hidden).toBe(false);
    expect(byId('utilities-overlay').hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(byId('utilities-menu').classList.contains('is-open')).toBe(true);
    expect(document.activeElement).toBe(byId('menu-guide'));

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(byId('utilities-menu').classList.contains('is-open')).toBe(false);
    expect(document.activeElement).toBe(toggle);

    await waitForClose();
    expect(byId('utilities-menu').hidden).toBe(true);
    expect(byId('utilities-overlay').hidden).toBe(true);
  });

  it('navega a una utilidad y vuelve al Panel desde la barra de retorno', () => {
    setupAdminSession();
    initApp(userConfig);

    byId('menu-toggle').click();
    byId('menu-access').click();

    expect(byId('view-access').hidden).toBe(false);
    expect(byId('view-dashboard').hidden).toBe(true);
    expect(byId('back-bar').hidden).toBe(false);
    expect(byId('back-view-name').textContent.trim()).toBe('Accesos');

    byId('back-to-dashboard').click();

    expect(byId('view-dashboard').hidden).toBe(false);
    expect(byId('back-bar').hidden).toBe(true);
    expect(byId('menu-toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('cierra la sesión desde el menú sin dejar utilidades visibles', () => {
    setupAdminSession();
    initApp(userConfig);

    byId('menu-toggle').click();
    byId('menu-logout').click();

    expect(byId('view-login').hidden).toBe(false);
    expect(byId('menu-toggle').hidden).toBe(true);
    expect(byId('utilities-menu').hidden).toBe(true);
    expect(byId('utilities-overlay').hidden).toBe(true);
    expect(byId('session-role').hidden).toBe(true);
  });

  it('muestra la grilla de ocho accesos operativos para finanzas', () => {
    setupFinanzasSession();
    initApp(userConfig);

    expect(byId('view-dashboard').hidden).toBe(false);
    expect(visibleQuickActionIds()).toEqual(PANEL_ACTIONS);
    for (const id of PANEL_ACTIONS) {
      expect(byId(id).hidden).toBe(false);
    }
    expect(byId('qa-new-payroll').hidden).toBe(false);
    expect(byId('qa-create-payroll').hidden).toBe(true);
  });

  it('muestra en el Panel del administrador solo los accesos de liquidaciones', () => {
    setupAdminSession();
    initApp(userConfig);

    expect(byId('view-dashboard').hidden).toBe(false);
    expect(visibleQuickActionIds()).toEqual([
      'qa-create-payroll',
      'qa-new-payroll',
    ]);
    expect(byId('qa-create-payroll').hidden).toBe(false);
    expect(byId('qa-new-payroll').hidden).toBe(false);
    for (const id of PANEL_ACTIONS) {
      if (id === 'qa-new-payroll') continue;
      expect(byId(id).hidden).toBe(true);
    }
  });

  it('no muestra la grilla del Panel ni la acción de liquidaciones al trabajador', () => {
    setupWorkerSession();
    initApp(userConfig);

    expect(byId('view-dashboard').hidden).toBe(true);
    expect(byId('view-payroll-worker').hidden).toBe(false);
    expect(byId('qa-new-payroll').closest('#view-dashboard')).not.toBeNull();
    expect(visibleQuickActionIds()).toEqual([]);
  });

  it('oculta Flujo de caja al trabajador y bloquea la navegación directa', () => {
    setupWorkerSession();
    const session = loadSession();
    initApp(userConfig);

    expect(canAccess('cashflow', session)).toBe(false);
    expect(resolveRoute('cashflow', session)).toBe('payroll-worker');
    expect(byId('nav-cashflow').hidden).toBe(true);
    expect(byId('qa-cashflow').closest('[hidden]')).not.toBeNull();

    byId('nav-cashflow').click();

    expect(byId('view-cashflow').hidden).toBe(true);
    expect(byId('view-payroll-worker').hidden).toBe(false);
    expect(byId('cashflow-content').textContent).not.toContain('Ingresos');
  });

  it('oculta los indicadores financieros del Panel al trabajador', () => {
    setupWorkerSession();
    initApp(userConfig);

    expect(byId('view-dashboard').hidden).toBe(true);
    for (const id of ['summary-caja', 'kpi-por-cobrar', 'kpi-por-pagar']) {
      expect(byId(id).closest('[hidden]')).not.toBeNull();
      expect(byId(id).textContent).toBe('');
    }
    expect(visibleQuickActionIds()).toEqual([]);

    byId('nav-dashboard').click();

    expect(byId('view-dashboard').hidden).toBe(true);
    expect(byId('view-payroll-worker').hidden).toBe(false);
  });
});

describe('003 - matriz de navegación por rol (T003, T037)', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('el administrador navega exactamente Panel, crear y gestionar liquidaciones y control de accesos', () => {
    setupAdminSession();
    initApp(userConfig);

    expect(visibleNavModules()).toEqual([
      'dashboard',
      'payroll-create',
      'payroll-admin',
      'access',
    ]);
  });

  it('finanzas conserva sus módulos de negocio más liquidaciones en solo lectura', () => {
    setupFinanzasSession();
    initApp(userConfig);

    expect(visibleNavModules()).toEqual([
      'dashboard',
      'entities',
      'invoice-sale',
      'invoice-purchase',
      'payroll-admin',
      'movements',
      'cashflow',
      'tracking',
      'search',
    ]);
  });

  it('ningún rol ve la navegación ni el menú de avisos al desarrollador (FR-020)', () => {
    for (const setup of [
      setupAdminSession,
      setupFinanzasSession,
      setupWorkerSession,
    ]) {
      loadAppMarkup();
      localStorage.clear();
      sessionStorage.clear();
      setup();
      initApp(userConfig);

      expect(byId('nav-dev-notifications')).toBeNull();
      expect(byId('menu-dev-notifications')).toBeNull();
      expect(visibleMenuIds()).not.toContain('menu-dev-notifications');
      expect(visibleNavModules()).not.toContain('dev-notifications');
    }
  });

  it('el administrador pierde el acceso a los módulos de negocio fuera de liquidaciones (FR-012)', () => {
    setupAdminSession();
    const session = loadSession();
    initApp(userConfig);

    const denied = [
      'entities',
      'invoice-sale',
      'invoice-purchase',
      'movements',
      'cashflow',
      'tracking',
      'search',
      'dev-notifications',
    ];
    for (const view of denied) {
      expect(canAccess(view, session)).toBe(false);
      expect(resolveRoute(view, session)).toBe('payroll-admin');
    }

    const allowed = ['dashboard', 'payroll-create', 'payroll-admin', 'access'];
    for (const view of allowed) {
      expect(canAccess(view, session)).toBe(true);
      expect(resolveRoute(view, session)).toBe(view);
    }
  });
});
