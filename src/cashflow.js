function indexBy(items, key) {
  return new Map(
    (items || [])
      .filter((item) => item && item[key] !== undefined)
      .map((item) => [item[key], item])
  );
}

function paymentMovements(movements) {
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

function documentFolio(document) {
  const reference = [document.series, document.folio]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .join('-');
  return reference || String(document.folio ?? document.document_id ?? '');
}

function buildRow(document, entity, payment) {
  const custom = document.customFields || {};
  const tipoFactura = custom.tipoFactura;
  if (tipoFactura !== 'venta' && tipoFactura !== 'compra') return null;

  const monto =
    Number(payment?.monto ?? custom.montoPagado ?? document.totalAmount) || 0;
  const fecha = String(
    payment?.fecha ??
      custom.fechaPago ??
      document.endDate ??
      document.startDate ??
      ''
  ).slice(0, 10);
  const esPersonal = entity?.customFields?.tipoTercero === 'personal';
  const tipo = tipoFactura === 'venta' ? 'Ingreso' : 'Egreso';
  const categoria =
    tipoFactura === 'venta'
      ? 'Cobro factura de venta'
      : esPersonal
        ? 'Liquidación de sueldo'
        : 'Factura de compra';

  return {
    document_id: document.document_id ?? document.id,
    fecha,
    tipo,
    categoria,
    tercero: entity?.name ?? document.entity_id ?? '',
    documento: `${tipoFactura === 'venta' ? 'Venta' : 'Compra'} #${documentFolio(document)}`,
    monto,
    signo: tipoFactura === 'venta' ? 1 : -1,
  };
}

export function computeCashflow(documents, entities, movements) {
  const entityById = indexBy(entities, 'entity_id');
  const paymentsByDocument = paymentMovements(movements);
  const rows = [];

  for (const document of documents || []) {
    if (!document || document.status !== 'Pagada') continue;
    const payment = paymentsByDocument.get(document.document_id ?? document.id);
    const row = buildRow(document, entityById.get(document.entity_id), payment);
    if (row) rows.push(row);
  }

  rows.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

  let ingresos = 0;
  let egresos = 0;
  for (const row of rows) {
    if (row.signo > 0) ingresos += row.monto;
    else egresos += row.monto;
  }

  return {
    rows,
    ingresos,
    egresos,
    neto: ingresos - egresos,
  };
}

const SHORT_MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function monthKeyOf(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

// Serie mensual de ingresos y gastos para el gráfico del Panel de finanzas
// (spec 004, contracts/trend-chart.md). Usa las mismas filas y la misma fecha
// efectiva de pago que computeCashflow; los meses sin pagos quedan en 0.
export function computeMonthlyIncomeExpense(
  documents,
  entities,
  movements,
  { months = 6, now = new Date() } = {}
) {
  const points = [];
  const byKey = new Map();
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const point = {
      monthKey: monthKeyOf(date),
      label: SHORT_MONTHS[date.getMonth()],
      income: 0,
      expense: 0,
      net: 0,
    };
    points.push(point);
    byKey.set(point.monthKey, point);
  }

  for (const row of computeCashflow(documents, entities, movements).rows) {
    const point = byKey.get(String(row.fecha).slice(0, 7));
    if (!point) continue;
    if (row.signo > 0) point.income += row.monto;
    else point.expense += row.monto;
  }
  for (const point of points) point.net = point.income - point.expense;

  return points;
}
