import { loadDocuments, loadEntities } from '../storage.js';
import { loadMovements } from '../movements.js';
import { computeDashboardSummary } from '../summary.js';

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

export function initDashboard({ config, onAction }) {
  setText('dashboard-title', config.labels.dashboard || 'Panel');
  setText('stat-entities-label', config.labels.entities || 'Entidades');
  setText('stat-documents-label', config.labels.documents || 'Documentos');

  const manageEntities = document.getElementById('qa-manage-entities');

  if (manageEntities) {
    manageEntities.textContent = `Abrir gestión de ${(config.labels.entities || 'Entidades').toLowerCase()}`;
  }

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
