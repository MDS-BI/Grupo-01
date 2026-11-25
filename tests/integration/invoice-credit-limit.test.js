import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { editDocument, initApp } from '../../src/app.js';
import { formatCurrencyCLP } from '../../src/format.js';
import { loadMovements } from '../../src/movements.js';
import {
  addDocument,
  addEntity,
  loadDocuments,
  STORAGE_KEYS,
  updateDocument,
} from '../../src/storage.js';
import {
  invoiceField as field,
  loadAppMarkup,
  setupFinanzasSession,
  submit,
} from '../setup/domFixture.js';

const sale = 'invoice-sale';

function createClient(code, creditLimit) {
  return addEntity({
    name: `Cliente ${code}`,
    code,
    taxId: '76.000.001-9',
    customFields: { tipoTercero: 'cliente' },
    ...(creditLimit === undefined ? {} : { creditLimit }),
  });
}

function saleInvoice(client, folio, total, status = 'Borrador') {
  const document = addDocument({
    entity_id: client.entity_id,
    folio,
    startDate: '2026-01-03',
    endDate: '2026-01-30',
    totalAmount: total,
    customFields: { tipoFactura: 'venta' },
  });
  if (status === 'Emitida') updateDocument(document.document_id, { status });
  return document;
}

function emitFromForm(document) {
  initApp();
  editDocument(document.document_id);
  const status = field(sale, 'status');
  status.value = 'Emitida';
  status.dispatchEvent(new Event('change'));
  submit(`${sale}-form`);
}

function snapshot() {
  return Object.fromEntries(
    [
      STORAGE_KEYS.salesInvoices,
      STORAGE_KEYS.entities,
      STORAGE_KEYS.movements,
    ].map((key) => [key, localStorage.getItem(key)])
  );
}

describe('FR-029 - aviso por límite de crédito al emitir venta', () => {
  beforeEach(() => {
    loadAppMarkup();
    setupFinanzasSession();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra límite, deuda y exceso cuando la deuda más el total supera el límite', () => {
    const client = createClient('CL-1', 1000);
    saleInvoice(client, 1, 700, 'Emitida');
    const draft = saleInvoice(client, 2, 500);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    emitFromForm(draft);

    expect(confirm).toHaveBeenCalledTimes(1);
    const message = confirm.mock.calls[0][0];
    expect(message).toContain(formatCurrencyCLP(1000));
    expect(message).toContain(formatCurrencyCLP(700));
    expect(message).toContain(formatCurrencyCLP(200));
  });

  it('emite la factura al confirmar el aviso', () => {
    const client = createClient('CL-2', 1000);
    saleInvoice(client, 1, 700, 'Emitida');
    const draft = saleInvoice(client, 2, 500);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    emitFromForm(draft);

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(
      loadDocuments().find(
        ({ document_id }) => document_id === draft.document_id
      ).status
    ).toBe('Emitida');
    expect(
      loadMovements().filter(
        ({ document_id }) => document_id === draft.document_id
      )
    ).toHaveLength(1);
  });

  it('deja la factura en Borrador y sin cambios al cancelar el aviso', () => {
    const client = createClient('CL-3', 1000);
    saleInvoice(client, 1, 700, 'Emitida');
    const draft = saleInvoice(client, 2, 500);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    initApp();
    editDocument(draft.document_id);
    const before = snapshot();
    const status = field(sale, 'status');
    status.value = 'Emitida';
    status.dispatchEvent(new Event('change'));
    submit(`${sale}-form`);

    expect(snapshot()).toEqual(before);
    expect(
      loadDocuments().find(
        ({ document_id }) => document_id === draft.document_id
      ).status
    ).toBe('Borrador');
  });

  it('no muestra aviso si el cliente no tiene límite de crédito', () => {
    const client = createClient('CL-4');
    saleInvoice(client, 1, 700, 'Emitida');
    const draft = saleInvoice(client, 2, 500);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    emitFromForm(draft);

    expect(confirm).not.toHaveBeenCalled();
    expect(
      loadDocuments().find(
        ({ document_id }) => document_id === draft.document_id
      ).status
    ).toBe('Emitida');

    const controlClient = createClient('CL-4B', 1000);
    emitFromForm(saleInvoice(controlClient, 3, 1100));

    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('no muestra aviso si la deuda más el total no supera el límite', () => {
    const client = createClient('CL-5', 1000);
    saleInvoice(client, 1, 700, 'Emitida');
    const draft = saleInvoice(client, 2, 300);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    emitFromForm(draft);

    expect(confirm).not.toHaveBeenCalled();
    expect(
      loadDocuments().find(
        ({ document_id }) => document_id === draft.document_id
      ).status
    ).toBe('Emitida');

    emitFromForm(saleInvoice(client, 3, 400));

    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
