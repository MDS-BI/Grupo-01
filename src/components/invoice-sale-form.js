import { formatCurrencyCLP } from '../format.js';
import { loadDocuments, loadEntities } from '../storage.js';
import { isBlank } from '../utils.js';
import { createInvoiceForm } from './invoice-form.js';

function creditLimitWarning(values, editingId) {
  if (values.status !== 'Emitida') return null;

  const client = loadEntities().find(
    (entity) => entity.entity_id === values.entity_id
  );
  if (!client || isBlank(client.creditLimit)) return null;

  const limit = Number(client.creditLimit);
  if (!Number.isFinite(limit)) return null;

  const debt = loadDocuments()
    .filter(
      (document) =>
        document.customFields?.tipoFactura === 'venta' &&
        document.status === 'Emitida' &&
        document.entity_id === values.entity_id &&
        document.document_id !== editingId
    )
    .reduce(
      (total, document) => total + (Number(document.totalAmount) || 0),
      0
    );
  const total = Number(values.totalAmount) || 0;
  const excess = debt + total - limit;
  if (excess <= 0) return null;

  return `El cliente supera su límite de crédito: límite ${formatCurrencyCLP(limit)}, deuda actual ${formatCurrencyCLP(debt)}, exceso ${formatCurrencyCLP(excess)}. ¿Desea emitir la factura de todos modos?`;
}

export function createSaleForm(options) {
  return createInvoiceForm({
    ...options,
    tipoFactura: 'venta',
    onSubmit: (values, editingId, extras) => {
      const warning = creditLimitWarning(values, editingId);
      if (
        warning &&
        typeof window !== 'undefined' &&
        typeof window.confirm === 'function' &&
        !window.confirm(warning)
      ) {
        return;
      }
      options.onSubmit(values, editingId, extras);
    },
  });
}
