import { getInvoiceView } from '../module-config.js';
import { renderInvoiceList } from './invoice-list.js';

export function renderPurchaseList(container, documents, entities, options) {
  const { readOnlyIds = new Set() } = options ?? {};
  renderInvoiceList(container, documents, entities, {
    ...options,
    readOnlyIds,
    tipoFactura: 'compra',
    columns: getInvoiceView('compra').columns,
  });
}
