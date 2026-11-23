import { describe, expect, it } from 'vitest';
import { renderMovementsList } from '../../src/components/movements-list.js';

describe('T101 - formato CLP de Movimientos financieros', () => {
  it('muestra montos con separador de miles y signo negativo delante del peso', () => {
    document.body.innerHTML = '<div id="movements-container"></div>';
    const container = document.getElementById('movements-container');

    renderMovementsList(
      container,
      [
        {
          id: 'mov-1',
          document_id: 'doc-1',
          entity_id: 'ent-1',
          fecha: '2026-02-03',
          tipo: 'cargo',
          monto: 1240000,
        },
        {
          id: 'mov-2',
          document_id: 'doc-2',
          entity_id: 'ent-1',
          fecha: '2026-02-04',
          tipo: 'pago',
          monto: -2430000,
        },
      ],
      [{ entity_id: 'ent-1', name: 'Tercero prueba' }]
    );

    const montos = Array.from(container.querySelectorAll('.record-total')).map(
      (element) => element.textContent
    );
    expect(montos).toEqual(['Monto: $1.240.000', 'Monto: -$2.430.000']);
  });
});
