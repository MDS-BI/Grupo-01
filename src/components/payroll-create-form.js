import { formatCurrencyCLP } from '../format.js';
import { isBlank } from '../utils.js';

// Formulario propio de «Crear liquidación de sueldo» (spec 003, Session
// 2026-11-25, T059). No reutiliza el formulario de facturas de compra: solo
// enlaza los diez campos acordados y calcula el total como
// sueldo base + bonos − descuentos, sin que se escriba a mano.
export const PAYROLL_CREATE_FIELDS = [
  'rut',
  'nombreCompleto',
  'periodoLiquidacion',
  'sueldoBase',
  'bonos',
  'descuentos',
  'startDate',
  'endDate',
  'series',
  'folio',
];

const BREAKDOWN_FIELDS = ['sueldoBase', 'bonos', 'descuentos'];
const BREAKDOWN_LABELS = {
  sueldoBase: 'El sueldo base',
  bonos: 'Los bonos',
  descuentos: 'Los descuentos',
};

const toAmount = (value) => (isBlank(value) ? 0 : Number(value));

export function computePayrollCreateTotal({ sueldoBase, bonos, descuentos }) {
  return toAmount(sueldoBase) + toAmount(bonos) - toAmount(descuentos);
}

export function initPayrollCreateForm({ root, onSubmit, onDirtyChange } = {}) {
  const form = root?.querySelector('#payroll-create-form');
  if (!form) return null;

  const inputs = new Map(
    PAYROLL_CREATE_FIELDS.map((field) => [
      field,
      form.querySelector(`#payroll-create-field-${field}`),
    ])
  );
  const totalElement = form.querySelector('#payroll-create-field-totalAmount');
  const formError = form.querySelector('[data-form-error]');
  const feedback = root.querySelector('[data-invoice-feedback]');
  const errorElements = new Map(
    [...form.querySelectorAll('[data-error]')].map((element) => [
      element.dataset.error,
      element,
    ])
  );
  let dirty = false;

  function setDirty(value) {
    const next = Boolean(value);
    if (next === dirty) return;
    dirty = next;
    onDirtyChange?.(dirty);
  }

  function value(field) {
    return String(inputs.get(field)?.value ?? '').trim();
  }

  function breakdown() {
    return Object.fromEntries(
      BREAKDOWN_FIELDS.map((field) => [field, toAmount(value(field))])
    );
  }

  function total() {
    return computePayrollCreateTotal(breakdown());
  }

  function updateTotal() {
    if (totalElement) totalElement.textContent = formatCurrencyCLP(total());
  }

  function showErrors(issues = []) {
    for (const element of [...errorElements.values(), formError]) {
      if (!element) continue;
      element.textContent = '';
      element.classList.remove('visible');
    }
    for (const input of inputs.values()) input?.removeAttribute('aria-invalid');
    for (const { field = '', message } of issues) {
      const key = field.replace(/^customFields\./, '');
      const target = errorElements.get(key) ?? formError;
      if (!target) continue;
      target.textContent = [target.textContent, message]
        .filter(Boolean)
        .join(' ');
      target.classList.add('visible');
      inputs.get(key)?.setAttribute('aria-invalid', 'true');
    }
  }

  function validateBreakdown() {
    const issues = [];
    if (isBlank(value('sueldoBase'))) {
      issues.push({
        field: 'sueldoBase',
        message: 'El sueldo base es obligatorio.',
      });
    }
    for (const field of BREAKDOWN_FIELDS) {
      const raw = value(field);
      if (isBlank(raw)) continue;
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount < 0) {
        issues.push({
          field,
          message: `${BREAKDOWN_LABELS[field]} debe ser un número no negativo.`,
        });
      }
    }
    return issues;
  }

  function readValues() {
    const values = {
      startDate: value('startDate'),
      endDate: value('endDate'),
      folio: value('folio'),
      totalAmount: String(total()),
      status: 'Borrador',
      customFields: {
        tipoFactura: 'compra',
        periodoLiquidacion: value('periodoLiquidacion'),
      },
    };
    if (!isBlank(value('series'))) values.series = value('series');
    return values;
  }

  function reset() {
    form.reset?.();
    for (const input of inputs.values()) {
      if (input) input.value = '';
    }
    showErrors([]);
    updateTotal();
    setDirty(false);
  }

  function focus() {
    inputs.get('rut')?.focus?.();
  }

  for (const input of inputs.values()) {
    if (!input) continue;
    const handler = () => {
      setDirty(true);
      updateTotal();
    };
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
  }

  const newButton = root.querySelector('[data-new-invoice]');
  if (newButton) {
    newButton.onclick = () => {
      reset();
      if (feedback) feedback.textContent = '';
      focus();
    };
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (feedback) feedback.textContent = '';
    const issues = validateBreakdown();
    if (issues.length > 0) {
      showErrors(issues);
      return;
    }
    showErrors([]);
    onSubmit?.(
      readValues(),
      null,
      { rut: value('rut'), nombreCompleto: value('nombreCompleto') },
      breakdown()
    );
  });

  reset();

  return {
    reset,
    focus,
    showErrors,
    setFeedback: (message) => {
      if (feedback) feedback.textContent = message;
    },
    getDirty: () => dirty,
  };
}
