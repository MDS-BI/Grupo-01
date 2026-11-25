import { allowedNextStatuses } from '../validation.js';
import { formatCurrencyCLP } from '../format.js';
import { PURCHASE_INVOICE_FIELDS } from './invoice-purchase-form.js';

// Formulario «Editar liquidación» (spec 004, HU7): solo los datos de la
// liquidación; el monto líquido se calcula y no se escribe a mano.
const FIELDS = [
  'periodoLiquidacion',
  'status',
  'sueldoBase',
  'bonos',
  'descuentos',
  'fechaPago',
];

export function computeNetAmount({ sueldoBase, bonos, descuentos }, fallback) {
  const base = Number(sueldoBase) || 0;
  const extra = Number(bonos) || 0;
  const minus = Number(descuentos) || 0;
  if (base === 0 && extra === 0 && minus === 0) {
    return { amount: Number(fallback) || 0, fromBreakdown: false };
  }
  return { amount: base + extra - minus, fromBreakdown: true };
}

export function initPayrollForm({ config, root, onSave, onDirtyChange }) {
  const form = root?.querySelector('#payroll-form');
  const errorsElement = root?.querySelector('#payroll-form-errors');
  if (!form) return null;

  let current = null;
  let dirty = false;

  const inputs = new Map(
    FIELDS.map((field) => [
      field,
      form.querySelector(`#payroll-field-${field}`),
    ])
  );
  const totalElement = form.querySelector('#payroll-field-totalAmount');
  const totalHint = form.querySelector('#payroll-total-hint');
  const paidWrapper = form.querySelector('#payroll-field-fechaPago-wrapper');
  const subtitle = form.querySelector('#payroll-form-subtitle');
  const feedback = form.querySelector('[data-invoice-feedback]');

  function setDirty(value) {
    dirty = Boolean(value);
    onDirtyChange?.(dirty);
  }

  function value(field) {
    return inputs.get(field)?.value ?? '';
  }

  function currentAmount() {
    return computeNetAmount(
      {
        sueldoBase: value('sueldoBase'),
        bonos: value('bonos'),
        descuentos: value('descuentos'),
      },
      current?.monto ?? current?.totalAmount
    );
  }

  function updateDerived() {
    const { amount, fromBreakdown } = currentAmount();
    if (totalElement) totalElement.textContent = formatCurrencyCLP(amount);
    if (totalHint) totalHint.hidden = fromBreakdown;
    if (paidWrapper) paidWrapper.hidden = value('status') !== 'Pagada';
  }

  for (const input of inputs.values()) {
    if (!input) continue;
    const handler = () => {
      setDirty(true);
      updateDerived();
    };
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
  }

  function fillStatusOptions(status) {
    const select = inputs.get('status');
    if (!select) return;
    select.textContent = '';
    const options = [
      status,
      ...allowedNextStatuses(config.statusLifecycle, status),
    ].filter((item, index, list) => item && list.indexOf(item) === index);
    for (const option of options) {
      const element = document.createElement('option');
      element.value = option;
      element.textContent = option;
      select.append(element);
    }
    select.value = status;
  }

  function close() {
    current = null;
    form.hidden = true;
    setDirty(false);
  }

  function setDocument(settlement) {
    current = settlement;
    const custom = settlement?.customFields || {};
    const status = settlement?.estado ?? settlement?.status ?? '';
    inputs.get('periodoLiquidacion').value =
      settlement?.periodo ?? custom.periodoLiquidacion ?? '';
    inputs.get('sueldoBase').value = settlement?.sueldoBase ?? '';
    inputs.get('descuentos').value = settlement?.descuentos ?? '';
    inputs.get('bonos').value = settlement?.bonos ?? '';
    inputs.get('fechaPago').value =
      settlement?.fechaPago ?? custom.fechaPago ?? '';
    fillStatusOptions(status);
    if (subtitle) subtitle.textContent = settlement?.workerLabel ?? '';
    if (feedback) feedback.textContent = '';
    showErrors([]);
    updateDerived();
    form.hidden = false;
    setDirty(false);
    form.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    inputs.get('periodoLiquidacion')?.focus?.();
  }

  function showErrors(errors) {
    if (!errorsElement) return;
    errorsElement.textContent = (errors || [])
      .map((error) => error.message)
      .join(' ');
  }

  form.querySelector('#payroll-form-cancel')?.addEventListener('click', close);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!current) return;
    const custom = current.customFields || {};
    const status = value('status');
    const { amount } = currentAmount();
    const values = {
      periodoLiquidacion: value('periodoLiquidacion'),
      sueldoBase: value('sueldoBase'),
      bonos: value('bonos'),
      descuentos: value('descuentos'),
      totalAmount: String(amount),
      status,
      startDate: current.startDate ?? '',
      endDate: current.endDate ?? '',
      centroCosto: custom.centroCosto ?? '',
      montoPagado: status === 'Pagada' ? String(amount) : '',
      fechaPago: status === 'Pagada' ? value('fechaPago') : '',
    };
    for (const field of PURCHASE_INVOICE_FIELDS) {
      if (!(field in values)) values[field] = '';
    }
    onSave?.(current.settlementId || current.document_id, values, current);
    setDirty(false);
  });

  return {
    setDocument,
    showErrors,
    close,
    getDirty: () => dirty,
    allowedStatuses: (status) =>
      allowedNextStatuses(config.statusLifecycle, status),
  };
}
