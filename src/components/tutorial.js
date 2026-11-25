import { navLabel } from './shell.js';
import { userConfig } from '../module-config.js';

const STEP_DEFINITIONS = [
  {
    id: 'panel',
    module: 'dashboard',
    title: (config) => navLabel(config, 'dashboard'),
    text: ({ config }) =>
      `Revisa el resumen de tu ${navLabel(config, 'dashboard')}, el menú ☰ y los accesos rápidos.`,
  },
  {
    id: 'payroll-create',
    module: 'payroll-create',
    title: (config) => navLabel(config, 'payroll-create'),
    text: () =>
      'Crea una liquidación de sueldo y alta automáticamente el acceso del trabajador con la contraseña inicial derivada de su RUT.',
  },
  {
    id: 'entities',
    module: 'entities',
    title: (config) => config.labels.entities || 'Terceros',
    text: ({ config }) =>
      `Crea un ${config.labels.entity || 'Tercero'} (cliente, proveedor o personal); el RUT se valida y el límite de crédito es solo de clientes.`,
  },
  {
    id: 'invoice-sale',
    module: 'invoice-sale',
    title: (config) => navLabel(config, 'invoice-sale'),
    text: ({ config }) =>
      `La ${config.labels.document || 'Factura'} de venta nace en Borrador, solo para clientes, con orden de venta opcional.`,
  },
  {
    id: 'invoice-purchase',
    module: 'invoice-purchase',
    title: (config) => navLabel(config, 'invoice-purchase'),
    text: ({ config }) =>
      `La ${config.labels.document || 'Factura'} de compra es para proveedores o personal; el centro de costo se elige al emitir y el período YYYY-MM se exige si el tercero es personal.`,
  },
  {
    id: 'issue-pay',
    module: 'invoice-sale',
    title: () => 'Emitir y pagar',
    text: () =>
      'El ciclo es Borrador → Emitida → Pagada; el monto pagado debe ser igual al total.',
  },
  {
    id: 'payroll-admin',
    module: 'payroll-admin',
    title: (config) => navLabel(config, 'payroll-admin'),
    text: ({ config }) =>
      `La ${config.labels.document || 'Factura'} de compra dirigida a personal es el comprobante de la liquidación; no se calculan haberes ni descuentos.`,
  },
  {
    id: 'access',
    module: 'access',
    title: (config) => navLabel(config, 'access'),
    text: () =>
      'Asocia, activa, desactiva y cambia el rol de los accesos desde Control de accesos; esta utilidad es solo del administrador.',
  },
  {
    id: 'movements',
    module: 'movements',
    title: (config) => navLabel(config, 'movements'),
    text: () => 'Un movimiento por emisión y por pago; son de solo lectura.',
  },
  {
    id: 'cashflow',
    module: 'cashflow',
    title: (config) => navLabel(config, 'cashflow'),
    text: ({ config }) =>
      `Ingresos y egresos de ${(config.labels.documents || 'Facturas').toLowerCase()} Pagadas, con totales y estado vacío; solo lectura.`,
  },
  {
    id: 'tracking',
    module: 'tracking',
    title: (config) => navLabel(config, 'tracking'),
    text: ({ config }) =>
      `Deuda por ${(config.labels.entity || 'Tercero').toLowerCase()} y vencimientos con fecha anterior a hoy.`,
  },
  {
    id: 'menu',
    module: null,
    title: () => 'Menú ☰ «Utilidades & Sesión»',
    text: ({ role }) =>
      role === 'administrador'
        ? 'En el menú ☰ «Utilidades & Sesión» puedes abrir Control de accesos y cerrar sesión. Control de accesos es solo del administrador.'
        : 'En el menú ☰ «Utilidades & Sesión» puedes usar "Cerrar sesión"; las utilidades de administración no están disponibles para tu rol.',
  },
  {
    id: 'payroll-worker',
    module: 'payroll-worker',
    title: (config) => navLabel(config, 'payroll-worker'),
    text: () =>
      'El trabajador ve su última liquidación con el desglose (sueldo base, descuentos y bonos) y el historial de sus propios pagos, en solo lectura, según la HU3 de la spec 002.',
  },
  {
    id: 'cuidados',
    module: null,
    title: () => 'Cuidados',
    text: () =>
      'Los datos son ficticios; la contraseña inicial son los primeros 4 dígitos del RUT; el control de acceso es solo de interfaz.',
  },
];

let activeEscapeHandler = null;

function isVisible(element) {
  if (!element || !element.isConnected) return false;
  const utilitiesMenu = element.closest?.('#utilities-menu');
  if (utilitiesMenu && !utilitiesMenu.classList.contains('is-open'))
    return false;
  for (let current = element; current; current = current.parentElement) {
    if (current.hidden) return false;
  }
  return true;
}

function resolveStep(definition, config, role) {
  return {
    id: definition.id,
    title: definition.title(config),
    module: definition.module,
    text: definition.text({ config, role }),
  };
}

function resolveSteps({ config, role, session, canAccess }) {
  const steps = [];
  for (const definition of STEP_DEFINITIONS) {
    if (
      role === 'trabajador' &&
      !['payroll-worker', 'cuidados'].includes(definition.id)
    )
      continue;
    if (role !== 'trabajador' && definition.id === 'payroll-worker') continue;
    if (
      definition.module &&
      typeof canAccess === 'function' &&
      !canAccess(definition.module, session)
    )
      continue;
    steps.push(resolveStep(definition, config, role));
  }
  return steps;
}

export const GUIDE_STEPS = STEP_DEFINITIONS.map((definition) =>
  resolveStep(definition, userConfig, 'administrador')
);

export function getGuideSteps({
  config = userConfig,
  role,
  session,
  canAccess,
}) {
  return resolveSteps({
    config,
    role: role || session?.role,
    session,
    canAccess,
  });
}

export function createTutorial({
  config = userConfig,
  root,
  session,
  canAccess,
  onNavigate,
}) {
  const steps = getGuideSteps({
    config,
    role: session?.role,
    session,
    canAccess,
  });
  const title = root?.querySelector('#guide-title');
  const indicator = root?.querySelector('#guide-step-indicator');
  const body = root?.querySelector('#guide-body');
  const prevButton = root?.querySelector('#guide-prev');
  const nextButton = root?.querySelector('#guide-next');
  const goButton = root?.querySelector('#guide-go');
  const closeButton = root?.querySelector('#guide-close');

  let index = 0;
  let opened = false;
  let opener = null;

  function render() {
    const step = steps[index];
    if (!step || !root) return;
    if (title) title.textContent = step.title;
    if (indicator)
      indicator.textContent = `Paso ${index + 1} de ${steps.length}`;
    if (body) {
      body.dataset.step = step.id;
      body.textContent = step.text;
    }
    if (prevButton) prevButton.hidden = index === 0;
    if (nextButton)
      nextButton.textContent =
        index === steps.length - 1 ? 'Finalizar' : 'Siguiente';
    if (goButton)
      goButton.hidden =
        !step.module ||
        typeof canAccess !== 'function' ||
        !canAccess(step.module, session);
  }

  function close({ returnFocus = true } = {}) {
    if (!root) return;
    root.hidden = true;
    opened = false;
    if (returnFocus && opener) {
      const focusTarget = isVisible(opener)
        ? opener
        : document.getElementById('menu-toggle');
      if (focusTarget && typeof focusTarget.focus === 'function')
        focusTarget.focus();
    }
    opener = null;
  }

  function open(startIndex = 0, nextOpener = document.activeElement) {
    if (!root || steps.length === 0) return;
    opener = nextOpener;
    index = Math.max(0, Math.min(Number(startIndex) || 0, steps.length - 1));
    render();
    root.hidden = false;
    opened = true;
    closeButton?.focus();
  }

  function next() {
    if (!opened) return;
    if (index >= steps.length - 1) close();
    else {
      index += 1;
      render();
    }
  }

  function prev() {
    if (!opened || index === 0) return;
    index -= 1;
    render();
  }

  function goTo(targetIndex) {
    if (!opened || !steps[targetIndex]) return;
    index = targetIndex;
    render();
  }

  function go() {
    const step = steps[index];
    if (!opened || !step?.module || typeof onNavigate !== 'function') return;
    onNavigate(step.module);
  }

  if (prevButton) prevButton.onclick = prev;
  if (nextButton) nextButton.onclick = next;
  if (goButton) goButton.onclick = go;
  if (closeButton) closeButton.onclick = () => close();

  if (activeEscapeHandler)
    document.removeEventListener('keydown', activeEscapeHandler);
  activeEscapeHandler = (event) => {
    if (event.key === 'Escape' && opened) close();
  };
  document.addEventListener('keydown', activeEscapeHandler);

  return { open, close, next, prev, goTo, isOpen: () => opened };
}
