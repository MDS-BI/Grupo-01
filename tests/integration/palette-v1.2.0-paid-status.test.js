import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderPayrollList } from '../../src/components/payroll-list.js';
import {
  renderPayrollSettlement,
  renderWorkerMarkup,
} from '../../src/components/payroll-worker.js';
import { loadAppMarkup } from '../setup/domFixture.js';

const css = fs
  .readFileSync(path.resolve(process.cwd(), 'src/styles.css'), 'utf8')
  .toLowerCase();

function ruleFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(
    css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')),
    (match) => match[1]
  ).join(' ');
}

function container(id) {
  const element = document.createElement('div');
  element.id = id;
  document.body.append(element);
  return element;
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('paleta v1.2.0 - estado Pagada', () => {
  it('conserva el texto Pagada en la lista y en Mi liquidación', () => {
    const entity = {
      entity_id: 'ent-paid',
      name: 'Tercero Pagado',
      taxId: '12345678-5',
    };
    const listContainer = container('paid-status-list');
    renderPayrollList(listContainer, {
      settlements: [
        {
          settlementId: 'set-paid',
          entityId: entity.entity_id,
          estado: 'Pagada',
          monto: 100,
          periodo: '2026-01',
          fechaPago: '2026-01-20',
        },
      ],
      entities: [entity],
    });
    const listBadge = listContainer.querySelector('.status-badge--paid');
    expect(listBadge?.textContent).toBe('Pagada');

    renderWorkerMarkup();
    renderPayrollSettlement(
      {
        estado: 'Pagada',
        monto: 100,
        periodo: '2026-01',
        fechaPago: '2026-01-20',
      },
      [],
      entity
    );
    const workerStatus = document.getElementById('payroll-worker-status');
    expect(workerStatus?.textContent).toBe('Estado: Pagada');
    expect(workerStatus?.classList.contains('status-badge--paid')).toBe(true);
  });

  it('aplica la paleta Pagada con precedencia sobre .worker-status', () => {
    const specificPaid =
      ruleFor('.payroll-table .status-badge--paid') +
      ruleFor('#payroll-worker-status.status-badge--paid');

    expect(specificPaid).toContain('#126782');
    expect(specificPaid).toContain('#219ebc');
    expect(css.indexOf('.payroll-table .status-badge--paid')).toBeGreaterThan(
      css.indexOf('.worker-status,')
    );
    expect(
      css.indexOf('#payroll-worker-status.status-badge--paid')
    ).toBeGreaterThan(css.indexOf('.worker-status,'));
    expect(css.indexOf('.payroll-table .status-badge--paid')).toBeGreaterThan(
      css.indexOf('.status-badge {')
    );
  });
});
