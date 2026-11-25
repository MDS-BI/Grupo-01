import {
  resolveWorkerPaymentHistory,
  resolveWorkerSettlement,
} from '../payroll.js';
import { formatCurrencyCLP } from '../format.js';
import {
  loadEntities,
  loadPayrollSettlements,
  loadPurchaseInvoices,
} from '../storage.js';

const WORKER_MARKUP = `
  <div
    id="guide-banner-worker"
    class="guide-banner"
    role="region"
    aria-label="Guía de uso"
    hidden
  >
    <button id="guide-open-worker" class="guide-shortcut" type="button">
      ¿Primera vez? Ver la guía
    </button>
    <button
      id="guide-dismiss-worker"
      class="guide-dismiss"
      type="button"
      aria-label="Cerrar aviso de la guía"
    >
      ✕
    </button>
  </div>
  <h1 id="payroll-worker-title">Mi liquidación</h1>
  <p id="payroll-worker-greeting" class="dashboard-greeting"></p>
  <div id="payroll-worker-card" class="worker-card">
    <div class="worker-hero">
      <p class="worker-hero-label">Monto líquido</p>
      <p id="payroll-worker-amount" class="worker-amount"></p>
      <h2 id="payroll-worker-period" class="worker-period">
        Sin período asignado
      </h2>
      <p id="payroll-worker-status" class="worker-status"></p>
      <p id="payroll-worker-paid-at" class="worker-paid-at"></p>
    </div>
    <div class="worker-details">
      <p id="payroll-worker-name" class="worker-name"></p>
      <p id="payroll-worker-rut" class="worker-rut"></p>
      <table id="payroll-worker-breakdown" class="payroll-breakdown">
        <caption>Desglose</caption>
        <tbody>
          <tr id="payroll-worker-base-salary"></tr>
          <tr id="payroll-worker-bonuses"></tr>
          <tr id="payroll-worker-discounts"></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div id="payroll-worker-empty" class="empty-state" hidden>
    <p>Aún no tienes una liquidación registrada.</p>
  </div>
  <h2 id="payroll-worker-history-title" class="section-heading">
    Historial de pagos
  </h2>
  <table id="payroll-worker-history-table" class="recent-movements">
    <thead>
      <tr>
        <th scope="col">Fecha de pago</th>
        <th scope="col">Período</th>
        <th scope="col" class="amount">Monto</th>
        <th scope="col">Estado</th>
      </tr>
    </thead>
    <tbody id="payroll-worker-history"></tbody>
  </table>
  <div id="payroll-worker-history-empty" class="empty-state" hidden>
    <p>Aún no tienes pagos registrados.</p>
  </div>
  <div id="payroll-worker-warning" class="worker-warning" hidden>
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

const MONTH_NAMES = [
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

// «2026-10» → «octubre 2026» (constitución v1.1.0, períodos legibles).
export function readablePeriod(value) {
  const match = /^(\d{4})-(\d{2})/.exec(String(value ?? ''));
  if (!match) return String(value ?? '');
  const name = MONTH_NAMES[Number(match[2]) - 1];
  return name ? `${name} ${match[1]}` : String(value);
}

function setBreakdownRow(id, label, value) {
  const row = document.getElementById(id);
  if (!row) return;
  row.textContent = '';
  const head = document.createElement('th');
  head.scope = 'row';
  head.textContent = label;
  const cell = document.createElement('td');
  cell.className = 'amount';
  cell.textContent = formatCurrencyCLP(value);
  row.append(head, cell);
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
    setText(
      'payroll-worker-period',
      readablePeriod(periodOf(settlement)) || 'Sin período'
    );
    setText('payroll-worker-name', entity?.name || '');
    setText('payroll-worker-rut', entity?.taxId || '');
    const base = Number(breakdownOf(settlement, 'sueldoBase')) || 0;
    const bonuses = Number(breakdownOf(settlement, 'bonos')) || 0;
    const discounts = Number(breakdownOf(settlement, 'descuentos')) || 0;
    setBreakdownRow('payroll-worker-base-salary', 'Sueldo base', base);
    setBreakdownRow('payroll-worker-bonuses', 'Bonos', bonuses);
    setBreakdownRow('payroll-worker-discounts', 'Descuentos', -discounts);
    setHidden(
      'payroll-worker-breakdown',
      base === 0 && bonuses === 0 && discounts === 0
    );
    setText('payroll-worker-amount', formatCurrencyCLP(amountOf(settlement)));
    setText('payroll-worker-status', `Estado: ${statusOf(settlement)}`);
    setText(
      'payroll-worker-paid-at',
      paidAtOf(settlement)
        ? `Fecha de pago: ${paidAtOf(settlement)}`
        : 'Sin pago registrado'
    );
    const firstName = String(entity?.name || '')
      .trim()
      .split(/\s+/)[0];
    setText(
      'payroll-worker-greeting',
      firstName ? `Hola, ${firstName}` : 'Hola'
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
      readablePeriod(periodOf(item)),
      formatCurrencyCLP(amountOf(item)),
      statusOf(item),
    ];
    values.forEach((value, index) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (index === 2) cell.className = 'amount';
      row.appendChild(cell);
    });
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
