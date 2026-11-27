import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  renderPayrollSettlement,
  renderWorkerMarkup,
} from '../../src/components/payroll-worker.js';
import { loadAppMarkup } from '../setup/domFixture.js';

const css = fs.readFileSync(
  path.resolve(process.cwd(), 'src/styles.css'),
  'utf8'
);
const mediaBlockMatch = css.match(
  /@media \(max-width: 640px\)\s*\{([\s\S]*?)\n\}/
);

function ruleFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(
    css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')),
    (match) => match[1]
  ).join(' ');
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('paleta v1.2.0 - badge del historial del trabajador', () => {
  it('coloca la etiqueta de estado dentro de la celda sin estirar la fila', () => {
    const entity = {
      entity_id: 'ent-history',
      name: 'Ana Pérez',
      taxId: '22.222.222-2',
    };
    renderWorkerMarkup();
    renderPayrollSettlement(
      {
        estado: 'Pagada',
        monto: 250000,
        periodo: '2026-01',
        fechaPago: '2026-01-20',
      },
      [
        {
          estado: 'Pagada',
          monto: 250000,
          periodo: '2026-01',
          fechaPago: '2026-01-20',
        },
      ],
      entity
    );

    const cells = Array.from(
      document.querySelectorAll('#payroll-worker-history tr:first-child td')
    );
    const statusCell = cells[3];
    const badge = statusCell?.querySelector('.status-badge');

    expect(statusCell?.classList.contains('status-badge')).toBe(false);
    expect(badge?.textContent).toBe('Pagada');
    expect(badge?.classList.contains('status-badge--paid')).toBe(true);
  });

  it('mantiene el badge en línea y sin reglas movibles en 640 px', () => {
    const block = mediaBlockMatch?.[1] ?? '';

    expect(ruleFor('.status-badge')).toContain('display: inline-block');
    expect(block).not.toMatch(/td\.status-badge/);
    expect(block).not.toMatch(
      /#payroll-worker-history-table\s+\.status-badge[^}]*display:\s*block/
    );
    expect(block).not.toMatch(
      /#payroll-worker-history-table\s+\.status-badge[^}]*width:\s*100%/
    );
  });
});
