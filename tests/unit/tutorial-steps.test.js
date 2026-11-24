import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTutorial,
  getGuideSteps,
  GUIDE_STEPS,
} from '../../src/components/tutorial.js';
import { canAccess } from '../../src/app.js';
import { NAV_MODULES, navLabel } from '../../src/components/shell.js';
import { userConfig } from '../../src/module-config.js';

const SESSIONS = {
  administrador: { accessId: '88.888.888-8', role: 'administrador' },
  finanzas: { accessId: '55.555.555-5', role: 'finanzas' },
  trabajador: {
    accessId: '22.222.222-2',
    role: 'trabajador',
    entityId: 'ent-1',
  },
};

const ADMIN_STEPS = [
  'panel',
  'payroll-create',
  'payroll-admin',
  'access',
  'menu',
  'cuidados',
];

const FINANCE_STEPS = [
  'panel',
  'entities',
  'invoice-sale',
  'invoice-purchase',
  'issue-pay',
  'payroll-admin',
  'movements',
  'cashflow',
  'tracking',
  'menu',
  'cuidados',
];

const WORKER_STEPS = ['payroll-worker', 'cuidados'];

function mountGuide() {
  document.body.innerHTML = `
    <section id="guide-panel" role="dialog" aria-modal="false" hidden>
      <h2 id="guide-title"></h2>
      <p id="guide-step-indicator"></p>
      <div id="guide-body"></div>
      <button id="guide-prev" type="button">Anterior</button>
      <button id="guide-next" type="button">Siguiente</button>
      <button id="guide-go" type="button">Ir a</button>
      <button id="guide-close" type="button">Cerrar</button>
    </section>
  `;
  return document.getElementById('guide-panel');
}

function storageEntries(storage) {
  const result = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    result[key] = storage.getItem(key);
  }
  return result;
}

function snapshotStorage() {
  return {
    local: storageEntries(localStorage),
    session: storageEntries(sessionStorage),
  };
}

describe('T113 - catálogo y selección de pasos de la guía', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mountGuide();
  });

  it('usa los IDs y el orden del contrato en el catálogo', () => {
    expect(GUIDE_STEPS.map((step) => step.id)).toEqual([
      'panel',
      'payroll-create',
      'entities',
      'invoice-sale',
      'invoice-purchase',
      'issue-pay',
      'payroll-admin',
      'access',
      'movements',
      'cashflow',
      'tracking',
      'menu',
      'payroll-worker',
      'cuidados',
    ]);
    for (const step of GUIDE_STEPS) {
      expect(typeof step.title).toBe('string');
      expect(typeof step.text).toBe('string');
      expect(Object.hasOwn(step, 'module')).toBe(true);
    }
    expect(GUIDE_STEPS.find((step) => step.id === 'menu').module).toBeNull();
    expect(
      GUIDE_STEPS.find((step) => step.id === 'cuidados').module
    ).toBeNull();
    expect(NAV_MODULES).toContain('cashflow');
    expect(NAV_MODULES).toContain('payroll-worker');
  });

  it('selecciona pasos por rol y respeta el canAccess inyectado', () => {
    const admin = getGuideSteps({
      config: userConfig,
      role: 'administrador',
      session: SESSIONS.administrador,
      canAccess,
    });
    const finance = getGuideSteps({
      config: userConfig,
      role: 'finanzas',
      session: SESSIONS.finanzas,
      canAccess,
    });
    const worker = getGuideSteps({
      config: userConfig,
      role: 'trabajador',
      session: SESSIONS.trabajador,
      canAccess,
    });

    expect(admin.map((step) => step.id)).toEqual(ADMIN_STEPS);
    expect(finance.map((step) => step.id)).toEqual(FINANCE_STEPS);
    expect(worker.map((step) => step.id)).toEqual(WORKER_STEPS);

    const denied = getGuideSteps({
      config: userConfig,
      role: 'administrador',
      session: SESSIONS.administrador,
      canAccess: (view, session) =>
        view !== 'payroll-create' &&
        view !== 'access' &&
        canAccess(view, session),
    });

    expect(denied.map((step) => step.id)).not.toContain('payroll-create');
    expect(denied.map((step) => step.id)).not.toContain('access');
    expect(denied.map((step) => step.id)).toContain('cuidados');
    expect(denied.map((step) => step.id)).toContain('menu');
  });

  it('toma términos de config.labels y navLabel', () => {
    const config = {
      ...userConfig,
      labels: {
        ...userConfig.labels,
        entity: 'Persona',
        entities: 'Personas',
        document: 'Boleta',
        documents: 'Boletas',
        dashboard: 'Inicio',
      },
    };
    const steps = getGuideSteps({
      config,
      role: 'finanzas',
      session: SESSIONS.finanzas,
      canAccess,
    });
    const adminSteps = getGuideSteps({
      config,
      role: 'administrador',
      session: SESSIONS.administrador,
      canAccess,
    });
    const panel = steps.find((step) => step.id === 'panel');
    const entities = steps.find((step) => step.id === 'entities');
    const invoiceSale = steps.find((step) => step.id === 'invoice-sale');

    expect(panel.title).toBe(navLabel(config, 'dashboard'));
    expect(entities.title).toBe('Personas');
    expect(entities.text).toContain('Persona');
    expect(invoiceSale.title).toBe('Boletas de venta');
    expect(invoiceSale.text).toContain('Boleta');
    expect(adminSteps.find((step) => step.id === 'payroll-create').title).toBe(
      navLabel(config, 'payroll-create')
    );
  });

  it('calcula el indicador, oculta "Ir a" cuando no aplica y no escribe almacenamiento', () => {
    const root = mountGuide();
    const tutorial = createTutorial({
      config: userConfig,
      root,
      session: SESSIONS.administrador,
      canAccess,
      onNavigate: () => {},
    });
    const before = snapshotStorage();

    tutorial.open(0, root);

    expect(document.getElementById('guide-step-indicator').textContent).toBe(
      'Paso 1 de 6'
    );
    expect(document.getElementById('guide-go').hidden).toBe(false);

    tutorial.next();

    expect(document.getElementById('guide-step-indicator').textContent).toBe(
      'Paso 2 de 6'
    );

    tutorial.prev();

    expect(document.getElementById('guide-step-indicator').textContent).toBe(
      'Paso 1 de 6'
    );

    tutorial.goTo(4);

    expect(document.getElementById('guide-body').dataset.step).toBe('menu');
    expect(document.getElementById('guide-go').hidden).toBe(true);

    tutorial.goTo(5);

    expect(document.getElementById('guide-body').dataset.step).toBe('cuidados');
    expect(document.getElementById('guide-go').hidden).toBe(true);
    expect(document.getElementById('guide-next').textContent).toBe('Finalizar');

    tutorial.close();

    expect(root.hidden).toBe(true);
    expect(snapshotStorage()).toEqual(before);
  });

  it('describe el menú según el rol del recorrido', () => {
    const admin = getGuideSteps({
      config: userConfig,
      role: 'administrador',
      session: SESSIONS.administrador,
      canAccess,
    }).find((step) => step.id === 'menu');
    const finance = getGuideSteps({
      config: userConfig,
      role: 'finanzas',
      session: SESSIONS.finanzas,
      canAccess,
    }).find((step) => step.id === 'menu');

    expect(admin.text).toContain('Control de accesos');
    expect(admin.text).not.toContain('Avisos al desarrollador');
    expect(finance.text).not.toContain('Control de accesos');
    expect(finance.text).not.toContain('Avisos al desarrollador');
    expect(finance.text).toContain('Cerrar sesión');
  });
});
