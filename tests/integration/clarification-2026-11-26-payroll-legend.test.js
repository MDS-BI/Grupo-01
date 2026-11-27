import { beforeEach, describe, expect, it } from 'vitest';
import { renderPayrollList } from '../../src/components/payroll-list.js';

const entity = Object.freeze({
  entity_id: 'ent-trabajador',
  name: 'Ana Pérez',
  taxId: '15432876-9',
  customFields: { tipoTercero: 'personal' },
});

let settlements;
let container;

beforeEach(() => {
  document.body.innerHTML = '<div id="payroll-list"></div>';
  container = document.getElementById('payroll-list');
  settlements = [
    {
      entityId: entity.entity_id,
      periodo: '2026-11',
      monto: 250000,
      estado: 'Borrador',
      fechaPago: '2026-11-25',
    },
  ];
});

describe('Clarificación 2026-11-26 - leyenda de liquidaciones', () => {
  it('explica el ciclo con las etiquetas canónicas', () => {
    renderPayrollList(container, {
      settlements,
      entities: [entity],
      records: [],
    });

    const legend = container.querySelector('.payroll-legend');
    expect(legend).toBeTruthy();
    expect(legend.textContent).toContain('Borrador (RRHH la prepara)');
    expect(legend.textContent).toContain('Emitida (aprobada por RRHH)');
    expect(legend.textContent).toContain('Pagada (finanzas registró el pago)');
  });

  it('muestra el RUT con puntos sin normalizar el almacenamiento', () => {
    renderPayrollList(container, {
      settlements,
      entities: [entity],
      records: [],
    });

    const cells = container.querySelectorAll('tbody tr td');
    expect(cells[1].textContent).toBe('15.432.876-9');
    expect(entity.taxId).toBe('15432876-9');
    expect(settlements[0].fechaPago).toBe('2026-11-25');
  });
});
