import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG } from '../../src/module-config.js';
import { addEntity, loadDocuments } from '../../src/storage.js';
import { invoiceField, loadAppMarkup, submit } from '../setup/domFixture.js';

beforeEach(() => {
  loadAppMarkup();
});

function fillDocument(entityId) {
  invoiceField('invoice-sale', 'entity_id').value = entityId;
  invoiceField('invoice-sale', 'series').value = 'A';
  invoiceField('invoice-sale', 'folio').value = '1';
  invoiceField('invoice-sale', 'startDate').value = '2026-01-01';
  invoiceField('invoice-sale', 'endDate').value = '2026-01-31';
  invoiceField('invoice-sale', 'subtotal').value = '100';
  invoiceField('invoice-sale', 'totalAmount').value = '95';
}

describe('US4 - registrar documentos vinculados', () => {
  it('crea y edita un documento asociado a una entidad', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' }, DEFAULT_CONFIG);
    initApp(DEFAULT_CONFIG);
    document.getElementById('nav-invoice-sale').click();

    fillDocument(entity.entity_id);
    submit('invoice-sale-form');

    const documents = loadDocuments();
    expect(documents).toHaveLength(1);
    expect(documents[0].entity_id).toBe(entity.entity_id);
    expect(documents[0].folio).toBe(1);
    expect(document.getElementById('invoice-sale-list').textContent).toContain(
      'Acme'
    );
    expect(document.getElementById('invoice-sale-list').textContent).toContain(
      '#1'
    );

    document.getElementById('invoice-sale-edit').value =
      documents[0].document_id;
    document
      .getElementById('invoice-sale-edit')
      .dispatchEvent(new Event('change'));
    document.querySelector('#view-invoice-sale [data-load-invoice]').click();
    expect(invoiceField('invoice-sale', 'folio').value).toBe('1');

    expect(invoiceField('invoice-sale', 'folio').readOnly).toBe(true);
    invoiceField('invoice-sale', 'folio').value = '2';
    invoiceField('invoice-sale', 'notes').value = 'Revisado';
    submit('invoice-sale-form');
    expect(loadDocuments()[0]).toMatchObject({ folio: 1, notes: 'Revisado' });
    expect(loadDocuments()).toHaveLength(1);
  });

  it('elimina un documento sin afectar a la entidad', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' }, DEFAULT_CONFIG);
    initApp(DEFAULT_CONFIG);
    document.getElementById('nav-invoice-sale').click();
    fillDocument(entity.entity_id);
    submit('invoice-sale-form');

    const originalConfirm = window.confirm;
    window.confirm = () => true;
    try {
      document
        .querySelector('#invoice-sale-list [data-action="delete"]')
        .click();
    } finally {
      window.confirm = originalConfirm;
    }

    expect(loadDocuments()).toHaveLength(0);
    expect(document.getElementById('invoice-sale-list').textContent).toContain(
      'No hay facturas de venta'
    );
  });
});
