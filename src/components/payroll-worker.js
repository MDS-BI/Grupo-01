import { resolveWorkerSettlement } from '../payroll.js';
import { loadEntities, loadPurchaseInvoices } from '../storage.js';

const WORKER_MARKUP = `
  <h1 id="payroll-worker-title">Mi liquidación</h1>
  <div id="payroll-worker-card">
    <h2 id="payroll-worker-period">Sin período asignado</h2>
    <p id="payroll-worker-name"></p>
    <p id="payroll-worker-rut"></p>
    <p id="payroll-worker-amount"></p>
    <p id="payroll-worker-status"></p>
    <p id="payroll-worker-paid-at"></p>
  </div>
  <div id="payroll-worker-empty" hidden>
    <p>Aún no tienes una liquidación registrada.</p>
  </div>
  <div id="payroll-worker-warning" hidden>
    <p id="payroll-worker-warning-message"></p>
  </div>
`;

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setHidden(id, hidden) {
  const element = document.getElementById(id);
  if (element) element.hidden = hidden;
}

const SECURITY_WARNING =
  'El control de acceso es una restricción de interfaz; los datos viven en el navegador y no deben usarse datos reales. Exactamente una liquidación vigente se muestra para tu RUT.';

export function renderWorkerMarkup() {
  const root = document.getElementById('view-payroll-worker');
  if (root) root.innerHTML = WORKER_MARKUP;
}

export function renderPayrollSettlement(settlement, entity, warningMessage) {
  const hasSettlement = Boolean(settlement);
  setHidden('payroll-worker-card', !hasSettlement);
  setHidden('payroll-worker-empty', hasSettlement);

  if (hasSettlement) {
    setText(
      'payroll-worker-period',
      settlement.customFields?.periodoLiquidacion || 'Sin período'
    );
    setText('payroll-worker-name', entity?.name || '');
    setText('payroll-worker-rut', entity?.taxId || '');
    setText(
      'payroll-worker-amount',
      `Monto: ${Number(settlement.totalAmount || 0).toLocaleString('es-CL')}`
    );
    setText('payroll-worker-status', `Estado: ${settlement.status || ''}`);
    setText(
      'payroll-worker-paid-at',
      settlement.customFields?.fechaPago
        ? `Fecha de pago: ${settlement.customFields.fechaPago}`
        : 'Sin pago registrado'
    );
  }

  const warning = warningMessage || SECURITY_WARNING;
  setText('payroll-worker-warning-message', warning);
  setHidden('payroll-worker-warning', false);
}

export function refreshPayrollWorker(session, warningMessage) {
  renderWorkerMarkup();
  const entities = loadEntities();
  const entity = entities.find((item) => item?.entity_id === session?.entityId);
  const settlement = resolveWorkerSettlement({
    entityId: session?.entityId,
    purchaseInvoices: loadPurchaseInvoices(),
    entities,
  });
  renderPayrollSettlement(settlement, entity, warningMessage);
  return settlement;
}
