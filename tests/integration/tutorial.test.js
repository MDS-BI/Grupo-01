import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';
import { saveAccessRecords } from '../../src/access-storage.js';
import { saveSession } from '../../src/session.js';
import {
  loadAppMarkup,
  setupAdminSession,
  setupFinanzasSession,
} from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

const ADMIN_STEPS = [
  'panel',
  'payroll-create',
  'payroll-admin',
  'access',
  'menu',
  'cuidados',
];

const FINANCE_STEPS = [
  'panel',
  'entities',
  'invoice-sale',
  'invoice-purchase',
  'issue-pay',
  'payroll-admin',
  'movements',
  'cashflow',
  'tracking',
  'menu',
  'cuidados',
];

const WORKER_STEPS = ['payroll-worker', 'cuidados'];

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

function resetApp() {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
}

function visibleMenuIds() {
  return Array.from(byId('utilities-menu').querySelectorAll('.menu-item'))
    .filter((item) => !item.hidden)
    .map((item) => item.id);
}

function openGuideFromMenu() {
  byId('menu-toggle').click();
  byId('menu-guide').click();
}

function currentStep() {
  return byId('guide-body').dataset.step;
}

function walkGuide() {
  const ids = [];
  for (let index = 0; index < 20 && !byId('guide-panel').hidden; index += 1) {
    ids.push(currentStep());
    byId('guide-next').click();
  }
  return ids;
}

function storageEntries(storage) {
  const result = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    result[key] = storage.getItem(key);
  }
  return result;
}

function snapshotStorage() {
  return {
    local: storageEntries(localStorage),
    session: storageEntries(sessionStorage),
  };
}

describe('T112 - guía de uso por rol', () => {
  beforeEach(resetApp);

  it('muestra "Guía de uso" en el menú para los tres roles y no sin sesión', () => {
    for (const setup of [
      setupAdminSession,
      setupFinanzasSession,
      setupWorkerSession,
    ]) {
      resetApp();
      setup();
      initApp(userConfig);

      expect(byId('menu-guide').hidden).toBe(false);
      expect(byId('menu-guide').textContent.trim()).toBe('Guía de uso');
      expect(visibleMenuIds()).toContain('menu-guide');
      expect(visibleMenuIds().at(-1)).toBe('menu-logout');
    }

    resetApp();
    initApp(userConfig);

    expect(byId('menu-guide').hidden).toBe(true);
    expect(byId('qa-guide').hidden).toBe(true);
    expect(byId('guide-panel').hidden).toBe(true);
    expect(visibleMenuIds()).toEqual([]);
  });

  it('muestra el acceso del Panel solo para administrador y finanzas', () => {
    for (const setup of [setupAdminSession, setupFinanzasSession]) {
      resetApp();
      setup();
      initApp(userConfig);

      expect(byId('view-dashboard').hidden).toBe(false);
      expect(byId('qa-guide').hidden).toBe(false);
      expect(byId('qa-guide').textContent.trim()).toBe(
        '¿Primera vez? Ver la guía'
      );
    }

    resetApp();
    setupWorkerSession();
    initApp(userConfig);

    expect(byId('view-dashboard').hidden).toBe(true);
    expect(byId('qa-guide').hidden).toBe(true);
  });

  it('abre y cierra la guía desde el menú y desde el Panel devolviendo el foco', () => {
    setupAdminSession();
    initApp(userConfig);

    const menuGuide = byId('menu-guide');
    menuGuide.focus();
    openGuideFromMenu();

    expect(byId('guide-panel').hidden).toBe(false);
    expect(currentStep()).toBe('panel');

    byId('guide-close').click();

    expect(byId('guide-panel').hidden).toBe(true);
    expect(document.activeElement).toBe(byId('menu-toggle'));

    const qaGuide = byId('qa-guide');
    qaGuide.focus();
    qaGuide.click();

    expect(byId('guide-panel').hidden).toBe(false);
    expect(currentStep()).toBe('panel');

    byId('guide-close').click();

    expect(byId('guide-panel').hidden).toBe(true);
    expect(document.activeElement).toBe(qaGuide);
  });

  it('devuelve el foco a #menu-toggle al cerrar con Escape si el menú ☰ está cerrado', () => {
    setupAdminSession();
    initApp(userConfig);

    const menuGuide = byId('menu-guide');
    menuGuide.focus();
    openGuideFromMenu();

    expect(byId('utilities-menu').classList.contains('is-open')).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(byId('guide-panel').hidden).toBe(true);
    expect(document.activeElement).toBe(byId('menu-toggle'));
  });

  it('devuelve el foco a #menu-toggle al cerrar tras usar Ir a desde el Panel', () => {
    setupAdminSession();
    initApp(userConfig);

    const qaGuide = byId('qa-guide');
    qaGuide.focus();
    qaGuide.click();
    byId('guide-next').click();
    byId('guide-go').click();

    expect(byId('view-payroll-create').hidden).toBe(false);
    expect(byId('qa-guide').hidden).toBe(false);

    byId('guide-close').click();

    expect(byId('guide-panel').hidden).toBe(true);
    expect(document.activeElement).toBe(byId('menu-toggle'));
  });

  it('sigue el recorrido del contrato para cada rol', () => {
    for (const [setup, expected] of [
      [setupAdminSession, ADMIN_STEPS],
      [setupFinanzasSession, FINANCE_STEPS],
      [setupWorkerSession, WORKER_STEPS],
    ]) {
      resetApp();
      setup();
      initApp(userConfig);
      openGuideFromMenu();

      expect(walkGuide()).toEqual(expected);
      expect(byId('guide-panel').hidden).toBe(true);
    }
  });

  it('menciona Accesos solo al administrador y describe Mi liquidación al trabajador', () => {
    setupAdminSession();
    initApp(userConfig);
    openGuideFromMenu();
    while (currentStep() !== 'menu') byId('guide-next').click();

    expect(byId('guide-body').textContent).toContain('Control de accesos');
    expect(byId('guide-body').textContent).not.toContain(
      'Avisos al desarrollador'
    );

    resetApp();
    setupFinanzasSession();
    initApp(userConfig);
    openGuideFromMenu();
    while (currentStep() !== 'menu') byId('guide-next').click();

    expect(byId('guide-body').textContent).not.toContain('Control de accesos');
    expect(byId('guide-body').textContent).not.toContain(
      'Avisos al desarrollador'
    );

    resetApp();
    setupWorkerSession();
    initApp(userConfig);
    openGuideFromMenu();

    expect(currentStep()).toBe('payroll-worker');
    expect(byId('guide-body').textContent).toContain('última liquidación');
    expect(byId('guide-body').textContent).toContain(
      'sueldo base, descuentos y bonos'
    );
    expect(byId('guide-body').textContent).toContain(
      'historial de sus propios pagos'
    );
    expect(byId('guide-body').textContent).toContain('solo lectura');
    expect(byId('guide-body').textContent).toContain('HU3');
  });

  it('no modifica datos ni sesión al recorrer la guía', () => {
    setupAdminSession();
    initApp(userConfig);
    const before = snapshotStorage();

    openGuideFromMenu();
    byId('guide-next').click();
    byId('guide-go').click();

    expect(byId('view-payroll-create').hidden).toBe(false);

    byId('guide-close').click();

    expect(snapshotStorage()).toEqual(before);
  });
});
