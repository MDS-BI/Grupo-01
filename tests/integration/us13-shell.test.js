import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, userConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';
import {
  loadAppMarkup,
  setupAdminSession,
  setupFinanzasSession,
} from '../setup/domFixture.js';

beforeEach(() => {
  loadAppMarkup();
  setupAdminSession();
});

describe('US13 - shell persistente', () => {
  it('muestra marca, logotipo y navegación activa', () => {
    initApp(DEFAULT_CONFIG);

    expect(document.getElementById('brand-name').textContent).toBe('ERP Base');
    expect(document.getElementById('view-context').hidden).toBe(true);
    expect(
      document.getElementById('brand-logo').querySelector('svg')
    ).toBeTruthy();
    expect(document.getElementById('brand-logo').textContent).toBe('R');
    expect(
      document.getElementById('nav-dashboard').getAttribute('aria-current')
    ).toBe('page');

    document.getElementById('nav-entities').click();
    expect(
      document.getElementById('nav-entities').hasAttribute('aria-current')
    ).toBe(false);
    expect(
      document.getElementById('nav-payroll-admin').getAttribute('aria-current')
    ).toBe('page');
    expect(document.getElementById('view-entities').hidden).toBe(true);
    expect(document.getElementById('view-payroll-admin').hidden).toBe(false);
    expect(document.getElementById('view-dashboard').hidden).toBe(true);
  });

  it('conserva los datos al navegar entre módulos', () => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    setupFinanzasSession();
    addEntity({ name: 'Acme', code: 'AC-1' }, DEFAULT_CONFIG);
    initApp(DEFAULT_CONFIG);

    document.getElementById('nav-entities').click();
    expect(document.getElementById('entity-list').textContent).toContain(
      'Acme'
    );

    document.getElementById('nav-dashboard').click();
    expect(document.getElementById('stat-entities').textContent).toBe('1');

    document.getElementById('nav-entities').click();
    expect(document.getElementById('entity-list').textContent).toContain(
      'Acme'
    );
  });

  it('mantiene el menú constante entre las vistas fijas del módulo y navega sin recargar', () => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    setupFinanzasSession();
    initApp(userConfig);

    const modulos = [
      'dashboard',
      'entities',
      'invoice-sale',
      'invoice-purchase',
      'movements',
      'tracking',
      'search',
    ];
    for (const modulo of modulos) {
      document.getElementById(`nav-${modulo}`).click();
      for (const view of modulos) {
        expect(document.getElementById(`view-${view}`).hidden).toBe(
          view !== modulo
        );
      }
      expect(
        document.getElementById(`nav-${modulo}`).getAttribute('aria-current')
      ).toBe('page');
      expect(document.getElementById('brand-name').textContent).toBe(
        'Contabilidad y Finanzas'
      );
      expect(document.getElementById('brand-name').textContent).not.toContain(
        '›'
      );
      const viewContext = document.getElementById('view-context');
      expect(viewContext.hidden).toBe(modulo === 'dashboard');
      if (modulo !== 'dashboard') {
        expect(
          document.getElementById('view-context-separator').textContent.trim()
        ).toBe('›');
      }
    }
  });

  it('muestra la identidad del sistema y el círculo de perfil del usuario (T004)', () => {
    initApp(userConfig);

    expect(document.getElementById('brand-name').textContent).toBe(
      'Contabilidad y Finanzas'
    );
    expect(document.getElementById('brand-name').textContent).not.toContain(
      '›'
    );
    expect(document.title).toBe('Contabilidad y Finanzas');
    expect(document.getElementById('brand-logo').textContent).toBe('R');
  });

  it('navega entre facturas de venta y compra con listados separados (FR-006)', () => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    setupFinanzasSession();
    initApp(userConfig);
    const entidad = addEntity(
      {
        name: 'Mixto',
        code: 'MX-1',
        customFields: { tipoTercero: 'cliente' },
      },
      userConfig
    );

    localStorage.setItem(
      'erp.salesInvoices',
      JSON.stringify([
        {
          id: 'd1',
          document_id: 'd1',
          entity_id: entidad.entity_id,
          folio: 1,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          totalAmount: 100,
          status: 'Borrador',
          customFields: { tipoFactura: 'venta' },
        },
      ])
    );

    localStorage.setItem(
      'erp.purchaseInvoices',
      JSON.stringify([
        {
          id: 'd2',
          document_id: 'd2',
          entity_id: entidad.entity_id,
          folio: 2,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          totalAmount: 200,
          status: 'Borrador',
          customFields: { tipoFactura: 'compra', centroCosto: 'Activo' },
        },
      ])
    );

    document.getElementById('nav-invoice-sale').click();
    expect(document.getElementById('view-invoice-sale').hidden).toBe(false);
    expect(document.getElementById('invoice-sale-list').textContent).toContain(
      '#1'
    );
    expect(
      document.getElementById('invoice-sale-list').textContent
    ).not.toContain('#2');

    document.getElementById('nav-invoice-purchase').click();
    expect(
      document.getElementById('invoice-purchase-list').textContent
    ).toContain('#2');
    expect(
      document.getElementById('invoice-purchase-list').textContent
    ).not.toContain('#1');
  });
});
