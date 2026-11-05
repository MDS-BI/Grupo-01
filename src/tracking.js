import { isBlank } from './utils.js';

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(document, today = todayISO()) {
  return (
    Boolean(document) &&
    document.status === 'Emitida' &&
    !isBlank(document.endDate) &&
    String(document.endDate) < String(today)
  );
}

function tipoDe(document) {
  return document.customFields ? document.customFields.tipoFactura : undefined;
}

export function computeDebtSummary(
  entities,
  documents,
  { today = todayISO() } = {}
) {
  const summary = (entities || []).map((entity) => ({
    entity_id: entity.entity_id,
    name: entity.name,
    tipoTercero:
      entity.customFields && entity.customFields.tipoTercero
        ? String(entity.customFields.tipoTercero)
        : undefined,
    porCobrar: 0,
    porPagar: 0,
    vencidas: 0,
  }));
  const byEntity = new Map(summary.map((entry) => [entry.entity_id, entry]));

  let totalPorCobrar = 0;
  let totalPorPagar = 0;
  const vencidas = [];

  for (const document of documents || []) {
    if (document.status !== 'Emitida') continue;
    const entry = byEntity.get(document.entity_id);
    const monto = Number(document.totalAmount) || 0;
    if (!entry) continue;
    if (tipoDe(document) === 'venta') {
      entry.porCobrar += monto;
      totalPorCobrar += monto;
    } else if (tipoDe(document) === 'compra') {
      entry.porPagar += monto;
      totalPorPagar += monto;
    }
    if (isOverdue(document, today)) {
      entry.vencidas += 1;
      vencidas.push(document);
    }
  }

  return { summary, totalPorCobrar, totalPorPagar, vencidas };
}
