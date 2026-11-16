import {
  getConfig,
  getInvoiceView,
  INVOICE_READ_ONLY_FIELDS,
} from './module-config.js';
import { generateId, isBlank } from './utils.js';
import { validateDocument, validateEntity } from './validation.js';
import {
  MOVEMENTS_KEY,
  clearMovements,
  deleteMovementsForDocument,
  deleteMovementsForEntity,
  movementsForTransition,
  saveMovements,
} from './movements.js';

export const STORAGE_KEYS = {
  entities: 'erp.entities',
  documents: 'erp.documents',
  salesInvoices: 'erp.salesInvoices',
  purchaseInvoices: 'erp.purchaseInvoices',
  unclassifiedDocuments: 'erp.unclassifiedDocuments',
  movements: MOVEMENTS_KEY,
  schemaVersion: 'erp.schemaVersion',
  migrationInvoiceSplit: 'erp.migration.invoiceSplit',
};

export const SCHEMA_VERSION = '2.0.0';

export class ValidationFailure extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationFailure';
    this.errors = Array.isArray(errors) ? errors : [];
  }
}

function unwrapCollection(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
}

function readCollection(key) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return unwrapCollection(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeCollection(key, value) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
  localStorage.setItem(STORAGE_KEYS.schemaVersion, SCHEMA_VERSION);
}

function coerceNumbers(record, fields) {
  const result = { ...record };
  for (const field of fields) {
    const value = result[field];
    if (isBlank(value)) {
      delete result[field];
      continue;
    }
    result[field] = Number(value);
  }
  return result;
}

function assertValid(errors) {
  if (errors.length > 0) throw new ValidationFailure(errors);
}

export function loadEntities() {
  return readCollection(STORAGE_KEYS.entities);
}

export function saveEntities(entities) {
  if (!Array.isArray(entities)) {
    throw new ValidationFailure([
      {
        field: 'entities',
        code: 'INVALID_FORMAT',
        message: 'La lista de entidades debe ser un array.',
      },
    ]);
  }
  writeCollection(STORAGE_KEYS.entities, entities);
}

export function loadDocuments() {
  // Vista unificada de solo lectura: facturas de venta + compras.
  // No incluye los documentos sin tipo (erp.unclassifiedDocuments).
  return [...loadSaleInvoices(), ...loadPurchaseInvoices()];
}

export function loadSaleInvoices() {
  return readCollection(STORAGE_KEYS.salesInvoices);
}

export function saveSaleInvoices(documents) {
  if (!Array.isArray(documents)) {
    throw new ValidationFailure([
      {
        field: 'salesInvoices',
        code: 'INVALID_FORMAT',
        message: 'La lista de facturas de venta debe ser un array.',
      },
    ]);
  }
  writeCollection(STORAGE_KEYS.salesInvoices, documents);
}

export function loadPurchaseInvoices() {
  return readCollection(STORAGE_KEYS.purchaseInvoices);
}

export function savePurchaseInvoices(documents) {
  if (!Array.isArray(documents)) {
    throw new ValidationFailure([
      {
        field: 'purchaseInvoices',
        code: 'INVALID_FORMAT',
        message: 'La lista de facturas de compra debe ser un array.',
      },
    ]);
  }
  writeCollection(STORAGE_KEYS.purchaseInvoices, documents);
}

export function loadUnclassifiedDocuments() {
  return readCollection(STORAGE_KEYS.unclassifiedDocuments);
}

export function saveUnclassifiedDocuments(documents) {
  if (!Array.isArray(documents)) {
    throw new ValidationFailure([
      {
        field: 'unclassifiedDocuments',
        code: 'INVALID_FORMAT',
        message: 'La lista de documentos no clasificados debe ser un array.',
      },
    ]);
  }
  writeCollection(STORAGE_KEYS.unclassifiedDocuments, documents);
}

export function saveDocuments(documents) {
  if (!Array.isArray(documents)) {
    throw new ValidationFailure([
      {
        field: 'documents',
        code: 'INVALID_FORMAT',
        message: 'La lista de documentos debe ser un array.',
      },
    ]);
  }
  const ventas = [];
  const compras = [];
  const sinTipo = [];
  for (const document of documents) {
    const tipo = document?.customFields?.tipoFactura;
    if (tipo === 'venta') ventas.push(document);
    else if (tipo === 'compra') compras.push(document);
    else sinTipo.push(document);
  }
  saveSaleInvoices(ventas);
  savePurchaseInvoices(compras);
  saveUnclassifiedDocuments(sinTipo);
}

export function migrateLegacyDocuments() {
  const migrationKey = STORAGE_KEYS.migrationInvoiceSplit;
  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem(migrationKey) === 'done') {
      return {
        ok: true,
        migrated: { sales: 0, purchases: 0, unclassified: 0 },
        legacyRemoved: false,
      };
    }
  }

  const legacy = readCollection(STORAGE_KEYS.documents);
  if (legacy.length === 0) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.migrationInvoiceSplit, 'done');
    }
    return {
      ok: true,
      migrated: { sales: 0, purchases: 0, unclassified: 0 },
      legacyRemoved: false,
    };
  }

  const ventas = [];
  const compras = [];
  const sinTipo = [];
  for (const document of legacy) {
    const tipo = document?.customFields?.tipoFactura;
    if (tipo === 'venta') ventas.push(document);
    else if (tipo === 'compra') compras.push(document);
    else sinTipo.push(document);
  }

  const sales = dedupeByDocumentId(ventas);
  const purchases = dedupeByDocumentId(compras);
  const unclassified = dedupeByDocumentId(sinTipo);

  saveSaleInvoices(sales);
  savePurchaseInvoices(purchases);
  saveUnclassifiedDocuments(unclassified);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.migrationInvoiceSplit, 'done');
    localStorage.removeItem('erp.documents');
  }

  return {
    ok: true,
    migrated: {
      sales: sales.length,
      purchases: purchases.length,
      unclassified: unclassified.length,
    },
    legacyRemoved: true,
  };
}

function dedupeByDocumentId(documents) {
  const seen = new Set();
  const result = [];
  for (const document of documents) {
    const key = document?.document_id ?? document?.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(document);
  }
  return result;
}

export function addEntity(entity, config = getConfig()) {
  const now = new Date().toISOString();
  const normalized = coerceNumbers(entity || {}, ['creditLimit']);
  const record = {
    ...normalized,
    entity_id: normalized.entity_id || generateId('ent'),
    createdAt: normalized.createdAt || now,
    updatedAt: now,
    customFields:
      normalized.customFields && typeof normalized.customFields === 'object'
        ? { ...normalized.customFields }
        : {},
  };
  record.id = record.entity_id;

  const existing = loadEntities();
  assertValid(validateEntity(record, { config, existing }));
  saveEntities([...existing, record]);
  return record;
}

export function updateEntity(id, updates, config = getConfig()) {
  const entities = loadEntities();
  const index = entities.findIndex(
    (entity) => entity.entity_id === id || entity.id === id
  );
  if (index === -1) {
    throw new ValidationFailure([
      {
        field: 'entity_id',
        code: 'NOT_FOUND',
        message: 'La entidad no existe.',
      },
    ]);
  }

  const previous = entities[index];
  const merged = {
    ...previous,
    ...coerceNumbers(updates || {}, ['creditLimit']),
    entity_id: previous.entity_id,
    id: previous.entity_id,
    createdAt: previous.createdAt,
    updatedAt: new Date().toISOString(),
    customFields:
      updates &&
      updates.customFields &&
      typeof updates.customFields === 'object'
        ? { ...updates.customFields }
        : { ...(previous.customFields || {}) },
  };

  assertValid(validateEntity(merged, { config, existing: entities }));
  const next = [...entities];
  next[index] = merged;
  saveEntities(next);
  return merged;
}

export function deleteEntity(id) {
  const entities = loadEntities();
  const next = entities.filter(
    (entity) => entity.entity_id !== id && entity.id !== id
  );
  saveEntities(next);
  deleteDocumentsForEntity(id);
  return next;
}

export function addDocument(document, config = getConfig()) {
  const now = new Date().toISOString();
  const normalized = coerceNumbers(document || {}, [
    'folio',
    'quantity',
    'subtotal',
    'discount',
    'taxAmount',
    'totalAmount',
  ]);

  let status = normalized.status;
  if (config.statusLifecycle && config.statusLifecycle.statuses.length > 0) {
    const initialStatus = config.statusLifecycle.statuses[0];
    if (!isBlank(status) && status !== initialStatus) {
      throw new ValidationFailure([
        {
          field: 'status',
          code: 'INVALID_INITIAL_STATUS',
          message: `Toda factura nueva debe iniciar en ${initialStatus}.`,
        },
      ]);
    }
    status = initialStatus;
  }

  const record = {
    ...normalized,
    ...(isBlank(status) ? {} : { status }),
    document_id: normalized.document_id || generateId('doc'),
    createdAt: normalized.createdAt || now,
    updatedAt: now,
    customFields:
      normalized.customFields && typeof normalized.customFields === 'object'
        ? { ...normalized.customFields }
        : {},
  };
  record.id = record.document_id;

  const entities = loadEntities();
  assertValid(
    validateDocument(record, { config, entities, documents: loadDocuments() })
  );
  const collection =
    record.customFields?.tipoFactura === 'compra'
      ? savePurchaseInvoices
      : saveSaleInvoices;
  const current =
    record.customFields?.tipoFactura === 'compra'
      ? loadPurchaseInvoices()
      : loadSaleInvoices();
  collection([...current, record]);
  applyMovementsForTransition(null, record);
  return record;
}

export function updateDocument(id, updates, config = getConfig()) {
  const documents = loadDocuments();
  const index = documents.findIndex(
    (document) => document.document_id === id || document.id === id
  );
  if (index === -1) {
    throw new ValidationFailure([
      {
        field: 'document_id',
        code: 'NOT_FOUND',
        message: 'El documento no existe.',
      },
    ]);
  }

  const previous = documents[index];
  const merged = {
    ...previous,
    ...coerceNumbers(updates || {}, [
      'folio',
      'quantity',
      'subtotal',
      'discount',
      'taxAmount',
      'totalAmount',
    ]),
    document_id: previous.document_id,
    id: previous.document_id,
    createdAt: previous.createdAt,
    updatedAt: new Date().toISOString(),
    customFields:
      updates &&
      updates.customFields &&
      typeof updates.customFields === 'object'
        ? { ...updates.customFields }
        : { ...(previous.customFields || {}) },
  };

  const previousType = previous.customFields?.tipoFactura;
  if (getInvoiceView(previousType)) {
    if (
      Object.hasOwn(merged.customFields, 'tipoFactura') &&
      merged.customFields.tipoFactura !== previousType
    ) {
      throw new ValidationFailure([
        {
          field: 'customFields.tipoFactura',
          code: 'READ_ONLY',
          message: 'El tipo de una factura guardada no se puede cambiar.',
        },
      ]);
    }
    merged.customFields.tipoFactura = previousType;
    for (const field of INVOICE_READ_ONLY_FIELDS) {
      merged[field] = previous[field];
    }
  }

  assertValid(
    validateDocument(merged, {
      config,
      entities: loadEntities(),
      documents: loadDocuments(),
      previousStatus: previous.status,
    })
  );

  const next = [...documents];
  next[index] = merged;
  const tipoFactura = previous.customFields?.tipoFactura;
  const collection =
    tipoFactura === 'compra' ? loadPurchaseInvoices() : loadSaleInvoices();
  const persisted = collection.map((item) =>
    item.document_id === merged.document_id ? merged : item
  );
  if (tipoFactura === 'compra') {
    savePurchaseInvoices(persisted);
  } else {
    saveSaleInvoices(persisted);
  }
  applyMovementsForTransition(previous, merged);
  return merged;
}

function applyMovementsForTransition(previous, next) {
  const created = movementsForTransition(previous, next);
  if (created.length > 0) {
    saveMovements([...loadMovements(), ...created]);
  }
}

function loadMovements() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.movements);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function deleteDocument(id) {
  const sales = loadSaleInvoices().filter(
    (document) => document.document_id !== id && document.id !== id
  );
  const purchases = loadPurchaseInvoices().filter(
    (document) => document.document_id !== id && document.id !== id
  );
  saveSaleInvoices(sales);
  savePurchaseInvoices(purchases);
  deleteMovementsForDocument(id);
  return loadDocuments();
}

export function deleteDocumentsForEntity(entityId) {
  const sales = loadSaleInvoices().filter(
    (document) => document.entity_id !== entityId
  );
  const purchases = loadPurchaseInvoices().filter(
    (document) => document.entity_id !== entityId
  );
  saveSaleInvoices(sales);
  savePurchaseInvoices(purchases);
  deleteMovementsForEntity(entityId);
  return loadDocuments();
}

export function clearAll() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.entities);
  localStorage.removeItem(STORAGE_KEYS.salesInvoices);
  localStorage.removeItem(STORAGE_KEYS.purchaseInvoices);
  localStorage.removeItem(STORAGE_KEYS.unclassifiedDocuments);
  localStorage.removeItem(STORAGE_KEYS.movements);
  localStorage.removeItem(STORAGE_KEYS.schemaVersion);
  localStorage.removeItem(STORAGE_KEYS.migrationInvoiceSplit);
}
