import {
  loadDocuments,
  loadEntities,
  loadPayrollSettlements,
} from '../storage.js';
import { loadMovements } from '../movements.js';
import { computeFinanceIndicators, FINANCE_INDICATORS } from '../finance.js';
import { computeMonthlyIncomeExpense } from '../cashflow.js';
import { formatCurrencyCLP } from '../format.js';
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

let dashboardAction = () => {};

export function initDashboard({ config, onAction }) {
  dashboardAction = onAction;
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

  const seeAll = document.getElementById('dashboard-movements-all');
  if (seeAll) seeAll.onclick = () => onAction('movements');

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

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

// Gráfico SVG propio de ingresos vs gastos (contracts/trend-chart.md).
function renderTrendChart(container, points) {
  if (!container) return;
  container.textContent = '';
  const max = Math.max(0, ...points.flatMap((p) => [p.income, p.expense]));
  if (max === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Sin movimientos en los últimos seis meses.';
    container.append(empty);
    return;
  }

  const legend = document.createElement('p');
  legend.className = 'trend-legend';
  for (const [tone, text] of [
    ['income', 'Ingresos'],
    ['expense', 'Gastos'],
  ]) {
    const item = document.createElement('span');
    item.className = `trend-legend-item trend-legend-item--${tone}`;
    item.textContent = text;
    legend.append(item);
  }
  container.append(legend);

  const width = 900;
  const height = 200;
  const padTop = 12;
  const bottom = 28;
  const chartHeight = height - padTop - bottom;
  const slot = width / points.length;
  const barWidth = Math.min(28, slot / 3);

  const svg = svgElement('svg', {
    viewBox: `0 0 ${width} ${height}`,
    width: '100%',
    height: '100%',
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    class: 'trend-svg',
  });
  const title = svgElement('title');
  title.textContent =
    'Tendencia de ingresos y gastos de los últimos seis meses';
  const desc = svgElement('desc');
  desc.textContent = points
    .map(
      (p) =>
        `${p.label}: ingresos ${formatCurrencyCLP(p.income)}, gastos ${formatCurrencyCLP(p.expense)}`
    )
    .join('; ');
  svg.append(title, desc);
  svg.append(
    svgElement('line', {
      x1: 0,
      x2: width,
      y1: padTop + chartHeight,
      y2: padTop + chartHeight,
      class: 'trend-axis',
    })
  );

  points.forEach((point, index) => {
    const center = slot * index + slot / 2;
    const group = svgElement('g', { class: 'trend-month' });
    const label = svgElement('title');
    label.textContent = `${point.label}: ingresos ${formatCurrencyCLP(point.income)}, gastos ${formatCurrencyCLP(point.expense)}`;
    group.append(label);
    for (const [value, offset, tone] of [
      [point.income, -barWidth - 2, 'income'],
      [point.expense, 2, 'expense'],
    ]) {
      const barHeight = Math.round((value / max) * chartHeight);
      group.append(
        svgElement('rect', {
          x: center + offset,
          y: padTop + chartHeight - barHeight,
          width: barWidth,
          height: barHeight,
          rx: 3,
          class: `trend-bar trend-bar--${tone}`,
        })
      );
    }
    const text = svgElement('text', {
      x: center,
      y: height - 8,
      'text-anchor': 'middle',
      class: 'trend-label',
    });
    text.textContent = point.label;
    group.append(text);
    svg.append(group);
  });

  container.append(svg);
}

function renderAlerts(list, indicators) {
  if (!list) return;
  list.textContent = '';
  const byId = Object.fromEntries(indicators.map((item) => [item.id, item]));
  const alerts = [];
  if (byId.cash?.stateTone === 'negative') {
    alerts.push({
      id: 'negative-cash',
      tone: 'negative',
      message: `Caja en negativo: ${byId.cash.display}`,
      action: 'cashflow',
    });
  }
  if (byId.overdue?.value > 0) {
    const count = byId.overdue.value;
    alerts.push({
      id: 'overdue-invoices',
      tone: 'action',
      message: count === 1 ? '1 factura vencida' : `${count} facturas vencidas`,
      action: 'tracking',
    });
  }
  if (alerts.length === 0) {
    const item = document.createElement('li');
    item.className = 'alert-item alert-item--ok';
    item.textContent = 'Sin alertas por ahora.';
    list.append(item);
    return;
  }
  for (const alert of alerts) {
    const item = document.createElement('li');
    item.className = `alert-item alert-item--${alert.tone}`;
    item.dataset.alert = alert.id;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'alert-link';
    button.textContent = `${alert.message} · Ver detalle`;
    button.onclick = () => dashboardAction(alert.action);
    item.append(button);
    list.append(item);
  }
}

const MOVEMENT_TYPES = {
  cargo: 'Venta emitida',
  abono: 'Compra emitida',
  pago: 'Pago',
};

function readableDate(value) {
  const [year, month, day] = String(value ?? '')
    .slice(0, 10)
    .split('-');
  return day ? `${day}-${month}-${year}` : String(value ?? '');
}

function renderRecentMovements(movements, entities) {
  const body = document.getElementById('dashboard-movements-body');
  const empty = document.getElementById('dashboard-movements-empty');
  if (!body) return;
  body.textContent = '';
  const latest = [...(movements || [])]
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
    .slice(0, 5);
  if (empty) empty.hidden = latest.length > 0;
  const names = new Map(
    (entities || []).map((entity) => [entity.entity_id, entity.name])
  );
  for (const movement of latest) {
    const row = document.createElement('tr');
    const cells = [
      readableDate(movement.fecha),
      MOVEMENT_TYPES[movement.tipo] ?? movement.tipo,
      names.get(movement.entity_id) ?? '—',
      formatCurrencyCLP(movement.monto),
    ];
    cells.forEach((value, index) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (index === 3) cell.className = 'amount';
      row.append(cell);
    });
    body.append(row);
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

  const insights = document.getElementById('finance-insights');
  const movementsSection = document.getElementById(
    'dashboard-movements-section'
  );

  if (role !== 'finanzas') {
    if (section) section.hidden = true;
    if (insights) insights.hidden = true;
    if (movementsSection) movementsSection.hidden = true;
    for (const id of FINANCE_VALUE_IDS) setText(id, '');
    for (const id of [
      'trend-chart',
      'dashboard-alerts',
      'dashboard-movements-body',
    ]) {
      setText(id, '');
    }
    return;
  }

  if (section) section.hidden = false;
  if (insights) insights.hidden = false;
  if (movementsSection) movementsSection.hidden = false;
  const entities = loadEntities();
  const documents = loadDocuments();
  setText('stat-entities', String(entities.length));
  setText('stat-documents', String(documents.length));

  const movements = loadMovements();
  const indicators = computeFinanceIndicators(documents, entities, movements);
  renderTrendChart(
    document.getElementById('trend-chart'),
    computeMonthlyIncomeExpense(documents, entities, movements)
  );
  renderAlerts(document.getElementById('dashboard-alerts'), indicators);
  renderRecentMovements(movements, entities);
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
