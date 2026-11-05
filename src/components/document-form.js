import { allowedNextStatuses } from '../validation.js';
import { isBlank } from '../utils.js';

const BASE_FIELDS = [
  'series',
  'folio',
  'startDate',
  'endDate',
  'quantity',
  'subtotal',
  'discount',
  'taxAmount',
  'totalAmount',
  'currency',
  'notes',
  'docPaymentTerms',
];

const TYPE_DEPENDENT_FIELDS = {
  venta: ['salesOrderId'],
  compra: ['centroCosto', 'periodoLiquidacion'],
};

let config = null;
let onSubmit = null;
let editingId = null;
let cachedEntities = [];

function formElement() {
  return document.getElementById('document-form');
}

function customContainer() {
  return document.getElementById('custom-document-fields');
}

function renderCustomFields() {
  const container = customContainer();
  if (!container) return;
  container.textContent = '';
  const fields = (config.customFields || []).filter(
    (field) => field.target === 'document'
  );

  for (const field of fields) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-field';
    wrapper.dataset.customField = field.key;

    const label = document.createElement('label');
    label.htmlFor = `custom-document-${field.key}`;
    label.textContent = field.required ? `${field.label} *` : field.label;

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Seleccione...';
      input.append(placeholder);
      for (const option of field.options || []) {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        input.append(optionElement);
      }
    } else {
      input = document.createElement('input');
      input.type =
        field.type === 'number'
          ? 'number'
          : field.type === 'date'
            ? 'date'
            : 'text';
    }

    input.id = `custom-document-${field.key}`;
    input.name = `custom-${field.key}`;
    input.dataset.customKey = field.key;
    if (field.required) input.setAttribute('aria-required', 'true');

    const error = document.createElement('div');
    error.className = 'error';
    error.id = `error-custom-document-${field.key}`;

    wrapper.append(label, input, error);
    container.append(wrapper);
  }
}

function configureStatus(previousStatus) {
  const select = document.getElementById('status');
  const free = document.getElementById('status-free');
  const lifecycle = config.statusLifecycle;

  if (lifecycle) {
    if (select) {
      select.hidden = false;
      select.textContent = '';
      const statuses = editingId
        ? allowedNextStatuses(lifecycle, previousStatus)
        : lifecycle.statuses.slice(0, 1);
      for (const status of statuses) {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        select.append(option);
      }
      if (previousStatus && statuses.includes(previousStatus)) {
        select.value = previousStatus;
      } else if (statuses.length > 0) {
        select.value = statuses[0];
      }
    }
    if (free) free.hidden = true;
  } else {
    if (select) {
      select.hidden = true;
      select.textContent = '';
    }
    if (free) free.hidden = false;
  }
}

function clearErrors() {
  const form = formElement();
  if (!form) return;
  form.querySelectorAll('.error').forEach((element) => {
    element.textContent = '';
    element.classList.remove('visible');
  });
  form.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
    element.removeAttribute('aria-invalid');
  });
}

function errorElement(field) {
  if (field === 'entity_id')
    return document.getElementById('error-document-entity');
  if (field.startsWith('customFields.')) {
    return document.getElementById(
      `error-custom-document-${field.slice('customFields.'.length)}`
    );
  }
  return document.getElementById(`error-${field}`);
}

function inputElement(field) {
  if (field === 'entity_id') return document.getElementById('document-entity');
  if (field.startsWith('customFields.')) {
    const key = field.slice('customFields.'.length);
    const container = customContainer();
    if (!container) return null;
    return Array.from(container.querySelectorAll('[data-custom-key]')).find(
      (element) => element.dataset.customKey === key
    );
  }
  return document.getElementById(field);
}

export function initDocumentForm({ config: nextConfig, onSubmit: handler }) {
  config = nextConfig;
  onSubmit = handler;
  editingId = null;
  cachedEntities = [];
  renderCustomFields();
  configureStatus();
  bindDocumentFormEvents();
  clearErrors();

  const form = formElement();
  if (form) {
    form.onsubmit = (event) => {
      event.preventDefault();
      if (onSubmit) onSubmit(readDocumentForm(), editingId);
    };
  }
}

function selectedTipoFactura() {
  const select = document.getElementById('custom-document-tipoFactura');
  return select ? select.value : '';
}

function selectedTerceroTipo() {
  const select = document.getElementById('document-entity');
  if (!select || !select.value) return '';
  const entity = cachedEntities.find((item) => item.entity_id === select.value);
  return entity && entity.customFields
    ? String(entity.customFields.tipoTercero || '')
    : '';
}

function allowedTerceroTipos(tipoFactura) {
  if (tipoFactura === 'venta') return ['cliente'];
  if (tipoFactura === 'compra') return ['proveedor', 'personal'];
  return null;
}

export function filterDocumentEntityOptions() {
  const select = document.getElementById('document-entity');
  if (!select) return;
  const tipos = allowedTerceroTipos(selectedTipoFactura());
  const current = select.value;
  const currentEntity = cachedEntities.find(
    (item) => item.entity_id === current
  );
  select.textContent = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Seleccione...';
  select.append(placeholder);

  for (const entity of cachedEntities) {
    const tipo =
      entity.customFields && entity.customFields.tipoTercero
        ? String(entity.customFields.tipoTercero)
        : '';
    const visible =
      tipos === null
        ? true
        : tipos.includes(tipo) || entity.entity_id === current;
    if (!visible) continue;
    const option = document.createElement('option');
    option.value = entity.entity_id;
    option.textContent = `${entity.name} (${entity.code})`;
    select.append(option);
  }

  if (current && select.value !== current && currentEntity) {
    const option = document.createElement('option');
    option.value = currentEntity.entity_id;
    option.textContent = `${currentEntity.name} (${currentEntity.code})`;
    select.append(option);
  }
  if (current && Array.from(select.options).some((o) => o.value === current)) {
    select.value = current;
  }
}

function updateFieldVisibility() {
  const tipo = selectedTipoFactura();
  const terceroTipo = selectedTerceroTipo();
  const container = customContainer();
  if (!container) return;
  const allowed = tipo ? TYPE_DEPENDENT_FIELDS[tipo] || [] : null;
  for (const wrapper of container.querySelectorAll('[data-custom-field]')) {
    const key = wrapper.dataset.customField;
    let visible = allowed === null ? true : allowed.includes(key);
    if (visible && tipo === 'compra' && key === 'periodoLiquidacion') {
      visible = selectedTerceroTipo() !== '' && terceroTipo === 'personal';
    }
    wrapper.hidden = !visible;
  }
}

function bindDocumentFormEvents() {
  const tipoSelect = document.getElementById('custom-document-tipoFactura');
  if (tipoSelect) {
    tipoSelect.onchange = () => {
      filterDocumentEntityOptions();
      updateFieldVisibility();
    };
  }
  const entitySelect = document.getElementById('document-entity');
  if (entitySelect) {
    const previous = entitySelect.onchange;
    entitySelect.onchange = (event) => {
      if (previous) previous(event);
      updateFieldVisibility();
    };
  }
}

export function presetDocumentTipoFactura(tipoFactura) {
  const select = document.getElementById('custom-document-tipoFactura');
  if (!select) return;
  select.value = tipoFactura;
  filterDocumentEntityOptions();
  updateFieldVisibility();
}

export function setDocumentFormEntities(entities) {
  cachedEntities = Array.isArray(entities) ? [...entities] : [];
  filterDocumentEntityOptions();
}

export function setDocumentFormOptions(documents, entities) {
  const select = document.getElementById('edit-document');
  if (!select) return;
  const current = select.value;
  select.textContent = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Seleccione...';
  select.append(placeholder);

  for (const documentRecord of documents) {
    const entity = entities.find(
      (item) => item.entity_id === documentRecord.entity_id
    );
    const option = document.createElement('option');
    option.value = documentRecord.document_id;
    option.textContent = `${documentRecord.folio ?? documentRecord.document_id} — ${entity ? entity.name : documentRecord.entity_id}`;
    select.append(option);
  }

  if (
    current &&
    documents.some((document) => document.document_id === current)
  ) {
    select.value = current;
  }
}

export function readDocumentForm() {
  const values = {};
  const entitySelect = document.getElementById('document-entity');
  if (entitySelect && !isBlank(entitySelect.value))
    values.entity_id = entitySelect.value;

  for (const field of BASE_FIELDS) {
    const element = document.getElementById(field);
    const value = element ? element.value : '';
    if (!isBlank(value)) values[field] = value;
  }

  if (config.statusLifecycle) {
    const select = document.getElementById('status');
    if (select && !isBlank(select.value)) values.status = select.value;
  } else {
    const free = document.getElementById('status-free');
    if (free && !isBlank(free.value)) values.status = free.value;
  }

  const customValues = {};
  const container = customContainer();
  if (container) {
    for (const element of container.querySelectorAll('[data-custom-key]')) {
      if (!isBlank(element.value))
        customValues[element.dataset.customKey] = element.value;
    }
  }
  values.customFields = customValues;
  return values;
}

export function setDocumentFormDocument(documentRecord) {
  editingId = documentRecord
    ? documentRecord.document_id || documentRecord.id || null
    : null;
  const form = formElement();
  if (!form || !documentRecord) return;
  clearErrors();

  const entitySelect = document.getElementById('document-entity');
  if (entitySelect) entitySelect.value = documentRecord.entity_id || '';

  for (const field of BASE_FIELDS) {
    const element = document.getElementById(field);
    if (element) element.value = documentRecord[field] ?? '';
  }

  configureStatus(documentRecord.status);
  if (config.statusLifecycle) {
    const select = document.getElementById('status');
    if (select && documentRecord.status) select.value = documentRecord.status;
  } else {
    const free = document.getElementById('status-free');
    if (free) free.value = documentRecord.status ?? '';
  }

  const container = customContainer();
  if (container) {
    const values = documentRecord.customFields || {};
    for (const element of container.querySelectorAll('[data-custom-key]')) {
      element.value = values[element.dataset.customKey] ?? '';
    }
  }
  filterDocumentEntityOptions();
  updateFieldVisibility();
}

export function resetDocumentForm() {
  editingId = null;
  const form = formElement();
  if (form) form.reset();
  configureStatus();
  const container = customContainer();
  if (container) {
    for (const element of container.querySelectorAll('[data-custom-key]')) {
      element.value = '';
    }
  }
  clearErrors();
}

export function showDocumentErrors(errors) {
  clearErrors();
  for (const error of errors) {
    const target = errorElement(error.field);
    if (target) {
      target.textContent = error.message;
      target.classList.add('visible');
    }
    const input = inputElement(error.field);
    if (input) input.setAttribute('aria-invalid', 'true');
  }
}

export function getEditingDocumentId() {
  return editingId;
}

export function focusDocumentForm() {
  const select = document.getElementById('document-entity');
  if (select) select.focus();
}
