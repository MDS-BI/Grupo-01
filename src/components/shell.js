import { INVOICE_VIEWS } from '../module-config.js';
import { resolveSessionProfile } from '../session.js';

const INVOICE_MODULES = Object.values(INVOICE_VIEWS).map(
  ({ module }) => module
);

const ADMIN_MODULES = [
  'dashboard',
  'payroll-create',
  'payroll-admin',
  'access',
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

const FINANCE_MENU_MODULES = [
  'entities',
  ...INVOICE_MODULES,
  'movements',
  'cashflow',
  'tracking',
  'payroll-admin',
  'search',
];

const FINANCE_MENU_LABELS = Object.freeze({
  'payroll-admin': 'Liquidaciones de sueldo',
});

export const NAV_MODULES = Object.freeze([
  ...new Set([...ADMIN_MODULES, ...FINANCE_MODULES, 'payroll-worker']),
]);

const MENU_TRANSITION_MS = 180;
let activeEscapeHandler = null;

function renderLogo(container, initials) {
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
  text.textContent = initials;

  svg.append(circle, text);
  container.append(svg);
}

function financeMenuLabel(config, module) {
  return FINANCE_MENU_LABELS[module] || navLabel(config, module);
}

export function navLabel(config, module) {
  const labels = config.labels || {};
  if (module === 'dashboard') return labels.dashboard || 'Panel';
  if (module === 'entities') return labels.entities || 'Entidades';
  const view = Object.values(INVOICE_VIEWS).find(
    (view) => view.module === module
  );
  if (view) return `${labels.documents} de ${view.label}`;
  if (module === 'payroll-create')
    return labels.payrollCreate || 'Crear liquidación de sueldo';
  if (module === 'payroll-admin')
    return labels.payrollAdmin || 'Gestionar liquidaciones de sueldo';
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

function registerEscapeHandler(closeMenu) {
  if (activeEscapeHandler) {
    document.removeEventListener('keydown', activeEscapeHandler);
  }
  activeEscapeHandler = (event) => {
    if (event.key === 'Escape') closeMenu({ returnFocus: true });
  };
  document.addEventListener('keydown', activeEscapeHandler);
}

export function createShell({
  config,
  session,
  entities = [],
  onNavigate,
  onLogout,
  onOpenGuide,
}) {
  const brandName = document.getElementById('brand-name');
  const brandLogo = document.getElementById('brand-logo');

  if (brandName) brandName.textContent = config.moduleName;
  const profile = resolveSessionProfile(session, { entities });
  if (brandLogo) renderLogo(brandLogo, profile.initials);

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

  const menuToggle = document.getElementById('menu-toggle');
  const utilitiesMenu = document.getElementById('utilities-menu');
  const utilitiesOverlay = document.getElementById('utilities-overlay');
  const menuGuide = document.getElementById('menu-guide');
  const menuAccess = document.getElementById('menu-access');
  const menuDevNotifications = document.getElementById(
    'menu-dev-notifications'
  );
  const menuSeparator = document.getElementById('menu-separator');
  const menuLogout = document.getElementById('menu-logout');
  const financeMenuTitle = document.getElementById('finance-menu-title');
  const financeMenu = document.getElementById('finance-menu-navigation');
  const financeMenuSeparator = document.getElementById(
    'finance-menu-separator'
  );
  const financeMenuButtons = [];
  if (financeMenu) {
    financeMenu.replaceChildren();
    for (const module of FINANCE_MENU_MODULES) {
      const button = document.createElement('button');
      const label = financeMenuLabel(config, module);
      button.id = `menu-nav-${module}`;
      button.className = 'menu-item';
      button.type = 'button';
      button.dataset.module = module;
      button.textContent = label;
      button.setAttribute('aria-label', label);
      button.hidden = true;
      financeMenu.append(button);
      financeMenuButtons.push(button);
    }
  }
  const backBar = document.getElementById('back-bar');
  const backButton = document.getElementById('back-to-dashboard');
  const backViewName = document.getElementById('back-view-name');

  function closeMenu({ returnFocus = false, immediate = false } = {}) {
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    if (utilitiesMenu) utilitiesMenu.classList.remove('is-open');
    if (utilitiesOverlay) utilitiesOverlay.classList.remove('is-open');

    const wasOpen = utilitiesMenu && !utilitiesMenu.hidden;
    if (wasOpen && !immediate) {
      const menu = utilitiesMenu;
      const overlay = utilitiesOverlay;
      window.setTimeout(() => {
        if (!menu.classList.contains('is-open')) {
          menu.hidden = true;
          if (overlay) overlay.hidden = true;
        }
      }, MENU_TRANSITION_MS);
    } else {
      if (utilitiesMenu) utilitiesMenu.hidden = true;
      if (utilitiesOverlay) utilitiesOverlay.hidden = true;
    }

    if (returnFocus && wasOpen && menuToggle && !menuToggle.hidden)
      menuToggle.focus();
  }

  function openMenu() {
    if (!session || !utilitiesMenu) return;
    utilitiesMenu.hidden = false;
    if (utilitiesOverlay) utilitiesOverlay.hidden = false;
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    void utilitiesMenu.offsetWidth;
    utilitiesMenu.classList.add('is-open');
    if (utilitiesOverlay) utilitiesOverlay.classList.add('is-open');

    const firstOption = [
      ...financeMenuButtons,
      menuGuide,
      menuAccess,
      menuDevNotifications,
      menuLogout,
    ].find((button) => button && !button.hidden);
    if (firstOption) firstOption.focus();
  }

  if (menuToggle) {
    menuToggle.hidden = !session;
    menuToggle.onclick = () => {
      if (!session) return;
      if (utilitiesMenu && !utilitiesMenu.hidden) closeMenu();
      else openMenu();
    };
  }

  if (utilitiesOverlay) utilitiesOverlay.onclick = () => closeMenu();

  if (menuGuide) {
    menuGuide.hidden = !session;
    menuGuide.onclick =
      session && onOpenGuide
        ? () => {
            closeMenu();
            onOpenGuide(menuGuide);
          }
        : null;
  }
  const isAdmin = Boolean(session) && session.role === 'administrador';
  const isFinance = Boolean(session) && session.role === 'finanzas';
  if (financeMenuTitle) financeMenuTitle.hidden = !isFinance;
  if (financeMenu) financeMenu.hidden = !isFinance;
  if (financeMenuSeparator) financeMenuSeparator.hidden = !isFinance;
  for (const button of financeMenuButtons) {
    button.hidden = !isFinance;
    button.onclick =
      isFinance && onNavigate
        ? () => {
            closeMenu();
            onNavigate(button.dataset.module);
          }
        : null;
  }
  if (menuAccess) {
    menuAccess.hidden = !isAdmin;
    menuAccess.onclick =
      isAdmin && onNavigate
        ? () => {
            closeMenu();
            onNavigate('access');
          }
        : null;
  }
  if (menuDevNotifications) {
    menuDevNotifications.hidden = true;
    menuDevNotifications.onclick = null;
  }
  if (menuSeparator)
    menuSeparator.hidden = menuAccess ? menuAccess.hidden : true;
  if (menuLogout) {
    menuLogout.hidden = !session;
    menuLogout.onclick =
      session && onLogout
        ? () => {
            closeMenu();
            onLogout();
          }
        : null;
  }
  if (backButton) {
    backButton.onclick =
      session && onNavigate
        ? () => {
            closeMenu();
            onNavigate('dashboard');
          }
        : null;
  }

  if (utilitiesMenu) utilitiesMenu.hidden = true;
  if (utilitiesOverlay) utilitiesOverlay.hidden = true;
  if (backBar) backBar.hidden = true;
  registerEscapeHandler(closeMenu);

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

    const isLogin = module === 'login';
    const canUsePanel = Boolean(session) && session.role !== 'trabajador';
    const showBack = canUsePanel && !isLogin && module !== 'dashboard';

    if (backBar) backBar.hidden = !showBack;
    if (showBack && backViewName)
      backViewName.textContent = navLabel(config, module);

    if (!session || isLogin) {
      closeMenu({ immediate: true });
      if (menuToggle) menuToggle.hidden = true;
      if (utilitiesMenu) utilitiesMenu.hidden = true;
      if (utilitiesOverlay) utilitiesOverlay.hidden = true;
    } else if (menuToggle) {
      menuToggle.hidden = false;
    }
  }

  return { setActive, closeMenu };
}
