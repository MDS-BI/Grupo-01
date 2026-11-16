import {
  getInvoiceView,
  INVOICE_READ_ONLY_FIELDS,
  INVOICE_VIEWS,
} from '../module-config.js';
import { isBlank } from '../utils.js';
import { allowedNextStatuses } from '../validation.js';

const TYPE_SPECIFIC_FIELDS = Object.values(INVOICE_VIEWS).flatMap(
  (view) => view.fields
);

function fillSelect(select, rows, placeholder, selected = select.value) {
  select.replaceChildren(
    new Option(placeholder, ''),
    ...rows.map(([value, label]) => new Option(label, value))
  );
  select.value = rows.some(([value]) => value === selected) ? selected : '';
}

export function createInvoiceForm({
  tipoFactura,
  root,
  config,
  onSubmit,
  onEdit,
  onDelete,
  onFilter,
}) {
  const view = getInvoiceView(tipoFactura);
  const form = root.querySelector('form');
  const editSelect = root.querySelector('[data-invoice-edit]');
  const filterSelect = root.querySelector('[data-invoice-filter]');
  const feedback = root.querySelector('[data-invoice-feedback]');
  const title = root.querySelector('[data-form-title]');
  const invoiceLabel = config.labels.document.toLowerCase();
  const thirdPartyLabel = config.labels.entity.toLowerCase();
  const lifecycle = config.statusLifecycle;
  const restrictThirdParties = config.customFields.some(
    ({ key, target }) => key === 'tipoTercero' && target === 'entity'
  );
  let editing = null;
  let entities = [];

  form.replaceChildren(
    root.ownerDocument.getElementById('invoice-fields').content.cloneNode(true)
  );
  form.querySelector('[data-label="entity_id"]').textContent =
    config.labels.entity;
  root.querySelector('[data-edit-label]').textContent =
    `Editar ${invoiceLabel}`;
  root.querySelector('[data-new-invoice]').textContent =
    `Nueva ${invoiceLabel}`;
  form.querySelector('button[type="submit"]').textContent =
    `Guardar ${invoiceLabel}`;

  let statusInput = form.querySelector('[data-field="status"]');
  if (!lifecycle) {
    const freeStatus = document.createElement('input');
    freeStatus.name = 'status';
    freeStatus.dataset.field = 'status';
    statusInput.replaceWith(freeStatus);
    statusInput = freeStatus;
  }

  const baseInputs = [...form.querySelectorAll('[data-field]')];
  const customContainer = form.querySelector('[data-custom-fields]');
  const customInputs = config.customFields
    .filter(
      ({ key, target }) =>
        target === 'document' &&
        key !== 'tipoFactura' &&
        (!TYPE_SPECIFIC_FIELDS.includes(key) || view.fields.includes(key))
    )
    .map(({ key, label, required, type, options = [] }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-field';
      const labelElement = document.createElement('label');
      labelElement.dataset.label = key;
      labelElement.textContent = required ? `${label} *` : label;
      const input = document.createElement(
        type === 'select' ? 'select' : 'input'
      );
      input.name = `custom-${key}`;
      input.dataset.field = key;
      if (type === 'select') {
        fillSelect(
          input,
          options.map((option) => [option, option]),
          'Seleccione…'
        );
      } else {
        input.type = type;
        if (type === 'number') input.step = 'any';
      }
      if (required) input.setAttribute('aria-required', 'true');
      const error = document.createElement('div');
      error.className = 'error';
      error.dataset.error = key;
      wrapper.append(labelElement, input, error);
      customContainer.append(wrapper);
      return input;
    });

  const inputs = new Map(
    [...baseInputs, ...customInputs].map((input) => [
      input.dataset.field,
      input,
    ])
  );
  const errors = new Map(
    [...form.querySelectorAll('[data-error]')].map((error) => [
      error.dataset.error,
      error,
    ])
  );
  for (const label of form.querySelectorAll('[data-label]')) {
    const key = label.dataset.label;
    const input = inputs.get(key);
    const error = errors.get(key);
    input.id = `${view.module}-field-${key}`;
    error.id = `${input.id}-error`;
    label.htmlFor = input.id;
    input.setAttribute('aria-describedby', error.id);
  }
  const entitySelect = inputs.get('entity_id');
  const formError = form.querySelector('[data-form-error]');

  function updateVisibility() {
    const selected = entities.find(
      ({ entity_id }) => entity_id === entitySelect.value
    );
    for (const input of customInputs) {
      const key = input.dataset.field;
      let visible = true;
      if (key === 'periodoLiquidacion') {
        visible = selected?.customFields?.tipoTercero === 'personal';
      }
      if ((key === 'montoPagado' || key === 'fechaPago') && lifecycle) {
        visible = statusInput.value === 'Pagada';
      }
      input.closest('.form-field').hidden = !visible;
    }
  }

  function showErrors(issues) {
    for (const error of [...errors.values(), formError]) {
      error.textContent = '';
      error.classList.remove('visible');
    }
    for (const input of inputs.values()) input.removeAttribute('aria-invalid');
    for (const { field, message } of issues) {
      const key = field.replace(/^customFields\./, '');
      const input = inputs.get(key);
      const target =
        input && !input.closest('.form-field').hidden
          ? errors.get(key)
          : formError;
      target.textContent = [target.textContent, message]
        .filter(Boolean)
        .join(' ');
      target.classList.add('visible');
      if (input) input.setAttribute('aria-invalid', 'true');
    }
  }

  function setEntities(records) {
    entities = records;
    const allowed = entities.filter(
      (entity) =>
        !restrictThirdParties ||
        view.thirdPartyTypes.includes(entity.customFields?.tipoTercero)
    );
    const rows = allowed.map(({ entity_id, name, code }) => [
      entity_id,
      `${name} (${code})`,
    ]);
    fillSelect(entitySelect, rows, `Seleccione ${thirdPartyLabel}…`);
    fillSelect(filterSelect, rows, 'Todos');
    updateVisibility();
  }

  function setOptions(records, names) {
    const applicable = records.filter(
      (record) =>
        record.customFields?.tipoFactura === tipoFactura &&
        (!filterSelect.value || record.entity_id === filterSelect.value)
    );
    fillSelect(
      editSelect,
      applicable.map(({ document_id, folio, entity_id }) => [
        document_id,
        `#${folio ?? document_id} · ${names.get(entity_id) ?? entity_id}`,
      ]),
      'Seleccione una factura…'
    );
    for (const selector of ['[data-load-invoice]', '[data-delete-invoice]']) {
      root.querySelector(selector).disabled = !editSelect.value;
    }
  }

  function setDocument(record) {
    if (record && record.customFields?.tipoFactura !== tipoFactura) return;
    editing = record;
    editSelect.value = record?.document_id ?? '';
    for (const input of baseInputs) {
      const key = input.dataset.field;
      if (key !== 'status') {
        const legacyValue =
          key === 'paymentTerms' ? record?.docPaymentTerms : undefined;
        input.value = record?.[key] ?? legacyValue ?? '';
      }
      if (INVOICE_READ_ONLY_FIELDS.includes(key))
        input.readOnly = Boolean(record);
    }
    if (lifecycle) {
      const statuses = record
        ? allowedNextStatuses(lifecycle, record.status)
        : lifecycle.statuses.slice(0, 1);
      statusInput.replaceChildren(
        ...statuses.map((status) => new Option(status, status))
      );
      statusInput.value = statuses.includes(record?.status)
        ? record.status
        : (statuses[0] ?? '');
    } else {
      statusInput.value = record?.status ?? '';
    }
    for (const input of customInputs) {
      input.value = record?.customFields?.[input.dataset.field] ?? '';
    }
    title.textContent = `${record ? 'Editar' : 'Nueva'} ${invoiceLabel} de ${view.label}`;
    feedback.textContent = '';
    showErrors([]);
    updateVisibility();
  }

  function readValues() {
    const values = { entity_id: entitySelect.value };
    for (const input of baseInputs) {
      const key = input.dataset.field;
      if (
        key !== 'entity_id' &&
        key !== 'status' &&
        !input.readOnly &&
        !isBlank(input.value)
      )
        values[key] = input.value;
    }
    if (!isBlank(statusInput.value)) values.status = statusInput.value;

    const customFields = { ...editing?.customFields, tipoFactura };
    for (const input of customInputs) {
      const key = input.dataset.field;
      if (key === 'periodoLiquidacion' && input.closest('.form-field').hidden) {
        delete customFields[key];
      } else if (!input.closest('.form-field').hidden) {
        if (isBlank(input.value)) delete customFields[key];
        else customFields[key] = input.value;
      }
    }
    return { ...values, customFields };
  }

  function reset() {
    setDocument(null);
  }

  function focus() {
    entitySelect.focus();
  }

  root.querySelector('[data-new-invoice]').onclick = () => {
    reset();
    onFilter();
    focus();
  };
  root.querySelector('[data-load-invoice]').onclick = () =>
    onEdit(editSelect.value);
  root.querySelector('[data-delete-invoice]').onclick = () =>
    onDelete(editSelect.value);
  editSelect.onchange = onFilter;
  filterSelect.onchange = onFilter;
  entitySelect.onchange = updateVisibility;
  statusInput.onchange = updateVisibility;
  form.onsubmit = (event) => {
    event.preventDefault();
    onSubmit(readValues(), editing?.document_id);
  };

  reset();
  return {
    reset,
    focus,
    setDocument,
    setEntities,
    setOptions,
    showErrors,
    getEditingId: () => editing?.document_id ?? null,
    getFilter: () => filterSelect.value,
    setFeedback: (message) => {
      feedback.textContent = message;
    },
  };
}
