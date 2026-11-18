import { beforeEach, describe, expect, it } from 'vitest';
import { appState, canAccess, initApp, resolveRoute } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addDocument, addEntity } from '../../src/storage.js';
import { clearSession, loadSession, saveSession } from '../../src/session.js';
import { loadAppMarkup } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

function businessViews() {
  return Array.from(document.querySelectorAll('main section.view'))
    .map((section) => section.id.replace(/^view-/, ''))
    .filter((view) => view !== 'login');
}

function seedBusinessData() {
  const worker = addEntity(
    {
      name: 'Dato Confidencial',
      code: 'CONF-001',
      taxId: '22222222-2',
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
  addDocument(
    {
      entity_id: worker.entity_id,
      series: 'LIQ',
      folio: '7777',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      totalAmount: 987654,
      status: 'Borrador',
      customFields: {
        tipoFactura: 'compra',
        periodoLiquidacion: '2026-10',
      },
    },
    userConfig
  );
}

function visibleViewText() {
  return Array.from(document.querySelectorAll('main section.view'))
    .filter((section) => !section.hidden)
    .map((section) => section.textContent)
    .join(' ');
}

describe('Acceso obligatorio sin modo invitado', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
  });

  it('no quedan controles ni textos del modo invitado en la pantalla de acceso', () => {
    initApp(userConfig);

    expect(byId('login-guest')).toBeNull();
    expect(byId('nav-login')).toBeNull();
    expect(byId('dashboard-guest-note')).toBeNull();
    expect(document.body.textContent).not.toContain('Rol: Invitado');
    expect(document.body.textContent).not.toContain(
      'Continuar sin iniciar sesión'
    );
    expect(byId('login-submit')).not.toBeNull();
    expect(byId('login-demo-load')).not.toBeNull();
    expect(byId('nav-logout')).not.toBeNull();
  });

  it('una sesión de invitado no abre vistas ni muestra Rol: Invitado', () => {
    saveSession({
      accessId: null,
      role: 'invitado',
      entityId: null,
      startedAt: new Date().toISOString(),
    });
    seedBusinessData();

    initApp(userConfig);

    expect(loadSession()).toBeNull();
    expect(appState.session).toBeNull();
    expect(byId('view-login').hidden).toBe(false);
    for (const view of businessViews()) {
      expect(byId(`view-${view}`).hidden).toBe(true);
    }
    expect(byId('session-role').textContent).not.toContain('Invitado');
    expect(document.body.textContent).not.toContain('Rol: Invitado');
    expect(byId('sidebar').hidden).toBe(true);
  });

  it('canAccess y resolveRoute rechazan el rol invitado en toda vista de negocio', () => {
    const views = businessViews();
    expect(views.length).toBeGreaterThan(0);

    for (const view of views) {
      expect(canAccess(view, { role: 'invitado' })).toBe(false);
      expect(resolveRoute(view, { role: 'invitado' })).toBe('login');
      expect(canAccess(view, null)).toBe(false);
      expect(resolveRoute(view, null)).toBe('login');
    }

    expect(canAccess('dashboard', { role: 'administrador' })).toBe(true);
    expect(resolveRoute('payroll-admin', { role: 'administrador' })).toBe(
      'payroll-admin'
    );
  });

  it('sin sesión, cualquier enlace directo vuelve al acceso sin exponer datos de negocio', () => {
    seedBusinessData();
    initApp(userConfig);

    expect(byId('view-login').hidden).toBe(false);
    expect(byId('sidebar').hidden).toBe(true);
    expect(appState.session).toBeNull();
    expect(loadSession()).toBeNull();
    expect(appState.currentModule).toBe('login');

    for (const view of businessViews()) {
      byId(`nav-${view}`)?.click();
      expect(byId('view-login').hidden).toBe(false);
      expect(byId(`view-${view}`).hidden).toBe(true);
      expect(appState.currentModule).toBe('login');
    }

    const visibleViews = Array.from(
      document.querySelectorAll('main section.view')
    )
      .filter((section) => !section.hidden)
      .map((section) => section.id);
    expect(visibleViews).toEqual(['view-login']);
    expect(visibleViewText()).not.toContain('Dato Confidencial');
    expect(visibleViewText()).not.toContain('7777');
    expect(clearSession()).toBeUndefined();
  });
});
