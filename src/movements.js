import { generateId, isBlank } from './utils.js';

export const MOVEMENTS_KEY = 'erp.movements';

const TRANSITION_TYPES = {
  venta: 'cargo',
  compra: 'abono',
};

function readMovements() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MOVEMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadMovements() {
  return readMovements();
}

export function saveMovements(movements) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
}

function formatEventDate(value, fallbackDate) {
  if (!isBlank(value)) return String(value).slice(0, 10);
  if (!isBlank(fallbackDate)) return String(fallbackDate).slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export function buildMovement(document, tipo, fecha) {
  const custom = document.customFields || {};
  const record = {
    id: generateId('mov'),
    document_id: document.document_id,
    entity_id: document.entity_id,
    fecha: formatEventDate(fecha, document.startDate),
    tipo,
    monto: Number(document.totalAmount),
  };
  appendDocumentContext(record, document, custom);
  return record;
}

function appendDocumentContext(record, document, custom) {
  if (document.customFields && !isBlank(custom.centroCosto)) {
    record.centroCosto = String(custom.centroCosto);
  }
  if (document.customFields && !isBlank(custom.salesOrderId)) {
    record.salesOrderId = String(custom.salesOrderId);
  }
}

export function movementsForTransition(previousDocument, nextDocument) {
  const previousStatus = previousDocument ? previousDocument.status : undefined;
  const nextStatus = nextDocument ? nextDocument.status : undefined;
  if (previousStatus === nextStatus) return [];
  const tipoFactura = nextDocument.customFields
    ? nextDocument.customFields.tipoFactura
    : undefined;

  if (nextDocument.status === 'Emitida' && TRANSITION_TYPES[tipoFactura]) {
    return [buildMovement(nextDocument, TRANSITION_TYPES[tipoFactura])];
  }
  if (nextDocument.status === 'Pagada') {
    const fecha = nextDocument.customFields
      ? nextDocument.customFields.fechaPago
      : undefined;
    return [buildMovement(nextDocument, 'pago', fecha)];
  }
  return [];
}

function removeFor(documentMatch, entityMatch) {
  const next = readMovements().filter((movement) => {
    if (entityMatch) return movement.entity_id !== entityMatch;
    if (documentMatch) return movement.document_id !== documentMatch;
    return true;
  });
  saveMovements(next);
  return next;
}

export function deleteMovementsForDocument(documentId) {
  return removeFor(documentId, undefined);
}

export function deleteMovementsForEntity(entityId) {
  return removeFor(undefined, entityId);
}

export function clearMovements() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(MOVEMENTS_KEY);
}

export function rebuildMovements(documents) {
  const sorted = [...(documents || [])].sort((a, b) =>
    String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
  );
  const movements = [];
  for (const document of sorted) {
    if (document.status === 'Emitida' || document.status === 'Pagada') {
      const tipoFactura = document.customFields
        ? document.customFields.tipoFactura
        : undefined;
      if (TRANSITION_TYPES[tipoFactura]) {
        movements.push(
          buildMovement(
            {
              ...document,
              document_id: document.document_id,
            },
            TRANSITION_TYPES[tipoFactura]
          )
        );
      }
      if (document.status === 'Pagada') {
        const fecha = document.customFields
          ? document.customFields.fechaPago
          : undefined;
        movements.push(buildMovement(document, 'pago', fecha));
      }
    }
  }
  saveMovements(movements);
  return movements;
}
