import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import {
  DEFAULT_CONFIG,
  userConfig,
  getConfig,
} from '../../src/module-config.js';
import { addDocument, addEntity } from '../../src/storage.js';
import { loadDemoData } from '../../src/demo-data.js';
import { saveAccessRecords } from '../../src/access-storage.js';
import { saveSession } from '../../src/session.js';
import { loadAppMarkup, setupAdminSession } from '../setup/domFixture.js';

function setupFinanceSession() {
  const now = new Date().toISOString();
  saveAccessRecords([
    {
      accessId: '55555555-5',
      role: 'finanzas',
      entityId: null,
      password: '5555',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  saveSession({
    accessId: '55555555-5',
    role: 'finanzas',
    entityId: null,
    startedAt: now,
  });
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
  setupAdminSession();
});

describe('US3 - panel de inicio', () => {
  it('muestra estadísticas coherentes con el almacenamiento', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' }, DEFAULT_CONFIG);
    addDocument(
      {
        entity_id: entity.entity_id,
        folio: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      },
      DEFAULT_CONFIG
    );
    initApp(DEFAULT_CONFIG);

    expect(document.getElementById('stat-entities').textContent).toBe('1');
    expect(document.getElementById('stat-documents').textContent).toBe('1');
  });

  it('las acciones rápidas navegan a la vista correcta', () => {
    initApp(DEFAULT_CONFIG);

    document.getElementById('qa-manage-entities').click();
    expect(document.getElementById('view-entities').hidden).toBe(false);
    expect(document.getElementById('name').value).toBe('');

    document.getElementById('qa-search').click();
    expect(document.getElementById('view-search').hidden).toBe(false);
    expect(document.activeElement).toBe(
      document.getElementById('search-input')
    );
  });

  it('los KPIs del home se calculan sobre las facturas con el módulo financiero', () => {
    initApp(userConfig);
    expect(document.getElementById('kpi-por-cobrar').textContent).toBe('0');
    expect(document.getElementById('kpi-por-pagar').textContent).toBe('0');
    expect(document.getElementById('kpi-vencidas').textContent).toBe('0');
  });

  it('con datos de demostración el home muestra KPIs coherentes con el seguimiento', () => {
    const config = getConfig();
    loadDemoData(config);
    initApp(userConfig);

    const porCobrar = Number(
      document.getElementById('kpi-por-cobrar').textContent
    );
    const porPagar = Number(
      document.getElementById('kpi-por-pagar').textContent
    );
    const vencidas = Number(
      document.getElementById('kpi-vencidas').textContent
    );
    expect(porCobrar).toBeGreaterThan(0);
    expect(porPagar).toBeGreaterThan(0);
    expect(vencidas).toBeGreaterThan(0);
  });

  it('muestra la acción nueva liquidación con sesión de administrador', () => {
    initApp(DEFAULT_CONFIG);

    expect(document.getElementById('view-dashboard').hidden).toBe(false);
    expect(document.getElementById('qa-new-payroll').hidden).toBe(false);
  });

  it('muestra la acción nueva liquidación con sesión de finanzas', () => {
    setupFinanceSession();
    initApp(DEFAULT_CONFIG);

    expect(document.getElementById('view-dashboard').hidden).toBe(false);
    expect(document.getElementById('qa-new-payroll').hidden).toBe(false);
    document.getElementById('qa-new-payroll').click();
    expect(document.getElementById('view-payroll-admin').hidden).toBe(false);
  });
});
