import { allowedNextStatuses } from '../validation.js';

const FIELDS = [
  ['periodoLiquidacion', 'Período (AAAA-MM)'],
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
    const wrapper = document.createElement('div');
    wrapper.className = 'form-field';
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.htmlFor = `payroll-field-${field}`;
    const input = document.createElement('input');
    input.id = `payroll-field-${field}`;
    input.dataset.field = field;
    if (field === 'status' || field === 'centroCosto') {
      input.type = 'text';
      input.readOnly = true;
    }
    input.addEventListener('input', () => setDirty(true));
    wrapper.append(labelElement, input);
    fieldsContainer.append(wrapper);
    inputs.set(field, input);
  }

  function setDocument(settlement) {
    current = settlement;
    const custom = settlement?.customFields || {};
    inputs.get('periodoLiquidacion').value = custom.periodoLiquidacion || '';
    inputs.get('totalAmount').value = settlement?.totalAmount ?? '';
    inputs.get('status').value = settlement?.status || '';
    inputs.get('startDate').value = settlement?.startDate || '';
    inputs.get('endDate').value = settlement?.endDate || '';
    inputs.get('centroCosto').value = custom.centroCosto || '';
    inputs.get('montoPagado').value = custom.montoPagado ?? '';
    inputs.get('fechaPago').value = custom.fechaPago || '';
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
    onSave?.(current.document_id, values, current);
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
