import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, userConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';
import { loadAppMarkup } from '../setup/domFixture.js';

beforeEach(() => {
  loadAppMarkup();
});

describe('US13 - shell persistente', () => {
  it('muestra marca, logotipo y navegación activa', () => {
    initApp(DEFAULT_CONFIG);

    expect(document.getElementById('brand-name').textContent).toBe('ERP Base');
    expect(
      document.getElementById('brand-logo').querySelector('svg')
    ).toBeTruthy();
    expect(document.getElementById('brand-logo').textContent).toBe('EB');
    expect(
      document.getElementById('nav-dashboard').getAttribute('aria-current')
    ).toBe('page');

    document.getElementById('nav-entities').click();
    expect(
      document.getElementById('nav-entities').getAttribute('aria-current')
    ).toBe('page');
    expect(
      document.getElementById('nav-dashboard').hasAttribute('aria-current')
    ).toBe(false);
    expect(document.getElementById('view-entities').hidden).toBe(false);
    expect(document.getElementById('view-dashboard').hidden).toBe(true);
  });

  it('conserva los datos al navegar entre módulos', () => {
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
    initApp(userConfig);

    const modulos = [
      'dashboard',
      'entities',
      'documents',
      'invoice-sale',
      'invoice-purchase',
      'movements',
      'tracking',
      'search',
    ];
    for (const modulo of modulos) {
      const vistaDestino =
        modulo === 'invoice-sale' || modulo === 'invoice-purchase'
          ? 'documents'
          : modulo;
      document.getElementById(`nav-${modulo}`).click();
      expect(document.getElementById(`view-${vistaDestino}`).hidden).toBe(
        false
      );
      for (const view of [
        'dashboard',
        'entities',
        'search',
        'movements',
        'tracking',
      ]) {
        if (view === vistaDestino) continue;
        expect(document.getElementById(`view-${view}`).hidden).toBe(true);
      }
      expect(
        document.getElementById(`nav-${modulo}`).getAttribute('aria-current')
      ).toBe('page');
      expect(document.getElementById('brand-name').textContent).toBe(
        'Contabilidad y Finanzas: Facturación y Pagos'
      );
    }
  });

  it('navega entre facturas de venta y compra con listados separados (FR-006)', () => {
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
      'erp.documents',
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
        {
          id: 'd2',
          document_id: 'd2',
          entity_id: entidad.entity_id,
          folio: 2,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          totalAmount: 200,
          status: 'Borrador',
          customFields: { tipoFactura: 'compra' },
        },
      ])
    );

    document.getElementById('nav-invoice-sale').click();
    expect(document.getElementById('view-documents').hidden).toBe(false);
    expect(document.getElementById('document-list').textContent).toContain(
      '#1'
    );
    expect(document.getElementById('document-list').textContent).not.toContain(
      '#2'
    );

    document.getElementById('nav-invoice-purchase').click();
    expect(document.getElementById('document-list').textContent).toContain(
      '#2'
    );
    expect(document.getElementById('document-list').textContent).not.toContain(
      '#1'
    );
  });
});
