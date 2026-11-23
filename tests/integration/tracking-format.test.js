import { describe, expect, it } from 'vitest';
import { renderTrackingView } from '../../src/components/tracking.js';

describe('T102 - formato CLP de Seguimiento', () => {
  it('muestra totales con separador de miles y signo negativo delante del peso', () => {
    document.body.innerHTML = '<div id="tracking-container"></div>';
    const container = document.getElementById('tracking-container');

    renderTrackingView(
      container,
      [{ entity_id: 'ent-1', name: 'Tercero prueba' }],
      [
        {
          document_id: 'doc-1',
          entity_id: 'ent-1',
          status: 'Emitida',
          totalAmount: 1240000,
          customFields: { tipoFactura: 'venta' },
        },
        {
          document_id: 'doc-2',
          entity_id: 'ent-1',
          status: 'Emitida',
          totalAmount: -2430000,
          customFields: { tipoFactura: 'compra' },
        },
      ]
    );

    const totales = Array.from(container.querySelectorAll('.record-total')).map(
      (element) => element.textContent
    );
    expect(totales).toEqual([
      'Total por cobrar: $1.240.000',
      'Total por pagar: -$2.430.000',
    ]);
  });
});
