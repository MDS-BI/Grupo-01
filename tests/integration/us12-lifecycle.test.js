import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, normalizeConfig } from '../../src/module-config.js';
import {
  addEntity,
  loadDocuments,
  updateDocument,
  ValidationFailure,
} from '../../src/storage.js';
import { invoiceField, loadAppMarkup, submit } from '../setup/domFixture.js';

beforeEach(() => {
  loadAppMarkup();
});

const { config: lifecycleConfig } = normalizeConfig({
  moduleName: 'X',
  statusLifecycle: {
    statuses: ['Borrador', 'Aprobado', 'Pagado'],
    transitions: { Borrador: ['Aprobado'], Aprobado: ['Pagado'], Pagado: [] },
  },
});

function createDocument(entityId) {
  invoiceField('invoice-sale', 'entity_id').value = entityId;
  invoiceField('invoice-sale', 'folio').value = '1';
  invoiceField('invoice-sale', 'startDate').value = '2026-01-01';
  invoiceField('invoice-sale', 'endDate').value = '2026-01-02';
  submit('invoice-sale-form');
}

describe('US12 - ciclo de vida de estados', () => {
  it('limita las transiciones y rechaza saltos no permitidos', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' }, lifecycleConfig);
    initApp(lifecycleConfig);
    document.getElementById('nav-invoice-sale').click();
    createDocument(entity.entity_id);

    const created = loadDocuments()[0];
    expect(created.status).toBe('Borrador');

    const options = Array.from(
      invoiceField('invoice-sale', 'status').options
    ).map((option) => option.value);
    expect(options).toEqual(['Borrador']);

    document.getElementById('invoice-sale-edit').value = created.document_id;
    document
      .getElementById('invoice-sale-edit')
      .dispatchEvent(new Event('change'));
    document.querySelector('#view-invoice-sale [data-load-invoice]').click();
    const editingOptions = Array.from(
      invoiceField('invoice-sale', 'status').options
    ).map((option) => option.value);
    expect(editingOptions).toEqual(['Borrador', 'Aprobado']);

    expect(() =>
      updateDocument(created.document_id, { status: 'Pagado' }, lifecycleConfig)
    ).toThrow(ValidationFailure);

    const promoted = updateDocument(
      created.document_id,
      { status: 'Aprobado' },
      lifecycleConfig
    );
    expect(promoted.status).toBe('Aprobado');

    document.getElementById('nav-invoice-sale').click();
    document.getElementById('invoice-sale-edit').value = created.document_id;
    document
      .getElementById('invoice-sale-edit')
      .dispatchEvent(new Event('change'));
    document.querySelector('#view-invoice-sale [data-load-invoice]').click();
    const promotedOptions = Array.from(
      invoiceField('invoice-sale', 'status').options
    ).map((option) => option.value);
    expect(promotedOptions).toEqual(['Aprobado', 'Pagado']);
  });

  it('usa estado de texto libre cuando no hay ciclo configurado', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' }, DEFAULT_CONFIG);
    initApp(DEFAULT_CONFIG);
    document.getElementById('nav-invoice-sale').click();

    expect(invoiceField('invoice-sale', 'status').tagName).toBe('INPUT');

    invoiceField('invoice-sale', 'entity_id').value = entity.entity_id;
    invoiceField('invoice-sale', 'folio').value = '1';
    invoiceField('invoice-sale', 'startDate').value = '2026-01-01';
    invoiceField('invoice-sale', 'endDate').value = '2026-01-02';
    invoiceField('invoice-sale', 'status').value = 'En revisión';
    submit('invoice-sale-form');

    expect(loadDocuments()[0].status).toBe('En revisión');
  });
});
