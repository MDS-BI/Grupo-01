import { loadDocuments, loadEntities } from '../storage.js';
import { computeDebtSummary } from '../tracking.js';

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

export function initDashboard({ config, onAction, onLoadDemoData }) {
  setText('dashboard-title', config.labels.dashboard || 'Panel');
  setText('stat-entities-label', config.labels.entities || 'Entidades');
  setText('stat-documents-label', config.labels.documents || 'Documentos');

  const newEntity = document.getElementById('qa-new-entity');
  const newDocument = document.getElementById('qa-new-document');
  const manageEntities = document.getElementById('qa-manage-entities');
  const newInvoiceSale = document.getElementById('qa-new-invoice-sale');
  const newInvoicePurchase = document.getElementById('qa-new-invoice-purchase');

  if (newEntity)
    newEntity.textContent = `Nueva ${(config.labels.entity || 'Entidad').toLowerCase()}`;
  if (newDocument)
    newDocument.textContent = `Nuevo ${(config.labels.document || 'Documento').toLowerCase()}`;
  if (manageEntities) {
    manageEntities.textContent = `Abrir gestión de ${(config.labels.entities || 'Entidades').toLowerCase()}`;
  }

  const bindings = [
    ['qa-new-entity', 'new-entity'],
    ['qa-new-document', 'new-document'],
    ['qa-new-invoice-sale', 'new-invoice-sale'],
    ['qa-new-invoice-purchase', 'new-invoice-purchase'],
    ['qa-tracking', 'tracking'],
    ['qa-manage-entities', 'manage-entities'],
    ['qa-search', 'search'],
  ];

  for (const [id, action] of bindings) {
    const button = document.getElementById(id);
    if (button) button.onclick = () => onAction(action);
  }

  const loadDemoButton = document.getElementById('qa-load-demo');
  if (loadDemoButton) {
    loadDemoButton.onclick = () => onLoadDemoData && onLoadDemoData();
  }
}

export function refreshDashboard({ onDemoAvailable } = {}) {
  setText('stat-entities', String(loadEntities().length));
  setText('stat-documents', String(loadDocuments().length));

  const { totalPorCobrar, totalPorPagar, vencidas } = computeDebtSummary(
    loadEntities(),
    loadDocuments()
  );
  setText('kpi-por-cobrar', String(totalPorCobrar));
  setText('kpi-por-pagar', String(totalPorPagar));
  setText('kpi-vencidas', String(vencidas.length));

  const loadDemoButton = document.getElementById('qa-load-demo');
  if (loadDemoButton) {
    const empty = loadEntities().length === 0 && loadDocuments().length === 0;
    loadDemoButton.hidden = !empty;
    if (empty && onDemoAvailable) onDemoAvailable();
  }
}
