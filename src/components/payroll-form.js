import { allowedNextStatuses } from '../validation.js';
import { PURCHASE_INVOICE_FIELDS } from './invoice-purchase-form.js';

const FIELDS = [
  ['periodoLiquidacion', 'Período (AAAA-MM)'],
  ['sueldoBase', 'Sueldo base'],
  ['descuentos', 'Descuentos'],
  ['bonos', 'Bonos'],
  ['totalAmount', 'Monto total'],
  ['status', 'Estado'],
  ['startDate', 'Fecha de emisión'],
  ['endDate', 'Fecha de vencimiento'],
  ['centroCosto', 'Centro de costo'],
  ['montoPagado', 'Monto pagado'],
  ['fechaPago', 'Fecha de pago'],
];

export function initPayrollForm({ config, root, onSave, onDirtyChange }) {
  const fieldsContainer = root?.querySelector('#payroll-form-fields');
  const errorsElement = root?.querySelector('#payroll-form-errors');
  const form = root?.querySelector('#payroll-form');
  if (!fieldsContainer || !form) return null;

  let current = null;
  let dirty = false;

  function setDirty(value) {
    dirty = Boolean(value);
    onDirtyChange?.(dirty);
  }

  const inputs = new Map();
  for (const [field, label] of FIELDS) {
    const fieldId = `payroll-field-${field}`;
    let input = fieldsContainer.querySelector(`#${fieldId}`);
    if (!input) {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-field';
      const labelElement = document.createElement('label');
      labelElement.textContent = label;
      labelElement.htmlFor = fieldId;
      input = document.createElement('input');
      input.id = fieldId;
      input.dataset.field = field;
      wrapper.append(labelElement, input);
      fieldsContainer.append(wrapper);
    }
    if (field === 'status' || field === 'centroCosto') {
      input.type = 'text';
      input.readOnly = true;
    }
    input.addEventListener('input', () => setDirty(true));
    inputs.set(field, input);
  }

  function setDocument(settlement) {
    current = settlement;
    const custom = settlement?.customFields || {};
    inputs.get('periodoLiquidacion').value =
      settlement?.periodo ?? custom.periodoLiquidacion ?? '';
    inputs.get('sueldoBase').value = settlement?.sueldoBase ?? '';
    inputs.get('descuentos').value = settlement?.descuentos ?? '';
    inputs.get('bonos').value = settlement?.bonos ?? '';
    inputs.get('totalAmount').value =
      settlement?.monto ?? settlement?.totalAmount ?? '';
    inputs.get('status').value = settlement?.estado ?? settlement?.status ?? '';
    inputs.get('startDate').value = settlement?.startDate ?? '';
    inputs.get('endDate').value = settlement?.endDate ?? '';
    inputs.get('centroCosto').value = custom.centroCosto ?? '';
    inputs.get('montoPagado').value = custom.montoPagado ?? '';
    inputs.get('fechaPago').value =
      settlement?.fechaPago ?? custom.fechaPago ?? '';
    setDirty(false);
  }

  function showErrors(errors) {
    if (!errorsElement) return;
    errorsElement.textContent = (errors || [])
      .map((error) => error.message)
      .join(' ');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!current) return;
    const values = {};
    for (const [field] of FIELDS) {
      values[field] = inputs.get(field).value;
    }
    for (const field of PURCHASE_INVOICE_FIELDS) {
      if (!(field in values)) values[field] = '';
    }
    onSave?.(current.settlementId || current.document_id, values, current);
    setDirty(false);
  });

  return {
    setDocument,
    showErrors,
    getDirty: () => dirty,
    allowedStatuses: (status) =>
      allowedNextStatuses(config.statusLifecycle, status),
  };
}
