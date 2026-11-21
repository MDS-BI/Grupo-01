import { loadDocuments, loadEntities } from '../storage.js';
import { loadMovements } from '../movements.js';
import { computeDashboardSummary } from '../summary.js';

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
    ['qa-new-payroll', labels.payrollAdmin || 'Liquidaciones de sueldo'],
    ['qa-tracking', 'Seguimiento'],
    ['qa-cashflow', 'Flujo de caja'],
    ['qa-movements', 'Movimientos financieros'],
    ['qa-search', labels.search || 'Buscar'],
  ];
  for (const [id, label] of quickLabels) setQuickActionLabel(id, label);

  const bindings = [
    ['qa-new-invoice-sale', 'new-invoice-sale'],
    ['qa-new-invoice-purchase', 'new-invoice-purchase'],
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
  const payrollAction = document.getElementById('qa-new-payroll');
  if (payrollAction)
    payrollAction.hidden = !['administrador', 'finanzas'].includes(
      session?.role
    );
}

export function refreshDashboard() {
  const entities = loadEntities();
  const documents = loadDocuments();
  const summary = computeDashboardSummary(entities, documents, loadMovements());

  setText('stat-entities', String(entities.length));
  setText('stat-documents', String(documents.length));
  setText('summary-saldo', String(summary.saldo));
  setText('summary-deuda', String(summary.deuda));
  setText('summary-caja', String(summary.caja));
  setText('kpi-por-cobrar', String(summary.totalPorCobrar));
  setText('kpi-por-pagar', String(summary.totalPorPagar));
  setText('kpi-vencidas', String(summary.vencidas.length));
}
