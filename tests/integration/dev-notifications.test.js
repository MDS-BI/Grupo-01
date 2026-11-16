import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp, appState } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';
import {
  appendDevNotification,
  clearDevNotifications,
  createAccessRecord,
  loadDevNotifications,
} from '../../src/access-storage.js';
import { saveSession } from '../../src/session.js';
import { loadAppMarkup, setupAdminSession } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

describe('US6 - avisos para el desarrollador', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
    vi.restoreAllMocks();
  });

  it('registra los motivos de incidencia y emite console.error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const reason of [
      'INVALID_RUT',
      'NOT_FOUND',
      'INACTIVE',
      'DUPLICATE',
      'BROKEN_ENTITY_LINK',
    ]) {
      appendDevNotification({
        accessId: '22222222-2',
        role: 'trabajador',
        reason,
        origin: 'login',
      });
    }
    expect(loadDevNotifications()).toHaveLength(5);
    expect(error).toHaveBeenCalled();
  });

  it('muestra fecha, RUT, rol, motivo y origen en el panel del administrador', () => {
    appendDevNotification({
      accessId: '22222222-2',
      role: 'trabajador',
      reason: 'INACTIVE',
      origin: 'login',
    });
    setupAdminSession();
    initApp(userConfig);
    byId('nav-dev-notifications').click();

    expect(byId('view-dev-notifications').hidden).toBe(false);
    const text = byId('dev-notifications-list').textContent;
    expect(text).toContain('22222222-2');
    expect(text).toContain('Acceso inactivo');
    expect(text).toContain('login');
  });

  it('no muestra el panel al trabajador', () => {
    const employee = addEntity(
      {
        name: 'Ana Pérez Soto',
        code: 'PE-001',
        taxId: '22222222-2',
        customFields: { tipoTercero: 'personal' },
      },
      userConfig
    );
    const access = createAccessRecord(
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: employee.entity_id,
        password: '2222',
      },
      { entities: [employee], records: [] }
    );
    saveSession({
      accessId: access.accessId,
      role: 'trabajador',
      entityId: employee.entity_id,
      startedAt: new Date().toISOString(),
    });
    initApp(userConfig);
    byId('nav-dev-notifications').click();

    expect(byId('view-payroll-worker').hidden).toBe(false);
    expect(byId('view-dev-notifications').hidden).toBe(true);
  });

  it('limpia los avisos con confirmación', () => {
    appendDevNotification({
      accessId: '22222222-2',
      role: 'trabajador',
      reason: 'NOT_FOUND',
      origin: 'login',
    });
    setupAdminSession();
    initApp(userConfig);
    byId('nav-dev-notifications').click();

    vi.spyOn(window, 'confirm').mockReturnValue(false);
    byId('dev-notifications-clear').click();
    expect(loadDevNotifications()).toHaveLength(1);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    byId('dev-notifications-clear').click();
    expect(loadDevNotifications()).toHaveLength(0);
    clearDevNotifications();
  });
});
