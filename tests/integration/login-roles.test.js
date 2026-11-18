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
import { clearSession, saveSession } from '../../src/session.js';
import { loadAppMarkup, submit } from '../setup/domFixture.js';

function createAdminAccess(existing = []) {
  return createAccessRecord(
    {
      accessId: '11111111-1',
      role: 'administrador',
      entityId: null,
      password: '1111',
    },
    { entities: [], records: existing }
  );
}

function createWorkerAccess(existing = []) {
  const worker = addEntity(
    {
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      taxId: '22222222-2',
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
  return createAccessRecord(
    {
      accessId: '22222222-2',
      role: 'trabajador',
      entityId: worker.entity_id,
      password: '2222',
    },
    { entities: [worker], records: existing }
  );
}

function login({ rut, password }) {
  const rutInput = document.getElementById('login-rut');
  const passwordInput = document.getElementById('login-password');
  if (rutInput) rutInput.value = rut;
  if (passwordInput) passwordInput.value = password;
  submit('login-form');
}

describe('US1 - inicio de sesión con RUT y contraseña', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
  });

  it('admin valida credenciales y entra al panel; trabajador a su liquidación', () => {
    const adminAccess = createAdminAccess();
    createWorkerAccess([adminAccess]);
    initApp(userConfig);

    expect(document.getElementById('view-login').hidden).toBe(false);
    expect(document.getElementById('view-dashboard').hidden).toBe(true);

    login({ rut: '11111111-1', password: '1111' });
    expect(document.getElementById('view-dashboard').hidden).toBe(false);
    expect(document.getElementById('nav-payroll-admin')).not.toBeNull();

    clearSession();
    login({ rut: '22222222-2', password: '2222' });
    expect(document.getElementById('view-payroll-worker').hidden).toBe(false);
    expect(document.getElementById('view-dashboard').hidden).toBe(true);
    expect(document.getElementById('nav-payroll-worker')).not.toBeNull();
    expect(document.getElementById('session-role').textContent).toBe(
      'Rol: Trabajador'
    );
    expect(document.getElementById('nav-invoices-group').hidden).toBe(true);
  });

  it('rechaza credenciales incorrectas sin exponer datos ni notificar', () => {
    createWorkerAccess();
    initApp(userConfig);

    login({ rut: '22222222-2', password: '9999' });
    expect(document.getElementById('view-login').hidden).toBe(false);
    expect(document.getElementById('login-error').hidden).toBe(false);
    expect(document.getElementById('login-error').textContent).toContain(
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
    expect(document.getElementById('view-login').hidden).toBe(false);
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
    expect(document.getElementById('view-login').hidden).toBe(false);
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
    expect(document.getElementById('view-login').hidden).toBe(false);
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

    login({ rut: '22222222-2', password: '2222' });
    expect(document.getElementById('view-login').hidden).toBe(false);
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
    document.getElementById('login-form').append(injected);
    login({ rut: '22222222-2', password: '2222' });
    expect(appState.session.role).toBe('trabajador');
    expect(document.getElementById('session-role').textContent).toBe(
      'Rol: Trabajador'
    );
    expect(document.getElementById('view-payroll-worker').hidden).toBe(false);
    expect(loadDevNotifications()).toHaveLength(0);
  });

  it('muestra solo dos campos y dos acciones en el acceso y oculta el lateral', () => {
    initApp(userConfig);
    expect(document.getElementById('login-role')).toBeNull();
    const form = document.getElementById('login-form');
    expect(
      Array.from(form.querySelectorAll('input'), (input) => input.id)
    ).toEqual(['login-rut', 'login-password']);
    expect(
      Array.from(form.querySelectorAll('button'), (button) => button.id)
    ).toEqual(['login-submit', 'login-guest']);
    expect(document.getElementById('sidebar').hidden).toBe(true);
    expect(
      document.getElementById('app').classList.contains('login-screen')
    ).toBe(true);
    expect(document.getElementById('session-role').hidden).toBe(true);
    expect(document.querySelector('#view-login h1').textContent).toBe(
      'Ingresar al ERP'
    );
  });

  it('muestra el rol del administrador y sitúa cerrar sesión al final del lateral', () => {
    createAdminAccess();
    initApp(userConfig);
    login({ rut: '11.111.111-1', password: '1111' });
    expect(document.getElementById('session-role').textContent).toBe(
      'Rol: Administrador'
    );
    expect(document.getElementById('sidebar').hidden).toBe(false);
    expect(
      document.getElementById('app').classList.contains('login-screen')
    ).toBe(false);
    const buttons = Array.from(
      document.querySelectorAll('#sidebar button')
    ).filter((button) => !button.hidden);
    expect(buttons.at(-1).id).toBe('nav-logout');
    document.getElementById('nav-entities').click();
    expect(document.getElementById('session-role').textContent).toBe(
      'Rol: Administrador'
    );
    document.getElementById('nav-logout').click();
    expect(document.getElementById('sidebar').hidden).toBe(true);
    expect(document.getElementById('session-role').hidden).toBe(true);
    expect(document.getElementById('session-role').textContent).toBe('');
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
    expect(document.getElementById('view-payroll-worker').hidden).toBe(false);

    clearSession();
    initApp(userConfig);
    expect(document.getElementById('view-login').hidden).toBe(false);
  });
});
