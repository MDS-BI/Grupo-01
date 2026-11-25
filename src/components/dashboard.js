import {
  loadDocuments,
  loadEntities,
  loadPayrollSettlements,
} from '../storage.js';
import { loadMovements } from '../movements.js';
import { computeFinanceIndicators, FINANCE_INDICATORS } from '../finance.js';
import { loadAccessRecords } from '../access-storage.js';
import { loadSession, resolveSessionProfile } from '../session.js';
import { todayISO } from '../tracking.js';

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setQuickActionLabel(id, label) {
  const button = document.getElementById(id);
  if (!button) return;
  const text = button.querySelector('.qa-label') || button;
  text.textContent = label;
}

export function initDashboard({ config, onAction }) {
  const labels = config.labels || {};
  const documents = labels.documents || 'Documentos';

  setText('dashboard-title', labels.dashboard || 'Panel');
  setText('stat-entities-label', labels.entities || 'Entidades');
  setText('stat-documents-label', documents);

  const quickLabels = [
    ['qa-manage-entities', labels.entities || 'Entidades'],
    ['qa-new-invoice-sale', `${documents} de venta`],
    ['qa-new-invoice-purchase', `${documents} de compra`],
    [
      'qa-create-payroll',
      labels.payrollCreate || 'Crear liquidación de sueldo',
    ],
    [
      'qa-new-payroll',
      labels.payrollAdmin || 'Gestionar liquidaciones de sueldo',
    ],
    ['qa-tracking', 'Seguimiento'],
    ['qa-cashflow', 'Flujo de caja'],
    ['qa-movements', 'Movimientos financieros'],
    ['qa-search', labels.search || 'Buscar'],
  ];
  for (const [id, label] of quickLabels) setQuickActionLabel(id, label);

  const bindings = [
    ['qa-new-invoice-sale', 'new-invoice-sale'],
    ['qa-new-invoice-purchase', 'new-invoice-purchase'],
    ['qa-create-payroll', 'create-payroll'],
    ['qa-new-payroll', 'new-payroll'],
    ['qa-cashflow', 'cashflow'],
    ['qa-movements', 'movements'],
    ['qa-tracking', 'tracking'],
    ['qa-manage-entities', 'manage-entities'],
    ['qa-search', 'search'],
  ];

  for (const [id, action] of bindings) {
    const button = document.getElementById(id);
    if (button) button.onclick = () => onAction(action);
  }

  for (const indicator of FINANCE_INDICATORS) {
    const card = document.getElementById(`indicator-${indicator.id}`);
    if (card) card.onclick = () => onAction(indicator.action);
    const info = document.querySelector(`[data-formula-for="${indicator.id}"]`);
    if (info) {
      info.title = indicator.formula;
      info.setAttribute('aria-label', `Fórmula: ${indicator.formula}`);
    }
  }
}

const MONTH_LABELS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function readableMonthLabel(date = new Date()) {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function computeAdminPayrollSummary(
  entities,
  accessRecords,
  settlements,
  { today = todayISO() } = {}
) {
  const records = (accessRecords || []).filter(
    (record) => record?.role === 'trabajador'
  );
  const workers = records.length;
  const monthKey = String(today || '').slice(0, 7);
  const list = settlements || [];
  const currentMonth = list.filter(
    (settlement) => String(settlement?.periodo ?? '').slice(0, 7) === monthKey
  ).length;
  const draft = list.filter(
    (settlement) => settlement?.estado === 'Borrador'
  ).length;
  return { workers, currentMonth, draft };
}

function renderPayrollMetric(container, { id, label, value }) {
  const card = document.createElement('article');
  card.className = 'stat-card payroll-metric';
  const metric = document.createElement('span');
  metric.id = id;
  metric.className = 'stat-value';
  metric.textContent = value > 0 ? String(value) : 'Ninguna';
  metric.classList.toggle('is-empty', !(value > 0));
  const text = document.createElement('span');
  text.textContent = label;
  card.append(metric, text);
  container.append(card);
}

function renderAdminPayrollSummary() {
  const summary = computeAdminPayrollSummary(
    loadEntities(),
    loadAccessRecords(),
    loadPayrollSettlements()
  );
  const container = document.getElementById('admin-payroll-summary');
  if (!container) return;
  container.hidden = false;
  container.textContent = '';
  const heading = document.createElement('h2');
  heading.className = 'section-heading';
  heading.textContent = 'Resumen de nómina';
  container.append(heading);
  renderPayrollMetric(container, {
    id: 'admin-payroll-workers',
    label: 'Trabajadores con acceso',
    value: summary.workers,
  });
  renderPayrollMetric(container, {
    id: 'admin-payroll-current-month',
    label: 'Liquidaciones del mes actual',
    value: summary.currentMonth,
  });
  renderPayrollMetric(container, {
    id: 'admin-payroll-draft',
    label: 'Liquidaciones en borrador',
    value: summary.draft,
  });
}

export function setDashboardSession(session) {
  const role = session?.role;
  const isAdmin = role === 'administrador';

  const createAction = document.getElementById('qa-create-payroll');
  if (createAction) createAction.hidden = !isAdmin;

  const payrollAction = document.getElementById('qa-new-payroll');
  if (payrollAction) {
    payrollAction.hidden = !['administrador', 'finanzas'].includes(role);
  }

  for (const id of [
    'qa-manage-entities',
    'qa-new-invoice-sale',
    'qa-new-invoice-purchase',
    'qa-tracking',
    'qa-cashflow',
    'qa-movements',
    'qa-search',
  ]) {
    const button = document.getElementById(id);
    if (button) button.hidden = isAdmin;
  }

  const profile = resolveSessionProfile(session, { entities: [] });
  setText('dashboard-greeting', `Hola, ${profile.displayName}`);
  setText(
    'dashboard-month',
    readableMonthLabel(
      session?.startedAt ? new Date(session.startedAt) : new Date()
    )
  );

  if (isAdmin) {
    renderAdminPayrollSummary();
  } else {
    const container = document.getElementById('admin-payroll-summary');
    if (container) container.hidden = true;
  }
}

const FINANCE_VALUE_IDS = [
  ...FINANCE_INDICATORS.map((indicator) => indicator.valueId),
  ...FINANCE_INDICATORS.map(
    (indicator) => `indicator-${indicator.id}-variation`
  ),
  'stat-entities',
  'stat-documents',
];

// El Panel solo muestra indicadores financieros al rol finanzas (HU1/HU2).
// Para cualquier otro rol la sección queda oculta y sin valores en el DOM.
export function refreshDashboard() {
  const role = loadSession()?.role;
  const section = document.getElementById('finance-indicators-section');

  if (role !== 'finanzas') {
    if (section) section.hidden = true;
    for (const id of FINANCE_VALUE_IDS) setText(id, '');
    return;
  }

  if (section) section.hidden = false;
  const entities = loadEntities();
  const documents = loadDocuments();
  setText('stat-entities', String(entities.length));
  setText('stat-documents', String(documents.length));

  const indicators = computeFinanceIndicators(
    documents,
    entities,
    loadMovements()
  );
  for (const indicator of indicators) {
    setText(indicator.valueId, indicator.display);
    const card = document.getElementById(`indicator-${indicator.id}`);
    if (card) {
      card.classList.toggle('is-negative', indicator.stateTone === 'negative');
      card.classList.toggle('is-action', indicator.stateTone === 'action');
      card.setAttribute(
        'aria-label',
        `${indicator.label}: ${indicator.display}, ${indicator.variationText}`
      );
    }
    const variation = document.getElementById(
      `indicator-${indicator.id}-variation`
    );
    if (variation) {
      variation.textContent = indicator.variationText;
      variation.dataset.tone = indicator.variationTone;
    }
  }
}
