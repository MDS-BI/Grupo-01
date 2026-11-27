import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import {
  DEFAULT_CONFIG,
  userConfig,
  getConfig,
} from '../../src/module-config.js';
import { addDocument, addEntity, updateDocument } from '../../src/storage.js';
import { loadDemoData } from '../../src/demo-data.js';
import { saveAccessRecords } from '../../src/access-storage.js';
import { saveSession } from '../../src/session.js';
import { loadAppMarkup, setupAdminSession } from '../setup/domFixture.js';

function setupFinanceSession() {
  const now = new Date().toISOString();
  saveAccessRecords([
    {
      accessId: '55555555-5',
      role: 'finanzas',
      entityId: null,
      password: '5555',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  saveSession({
    accessId: '55555555-5',
    role: 'finanzas',
    entityId: null,
    startedAt: now,
  });
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
  setupAdminSession();
});

function visibleQuickActionIds() {
  return Array.from(
    document.querySelectorAll('#view-dashboard .quick-actions button')
  )
    .filter((button) => !button.hidden && !button.closest('[hidden]'))
    .map((button) => button.id);
}

function quickActionLabel(id) {
  const button = document.getElementById(id);
  const label = button?.querySelector('.qa-label');
  return label ? label.textContent.trim() : null;
}

describe('US3 - panel de inicio', () => {
  it('muestra estadísticas coherentes con el almacenamiento (finanzas)', () => {
    setupFinanceSession();
    const entity = addEntity({ name: 'Acme', code: 'AC-1' }, DEFAULT_CONFIG);
    addDocument(
      {
        entity_id: entity.entity_id,
        folio: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      },
      DEFAULT_CONFIG
    );
    initApp(DEFAULT_CONFIG);

    expect(document.getElementById('stat-entities').textContent).toBe('1');
    expect(document.getElementById('stat-documents').textContent).toBe('1');
  });

  it('el Panel del administrador muestra saludo, mes y resumen de nómina sin datos financieros', () => {
    addEntity(
      {
        name: 'Acme',
        code: 'AC-1',
        customFields: { tipoTercero: 'personal' },
      },
      DEFAULT_CONFIG
    );
    initApp(DEFAULT_CONFIG);

    expect(document.getElementById('dashboard-title').textContent).toBe(
      'Panel'
    );
    expect(document.getElementById('dashboard-greeting').textContent).toBe(
      'Hola, Recursos Humanos'
    );
    expect(document.getElementById('dashboard-month').textContent).toMatch(
      /^[a-z]+ \d{4}$/i
    );
    expect(document.getElementById('admin-payroll-summary')).toBeTruthy();
    for (const id of [
      'summary-caja',
      'kpi-por-cobrar',
      'kpi-por-pagar',
      'kpi-vencidas',
      'stat-entities',
      'stat-documents',
    ]) {
      const element = document.getElementById(id);
      expect(element.closest('[hidden]')).not.toBeNull();
      expect(element.textContent).toBe('');
    }
  });

  it('el Panel del administrador oculta todo el contenido financiero (HU1)', () => {
    const config = getConfig();
    loadDemoData(config);
    setupAdminSession();
    initApp(userConfig);

    function visibleText(element) {
      if (!element || element.hidden) return '';
      return Array.from(element.childNodes)
        .map((node) =>
          node.nodeType === 3 ? node.textContent : visibleText(node)
        )
        .join('');
    }

    const text = visibleText(document.getElementById('view-dashboard'));
    expect(text).not.toContain('Resumen financiero');
    expect(text).not.toContain('Indicadores');
    expect(text).not.toContain('Terceros');
    expect(text).not.toContain('Facturas');
    expect(text).not.toMatch(/\$\d/);
    expect(text).not.toContain('Caja neta');
    expect(text).not.toContain('Por cobrar');
    expect(document.getElementById('admin-payroll-summary').hidden).toBe(false);
    expect(document.getElementById('finance-indicators-section').hidden).toBe(
      true
    );
    for (const id of ['stat-entities', 'stat-documents']) {
      expect(document.getElementById(id).textContent).toBe('');
    }
  });

  it('el Panel de finanzas sigue mostrando los valores del resumen financiero', () => {
    setupFinanceSession();
    const config = getConfig();
    loadDemoData(config);
    initApp(userConfig);

    for (const id of [
      'summary-caja',
      'kpi-por-cobrar',
      'kpi-por-pagar',
      'kpi-vencidas',
    ]) {
      const value = document.getElementById(id).textContent;
      expect(value).not.toBe('');
    }
    for (const id of ['summary-caja', 'kpi-por-cobrar', 'kpi-por-pagar']) {
      expect(document.getElementById(id).textContent).toMatch(/\$/);
    }
    expect(document.getElementById('finance-indicators-section').hidden).toBe(
      false
    );
  });

  it('las acciones rápidas navegan a la vista correcta', () => {
    setupFinanceSession();
    initApp(DEFAULT_CONFIG);

    document.getElementById('qa-manage-entities').click();
    expect(document.getElementById('view-entities').hidden).toBe(false);
    expect(document.getElementById('name').value).toBe('');

    document.getElementById('qa-search').click();
    expect(document.getElementById('view-search').hidden).toBe(false);
    expect(document.activeElement).toBe(
      document.getElementById('search-input')
    );
  });

  it('oculta los KPIs financieros del Panel del administrador (FR-007)', () => {
    initApp(userConfig);
    for (const id of [
      'summary-caja',
      'kpi-por-cobrar',
      'kpi-por-pagar',
      'kpi-vencidas',
      'stat-entities',
      'stat-documents',
    ]) {
      const element = document.getElementById(id);
      expect(element.closest('[hidden]')).not.toBeNull();
      expect(element.textContent).toBe('');
    }
  });

  it('con datos de demostración el home de finanzas muestra KPIs coherentes con el seguimiento', () => {
    setupFinanceSession();
    const config = getConfig();
    loadDemoData(config);
    initApp(userConfig);

    const porCobrar = Number(
      document
        .getElementById('kpi-por-cobrar')
        .textContent.replace(/[$]/g, '')
        .replace(/\./g, '')
    );
    const porPagar = Number(
      document
        .getElementById('kpi-por-pagar')
        .textContent.replace(/[$]/g, '')
        .replace(/\./g, '')
    );
    const vencidas = Number(
      document.getElementById('kpi-vencidas').textContent
    );
    expect(porCobrar).toBeGreaterThan(0);
    expect(porPagar).toBeGreaterThan(0);
    expect(vencidas).toBeGreaterThan(0);
  });

  it('muestra la acción nueva liquidación con sesión de administrador', () => {
    initApp(DEFAULT_CONFIG);

    expect(document.getElementById('view-dashboard').hidden).toBe(false);
    expect(document.getElementById('qa-new-payroll').hidden).toBe(false);
  });

  it('finanzas llega a las liquidaciones desde el menú, no desde un acceso rápido (HU5)', () => {
    setupFinanceSession();
    initApp(DEFAULT_CONFIG);

    expect(document.getElementById('view-dashboard').hidden).toBe(false);
    expect(document.getElementById('qa-new-payroll').hidden).toBe(true);
    document.getElementById('nav-payroll-admin').click();
    expect(document.getElementById('view-payroll-admin').hidden).toBe(false);
  });

  it('limita el Panel del administrador a crear y gestionar liquidaciones (FR-013)', () => {
    initApp(DEFAULT_CONFIG);

    expect(visibleQuickActionIds()).toEqual([
      'qa-create-payroll',
      'qa-new-payroll',
    ]);
    expect(quickActionLabel('qa-create-payroll')).toBe(
      'Crear liquidación de sueldo'
    );
    expect(quickActionLabel('qa-new-payroll')).toBe(
      'Gestionar liquidaciones de sueldo'
    );
    for (const id of [
      'qa-manage-entities',
      'qa-new-invoice-sale',
      'qa-new-invoice-purchase',
      'qa-tracking',
      'qa-cashflow',
      'qa-movements',
      'qa-search',
    ]) {
      expect(document.getElementById(id).hidden).toBe(true);
    }

    document.getElementById('qa-create-payroll').click();
    expect(document.getElementById('view-payroll-create').hidden).toBe(false);

    document.getElementById('nav-dashboard').click();
    document.getElementById('qa-new-payroll').click();
    expect(document.getElementById('view-payroll-admin').hidden).toBe(false);
    expect(document.getElementById('view-payroll-create').hidden).toBe(true);
  });
  it('finanzas ve una sola fila de 4 indicadores, sin «Deuda pendiente» ni «Saldo neto» (HU2)', () => {
    setupFinanceSession();
    loadDemoData(getConfig());
    initApp(userConfig);

    const section = document.getElementById('finance-indicators-section');
    const labels = Array.from(
      section.querySelectorAll('.indicator-card .indicator-label')
    ).map((label) => label.firstChild.textContent.trim());
    expect(labels).toEqual([
      'Caja neta',
      'Por cobrar',
      'Por pagar',
      'Facturas vencidas',
    ]);
    const viewText = document.getElementById('view-dashboard').textContent;
    expect(viewText).not.toContain('Deuda pendiente');
    expect(viewText).not.toContain('Saldo neto');
    expect(viewText).not.toContain('por cobrar + por pagar');
    expect(document.getElementById('summary-deuda')).toBeNull();
  });

  it('cada indicador muestra su variación y su fórmula solo en el tooltip accesible (HU2)', () => {
    setupFinanceSession();
    loadDemoData(getConfig());
    initApp(userConfig);

    for (const id of ['cash', 'receivable', 'payable', 'overdue']) {
      const variation = document.getElementById(`indicator-${id}-variation`);
      expect(variation.textContent).toMatch(
        /sin dato anterior|sin cambio|nuevo|% vs mes anterior/
      );
      expect(['favorable', 'unfavorable', 'neutral']).toContain(
        variation.dataset.tone
      );
      const info = document.querySelector(`[data-formula-for="${id}"]`);
      expect(info.textContent).toBe('i');
      expect(info.title.length).toBeGreaterThan(10);
    }
    const label = document
      .getElementById('indicator-cash')
      .querySelector('.indicator-label').firstChild.textContent;
    expect(label).not.toContain('-');
    expect(label).not.toContain('(');
  });

  it('marca en ámbar las facturas vencidas y en rojo la caja negativa (HU2)', () => {
    setupFinanceSession();
    const config = getConfig();
    const proveedor = addEntity(
      {
        name: 'Proveedor',
        code: 'PV-9',
        customFields: { tipoTercero: 'proveedor' },
      },
      config
    );
    const document_ = addDocument(
      {
        entity_id: proveedor.entity_id,
        series: 'A',
        folio: 9,
        startDate: '2020-01-01',
        endDate: '2020-01-31',
        totalAmount: 500,
        customFields: { tipoFactura: 'compra' },
      },
      config
    );
    updateDocument(
      document_.document_id,
      {
        status: 'Emitida',
        customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
      },
      config
    );
    updateDocument(
      document_.document_id,
      {
        status: 'Pagada',
        customFields: {
          tipoFactura: 'compra',
          centroCosto: 'Consumible',
          montoPagado: 500,
          fechaPago: '2020-02-01',
        },
      },
      config
    );
    const vencida = addDocument(
      {
        entity_id: proveedor.entity_id,
        series: 'A',
        folio: 10,
        startDate: '2020-01-01',
        endDate: '2020-01-31',
        totalAmount: 100,
        customFields: { tipoFactura: 'compra' },
      },
      config
    );
    updateDocument(
      vencida.document_id,
      {
        status: 'Emitida',
        customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
      },
      config
    );
    initApp(config);

    const cash = document.getElementById('indicator-cash');
    expect(document.getElementById('summary-caja').textContent).toBe('-$500');
    expect(cash.classList.contains('is-negative')).toBe(true);
    const overdue = document.getElementById('indicator-overdue');
    expect(document.getElementById('kpi-vencidas').textContent).toBe('1');
    expect(overdue.classList.contains('is-action')).toBe(true);
    const receivable = document.getElementById('indicator-receivable');
    expect(receivable.classList.contains('is-negative')).toBe(false);
    expect(receivable.classList.contains('is-action')).toBe(false);
  });

  it('las tarjetas llevan a su lista: caja → flujo, cobrar → ventas, pagar → compras, vencidas → seguimiento (HU2)', () => {
    setupFinanceSession();
    initApp(userConfig);

    const routes = [
      ['indicator-cash', 'view-cashflow'],
      ['indicator-receivable', 'view-invoice-sale'],
      ['indicator-payable', 'view-invoice-purchase'],
      ['indicator-overdue', 'view-tracking'],
    ];
    for (const [cardId, viewId] of routes) {
      document.getElementById('nav-dashboard').click();
      document.getElementById(cardId).click();
      expect(document.getElementById(viewId).hidden).toBe(false);
    }
  });
  it('finanzas ve el gráfico SVG de 6 meses con leyenda y las alertas al lado (HU4)', () => {
    setupFinanceSession();
    loadDemoData(getConfig());
    initApp(userConfig);

    const trend = document.getElementById('dashboard-trend-section');
    expect(trend.closest('[hidden]')).toBeNull();
    const svg = trend.querySelector('svg[role="img"]');
    expect(svg).not.toBeNull();
    expect(svg.querySelector('title').textContent).toBe(
      'Tendencia de ingresos y gastos de los últimos seis meses'
    );
    expect(svg.querySelectorAll('.trend-label')).toHaveLength(6);
    expect(trend.textContent).toContain('Ingresos');
    expect(trend.textContent).toContain('Gastos');

    const alerts = document.getElementById('dashboard-alerts-section');
    expect(alerts.closest('[hidden]')).toBeNull();
    expect(alerts.parentElement).toBe(trend.parentElement);
  });

  it('sin alerta de caja negativa y con vencidas que enlazan a su detalle (HU6)', () => {
    setupFinanceSession();
    loadDemoData(getConfig());
    initApp(userConfig);

    const cash = document.querySelector('[data-alert="negative-cash"] button');
    const overdue = document.querySelector(
      '[data-alert="overdue-invoices"] button'
    );
    expect(cash).toBeNull();
    expect(document.getElementById('summary-caja').textContent).not.toContain(
      '-'
    );
    expect(overdue.textContent).toContain('vencida');

    overdue.click();
    expect(document.getElementById('view-tracking').hidden).toBe(false);
  });

  it('sin caja negativa ni vencidas no se generan alertas (HU4)', () => {
    setupFinanceSession();
    initApp(userConfig);

    expect(document.querySelector('[data-alert]')).toBeNull();
    expect(document.getElementById('dashboard-alerts').textContent).toContain(
      'Sin alertas'
    );
    expect(document.getElementById('trend-chart').textContent).toContain(
      'Sin movimientos en los últimos seis meses'
    );
  });

  it('muestra solo los 5 movimientos más recientes y «Ver todos» abre el listado (HU4)', () => {
    setupFinanceSession();
    const config = getConfig();
    const cliente = addEntity(
      {
        name: 'Cliente Mov',
        code: 'CL-M',
        customFields: { tipoTercero: 'cliente' },
      },
      config
    );
    for (let folio = 1; folio <= 4; folio += 1) {
      const factura = addDocument(
        {
          entity_id: cliente.entity_id,
          series: 'M',
          folio,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          totalAmount: 1000 * folio,
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
            montoPagado: 1000 * folio,
            fechaPago: `2026-0${folio}-15`,
          },
        },
        config
      );
    }
    initApp(config);

    const rows = document.querySelectorAll('#dashboard-movements-body tr');
    expect(rows).toHaveLength(5);
    expect(rows[0].textContent).toContain('$');
    expect(rows[0].querySelector('td.amount')).not.toBeNull();

    document.getElementById('dashboard-movements-all').click();
    expect(document.getElementById('view-movements').hidden).toBe(false);
  });

  it('administrador y trabajador no ven gráfico, alertas ni movimientos (HU4)', () => {
    loadDemoData(getConfig());
    setupAdminSession();
    initApp(userConfig);

    for (const id of [
      'dashboard-trend-section',
      'dashboard-alerts-section',
      'dashboard-movements-section',
    ]) {
      expect(document.getElementById(id).closest('[hidden]')).not.toBeNull();
    }
    expect(document.getElementById('trend-chart').textContent).toBe('');
    expect(document.getElementById('dashboard-alerts').textContent).toBe('');
    expect(
      document.getElementById('dashboard-movements-body').textContent
    ).toBe('');
  });
  it('finanzas ve 4 accesos rápidos con etiquetas de una línea (HU5)', () => {
    setupFinanceSession();
    initApp(userConfig);

    expect(visibleQuickActionIds()).toEqual([
      'qa-new-invoice-sale',
      'qa-new-invoice-purchase',
      'qa-cashflow',
      'qa-search',
    ]);
    expect(quickActionLabel('qa-new-invoice-sale')).toBe(
      'Nueva factura de venta'
    );
    expect(quickActionLabel('qa-new-invoice-purchase')).toBe(
      'Nueva factura de compra'
    );
  });

  it('el banner «¿Primera vez?» se descarta por rol y por sesión (HU5)', () => {
    initApp(userConfig);
    const banner = document.getElementById('guide-banner-dashboard');
    expect(banner.hidden).toBe(false);
    expect(document.getElementById('qa-guide').textContent.trim()).toBe(
      '¿Primera vez? Ver la guía'
    );

    document.getElementById('guide-dismiss-dashboard').click();
    expect(banner.hidden).toBe(true);
    expect(sessionStorage.getItem('erp.guideDismissed.administrador')).toBe(
      '1'
    );

    initApp(userConfig);
    expect(document.getElementById('guide-banner-dashboard').hidden).toBe(true);

    setupFinanceSession();
    initApp(userConfig);
    expect(document.getElementById('guide-banner-dashboard').hidden).toBe(
      false
    );
  });
});
