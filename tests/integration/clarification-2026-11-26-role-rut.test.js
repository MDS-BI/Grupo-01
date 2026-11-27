import { beforeEach, describe, expect, it } from 'vitest';
import { saveAccessRecords } from '../../src/access-storage.js';
import { initAccessAdmin } from '../../src/components/access-admin.js';
import { setDashboardSession } from '../../src/components/dashboard.js';
import { createShell } from '../../src/components/shell.js';
import { getConfig } from '../../src/module-config.js';
import { resolveSessionProfile } from '../../src/session.js';
import { loadAppMarkup } from '../setup/domFixture.js';

const config = getConfig();
const byId = (id) => document.getElementById(id);

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('Clarificación 2026-11-26 - rol y RUT visibles', () => {
  it('deriva «Recursos Humanos» sin cambiar la clave interna', () => {
    expect(resolveSessionProfile({ role: 'administrador' })).toEqual({
      role: 'administrador',
      roleLabel: 'Recursos Humanos',
      displayName: 'Recursos Humanos',
      initials: 'R',
      source: 'role',
    });
  });

  it('muestra el rol visible en la cabecera y en el Panel', () => {
    createShell({
      config,
      session: { role: 'administrador' },
      onNavigate: () => {},
      onLogout: () => {},
      onOpenGuide: () => {},
    });
    expect(byId('session-role').textContent).toBe('Rol: Recursos Humanos');

    setDashboardSession({ role: 'administrador', startedAt: '2026-11-26' });
    expect(byId('dashboard-greeting').textContent).toBe(
      'Hola, Recursos Humanos'
    );
  });

  it('muestra «Recursos Humanos» en el selector sin cambiar el valor', () => {
    initAccessAdmin({ config });
    const option = document.querySelector(
      '#access-role option[value="administrador"]'
    );
    expect(option.textContent).toBe('Recursos Humanos');
    expect(option.value).toBe('administrador');
  });

  it('muestra RUT con puntos y roles legibles en Control de accesos', () => {
    saveAccessRecords([
      {
        accessId: '12345678-5',
        role: 'administrador',
        entityId: null,
        password: '1234',
        active: true,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        accessId: '12.345.678-5',
        role: 'finanzas',
        entityId: null,
        password: '1234',
        active: true,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ]);

    initAccessAdmin({ config });
    const text = byId('access-list').textContent;

    expect(text.match(/12\.345\.678-5/g)).toHaveLength(2);
    expect(text).not.toContain('12345678-5');
    expect(text).toContain('Recursos Humanos');
    expect(text).toContain('Finanzas');
  });
});
