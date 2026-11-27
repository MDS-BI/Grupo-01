import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';
import { createAccessRecord } from '../../src/access-storage.js';
import { saveSession } from '../../src/session.js';
import {
  loadAppMarkup,
  setupAdminSession,
  setupFinanzasSession,
} from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

function signInWorker() {
  const entity = addEntity(
    {
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      taxId: '22.222.222-2',
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
  const access = createAccessRecord(
    {
      accessId: '22.222.222-2',
      role: 'trabajador',
      entityId: entity.entity_id,
      password: '2222',
    },
    { entities: [entity], records: [] }
  );
  saveSession({
    accessId: access.accessId,
    role: 'trabajador',
    entityId: entity.entity_id,
    startedAt: new Date().toISOString(),
  });
}

function navigate(module) {
  byId(`nav-${module}`).click();
}

describe('Banner contextual - nombre de vista y franja de retorno', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('muestra el nombre de la vista con › fuera del Panel sin alterar #brand-name', () => {
    setupFinanzasSession();
    initApp(userConfig);

    expect(byId('brand-name').textContent).toBe('Contabilidad y Finanzas');
    expect(byId('view-context')).toBeTruthy();
    expect(byId('view-context').hidden).toBe(true);

    navigate('invoice-purchase');
    expect(byId('brand-name').textContent).toBe('Contabilidad y Finanzas');
    expect(byId('view-context').hidden).toBe(false);
    expect(byId('view-context-separator').textContent).toBe('›');
    expect(byId('view-context-name').textContent).toBe('Facturas de compra');

    navigate('tracking');
    expect(byId('view-context-name').textContent).toBe('Seguimiento');
  });

  it('muestra la vista del administrador y del trabajador fuera del Panel', () => {
    setupAdminSession();
    initApp(userConfig);

    navigate('payroll-admin');
    expect(byId('view-context-name').textContent).toBe(
      'Gestionar liquidaciones de sueldo'
    );

    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    signInWorker();
    initApp(userConfig);

    navigate('payroll-worker');
    expect(byId('brand-name').textContent).toBe('Contabilidad y Finanzas');
    expect(byId('view-context').hidden).toBe(false);
    expect(byId('view-context-name').textContent).toBe('Mi liquidación');
  });

  it('conserva #back-bar exactamente como estaba', () => {
    setupFinanzasSession();
    initApp(userConfig);

    expect(byId('back-bar').hidden).toBe(true);

    navigate('invoice-purchase');
    expect(byId('back-bar').hidden).toBe(false);
    expect(byId('back-to-dashboard').textContent.trim()).toBe(
      '← Volver al Panel'
    );
    expect(byId('back-view-name').textContent).toBe('Facturas de compra');

    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    signInWorker();
    initApp(userConfig);

    navigate('payroll-worker');
    expect(byId('back-bar').hidden).toBe(true);
  });
});
