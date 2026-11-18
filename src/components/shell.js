import { INVOICE_VIEWS } from '../module-config.js';
import { monogram } from '../utils.js';

const INVOICE_MODULES = Object.values(INVOICE_VIEWS).map(
  ({ module }) => module
);

const ADMIN_MODULES = [
  'dashboard',
  'entities',
  ...INVOICE_MODULES,
  'payroll-admin',
  'access',
  'dev-notifications',
  'movements',
  'cashflow',
  'tracking',
  'search',
];

const FINANCE_MODULES = [
  'dashboard',
  'entities',
  ...INVOICE_MODULES,
  'payroll-admin',
  'movements',
  'cashflow',
  'tracking',
  'search',
];

function renderLogo(container, moduleName) {
  if (!container) return;
  container.textContent = '';
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('width', '40');
  svg.setAttribute('height', '40');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('brand-logo-svg');

  const circle = document.createElementNS(namespace, 'circle');
  circle.setAttribute('cx', '20');
  circle.setAttribute('cy', '20');
  circle.setAttribute('r', '20');
  circle.style.fill = 'var(--accent-color)';

  const text = document.createElementNS(namespace, 'text');
  text.setAttribute('x', '20');
  text.setAttribute('y', '26');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '16');
  text.setAttribute('font-weight', '700');
  text.setAttribute('fill', '#ffffff');
  text.textContent = monogram(moduleName);

  svg.append(circle, text);
  container.append(svg);
}

function navLabel(config, module) {
  const labels = config.labels || {};
  if (module === 'dashboard') return labels.dashboard || 'Panel';
  if (module === 'entities') return labels.entities || 'Entidades';
  const view = Object.values(INVOICE_VIEWS).find(
    (view) => view.module === module
  );
  if (view) return `${labels.documents} de ${view.label}`;
  if (module === 'payroll-admin')
    return labels.payrollAdmin || 'Liquidaciones de sueldo';
  if (module === 'access') return labels.access || 'Accesos';
  if (module === 'dev-notifications')
    return labels.devNotifications || 'Avisos para el desarrollador';
  if (module === 'movements') return 'Movimientos financieros';
  if (module === 'cashflow') return 'Flujo de caja';
  if (module === 'tracking') return 'Seguimiento';
  if (module === 'payroll-worker')
    return labels.payrollWorker || 'Mi liquidación';
  return labels.search || 'Buscar';
}

export function createShell({ config, session, onNavigate, onLogout }) {
  const brandName = document.getElementById('brand-name');
  const brandLogo = document.getElementById('brand-logo');

  if (brandName) brandName.textContent = config.moduleName;
  renderLogo(brandLogo, config.moduleName);

  const modules = !session
    ? []
    : session.role === 'trabajador'
      ? ['payroll-worker']
      : session.role === 'finanzas'
        ? FINANCE_MODULES
        : ADMIN_MODULES;

  const navButtons = Array.from(
    document.querySelectorAll('.sidebar .nav-item[data-module]')
  );
  for (const button of navButtons) {
    const label = navLabel(config, button.dataset.module);
    button.textContent = label;
    button.setAttribute('aria-label', label);
    button.hidden = !session || !modules.includes(button.dataset.module);
    button.onclick =
      session && onNavigate ? () => onNavigate(button.dataset.module) : null;
  }
  const invoiceGroup = document.getElementById('nav-invoices-group');
  if (invoiceGroup) {
    invoiceGroup.hidden =
      !session || !modules.some((module) => INVOICE_MODULES.includes(module));
  }

  const roleLabel = document.getElementById('session-role');
  if (roleLabel) {
    const roleNames = {
      administrador: 'Administrador',
      finanzas: 'Finanzas',
      trabajador: 'Trabajador',
    };
    roleLabel.textContent = session ? `Rol: ${roleNames[session.role]}` : '';
    roleLabel.hidden = !session;
  }

  const logoutButton = document.getElementById('nav-logout');
  if (logoutButton) {
    logoutButton.hidden = !session;
    if (!logoutButton.hidden && onLogout)
      logoutButton.onclick = () => onLogout();
    else logoutButton.onclick = null;
  }

  function setActive(module) {
    for (const button of navButtons) {
      const isActive = button.dataset.module === module;
      button.classList.toggle('active', isActive);
      if (isActive) {
        button.setAttribute('aria-current', 'page');
      } else {
        button.removeAttribute('aria-current');
      }
    }
  }

  return { setActive };
}
