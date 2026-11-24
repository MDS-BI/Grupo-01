import { describe, expect, it } from 'vitest';
import { renderEntityList } from '../../src/components/entity-list.js';
import { renderPayrollList } from '../../src/components/payroll-list.js';
import { loadDemoData } from '../../src/demo-data.js';
import { normalizeConfig, userConfig } from '../../src/module-config.js';
import { resolveAdminSettlements } from '../../src/payroll.js';
import { searchEntities } from '../../src/search.js';
import {
  loadEntities,
  loadPayrollSettlements,
  loadPurchaseInvoices,
} from '../../src/storage.js';

const { config } = normalizeConfig({ moduleName: 'Rendimiento' });

function buildEntities(count) {
  return Array.from({ length: count }, (_, index) => ({
    entity_id: `ent_${index}`,
    name: `Entidad ${index}`,
    code: `COD-${String(index).padStart(4, '0')}`,
    description: `Descripción ${index}`,
    customFields: { segment: index % 2 === 0 ? 'Oro' : 'Plata' },
  }));
}

describe('rendimiento', () => {
  it('busca y filtra 500 entidades en menos de 100 ms', () => {
    const entities = buildEntities(500);
    const started = performance.now();
    const results = searchEntities(entities, 'COD-0499', config);
    const elapsed = performance.now() - started;

    expect(results).toHaveLength(1);
    expect(elapsed).toBeLessThan(100);
  });

  it('renderiza 500 entidades en menos de 200 ms', () => {
    const entities = buildEntities(500);
    const warmup = document.createElement('div');
    renderEntityList(warmup, entities, {
      config,
      onEdit: () => {},
      onDelete: () => {},
    });

    const container = document.createElement('div');
    document.body.append(container);
    const started = performance.now();
    renderEntityList(container, entities, {
      config,
      onEdit: () => {},
      onDelete: () => {},
    });
    const elapsed = performance.now() - started;

    expect(container.querySelectorAll('.record-card')).toHaveLength(500);
    expect(elapsed).toBeLessThan(200);
  });

  it('filtra y renderiza las liquidaciones de demostración por RUT en menos de 1 s', () => {
    localStorage.clear();
    expect(loadDemoData(userConfig).ok).toBe(true);

    const entities = loadEntities();
    const container = document.createElement('div');
    const started = performance.now();
    const results = resolveAdminSettlements({
      settlements: loadPayrollSettlements(),
      purchaseInvoices: loadPurchaseInvoices(),
      entities,
      filters: { rut: '22.222.222-2' },
    });
    renderPayrollList(container, { settlements: results, entities });
    const elapsed = performance.now() - started;

    expect(results.length).toBeGreaterThan(0);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(results.length);
    expect(elapsed).toBeLessThan(1000);
  });
});
