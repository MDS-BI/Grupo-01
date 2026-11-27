import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { renderPayrollList } from '../../src/components/payroll-list.js';
import {
  renderPayrollSettlement,
  renderWorkerMarkup,
} from '../../src/components/payroll-worker.js';
import { renderPurchaseList } from '../../src/components/invoice-purchase-list.js';
import { renderSaleList } from '../../src/components/invoice-sale-list.js';
import { renderMovementsList } from '../../src/components/movements-list.js';
import { getConfig } from '../../src/module-config.js';
import { addDocument, addEntity, updateDocument } from '../../src/storage.js';
import {
  loadAppMarkup,
  setupAdminSession,
  setupFinanzasSession,
} from '../setup/domFixture.js';

const config = getConfig();
const DATE = '2026-11-25';
const VISIBLE_DATE = '25-11-2026';

function entityMap(entities) {
  return new Map(entities.map((entity) => [entity.entity_id, entity.name]));
}

function paidInvoice({ name, code, tipoTercero, tipoFactura, folio }) {
  const entity = addEntity(
    { name, code, customFields: { tipoTercero } },
    config
  );
  const document = addDocument(
    {
      entity_id: entity.entity_id,
      series: 'A',
      folio,
      startDate: DATE,
      endDate: DATE,
      totalAmount: 250000,
      currency: 'CLP',
      customFields: { tipoFactura },
    },
    config
  );
  updateDocument(
    document.document_id,
    { status: 'Emitida', customFields: { tipoFactura } },
    config
  );
  updateDocument(
    document.document_id,
    {
      status: 'Pagada',
      customFields: { tipoFactura, fechaPago: DATE, montoPagado: 250000 },
    },
    config
  );
  return { entity, document };
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('Clarificación 2026-11-26 - fechas visibles', () => {
  it('muestra DD-MM-AAAA en listas de facturas de venta y compra', () => {
    const cliente = addEntity(
      {
        name: 'Cliente Fechas',
        code: 'CL-FE',
        customFields: { tipoTercero: 'cliente' },
      },
      config
    );
    const proveedor = addEntity(
      {
        name: 'Proveedor Fechas',
        code: 'PV-FE',
        customFields: { tipoTercero: 'proveedor' },
      },
      config
    );
    const venta = addDocument(
      {
        entity_id: cliente.entity_id,
        series: 'A',
        folio: 1,
        startDate: DATE,
        endDate: DATE,
        totalAmount: 250000,
        currency: 'CLP',
        customFields: { tipoFactura: 'venta' },
      },
      config
    );
    const compra = addDocument(
      {
        entity_id: proveedor.entity_id,
        series: 'B',
        folio: 2,
        startDate: DATE,
        endDate: DATE,
        totalAmount: 250000,
        currency: 'CLP',
        customFields: { tipoFactura: 'compra' },
      },
      config
    );
    const entities = entityMap([cliente, proveedor]);
    const saleContainer = document.createElement('div');
    const purchaseContainer = document.createElement('div');

    renderSaleList(saleContainer, [venta], entities, {
      readOnlyIds: new Set(),
    });
    renderPurchaseList(purchaseContainer, [compra], entities, {
      readOnlyIds: new Set(),
    });

    for (const container of [saleContainer, purchaseContainer]) {
      expect(container.textContent).toContain(VISIBLE_DATE);
      expect(container.textContent).not.toContain(DATE);
    }
  });

  it('muestra DD-MM-AAAA en movimientos financieros', () => {
    const container = document.createElement('div');

    renderMovementsList(
      container,
      [
        {
          id: 'mov-1',
          document_id: 'doc-venta-1',
          entity_id: 'ent-cliente',
          fecha: DATE,
          tipo: 'cargo',
          monto: 250000,
        },
      ],
      [{ entity_id: 'ent-cliente', name: 'Cliente Fechas' }]
    );

    expect(container.textContent).toContain(VISIBLE_DATE);
    expect(container.textContent).not.toContain(DATE);
  });

  it('muestra DD-MM-AAAA en la columna Fecha del flujo de caja', () => {
    paidInvoice({
      name: 'Cliente Flujo',
      code: 'CL-FL',
      tipoTercero: 'cliente',
      tipoFactura: 'venta',
      folio: 1,
    });
    setupFinanzasSession();
    initApp(config);
    document.getElementById('qa-cashflow').click();

    const rows = document
      .getElementById('cashflow-table')
      .querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    const firstCell = rows[0].cells[0].textContent;
    expect(firstCell).toBe(VISIBLE_DATE);
    expect(document.getElementById('view-cashflow').textContent).not.toContain(
      DATE
    );
  });

  it('muestra DD-MM-AAAA en Mi liquidación y Gestionar liquidaciones', () => {
    setupAdminSession();
    const entity = {
      entity_id: 'ent-trabajador',
      name: 'Ana Pérez',
      taxId: '15432876-9',
      customFields: { tipoTercero: 'personal' },
    };
    const settlement = {
      entityId: entity.entity_id,
      periodo: '2026-11',
      monto: 250000,
      estado: 'Pagada',
      fechaPago: DATE,
    };

    renderWorkerMarkup();
    renderPayrollSettlement(
      settlement,
      [settlement],
      entity,
      'Aviso de prueba'
    );
    expect(document.getElementById('payroll-worker-paid-at').textContent).toBe(
      `Fecha de pago: ${VISIBLE_DATE}`
    );
    expect(
      document.querySelector('#payroll-worker-history tr td').textContent
    ).toBe(VISIBLE_DATE);

    const container = document.createElement('div');
    renderPayrollList(container, {
      settlements: [settlement],
      entities: [entity],
      records: [],
    });
    const cells = container.querySelectorAll('tbody tr td');
    expect(cells[5].textContent).toBe(VISIBLE_DATE);
    expect(container.textContent).not.toContain(DATE);
  });
});
