import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appState, canAccess, initApp, resolveRoute } from '../../src/app.js';
import { loadDocuments } from '../../src/storage.js';
import { loadAccessRecords } from '../../src/access-storage.js';
import { userConfig } from '../../src/module-config.js';
import { clearSession, loadSession } from '../../src/session.js';
import { loadAppMarkup, setupAdminSession } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

function submitLogin({ rut, password }) {
  byId('login-rut').value = rut;
  byId('login-password').value = password;
  byId('login-form').dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true })
  );
}

describe('Ingreso opcional por rol', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
    vi.restoreAllMocks();
  });

  it('continuar sin iniciar sesión abre el panel como invitado', () => {
    initApp(userConfig);
    expect(byId('view-login').hidden).toBe(false);

    byId('login-guest').click();

    expect(byId('view-login').hidden).toBe(true);
    expect(byId('view-dashboard').hidden).toBe(false);
    expect(loadSession()).toMatchObject({ role: 'invitado' });
    expect(byId('dashboard-guest-note').hidden).toBe(false);
    expect(byId('qa-new-payroll').hidden).toBe(true);
    expect(byId('nav-login').hidden).toBe(false);
    expect(byId('nav-logout').hidden).toBe(true);
    expect(byId('session-role').textContent).toBe('Rol: Invitado');
    const buttons = Array.from(
      document.querySelectorAll('#sidebar button')
    ).filter((button) => !button.hidden);
    expect(buttons.at(-1).id).toBe('nav-login');
  });

  it('carga la demostración desde invitado y permite probar las tres credenciales', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    initApp(userConfig);
    expect(byId('login-no-accesses').hidden).toBe(false);
    byId('login-guest').click();
    byId('qa-load-demo').click();
    expect(loadAccessRecords()).toHaveLength(3);
    expect(loadDocuments().length).toBeGreaterThan(0);
    expect(appState.session.role).toBe('invitado');

    for (const [rut, password, role, view] of [
      ['11.111.111-1', '1111', 'Administrador', 'dashboard'],
      ['22.222.222-2', '2222', 'Trabajador', 'payroll-worker'],
      ['45.000.000-0', '4500', 'Trabajador', 'payroll-worker'],
    ]) {
      byId('nav-login').click();
      expect(byId('login-no-accesses').hidden).toBe(true);
      submitLogin({ rut, password });
      expect(byId(`view-${view}`).hidden).toBe(false);
      expect(byId('session-role').textContent).toBe(`Rol: ${role}`);
      byId('nav-logout').click();
      expect(byId('session-role').hidden).toBe(true);
      expect(byId('sidebar').hidden).toBe(true);
      byId('login-guest').click();
    }
  });

  it('el invitado navega por facturación pero no ve liquidaciones ni accesos', () => {
    initApp(userConfig);
    byId('login-guest').click();

    byId('nav-entities').click();
    expect(byId('view-entities').hidden).toBe(false);

    byId('nav-invoice-purchase').click();
    expect(byId('view-invoice-purchase').hidden).toBe(false);

    for (const module of [
      'payroll-admin',
      'payroll-worker',
      'access',
      'dev-notifications',
    ]) {
      expect(byId(`nav-${module}`).hidden).toBe(true);
      byId(`nav-${module}`).click();
      expect(byId(`view-${module}`).hidden).toBe(true);
    }

    byId('nav-search').click();
    expect(byId('view-search').hidden).toBe(false);
  });

  it('el modo invitado sobrevive la recarga y puede volver al acceso', () => {
    initApp(userConfig);
    byId('login-guest').click();

    loadAppMarkup();
    initApp(userConfig);
    expect(byId('view-dashboard').hidden).toBe(false);
    expect(byId('nav-login').hidden).toBe(false);
    expect(byId('session-role').textContent).toBe('Rol: Invitado');

    byId('nav-login').click();
    expect(byId('view-login').hidden).toBe(false);
    expect(loadSession()).toBeNull();
    expect(byId('nav-login').hidden).toBe(true);
    expect(byId('sidebar').hidden).toBe(true);
    expect(byId('session-role').hidden).toBe(true);
  });

  it('matriz de acceso: el rol define quién ve cada liquidación', () => {
    expect(canAccess('payroll-worker', { role: 'trabajador' })).toBe(true);
    expect(canAccess('payroll-admin', { role: 'administrador' })).toBe(true);
    expect(canAccess('dashboard', { role: 'invitado' })).toBe(true);
    expect(canAccess('payroll-worker', { role: 'invitado' })).toBe(false);
    expect(canAccess('payroll-admin', { role: 'invitado' })).toBe(false);
    expect(canAccess('access', { role: 'invitado' })).toBe(false);
    expect(resolveRoute('payroll-admin', { role: 'invitado' })).toBe(
      'dashboard'
    );
    expect(resolveRoute('payroll-worker', { role: 'trabajador' })).toBe(
      'payroll-worker'
    );
  });

  it('al iniciar sesión se actualizan la barra lateral y el cierre de sesión', () => {
    setupAdminSession();
    initApp(userConfig);
    byId('nav-logout').click();
    expect(byId('view-login').hidden).toBe(false);

    submitLogin({
      rut: '11111111-1',
      password: '1111',
    });

    expect(byId('view-dashboard').hidden).toBe(false);
    expect(byId('nav-logout').hidden).toBe(false);
    expect(byId('nav-payroll-admin').hidden).toBe(false);
    expect(byId('dashboard-guest-note').hidden).toBe(true);
  });

  it('ya no existe el botón duplicado "Nueva entidad" y el acceso rápido restante abre terceros', () => {
    setupAdminSession();
    initApp(userConfig);

    expect(byId('qa-new-entity')).toBeNull();
    byId('qa-manage-entities').click();
    expect(byId('view-entities').hidden).toBe(false);
  });

  it('salir del modo invitado limpia la sesión de la pestaña', () => {
    initApp(userConfig);
    byId('login-guest').click();

    byId('nav-login').click();
    expect(clearSession()).toBeUndefined();
    expect(byId('view-login').hidden).toBe(false);
    expect(appState.session).toBeNull();
  });
});
