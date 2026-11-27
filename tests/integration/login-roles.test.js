import { beforeEach, describe, expect, it } from 'vitest';
import { initApp, appState } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';
import {
  createAccessRecord,
  deactivateAccessRecord,
  loadAccessRecords,
  loadDevNotifications,
  saveAccessRecords,
} from '../../src/access-storage.js';
import { clearSession, loadSession, saveSession } from '../../src/session.js';
import { loadAppMarkup, submit } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

const ADMIN_RUT = '88.888.888-8';
const FINANZAS_RUT = '55.555.555-5';
const WORKER_RUT = '22.222.222-2';
const OTHER_WORKER_RUT = '45.000.000-0';

function createAdminAccess(existing = []) {
  return createAccessRecord(
    {
      accessId: '88888888-8',
      role: 'administrador',
      entityId: null,
      password: '8888',
    },
    { entities: [], records: existing }
  );
}

function createFinanceAccess(existing = []) {
  const now = new Date().toISOString();
  const record = {
    accessId: '55555555-5',
    role: 'finanzas',
    entityId: null,
    password: '5555',
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  saveAccessRecords([...existing, record]);
  return record;
}

function createWorkerAccess(
  existing = [],
  {
    rut = WORKER_RUT,
    password = '2222',
    name = 'Ana Pérez Soto',
    code = 'PE-001',
  } = {}
) {
  const worker = addEntity(
    {
      name,
      code,
      taxId: rut,
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
  return createAccessRecord(
    {
      accessId: rut,
      role: 'trabajador',
      entityId: worker.entity_id,
      password,
    },
    { entities: [worker], records: existing }
  );
}

function login({ rut, password }) {
  byId('login-rut').value = rut;
  byId('login-password').value = password;
  submit('login-form');
}

function visibleNavIds() {
  return Array.from(document.querySelectorAll('#sidebar button'))
    .filter((button) => !button.hidden)
    .map((button) => button.id);
}

describe('US1 - inicio de sesión con RUT y contraseña', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
  });

  it('muestra login-submit y login-demo-load sin invitado ni selector de rol', () => {
    initApp(userConfig);

    expect(byId('login-guest')).toBeNull();
    expect(byId('login-submit')).not.toBeNull();
    expect(byId('login-demo-load')).not.toBeNull();
    expect(
      Array.from(
        byId('login-form').querySelectorAll('button'),
        (button) => button.id
      )
    ).toEqual(['login-submit', 'login-demo-load']);
    expect(byId('login-role')).toBeNull();
    expect(document.querySelector('#view-login select')).toBeNull();
    expect(document.querySelector('#view-login [name="role"]')).toBeNull();
    expect(
      Array.from(
        byId('login-form').querySelectorAll('input'),
        (input) => input.id
      )
    ).toEqual(['login-rut', 'login-password']);
    expect(byId('sidebar').hidden).toBe(true);
    expect(byId('app').classList.contains('login-screen')).toBe(true);
    expect(byId('session-role').hidden).toBe(true);
  });

  it('admin, finanzas y trabajador entran a su vista según el acceso registrado', () => {
    const admin = createAdminAccess();
    const finance = createFinanceAccess([admin]);
    const worker = createWorkerAccess([admin, finance]);
    createWorkerAccess([admin, finance, worker], {
      rut: OTHER_WORKER_RUT,
      password: '4500',
      name: 'Bruno Soto Vega',
      code: 'PE-002',
    });

    const cases = [
      {
        rut: ADMIN_RUT,
        password: '8888',
        role: 'administrador',
        roleLabel: 'Recursos Humanos',
        view: 'dashboard',
        allowed: 'nav-access',
        denied: 'nav-payroll-worker',
      },
      {
        rut: FINANZAS_RUT,
        password: '5555',
        role: 'finanzas',
        roleLabel: 'Finanzas',
        view: 'dashboard',
        allowed: 'nav-payroll-admin',
        denied: 'nav-access',
      },
      {
        rut: WORKER_RUT,
        password: '2222',
        role: 'trabajador',
        roleLabel: 'Trabajador',
        view: 'payroll-worker',
        allowed: 'nav-payroll-worker',
        denied: 'nav-access',
      },
      {
        rut: OTHER_WORKER_RUT,
        password: '4500',
        role: 'trabajador',
        roleLabel: 'Trabajador',
        view: 'payroll-worker',
        allowed: 'nav-payroll-worker',
        denied: 'nav-access',
      },
    ];

    for (const item of cases) {
      clearSession();
      initApp(userConfig);
      login({ rut: item.rut, password: item.password });

      expect(appState.session.role).toBe(item.role);
      expect(byId('session-role').textContent).toBe(`Rol: ${item.roleLabel}`);
      expect(byId(`view-${item.view}`).hidden).toBe(false);
      expect(byId('view-login').hidden).toBe(true);
      expect(byId('sidebar').hidden).toBe(false);
      expect(byId(item.allowed).hidden).toBe(false);
      expect(byId(item.denied).hidden).toBe(true);
      expect(visibleNavIds().at(-1)).toBe('nav-logout');
    }
  });

  it('rechaza un RUT vacío sin abrir ninguna vista de negocio', () => {
    createAdminAccess();
    initApp(userConfig);

    login({ rut: '', password: '8888' });

    expect(byId('view-login').hidden).toBe(false);
    expect(byId('view-dashboard').hidden).toBe(true);
    expect(byId('login-error').hidden).toBe(false);
    expect(byId('login-error').textContent).toContain('RUT');
    expect(loadSession()).toBeNull();
    expect(appState.session).toBeNull();
  });

  it('rechaza una contraseña vacía sin notificar al desarrollador', () => {
    createAdminAccess();
    initApp(userConfig);

    login({ rut: ADMIN_RUT, password: '' });

    expect(byId('view-login').hidden).toBe(false);
    expect(byId('view-dashboard').hidden).toBe(true);
    expect(byId('login-error').hidden).toBe(false);
    expect(byId('login-error').textContent).toContain('contraseña');
    expect(loadSession()).toBeNull();
    expect(appState.session).toBeNull();
    expect(loadDevNotifications()).toHaveLength(0);
  });

  it('rechaza credenciales incorrectas sin exponer datos ni notificar', () => {
    createAdminAccess();
    initApp(userConfig);

    login({ rut: ADMIN_RUT, password: '9999' });
    expect(byId('view-login').hidden).toBe(false);
    expect(byId('login-error').hidden).toBe(false);
    expect(byId('login-error').textContent).toContain(
      'RUT o contraseña incorrectos'
    );
    expect(loadAccessRecords()).toHaveLength(1);
    expect(loadDevNotifications()).toHaveLength(0);
    expect(appState.session).toBeNull();
  });

  it('rechaza el RUT inválido y registra la incidencia del desarrollador', () => {
    createWorkerAccess();
    initApp(userConfig);

    login({ rut: '12345678-1', password: '1234' });
    expect(byId('view-login').hidden).toBe(false);
    expect(loadDevNotifications()).toHaveLength(1);
    expect(loadDevNotifications()[0]).toMatchObject({
      accessId: '12345678-1',
      reason: 'INVALID_RUT',
      origin: 'login',
    });
  });

  it('rechaza el RUT no registrado y registra la incidencia del desarrollador', () => {
    createWorkerAccess();
    initApp(userConfig);

    login({ rut: '12121212-9', password: '1234' });
    expect(byId('view-login').hidden).toBe(false);
    expect(loadDevNotifications()).toHaveLength(1);
    expect(loadDevNotifications()[0]).toMatchObject({
      accessId: '12121212-9',
      reason: 'NOT_FOUND',
      origin: 'login',
    });
  });

  it('rechaza el acceso inactivo y registra la incidencia del desarrollador', () => {
    const access = createWorkerAccess();
    deactivateAccessRecord(access.accessId, { records: loadAccessRecords() });
    initApp(userConfig);

    login({ rut: access.accessId, password: '2222' });
    expect(byId('view-login').hidden).toBe(false);
    expect(loadDevNotifications()).toHaveLength(1);
    expect(loadDevNotifications()[0]).toMatchObject({
      accessId: access.accessId,
      reason: 'INACTIVE',
      origin: 'login',
    });
  });

  it('rechaza el vínculo roto con el tercero personal y notifica', () => {
    createWorkerAccess();
    saveAccessRecords([
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: 'ent_missing',
        password: '2222',
        active: true,
        createdAt: '2026-11-11T12:00:00.000Z',
        updatedAt: '2026-11-11T12:00:00.000Z',
      },
    ]);
    initApp(userConfig);

    login({ rut: WORKER_RUT, password: '2222' });
    expect(byId('view-login').hidden).toBe(false);
    expect(loadDevNotifications()).toHaveLength(1);
    expect(loadDevNotifications()[0]).toMatchObject({
      accessId: '22222222-2',
      reason: 'BROKEN_ENTITY_LINK',
      origin: 'login',
    });
  });

  it('usa el rol del RUT aunque se agregue un campo de rol al formulario', () => {
    createWorkerAccess();
    initApp(userConfig);
    const injected = document.createElement('input');
    injected.id = 'login-role';
    injected.value = 'administrador';
    byId('login-form').append(injected);
    login({ rut: WORKER_RUT, password: '2222' });

    expect(appState.session.role).toBe('trabajador');
    expect(byId('session-role').textContent).toBe('Rol: Trabajador');
    expect(byId('view-payroll-worker').hidden).toBe(false);
    expect(loadDevNotifications()).toHaveLength(0);
  });

  it('muestra el rol del administrador y sitúa cerrar sesión al final del lateral', () => {
    createAdminAccess();
    initApp(userConfig);
    login({ rut: ADMIN_RUT, password: '8888' });

    expect(byId('session-role').textContent).toBe('Rol: Recursos Humanos');
    expect(byId('sidebar').hidden).toBe(false);
    expect(byId('app').classList.contains('login-screen')).toBe(false);
    expect(visibleNavIds().at(-1)).toBe('nav-logout');
    byId('nav-entities').click();
    expect(byId('session-role').textContent).toBe('Rol: Recursos Humanos');
    byId('nav-logout').click();
    expect(byId('sidebar').hidden).toBe(true);
    expect(byId('session-role').hidden).toBe(true);
    expect(byId('session-role').textContent).toBe('');
  });

  it('descarta la sesión al recargar cuando no es válida', () => {
    const access = createWorkerAccess();
    saveSession({
      accessId: access.accessId,
      role: 'trabajador',
      entityId: access.entityId,
      startedAt: new Date().toISOString(),
    });
    initApp(userConfig);
    expect(byId('view-payroll-worker').hidden).toBe(false);

    clearSession();
    initApp(userConfig);
    expect(byId('view-login').hidden).toBe(false);
  });
});
