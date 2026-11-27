import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { getConfig } from '../../src/module-config.js';
import { addDocument, addEntity, updateDocument } from '../../src/storage.js';
import { renderPurchaseList } from '../../src/components/invoice-purchase-list.js';
import { renderSaleList } from '../../src/components/invoice-sale-list.js';
import { renderPayrollList } from '../../src/components/payroll-list.js';
import {
  renderPayrollSettlement,
  renderWorkerMarkup,
} from '../../src/components/payroll-worker.js';
import { loadAppMarkup, setupFinanzasSession } from '../setup/domFixture.js';

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

describe('paleta v1.2.0 - etiquetas de estado', () => {
  it('clasifica estados de facturas y liquidaciones sin renombrarlos', () => {
    const config = getConfig();
    const entity = {
      entity_id: 'ent-status',
      name: 'Tercero Estado',
      customFields: { tipoTercero: 'cliente' },
    };
    const entities = new Map([[entity.entity_id, entity.name]]);
    const saleContainer = container('status-sale');
    const purchaseContainer = container('status-purchase');
    renderSaleList(
      saleContainer,
      [
        {
          document_id: 'doc-issued',
          entity_id: entity.entity_id,
          series: 'A',
          folio: 1,
          status: 'Emitida',
          totalAmount: 100,
          customFields: { tipoFactura: 'venta' },
        },
        {
          document_id: 'doc-paid',
          entity_id: entity.entity_id,
          series: 'A',
          folio: 2,
          status: 'Pagada',
          totalAmount: 100,
          customFields: { tipoFactura: 'venta' },
        },
      ],
      entities,
      { onEdit() {}, onDelete() {} }
    );
    renderPurchaseList(
      purchaseContainer,
      [
        {
          document_id: 'doc-overdue',
          entity_id: entity.entity_id,
          series: 'P',
          folio: 3,
          status: 'Vencida',
          totalAmount: 100,
          customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
        },
      ],
      entities,
      { onEdit() {}, onDelete() {}, readOnlyIds: new Set() }
    );

    const saleBadges = Array.from(
      saleContainer.querySelectorAll('.invoice-badge')
    );
    expect(saleBadges[0].textContent).toBe('Emitida');
    expect(saleBadges[0].classList.contains('invoice-badge--issued')).toBe(
      true
    );
    expect(saleBadges[1].textContent).toBe('Pagada');
    expect(saleBadges[1].classList.contains('invoice-badge--paid')).toBe(true);
    const purchaseBadge = purchaseContainer.querySelector('.invoice-badge');
    expect(purchaseBadge.textContent).toBe('Vencida');
    expect(purchaseBadge.classList.contains('invoice-badge--overdue')).toBe(
      true
    );

    const payrollContainer = container('status-payroll');
    renderPayrollList(payrollContainer, {
      settlements: [
        {
          settlementId: 'set-1',
          entityId: entity.entity_id,
          estado: 'Emitida',
          monto: 100,
        },
        {
          settlementId: 'set-2',
          entityId: entity.entity_id,
          estado: 'Pagada',
          monto: 100,
        },
        {
          settlementId: 'set-3',
          entityId: entity.entity_id,
          estado: 'Anulada',
          monto: 100,
        },
      ],
      entities: [entity],
      records: [],
    });
    const payrollBadges = Array.from(
      payrollContainer.querySelectorAll('.status-badge')
    );
    expect(payrollBadges.map((badge) => badge.textContent)).toEqual([
      'Emitida',
      'Pagada',
      'Anulada',
    ]);
    expect(payrollBadges[0].classList.contains('status-badge--issued')).toBe(
      true
    );
    expect(payrollBadges[1].classList.contains('status-badge--paid')).toBe(
      true
    );
    expect(payrollBadges[2].classList.contains('status-badge--void')).toBe(
      true
    );

    renderWorkerMarkup();
    renderPayrollSettlement(
      {
        estado: 'Emitida',
        monto: 100,
        periodo: '2026-01',
        fechaPago: '2026-01-01',
      },
      [],
      entity
    );
    const workerStatus = document.getElementById('payroll-worker-status');
    expect(workerStatus.textContent).toContain('Emitida');
    expect(workerStatus.classList.contains('status-badge--issued')).toBe(true);
    expect(config).toBeTruthy();
  });

  it('usa la paleta v1.2.0 en estados favorables, críticos e informativos', () => {
    const issued =
      ruleFor('.invoice-badge--issued') + ruleFor('.status-badge--issued');
    expect(issued).toContain('#ffb703');
    expect(issued).toContain('#023047');

    const paid =
      ruleFor('.invoice-badge--paid') + ruleFor('.status-badge--paid');
    expect(paid).toContain('#126782');
    expect(paid).toContain('#219ebc');

    const overdue =
      ruleFor('.invoice-badge--overdue') + ruleFor('.status-badge--void');
    expect(overdue).toContain('#a84f00');
    expect(overdue).toContain('#fb8500');

    expect(
      ruleFor(".cashflow-table tr[data-tipo='ingreso'] td:last-child")
    ).toContain('#126782');
    expect(
      ruleFor(".cashflow-table tr[data-tipo='egreso'] td:last-child")
    ).toContain('#a84f00');
    expect(ruleFor('.route-message')).toContain('#8ecae6');
    expect(ruleFor('.route-message')).toContain('#023047');
  });

  it('mantiene montos y fechas legibles en el flujo de caja', () => {
    setupFinanzasSession();
    const config = getConfig();
    const cliente = addEntity(
      {
        name: 'Cliente Estado',
        code: 'CL-ES',
        customFields: { tipoTercero: 'cliente' },
      },
      config
    );
    const factura = addDocument(
      {
        entity_id: cliente.entity_id,
        series: 'V',
        folio: 1,
        startDate: '2026-01-10',
        endDate: '2026-02-10',
        totalAmount: 250000,
        customFields: { tipoFactura: 'venta' },
      },
      config
    );
    updateDocument(
      factura.document_id,
      { status: 'Emitida', customFields: { tipoFactura: 'venta' } },
      config
    );
    updateDocument(
      factura.document_id,
      {
        status: 'Pagada',
        customFields: {
          tipoFactura: 'venta',
          montoPagado: 250000,
          fechaPago: '2026-01-20',
        },
      },
      config
    );

    initApp(config);
    document.getElementById('qa-cashflow').click();
    const rows = document.querySelectorAll('#cashflow-table tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].dataset.tipo).toBe('ingreso');
    expect(rows[0].textContent).toContain('20-01-2026');
    expect(rows[0].textContent).toContain('$250.000');
  });
});
