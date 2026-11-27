import { beforeEach, describe, expect, it } from 'vitest';
import { appState, canAccess, initApp, resolveRoute } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import {
  loadAccessRecords,
  saveAccessRecords,
} from '../../src/access-storage.js';
import { clearSession, saveSession } from '../../src/session.js';
import { loadAppMarkup, submit } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

function isVisible(element) {
  return Boolean(element) && !element.hidden && !element.closest('[hidden]');
}

function saveAdminAccess() {
  const now = new Date().toISOString();
  saveAccessRecords([
    {
      accessId: '88888888-8',
      role: 'administrador',
      entityId: null,
      password: '8888',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  saveSession({
    accessId: '88888888-8',
    role: 'administrador',
    entityId: null,
    startedAt: now,
  });
}

function login({ rut, password }) {
  byId('login-rut').value = rut;
  byId('login-password').value = password;
  submit('login-form');
}

describe('US2 - alta de finanzas por el administrador', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
  });

  it('crea finanzas desde access-role sin access-entity y le bloquea view-access', () => {
    saveAdminAccess();
    initApp(userConfig);
    byId('nav-access').click();

    const roleSelect = byId('access-role');
    expect(Array.from(roleSelect.options, (option) => option.value)).toContain(
      'finanzas'
    );
    roleSelect.value = 'finanzas';
    roleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    expect(byId('access-entity').value).toBe('');
    expect(isVisible(byId('access-entity'))).toBe(false);

    byId('access-rut').value = '55.555.555-5';
    byId('access-rut').dispatchEvent(new Event('input', { bubbles: true }));
    expect(byId('access-password').value).toBe('5555');
    submit('access-form');

    const finance = loadAccessRecords().find(
      (item) => item.accessId === '55555555-5'
    );
    expect(finance).toMatchObject({
      role: 'finanzas',
      entityId: null,
      password: '5555',
      active: true,
    });
    expect(byId('access-form-error')?.textContent ?? '').toBe('');
    expect(byId('access-list').textContent).toContain('55.555.555-5');
    expect(byId('access-list').textContent).toContain('Finanzas');

    clearSession();
    initApp(userConfig);
    login({ rut: '55.555.555-5', password: '5555' });

    const session = appState.session;
    expect(session?.role).toBe('finanzas');
    expect(canAccess('access', session)).toBe(false);
    expect(resolveRoute('access', session)).toBe('dashboard');
    expect(byId('nav-access').hidden).toBe(true);

    byId('nav-access').click();
    expect(byId('view-access').hidden).toBe(true);
    expect(byId('view-dashboard').hidden).toBe(false);
  });
});
