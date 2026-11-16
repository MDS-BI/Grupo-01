import { createInvoiceForm } from './invoice-form.js';

export function createSaleForm(options) {
  return createInvoiceForm({ ...options, tipoFactura: 'venta' });
}
