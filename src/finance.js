import { computeCashflow } from './cashflow.js';
import { computeDebtSummary, todayISO } from './tracking.js';
import { formatCurrencyCLP } from './format.js';

// Indicadores del Panel de finanzas (spec 004, HU2 / FR-011 a FR-020).
// Todo se deriva en lectura: no se agrega almacenamiento ni campos nuevos.

export const FINANCE_INDICATORS = Object.freeze([
  {
    id: 'cash',
    label: 'Caja neta',
    valueId: 'summary-caja',
    formula:
      'Cobros de facturas de venta pagadas menos pagos de facturas de compra y liquidaciones pagadas.',
    action: 'cashflow',
    upTone: 'favorable',
    downTone: 'unfavorable',
    kind: 'amount',
  },
  {
    id: 'receivable',
    label: 'Por cobrar',
    valueId: 'kpi-por-cobrar',
    formula: 'Suma de las facturas de venta emitidas que aún no se han pagado.',
    action: 'list-invoice-sale',
    upTone: 'neutral',
    downTone: 'neutral',
    kind: 'amount',
  },
  {
    id: 'payable',
    label: 'Por pagar',
    valueId: 'kpi-por-pagar',
    formula:
      'Suma de las facturas de compra emitidas que aún no se han pagado.',
    action: 'list-invoice-purchase',
    upTone: 'unfavorable',
    downTone: 'favorable',
    kind: 'amount',
  },
  {
    id: 'overdue',
    label: 'Facturas vencidas',
    valueId: 'kpi-vencidas',
    formula:
      'Cantidad de facturas emitidas, sin pagar, cuya fecha de vencimiento ya pasó.',
    action: 'tracking',
    upTone: 'unfavorable',
    downTone: 'favorable',
    kind: 'count',
  },
]);

function tipoFactura(document) {
  return document?.customFields?.tipoFactura;
}

function dateOnly(value) {
  return String(value ?? '').slice(0, 10);
}

// Último día del mes anterior al de `today` (formato AAAA-MM-DD).
export function previousMonthEnd(today = todayISO()) {
  const [year, month] = dateOnly(today).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10);
}

function latestPayments(movements) {
  const payments = new Map();
  for (const movement of movements || []) {
    if (!movement || movement.tipo !== 'pago') continue;
    const previous = payments.get(movement.document_id);
    if (!previous || String(movement.fecha) >= String(previous.fecha)) {
      payments.set(movement.document_id, movement);
    }
  }
  return payments;
}

function paymentDate(document, payments) {
  if (document.status !== 'Pagada') return null;
  const payment = payments.get(document.document_id ?? document.id);
  const date = payment?.fecha ?? document.customFields?.fechaPago ?? null;
  return date ? dateOnly(date) : null;
}

// Reconstruye el estado al cierre del mes anterior (data-model.md, previousValue).
function computePreviousValues(documents, entities, movements, cutoff) {
  const entityIds = new Set((entities || []).map((entity) => entity.entity_id));
  const payments = latestPayments(movements);
  const relevant = (documents || []).filter(
    (document) =>
      document &&
      ['venta', 'compra'].includes(tipoFactura(document)) &&
      ['Emitida', 'Pagada'].includes(document.status)
  );

  const hasHistory = relevant.some(
    (document) =>
      dateOnly(document.startDate) && dateOnly(document.startDate) <= cutoff
  );
  if (!hasHistory) {
    return { cash: null, receivable: null, payable: null, overdue: null };
  }

  const cashRows = computeCashflow(documents, entities, movements).rows;
  const cash = cashRows
    .filter((row) => row.fecha && row.fecha <= cutoff)
    .reduce((total, row) => total + row.signo * row.monto, 0);

  let receivable = 0;
  let payable = 0;
  let overdue = 0;
  for (const document of relevant) {
    if (!entityIds.has(document.entity_id)) continue;
    const issued = dateOnly(document.startDate);
    if (!issued || issued > cutoff) continue;
    const paidOn = paymentDate(document, payments);
    const openAtCutoff = !paidOn || paidOn > cutoff;
    if (!openAtCutoff) continue;
    const amount = Number(document.totalAmount) || 0;
    if (tipoFactura(document) === 'venta') receivable += amount;
    else payable += amount;
    const due = dateOnly(document.endDate);
    if (due && due < cutoff) overdue += 1;
  }

  return { cash, receivable, payable, overdue };
}

export function describeVariation(current, previous) {
  if (previous === null || previous === undefined) {
    return { direction: 'unknown', percent: null, text: 'sin dato anterior' };
  }
  if (current === previous) {
    return { direction: 'flat', percent: 0, text: 'sin cambio' };
  }
  const direction = current > previous ? 'up' : 'down';
  const arrow = direction === 'up' ? '▲' : '▼';
  if (previous === 0) {
    return { direction, percent: null, text: `${arrow} nuevo` };
  }
  const percent = Math.round(
    (Math.abs(current - previous) / Math.abs(previous)) * 100
  );
  return {
    direction,
    percent,
    text: `${arrow} ${percent} % vs mes anterior`,
  };
}

function variationTone(meta, direction) {
  if (direction === 'up') return meta.upTone;
  if (direction === 'down') return meta.downTone;
  return 'neutral';
}

function stateTone(id, value) {
  if (id === 'cash' && value < 0) return 'negative';
  if (id === 'overdue' && value > 0) return 'action';
  return 'neutral';
}

export function computeFinanceIndicators(
  documents,
  entities,
  movements,
  { today = todayISO() } = {}
) {
  const debt = computeDebtSummary(entities, documents, { today });
  const cashflow = computeCashflow(documents, entities, movements);
  const current = {
    cash: cashflow.neto,
    receivable: debt.totalPorCobrar,
    payable: debt.totalPorPagar,
    overdue: debt.vencidas.length,
  };
  const previous = computePreviousValues(
    documents,
    entities,
    movements,
    previousMonthEnd(today)
  );

  return FINANCE_INDICATORS.map((meta) => {
    const value = current[meta.id];
    const variation = describeVariation(value, previous[meta.id]);
    return {
      ...meta,
      value,
      display:
        meta.kind === 'amount' ? formatCurrencyCLP(value) : String(value),
      previousValue: previous[meta.id],
      variationDirection: variation.direction,
      variationPercent: variation.percent,
      variationText: variation.text,
      variationTone: variationTone(meta, variation.direction),
      stateTone: stateTone(meta.id, value),
    };
  });
}
