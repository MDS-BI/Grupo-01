import { beforeEach, describe, expect, it } from 'vitest';
import { ACCESS_STORAGE_KEYS } from '../../src/module-config.js';
import {
  appendDevNotification,
  clearDevNotifications,
  createAccessRecord,
  deactivateAccessRecord,
  loadAccessRecords,
  loadDevNotifications,
  resetPassword,
  saveAccessRecords,
  updateAccessRecord,
} from '../../src/access-storage.js';
import { ValidationFailure } from '../../src/storage.js';
import { initialPassword } from '../../src/auth.js';

function entity(tipoTercero = 'personal', entityId = 'ent_worker') {
  return {
    entity_id: entityId,
    name: 'Ana Pérez Soto',
    customFields: { tipoTercero },
  };
}

function adminRecord() {
  return {
    accessId: '11111111-1',
    role: 'administrador',
    entityId: null,
    password: '1111',
    active: true,
    createdAt: '2026-11-11T12:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
  };
}

function workerRecord() {
  return {
    accessId: '22222222-2',
    role: 'trabajador',
    entityId: 'ent_worker',
    password: '2222',
    active: true,
    createdAt: '2026-11-11T12:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
  };
}

describe('access-storage: persistencia de accesos', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('persiste los accesos en la clave erp.accessRecords', () => {
    saveAccessRecords([workerRecord()]);
    expect(
      JSON.parse(localStorage.getItem(ACCESS_STORAGE_KEYS.accessRecords))
    ).toHaveLength(1);
  });

  it('crea un acceso de trabajador con la contraseña inicial derivada del RUT', () => {
    const record = createAccessRecord(
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: 'ent_worker',
        password: initialPassword('22222222-2'),
      },
      { entities: [entity()], records: [] }
    );
    expect(record.accessId).toBe('22222222-2');
    expect(record.password).toBe('2222');
    expect(record.active).toBe(true);
    expect(loadAccessRecords()).toHaveLength(1);
  });

  it('rechaza un RUT inválido sin persistir', () => {
    expect(() =>
      createAccessRecord(
        {
          accessId: '12345678-1',
          role: 'trabajador',
          entityId: 'ent_worker',
          password: '1234',
        },
        { entities: [entity()], records: [] }
      )
    ).toThrow(ValidationFailure);
    expect(loadAccessRecords()).toHaveLength(0);
  });

  it('rechaza un RUT duplicado', () => {
    expect(() =>
      createAccessRecord(
        {
          accessId: '22222222-2',
          role: 'trabajador',
          entityId: 'ent_worker',
          password: '2222',
        },
        { entities: [entity()], records: [workerRecord()] }
      )
    ).toThrow(ValidationFailure);
  });

  it('exige un tercero personal para trabajadores y lo valida', () => {
    expect(() =>
      createAccessRecord(
        {
          accessId: '22222222-2',
          role: 'trabajador',
          entityId: null,
          password: '2222',
        },
        { entities: [entity()], records: [] }
      )
    ).toThrow(ValidationFailure);

    expect(() =>
      createAccessRecord(
        {
          accessId: '22222222-2',
          role: 'trabajador',
          entityId: 'ent_admin',
          password: '2222',
        },
        { entities: [entity('cliente')], records: [] }
      )
    ).toThrow(ValidationFailure);
  });

  it('rechaza la contraseña cuando no es la inicial derivada del RUT', () => {
    expect(() =>
      createAccessRecord(
        {
          accessId: '22222222-2',
          role: 'trabajador',
          entityId: 'ent_worker',
          password: '9999',
        },
        { entities: [entity()], records: [] }
      )
    ).toThrow(ValidationFailure);
  });

  it('permite crear un administrador sin tercero', () => {
    const record = createAccessRecord(
      {
        accessId: '12121212-9',
        role: 'administrador',
        entityId: null,
        password: '1212',
      },
      { entities: [], records: [adminRecord()] }
    );
    expect(record.role).toBe('administrador');
  });
});

describe('access-storage: ciclo de vida de accesos', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('desactiva accesos y protege el último administrador', () => {
    const worker = deactivateAccessRecord('22222222-2', {
      entities: [entity()],
      records: [adminRecord(), workerRecord()],
    });
    expect(worker.active).toBe(false);

    expect(() =>
      deactivateAccessRecord('11111111-1', {
        entities: [],
        records: [adminRecord(), workerRecord()],
      })
    ).toThrow(ValidationFailure);
    const admin = loadAccessRecords().find(
      (record) => record.accessId === '11111111-1'
    );
    expect(admin.active).toBe(true);
  });

  it('restablece la contraseña inicial del RUT', () => {
    const updated = updateAccessRecord(
      '22222222-2',
      { password: '2222' },
      { entities: [entity()], records: [workerRecord()] }
    );
    expect(updated.password).toBe('2222');
    expect(
      resetPassword('22222222-2', {
        entities: [entity()],
        records: [workerRecord()],
      }).password
    ).toBe('2222');
  });
});

describe('access-storage: notificaciones al desarrollador', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('acumula y limpia las notificaciones', () => {
    expect(loadDevNotifications()).toEqual([]);
    const notification = appendDevNotification({
      accessId: '22222222-2',
      role: 'trabajador',
      reason: 'BROKEN_ENTITY_LINK',
      origin: 'login',
    });
    expect(loadDevNotifications()).toHaveLength(1);
    expect(notification.reason).toBe('BROKEN_ENTITY_LINK');
    clearDevNotifications();
    expect(loadDevNotifications()).toEqual([]);
  });
});
