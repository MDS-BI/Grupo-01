import {
  resolveWorkerPaymentHistory,
  resolveWorkerSettlement,
} from '../payroll.js';
import {
  loadEntities,
  loadPayrollSettlements,
  loadPurchaseInvoices,
} from '../storage.js';

const WORKER_MARKUP = `
  <h1 id="payroll-worker-title">Mi liquidación</h1>
  <div id="payroll-worker-card">
    <h2 id="payroll-worker-period">Sin período asignado</h2>
    <p id="payroll-worker-name"></p>
    <p id="payroll-worker-rut"></p>
    <div class="payroll-breakdown">
      <p id="payroll-worker-base-salary"></p>
      <p id="payroll-worker-discounts"></p>
      <p id="payroll-worker-bonuses"></p>
    </div>
    <p id="payroll-worker-amount"></p>
    <p id="payroll-worker-status"></p>
    <p id="payroll-worker-paid-at"></p>
  </div>
  <div id="payroll-worker-empty" hidden>
    <p>Aún no tienes una liquidación registrada.</p>
  </div>
  <h2 id="payroll-worker-history-title">Historial de pagos</h2>
  <table id="payroll-worker-history-table">
    <thead>
      <tr>
        <th>Fecha de pago</th>
        <th>Período</th>
        <th>Monto</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody id="payroll-worker-history"></tbody>
  </table>
  <div id="payroll-worker-history-empty" hidden>
    <p>Aún no tienes pagos registrados.</p>
  </div>
  <div id="payroll-worker-warning" hidden>
    <p id="payroll-worker-warning-message"></p>
  </div>
`;

const SECURITY_WARNING =
  'El control de acceso es una restricción de interfaz; los datos viven en el navegador. La contraseña inicial es inmutable y no deben usarse datos reales. Solo ves tu propia liquidación y tus pagos registrados.';

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setHidden(id, hidden) {
  const element = document.getElementById(id);
  if (element) element.hidden = hidden;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-CL');
}

function periodOf(settlement) {
  return (
    settlement?.periodo ?? settlement?.customFields?.periodoLiquidacion ?? ''
  );
}

function amountOf(settlement) {
  return settlement?.monto ?? settlement?.totalAmount ?? 0;
}

function statusOf(settlement) {
  return settlement?.estado ?? settlement?.status ?? '';
}

function paidAtOf(settlement) {
  return settlement?.fechaPago ?? settlement?.customFields?.fechaPago ?? '';
}

function breakdownOf(settlement, field) {
  if (field === 'sueldoBase' && settlement?.sueldoBase !== undefined) {
    return settlement.sueldoBase;
  }
  if (field === 'descuentos' && settlement?.descuentos !== undefined) {
    return settlement.descuentos;
  }
  if (field === 'bonos' && settlement?.bonos !== undefined) {
    return settlement.bonos;
  }
  return 0;
}

export function renderWorkerMarkup() {
  const root = document.getElementById('view-payroll-worker');
  if (root) root.innerHTML = WORKER_MARKUP;
}

export function renderPayrollSettlement(
  settlement,
  history = [],
  entity,
  warningMessage
) {
  const hasSettlement = Boolean(settlement);
  setHidden('payroll-worker-card', !hasSettlement);
  setHidden('payroll-worker-empty', hasSettlement);

  if (hasSettlement) {
    setText('payroll-worker-period', periodOf(settlement) || 'Sin período');
    setText('payroll-worker-name', entity?.name || '');
    setText('payroll-worker-rut', entity?.taxId || '');
    setText(
      'payroll-worker-base-salary',
      `Sueldo base: ${formatMoney(breakdownOf(settlement, 'sueldoBase'))}`
    );
    setText(
      'payroll-worker-discounts',
      `Descuentos: ${formatMoney(breakdownOf(settlement, 'descuentos'))}`
    );
    setText(
      'payroll-worker-bonuses',
      `Bonos: ${formatMoney(breakdownOf(settlement, 'bonos'))}`
    );
    setText(
      'payroll-worker-amount',
      `Monto: ${formatMoney(amountOf(settlement))}`
    );
    setText('payroll-worker-status', `Estado: ${statusOf(settlement)}`);
    setText(
      'payroll-worker-paid-at',
      paidAtOf(settlement)
        ? `Fecha de pago: ${paidAtOf(settlement)}`
        : 'Sin pago registrado'
    );
  }

  const rows = Array.isArray(history) ? history : [];
  const tbody = document.getElementById('payroll-worker-history');
  if (tbody) tbody.innerHTML = '';
  const hasHistory = rows.length > 0;
  setHidden('payroll-worker-history-table', !hasHistory);
  setHidden('payroll-worker-history-empty', hasHistory);

  for (const item of rows) {
    const row = document.createElement('tr');
    const values = [
      paidAtOf(item),
      periodOf(item),
      formatMoney(amountOf(item)),
      statusOf(item),
    ];
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    }
    tbody?.appendChild(row);
  }

  const warning = warningMessage || SECURITY_WARNING;
  setText('payroll-worker-warning-message', warning);
  setHidden('payroll-worker-warning', false);
}

export function refreshPayrollWorker(session, warningMessage, data = {}) {
  renderWorkerMarkup();
  const entities = data.entities || loadEntities();
  const purchaseInvoices = data.purchaseInvoices || loadPurchaseInvoices();
  const settlements = data.settlements || loadPayrollSettlements();
  const entity = entities.find((item) => item?.entity_id === session?.entityId);
  const settlement = resolveWorkerSettlement({
    entityId: session?.entityId,
    settlements,
    purchaseInvoices,
    entities,
  });
  const history = resolveWorkerPaymentHistory({
    entityId: session?.entityId,
    settlements,
    purchaseInvoices,
    entities,
  });
  renderPayrollSettlement(settlement, history, entity, warningMessage);
  return settlement;
}
