import { beforeEach, describe, expect, it } from 'vitest';
import { initApp, appState } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';
import {
  createAccessRecord,
  deactivateAccessRecord,
  loadAccessRecords,
  loadDevNotifications,
  reactivateAccessRecord,
  resetPassword,
} from '../../src/access-storage.js';
import { clearSession, saveSession } from '../../src/session.js';
import { loadAppMarkup, submit } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

function personal(rut, code) {
  return addEntity(
    {
      name: `Trabajador ${code}`,
      code,
      taxId: rut,
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
}

function adminSession() {
  saveSession({
    accessId: '11111111-1',
    role: 'administrador',
    entityId: null,
    startedAt: new Date().toISOString(),
  });
}

function adminAccess(existing = []) {
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

function fillAccessForm({ role = 'trabajador', rut, entityId }) {
  byId('access-role').value = role;
  byId('access-rut').value = rut;
  byId('access-rut').dispatchEvent(new Event('input', { bubbles: true }));
  if (entityId) {
    byId('access-entity').value = entityId;
    expect(byId('access-entity').value).toBe(entityId);
  }
  submit('access-form');
}

describe('US2 - administración de accesos', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    appState.currentModule = 'dashboard';
  });

  it('crea un acceso de trabajador desde el formulario con contraseña inicial derivada', () => {
    const worker = personal('22.222.222-2', 'PE-001');
    adminAccess();
    adminSession();
    initApp(userConfig);
    byId('nav-access').click();

    expect(
      Array.from(byId('access-entity').options, (option) => option.value)
    ).toContain(worker.entity_id);
    fillAccessForm({ rut: '22.222.222-2', entityId: worker.entity_id });

    const record = loadAccessRecords().find(
      (item) => item.accessId === '22222222-2'
    );
    expect(record).toMatchObject({
      role: 'trabajador',
      entityId: worker.entity_id,
      password: '2222',
      active: true,
    });
    expect(byId('access-list').textContent).toContain('22.222.222-2');
  });

  it('muestra la contraseña inicial de solo lectura al escribir el RUT', () => {
    adminAccess();
    adminSession();
    initApp(userConfig);
    byId('nav-access').click();

    byId('access-rut').value = '22.222.222-2';
    byId('access-rut').dispatchEvent(new Event('input', { bubbles: true }));
    expect(byId('access-password').value).toBe('2222');
    expect(byId('access-password').readOnly).toBe(true);
  });

  it('solo ofrece terceros personales sin acceso activo', () => {
    const free = personal('33.333.333-3', 'PE-002');
    const linked = personal('22.222.222-2', 'PE-001');
    adminAccess();
    createAccessRecord(
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: linked.entity_id,
        password: '2222',
      },
      { entities: [linked], records: loadAccessRecords() }
    );
    adminSession();
    initApp(userConfig);
    byId('nav-access').click();

    const options = Array.from(
      byId('access-entity').options,
      (option) => option.value
    );
    expect(options).toContain(free.entity_id);
    expect(options).not.toContain(linked.entity_id);
  });

  it('rechaza el RUT duplicado, muestra el error y avisa al desarrollador', () => {
    const worker = personal('22.222.222-2', 'PE-001');
    const free = personal('33.333.333-3', 'PE-002');
    const admin = adminAccess();
    createAccessRecord(
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: worker.entity_id,
        password: '2222',
      },
      { entities: [worker], records: [admin] }
    );
    adminSession();
    initApp(userConfig);
    byId('nav-access').click();

    fillAccessForm({ rut: '22.222.222-2', entityId: free.entity_id });
    expect(byId('access-form-error').textContent).toContain('RUT');
    expect(
      loadDevNotifications().some((note) => note.reason === 'DUPLICATE')
    ).toBe(true);
    expect(loadAccessRecords()).toHaveLength(2);
  });

  it('protege el último administrador activo', () => {
    adminAccess();
    adminSession();
    initApp(userConfig);
    byId('nav-access').click();

    const buttons = Array.from(
      byId('access-list').querySelectorAll('button'),
      (button) => button.textContent
    );
    expect(buttons).not.toContain('Desactivar');
  });

  it('el trabajador entra con la contraseña inicial creada por el administrador', () => {
    const worker = personal('22.222.222-2', 'PE-001');
    adminAccess();
    adminSession();
    initApp(userConfig);
    byId('nav-access').click();
    fillAccessForm({ rut: '22.222.222-2', entityId: worker.entity_id });
    expect(loadAccessRecords()).toHaveLength(2);

    clearSession();
    initApp(userConfig);
    byId('login-rut').value = '22.222.222-2';
    byId('login-password').value = '2222';
    submit('login-form');
    expect(byId('view-payroll-worker').hidden).toBe(false);
  });

  it('la desactivación y reactivación aplican en el siguiente intento de acceso', () => {
    const worker = personal('22.222.222-2', 'PE-001');
    const admin = adminAccess();
    createAccessRecord(
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: worker.entity_id,
        password: '2222',
      },
      { entities: [worker], records: [admin] }
    );

    deactivateAccessRecord('22222222-2', { records: loadAccessRecords() });
    clearSession();
    initApp(userConfig);
    byId('login-rut').value = '22.222.222-2';
    byId('login-password').value = '2222';
    submit('login-form');
    expect(byId('view-login').hidden).toBe(false);
    expect(byId('login-error').textContent).toContain('inactivo');

    reactivateAccessRecord('22222222-2', { records: loadAccessRecords() });
    byId('login-rut').value = '22.222.222-2';
    byId('login-password').value = '2222';
    submit('login-form');
    expect(byId('view-payroll-worker').hidden).toBe(false);
  });

  it('el restablecimiento de contraseña reaplica la inicial del RUT', () => {
    const worker = personal('22.222.222-2', 'PE-001');
    const admin = adminAccess();
    createAccessRecord(
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: worker.entity_id,
        password: '2222',
      },
      { entities: [worker], records: [admin] }
    );

    const updated = resetPassword('22222222-2', {
      records: loadAccessRecords(),
    });
    expect(updated.password).toBe('2222');
    clearSession();
    initApp(userConfig);
    byId('login-rut').value = '22.222.222-2';
    byId('login-password').value = '2222';
    submit('login-form');
    expect(byId('view-payroll-worker').hidden).toBe(false);
  });
});
