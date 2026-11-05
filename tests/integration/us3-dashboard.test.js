import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import {
  DEFAULT_CONFIG,
  userConfig,
  getConfig,
} from '../../src/module-config.js';
import { addDocument, addEntity } from '../../src/storage.js';
import { loadDemoData } from '../../src/demo-data.js';
import { loadAppMarkup } from '../setup/domFixture.js';

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
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

    document.getElementById('qa-new-entity').click();
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
    expect(document.getElementById('qa-load-demo').hidden).toBe(false);
  });

  it('con datos de demostración el home muestra KPIs coherentes con el seguimiento', () => {
    const config = getConfig();
    loadDemoData(config);
    initApp(userConfig);

    expect(document.getElementById('qa-load-demo').hidden).toBe(true);
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
});
