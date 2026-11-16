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
