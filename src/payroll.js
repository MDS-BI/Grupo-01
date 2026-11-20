const text = (value) => String(value ?? '');

function isPersonal(entity) {
  return entity?.customFields?.tipoTercero === 'personal';
}

function compareDescending(a, b) {
  return text(b).localeCompare(text(a));
}

function invoiceMap(purchaseInvoices = []) {
  return new Map(
    (purchaseInvoices || [])
      .filter((item) => item?.document_id)
      .map((item) => [String(item.document_id), item])
  );
}

function periodOf(settlement, invoice) {
  return settlement?.periodo ?? invoice?.customFields?.periodoLiquidacion;
}

function startDateOf(settlement, invoice) {
  return invoice?.startDate ?? settlement?.startDate;
}

function toSettlementShape(document) {
  return {
    ...document,
    settlementId: document?.document_id,
    documentId: document?.document_id,
    entityId: document?.entity_id,
    periodo: document?.customFields?.periodoLiquidacion,
    sueldoBase: 0,
    descuentos: 0,
    bonos: 0,
    monto: Number(document?.totalAmount) || 0,
    estado: document?.status,
    fechaPago: document?.customFields?.fechaPago || null,
  };
}

function resolveWorkerSettlementLegacy({
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

export function resolveWorkerSettlement({
  entityId,
  settlements,
  purchaseInvoices = [],
  entities = [],
} = {}) {
  if (!entityId) return null;
  const entity = entities.find((item) => item?.entity_id === entityId);
  if (!isPersonal(entity)) return null;

  if (!settlements) {
    return resolveWorkerSettlementLegacy({
      entityId,
      purchaseInvoices,
      entities,
    });
  }

  const own = settlements.filter(
    (settlement) => String(settlement?.entityId) === String(entityId)
  );
  if (own.length === 0) return null;

  const invoices = invoiceMap(purchaseInvoices);
  return [...own].sort((a, b) => {
    const period = compareDescending(
      periodOf(a, invoices.get(String(a?.documentId))),
      periodOf(b, invoices.get(String(b?.documentId)))
    );
    if (period !== 0) return period;
    const start = compareDescending(
      startDateOf(a, invoices.get(String(a?.documentId))),
      startDateOf(b, invoices.get(String(b?.documentId)))
    );
    if (start !== 0) return start;
    return compareDescending(a?.createdAt, b?.createdAt);
  })[0];
}

export function resolveWorkerPaymentHistory({
  entityId,
  settlements,
  purchaseInvoices = [],
  entities = [],
} = {}) {
  if (!entityId) return [];
  const entity = entities.find((item) => item?.entity_id === entityId);
  if (entities.length > 0 && !isPersonal(entity)) return [];

  const source = settlements
    ? settlements
    : (purchaseInvoices || []).map(toSettlementShape);

  const paid = source.filter(
    (settlement) =>
      String(settlement?.entityId) === String(entityId) &&
      settlement?.estado === 'Pagada' &&
      text(settlement?.fechaPago).trim().length > 0
  );

  return [...paid].sort((a, b) => {
    const paidAt = compareDescending(a?.fechaPago, b?.fechaPago);
    if (paidAt !== 0) return paidAt;
    return compareDescending(a?.periodo, b?.periodo);
  });
}

export function resolveAdminSettlements({
  settlements,
  purchaseInvoices = [],
  entities = [],
  filters = {},
} = {}) {
  const byId = new Map(
    (entities || []).map((entity) => [entity?.entity_id, entity])
  );

  if (!settlements) {
    const legacy = (purchaseInvoices || []).filter((document) =>
      isPersonal(byId.get(document?.entity_id))
    );

    const period = text(filters.period).trim();
    let filtered = legacy;
    if (period) {
      filtered = filtered.filter(
        (document) =>
          text(document?.customFields?.periodoLiquidacion) === period
      );
    }

    const entityId = text(filters.entityId).trim();
    const worker = text(filters.worker).trim().toLowerCase();
    if (entityId) {
      filtered = filtered.filter(
        (document) => document?.entity_id === entityId
      );
    } else if (worker) {
      filtered = filtered.filter((document) => {
        const item = byId.get(document?.entity_id);
        return (
          text(item?.name).toLowerCase().includes(worker) ||
          text(item?.taxId).toLowerCase().includes(worker)
        );
      });
    }

    return [...filtered].sort((a, b) => {
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

  let filtered = settlements.filter((settlement) =>
    isPersonal(byId.get(settlement?.entityId))
  );

  const period = text(filters.period).trim();
  if (period) {
    filtered = filtered.filter(
      (settlement) => text(settlement?.periodo) === period
    );
  }

  const entityId = text(filters.entityId).trim();
  const worker = text(filters.worker).trim().toLowerCase();
  if (entityId) {
    filtered = filtered.filter(
      (settlement) => text(settlement?.entityId) === entityId
    );
  } else if (worker) {
    filtered = filtered.filter((settlement) => {
      const entity = byId.get(settlement?.entityId);
      return (
        text(entity?.name).toLowerCase().includes(worker) ||
        text(entity?.taxId).toLowerCase().includes(worker)
      );
    });
  }

  return [...filtered].sort((a, b) => {
    const period = compareDescending(a?.periodo, b?.periodo);
    if (period !== 0) return period;
    const nameA = text(byId.get(a?.entityId)?.name);
    const nameB = text(byId.get(b?.entityId)?.name);
    return nameA.localeCompare(nameB);
  });
}
