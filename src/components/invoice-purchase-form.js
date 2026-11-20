import { createInvoiceForm } from './invoice-form.js';

export const PURCHASE_INVOICE_FIELDS = [
  'periodoLiquidacion',
  'centroCosto',
  'montoPagado',
  'fechaPago',
];

export function createPurchaseForm(options) {
  return createInvoiceForm({ ...options, tipoFactura: 'compra' });
}
