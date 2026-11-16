import { getInvoiceView } from '../module-config.js';
import { renderInvoiceList } from './invoice-list.js';

export function renderSaleList(container, documents, entities, options) {
  renderInvoiceList(container, documents, entities, {
    ...options,
    tipoFactura: 'venta',
    columns: getInvoiceView('venta').columns,
  });
}
