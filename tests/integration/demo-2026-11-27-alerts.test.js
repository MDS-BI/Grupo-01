import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { editDocument, initApp } from '../../src/app.js';
import { normalizeRut } from '../../src/auth.js';
import { loadDemoData } from '../../src/demo-data.js';
import { formatCurrencyCLP } from '../../src/format.js';
import { userConfig } from '../../src/module-config.js';
import { saveSession } from '../../src/session.js';
import {
  loadEntities,
  loadPayrollSettlements,
  loadPurchaseInvoices,
  loadSaleInvoices,
} from '../../src/storage.js';
import { todayISO } from '../../src/tracking.js';
import {
  invoiceField as field,
  loadAppMarkup,
  submit,
} from '../setup/domFixture.js';

const TODAY_ISO = '2026-11-27';
const PE003_NAME = 'Camila Rojas Fuentes';
let originalConfirm;
let originalTZ;

function clearErpStorage() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('erp.')) localStorage.removeItem(key);
  }
}

function localDate(offset) {
  const date = new Date(2026, 10, 27 + offset, 12, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function byCode(entities, code) {
  return entities.find((entity) => entity.code === code);
}

function signIn({ accessId, role, entityId }) {
  loadAppMarkup();
  saveSession({
    accessId: normalizeRut(accessId),
    role,
    entityId,
    startedAt: new Date().toISOString(),
  });
  initApp(userConfig);
}

beforeEach(() => {
  originalTZ = process.env.TZ;
  process.env.TZ = 'America/Santiago';
  originalConfirm = window.confirm;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-27T21:30:00-03:00'));
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  clearErpStorage();
  expect(loadDemoData(userConfig).ok).toBe(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  window.confirm = originalConfirm;
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe('HU6 - alertas y avisos de la demostración 2026-11-27', () => {
  it('mantiene vencidas, por vencer y un cliente cerca de su límite', () => {
    const today = todayISO();
    const ventas = loadSaleInvoices();
    const entities = loadEntities();
    const vencidas = ventas.filter(
      (document) => document.status === 'Emitida' && document.endDate < today
    );
    const porVencer = ventas.filter(
      (document) =>
        document.status === 'Emitida' &&
        document.endDate >= today &&
        document.endDate <= localDate(7)
    );
    const deudaPorCliente = new Map();
    for (const document of ventas) {
      if (document.status !== 'Emitida') continue;
      deudaPorCliente.set(
        document.entity_id,
        (deudaPorCliente.get(document.entity_id) || 0) +
          (Number(document.totalAmount) || 0)
      );
    }
    const cercaDelLimite = entities.find(
      (entity) =>
        entity.customFields.tipoTercero === 'cliente' &&
        entity.creditLimit > 0 &&
        (deudaPorCliente.get(entity.entity_id) || 0) >= entity.creditLimit * 0.8
    );

    expect(today).toBe(TODAY_ISO);
    expect(vencidas).toHaveLength(2);
    expect(porVencer.length).toBeGreaterThanOrEqual(1);
    expect(cercaDelLimite).toBeTruthy();
  });

  it('dispara el aviso FR-029 al emitir la factura del cliente cerca del límite', () => {
    const entities = loadEntities();
    const ventas = loadSaleInvoices();
    const deudaPorCliente = new Map();
    for (const document of ventas) {
      if (document.status !== 'Emitida') continue;
      deudaPorCliente.set(
        document.entity_id,
        (deudaPorCliente.get(document.entity_id) || 0) +
          (Number(document.totalAmount) || 0)
      );
    }
    const cliente = entities.find(
      (entity) =>
        entity.customFields.tipoTercero === 'cliente' &&
        entity.creditLimit > 0 &&
        (deudaPorCliente.get(entity.entity_id) || 0) >= entity.creditLimit * 0.8
    );
    const borrador = ventas.find(
      (document) =>
        document.entity_id === cliente.entity_id &&
        document.status === 'Borrador'
    );
    expect(borrador).toBeTruthy();

    loadAppMarkup();
    signIn({
      accessId: '55.555.555-5',
      role: 'finanzas',
      entityId: null,
    });
    editDocument(borrador.document_id);
    const status = field('invoice-sale', 'status');
    status.value = 'Emitida';
    status.dispatchEvent(new Event('change'));
    submit('invoice-sale-form');

    const confirm = window.confirm;
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm.mock.calls[0][0]).toContain(
      formatCurrencyCLP(cliente.creditLimit)
    );
    expect(
      loadSaleInvoices().find(
        (document) => document.document_id === borrador.document_id
      ).status
    ).toBe('Emitida');
  });

  it('muestra el aviso de RRHH por PE-003 sin afectar las vistas de Ana ni de Bruno', () => {
    const entities = loadEntities();
    const pe3 = byCode(entities, 'PE-003');
    const pe1 = byCode(entities, 'PE-001');
    const pe2 = byCode(entities, 'PE-002');
    const settlements = loadPayrollSettlements();
    const drafts = settlements.filter((item) => item.estado === 'Borrador');
    const draft = drafts.find((item) => item.entityId === pe3.entity_id);

    expect(drafts).toHaveLength(1);
    expect(draft).toMatchObject({
      periodo: TODAY_ISO.slice(0, 7),
      estado: 'Borrador',
    });
    expect(draft.sueldoBase).toBeGreaterThan(0);
    expect(
      loadPurchaseInvoices().find(
        (document) => document.document_id === draft.documentId
      )
    ).toMatchObject({
      entity_id: pe3.entity_id,
      customFields: {
        tipoFactura: 'compra',
        periodoLiquidacion: TODAY_ISO.slice(0, 7),
      },
    });

    signIn({
      accessId: '88.888.888-8',
      role: 'administrador',
      entityId: null,
    });
    expect(document.getElementById('banner-notice').hidden).toBe(false);
    expect(
      document.getElementById('banner-notice-text').textContent.trim()
    ).toBe('1 liquidación en borrador');

    for (const worker of [
      { accessId: '22.222.222-2', entity: pe1, name: 'Ana Pérez Soto' },
      { accessId: '45.000.000-0', entity: pe2, name: 'Bruno Soto Vega' },
    ]) {
      signIn({
        accessId: worker.accessId,
        role: 'trabajador',
        entityId: worker.entity.entity_id,
      });
      const view = document.getElementById('view-payroll-worker');
      expect(view.hidden).toBe(false);
      expect(document.getElementById('payroll-worker-name').textContent).toBe(
        worker.name
      );
      expect(view.textContent).not.toContain(PE003_NAME);
      expect(view.textContent).not.toContain('PE-003');
      expect(
        settlements
          .filter((item) => item.entityId === worker.entity.entity_id)
          .some((item) => item.entityId === pe3.entity_id)
      ).toBe(false);
    }
  });
});
