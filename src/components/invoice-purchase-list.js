import { getInvoiceView } from '../module-config.js';
import { renderInvoiceList } from './invoice-list.js';

export function renderPurchaseList(container, documents, entities, options) {
  renderInvoiceList(container, documents, entities, {
    ...options,
    tipoFactura: 'compra',
    columns: getInvoiceView('compra').columns,
  });
}
