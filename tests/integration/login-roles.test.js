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

function login({ role, rut, password }) {
  const roleInput = document.getElementById('login-role');
  const rutInput = document.getElementById('login-rut');
  const passwordInput = document.getElementById('login-password');
  if (roleInput) roleInput.value = role;
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

    login({ role: 'administrador', rut: '11111111-1', password: '1111' });
    expect(document.getElementById('view-dashboard').hidden).toBe(false);
    expect(document.getElementById('nav-payroll-admin')).not.toBeNull();

    clearSession();
    login({ role: 'trabajador', rut: '22222222-2', password: '2222' });
    expect(document.getElementById('view-payroll-worker').hidden).toBe(false);
    expect(document.getElementById('view-dashboard').hidden).toBe(true);
    expect(document.getElementById('nav-payroll-worker')).not.toBeNull();
  });

  it('rechaza credenciales incorrectas sin exponer datos ni notificar', () => {
    createWorkerAccess();
    initApp(userConfig);

    login({ role: 'trabajador', rut: '22222222-2', password: '9999' });
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

    login({ role: 'trabajador', rut: '12345678-1', password: '1234' });
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

    login({ role: 'trabajador', rut: '12121212-9', password: '1234' });
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

    login({ role: 'trabajador', rut: access.accessId, password: '2222' });
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

    login({ role: 'trabajador', rut: '22222222-2', password: '2222' });
    expect(document.getElementById('view-login').hidden).toBe(false);
    expect(loadDevNotifications()).toHaveLength(1);
    expect(loadDevNotifications()[0]).toMatchObject({
      accessId: '22222222-2',
      reason: 'BROKEN_ENTITY_LINK',
      origin: 'login',
    });
  });

  it('rechaza el rol incompatible sin notificar al desarrollador', () => {
    createWorkerAccess();
    initApp(userConfig);

    login({ role: 'administrador', rut: '22222222-2', password: '2222' });
    expect(document.getElementById('view-login').hidden).toBe(false);
    expect(document.getElementById('login-error').textContent).toContain(
      'RUT o contraseña incorrectos'
    );
    expect(loadDevNotifications()).toHaveLength(0);
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
