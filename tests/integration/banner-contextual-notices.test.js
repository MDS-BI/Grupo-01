import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp, requestDeleteDocument } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  loadPayrollSettlements,
  savePayrollSettlements,
  updateDocument,
} from '../../src/storage.js';
import { createAccessRecord } from '../../src/access-storage.js';
import { saveSession } from '../../src/session.js';
import {
  loadAppMarkup,
  setupAdminSession,
  setupFinanzasSession,
  submit,
} from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

function seedOverdue(count) {
  const provider = addEntity(
    {
      name: 'Proveedor Avisos',
      code: 'PV-AV',
      customFields: { tipoTercero: 'proveedor' },
    },
    userConfig
  );
  const ids = [];
  for (let folio = 1; folio <= count; folio += 1) {
    const document = addDocument(
      {
        entity_id: provider.entity_id,
        series: 'P',
        folio,
        startDate: '2026-01-10',
        endDate: '2026-02-10',
        totalAmount: 500 * folio,
        customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
      },
      userConfig
    );
    updateDocument(
      document.document_id,
      {
        status: 'Emitida',
        customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
      },
      userConfig
    );
    ids.push(document.document_id);
  }
  return ids;
}

function seedDrafts(count) {
  const worker = addEntity(
    {
      name: 'Ana Pérez Soto',
      code: 'PE-AV',
      taxId: '22.222.222-2',
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
  const settlements = [];
  for (let folio = 1; folio <= count; folio += 1) {
    const document = addDocument(
      {
        entity_id: worker.entity_id,
        series: 'LIQ',
        folio,
        startDate: '2026-10-01',
        endDate: '2026-10-28',
        totalAmount: 700000 + folio,
        customFields: {
          tipoFactura: 'compra',
          centroCosto: 'Consumible',
          periodoLiquidacion: '2026-10',
        },
      },
      userConfig
    );
    settlements.push({
      settlementId: `set_${folio}`,
      documentId: document.document_id,
      entityId: worker.entity_id,
      periodo: '2026-10',
      sueldoBase: 500000,
      descuentos: 20000,
      bonos: 220000,
      monto: 700000 + folio,
      estado: 'Borrador',
      fechaPago: null,
    });
  }
  savePayrollSettlements(settlements);
}

function signInWorker() {
  const entity = addEntity(
    {
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      taxId: '22.222.222-2',
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
  const access = createAccessRecord(
    {
      accessId: '22.222.222-2',
      role: 'trabajador',
      entityId: entity.entity_id,
      password: '2222',
    },
    { entities: [entity], records: [] }
  );
  saveSession({
    accessId: access.accessId,
    role: 'trabajador',
    entityId: entity.entity_id,
    startedAt: new Date().toISOString(),
  });
}

function reset() {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
}

describe('Banner contextual - avisos por rol', () => {
  beforeEach(reset);

  it('muestra avisos de finanzas en singular y plural que llevan a Seguimiento', () => {
    setupFinanzasSession();
    seedOverdue(1);
    initApp(userConfig);

    expect(byId('banner-notice')).toBeTruthy();
    expect(byId('banner-notice').hidden).toBe(false);
    expect(byId('banner-notice-text').textContent.trim()).toBe(
      '1 factura vencida'
    );
    expect(byId('banner-notice').getAttribute('aria-label')).toBe(
      '1 factura vencida'
    );

    byId('banner-notice').click();
    expect(byId('view-tracking').hidden).toBe(false);

    reset();
    setupFinanzasSession();
    seedOverdue(2);
    initApp(userConfig);

    expect(byId('banner-notice-text').textContent.trim()).toBe(
      '2 facturas vencidas'
    );
    expect(byId('banner-notice').getAttribute('aria-label')).toBe(
      '2 facturas vencidas'
    );
  });

  it('muestra avisos de Recursos Humanos en singular y plural que llevan a Gestionar liquidaciones', () => {
    setupAdminSession();
    seedDrafts(1);
    initApp(userConfig);

    expect(byId('banner-notice')).toBeTruthy();
    expect(byId('banner-notice').hidden).toBe(false);
    expect(byId('banner-notice-text').textContent.trim()).toBe(
      '1 liquidación en borrador'
    );
    expect(byId('banner-notice').getAttribute('aria-label')).toBe(
      '1 liquidación en borrador'
    );

    byId('banner-notice').click();
    expect(byId('view-payroll-admin').hidden).toBe(false);

    reset();
    setupAdminSession();
    seedDrafts(2);
    initApp(userConfig);

    expect(byId('banner-notice-text').textContent.trim()).toBe(
      '2 liquidaciones en borrador'
    );
    expect(byId('banner-notice').getAttribute('aria-label')).toBe(
      '2 liquidaciones en borrador'
    );
  });

  it('oculta el aviso para el trabajador y cuando el número es cero', () => {
    setupFinanzasSession();
    initApp(userConfig);
    expect(byId('banner-notice').hidden).toBe(true);

    reset();
    setupAdminSession();
    initApp(userConfig);
    expect(byId('banner-notice').hidden).toBe(true);

    reset();
    signInWorker();
    seedOverdue(2);
    seedDrafts(2);
    initApp(userConfig);
    expect(byId('banner-notice').hidden).toBe(true);
  });

  it('actualiza el aviso al eliminar datos que alimentan el Panel sin recargar', () => {
    setupFinanzasSession();
    const [documentId] = seedOverdue(1);
    initApp(userConfig);

    expect(byId('banner-notice').hidden).toBe(false);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    requestDeleteDocument(documentId);

    expect(byId('banner-notice').hidden).toBe(true);
    confirmSpy.mockRestore();
  });

  it('oculta el aviso al emitir una liquidación desde Gestionar liquidaciones sin cambiar de vista', () => {
    setupAdminSession();
    seedDrafts(1);
    initApp(userConfig);

    expect(byId('banner-notice').hidden).toBe(false);
    expect(byId('banner-notice-text').textContent.trim()).toBe(
      '1 liquidación en borrador'
    );

    byId('nav-payroll-admin').click();
    byId('view-payroll-admin').querySelector('[data-action="edit"]').click();

    const status = byId('payroll-field-status');
    status.value = 'Emitida';
    status.dispatchEvent(new Event('change', { bubbles: true }));
    submit('payroll-form');

    expect(loadPayrollSettlements()[0].estado).toBe('Emitida');
    expect(byId('banner-notice').hidden).toBe(true);
  });
});
