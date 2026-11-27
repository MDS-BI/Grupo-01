import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { initAccessAdmin } from '../../src/components/access-admin.js';
import { renderPayrollList } from '../../src/components/payroll-list.js';
import { renderSaleList } from '../../src/components/invoice-sale-list.js';
import { renderMovementsList } from '../../src/components/movements-list.js';
import { saveAccessRecords } from '../../src/access-storage.js';
import { getConfig } from '../../src/module-config.js';
import { addDocument, addEntity, updateDocument } from '../../src/storage.js';
import { loadAppMarkup, setupFinanzasSession } from '../setup/domFixture.js';

const config = getConfig();
const FORBIDDEN = ['doc_', 'ent_', 'set_', 'salesOrderId'];

function assertNoInternalText(container) {
  for (const token of FORBIDDEN) {
    expect(container.textContent).not.toContain(token);
  }
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('Clarificación 2026-11-26 - etiquetas legibles', () => {
  it('no muestra identificadores internos en listas de facturas', () => {
    const cliente = addEntity(
      {
        name: 'Cliente Etiquetas',
        code: 'CL-ET',
        customFields: { tipoTercero: 'cliente' },
      },
      config
    );
    const venta = addDocument(
      {
        entity_id: cliente.entity_id,
        series: 'A',
        folio: 1,
        startDate: '2026-11-01',
        endDate: '2026-11-25',
        totalAmount: 250000,
        currency: 'CLP',
        customFields: { tipoFactura: 'venta' },
      },
      config
    );
    const entities = new Map([[cliente.entity_id, cliente.name]]);
    const container = document.createElement('div');

    renderSaleList(container, [venta], entities, { readOnlyIds: new Set() });

    assertNoInternalText(container);
  });

  it('muestra tipos, referencias y terceros legibles en movimientos', () => {
    const cliente = {
      entity_id: 'ent-cliente',
      name: 'Cliente Etiquetas',
      taxId: '12345678-5',
    };
    const venta = {
      document_id: 'doc_venta_1',
      series: 'A',
      folio: 1,
      customFields: { tipoFactura: 'venta', salesOrderId: 'PED-036' },
    };
    const compra = {
      document_id: 'doc_compra_2',
      series: 'B',
      folio: 2,
      customFields: { tipoFactura: 'compra' },
    };
    const container = document.createElement('div');

    renderMovementsList(
      container,
      [
        {
          id: 'mov-1',
          document_id: venta.document_id,
          entity_id: cliente.entity_id,
          fecha: '2026-11-25',
          tipo: 'cargo',
          monto: 250000,
          salesOrderId: 'PED-036',
        },
        {
          id: 'mov-2',
          document_id: compra.document_id,
          entity_id: cliente.entity_id,
          fecha: '2026-11-25',
          tipo: 'pago',
          monto: -100000,
        },
      ],
      [cliente],
      [venta, compra]
    );

    expect(container.textContent).toContain('Venta emitida');
    expect(container.textContent).toContain('Pago');
    expect(container.textContent).toContain('Venta A #1');
    expect(container.textContent).toContain('Compra B #2');
    expect(container.textContent).toContain('Orden de venta: PED-036');
    expect(container.textContent).toContain('Cliente Etiquetas');
    assertNoInternalText(container);
  });

  it('no muestra identificadores internos en flujo de caja ni liquidaciones', () => {
    const entidad = addEntity(
      {
        name: 'Proveedor Etiquetas',
        code: 'PV-ET',
        customFields: { tipoTercero: 'proveedor' },
      },
      config
    );
    const compra = addDocument(
      {
        entity_id: entidad.entity_id,
        series: 'B',
        folio: 2,
        startDate: '2026-11-01',
        endDate: '2026-11-25',
        totalAmount: 100000,
        currency: 'CLP',
        customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
      },
      config
    );
    updateDocument(
      compra.document_id,
      {
        status: 'Emitida',
        customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
      },
      config
    );
    updateDocument(
      compra.document_id,
      {
        status: 'Pagada',
        customFields: {
          tipoFactura: 'compra',
          centroCosto: 'Consumible',
          fechaPago: '2026-11-25',
          montoPagado: 100000,
        },
      },
      config
    );
    setupFinanzasSession();
    initApp(config);
    document.getElementById('qa-cashflow').click();
    const cashflow = document.getElementById('view-cashflow');
    assertNoInternalText(cashflow);

    const payrollContainer = document.createElement('div');
    renderPayrollList(payrollContainer, {
      settlements: [
        {
          entityId: entidad.entity_id,
          documentId: compra.document_id,
          periodo: '2026-11',
          monto: 100000,
          estado: 'Pagada',
          fechaPago: '2026-11-25',
        },
      ],
      entities: [entidad],
      records: [],
      documents: [compra],
    });
    assertNoInternalText(payrollContainer);
  });

  it('muestra el tercero por nombre en Control de accesos', () => {
    const trabajador = addEntity(
      {
        name: 'Ana Pérez',
        code: 'PE-ET',
        taxId: '15432876-9',
        customFields: { tipoTercero: 'personal' },
      },
      config
    );
    saveAccessRecords([
      {
        accessId: '15432876-9',
        role: 'trabajador',
        entityId: trabajador.entity_id,
        password: '1543',
        active: true,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ]);

    initAccessAdmin({ config });

    const list = document.getElementById('access-list');
    expect(list.textContent).toContain('Tercero: Ana Pérez');
    assertNoInternalText(list);
  });
});
