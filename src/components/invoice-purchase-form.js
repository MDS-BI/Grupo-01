import { createInvoiceForm } from './invoice-form.js';

export function createPurchaseForm(options) {
  return createInvoiceForm({ ...options, tipoFactura: 'compra' });
}
