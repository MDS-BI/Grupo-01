import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp, appState } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import {
  loadAppMarkup,
  setupAdminSession,
  setupFinanzasSession,
} from '../setup/domFixture.js';
import { loadSession } from '../../src/session.js';

const byId = (id) => document.getElementById(id);

describe('US6 - ciclo de vida de la sesión', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
    setupAdminSession();
    vi.restoreAllMocks();
  });

  it('la recarga conserva la sesión', () => {
    initApp(userConfig);
    expect(byId('view-dashboard').hidden).toBe(false);

    loadAppMarkup();
    initApp(userConfig);
    expect(byId('view-dashboard').hidden).toBe(false);
    expect(byId('session-role').textContent).toBe('Rol: Administrador');
    expect(loadSession()).toMatchObject({
      accessId: '88888888-8',
      role: 'administrador',
    });
  });

  it('la recarga conserva la sesión de finanzas', () => {
    setupFinanzasSession();
    initApp(userConfig);
    expect(byId('view-dashboard').hidden).toBe(false);
    expect(byId('session-role').textContent).toBe('Rol: Finanzas');
    expect(loadSession()).toMatchObject({
      accessId: '55555555-5',
      role: 'finanzas',
      entityId: null,
    });
  });

  it('cerrar sesión elimina la sesión y vuelve al acceso', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    initApp(userConfig);
    byId('nav-logout').click();

    expect(byId('view-login').hidden).toBe(false);
    expect(loadSession()).toBeNull();
    expect(appState.session).toBeNull();
  });

  it('cerrar la pestaña descarta la sesión de sessionStorage', () => {
    initApp(userConfig);
    expect(byId('view-dashboard').hidden).toBe(false);

    sessionStorage.clear();
    loadAppMarkup();
    initApp(userConfig);
    expect(byId('view-login').hidden).toBe(false);
  });

  it('pide confirmación cuando hay cambios sin guardar', () => {
    initApp(userConfig);
    appState.payrollDirty = true;
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    byId('nav-logout').click();
    expect(byId('view-dashboard').hidden).toBe(false);
    expect(loadSession()).not.toBeNull();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    byId('nav-logout').click();
    expect(byId('view-login').hidden).toBe(false);
  });
});
