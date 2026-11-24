import { loadDocuments, loadEntities } from '../storage.js';
import { loadMovements } from '../movements.js';
import { computeDashboardSummary } from '../summary.js';
import { formatCurrencyCLP } from '../format.js';

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
}

export function refreshDashboard() {
  const entities = loadEntities();
  const documents = loadDocuments();
  const summary = computeDashboardSummary(entities, documents, loadMovements());

  setText('stat-entities', String(entities.length));
  setText('stat-documents', String(documents.length));
  setText('summary-saldo', formatCurrencyCLP(summary.saldo));
  setText('summary-deuda', formatCurrencyCLP(summary.deuda));
  setText('summary-caja', formatCurrencyCLP(summary.caja));
  setText('kpi-por-cobrar', formatCurrencyCLP(summary.totalPorCobrar));
  setText('kpi-por-pagar', formatCurrencyCLP(summary.totalPorPagar));
  setText('kpi-vencidas', String(summary.vencidas.length));
}
