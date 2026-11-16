const text = (value) => String(value ?? '');

function isPersonal(entity) {
  return entity?.customFields?.tipoTercero === 'personal';
}

function compareDescending(a, b) {
  return text(b).localeCompare(text(a));
}

export function resolveWorkerSettlement({
  entityId,
  purchaseInvoices = [],
  entities = [],
} = {}) {
  if (!entityId) return null;
  const entity = entities.find((item) => item?.entity_id === entityId);
  if (!isPersonal(entity)) return null;

  const settlements = (purchaseInvoices || []).filter(
    (document) => document?.entity_id === entityId
  );
  if (settlements.length === 0) return null;

  const sorted = [...settlements].sort((a, b) => {
    const period = compareDescending(
      a?.customFields?.periodoLiquidacion,
      b?.customFields?.periodoLiquidacion
    );
    if (period !== 0) return period;
    const start = compareDescending(a?.startDate, b?.startDate);
    if (start !== 0) return start;
    return compareDescending(a?.createdAt, b?.createdAt);
  });

  return sorted[0];
}

export function resolveAdminSettlements({
  purchaseInvoices = [],
  entities = [],
  filters = {},
} = {}) {
  const byId = new Map(
    (entities || []).map((entity) => [entity?.entity_id, entity])
  );
  let settlements = (purchaseInvoices || []).filter((document) =>
    isPersonal(byId.get(document?.entity_id))
  );

  const period = text(filters.period).trim();
  if (period) {
    settlements = settlements.filter(
      (document) => text(document?.customFields?.periodoLiquidacion) === period
    );
  }

  const entityId = text(filters.entityId).trim();
  const worker = text(filters.worker).trim().toLowerCase();
  if (entityId) {
    settlements = settlements.filter(
      (document) => document?.entity_id === entityId
    );
  } else if (worker) {
    settlements = settlements.filter((document) => {
      const entity = byId.get(document?.entity_id);
      return (
        text(entity?.name).toLowerCase().includes(worker) ||
        text(entity?.taxId).toLowerCase().includes(worker)
      );
    });
  }

  return [...settlements].sort((a, b) => {
    const period = compareDescending(
      a?.customFields?.periodoLiquidacion,
      b?.customFields?.periodoLiquidacion
    );
    if (period !== 0) return period;
    const nameA = text(byId.get(a?.entity_id)?.name);
    const nameB = text(byId.get(b?.entity_id)?.name);
    return nameA.localeCompare(nameB);
  });
}
