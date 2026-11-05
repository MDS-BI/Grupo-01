import { isBlank, isValidDate, normalizeText } from './utils.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RUT_PATTERN = /^\d{1,2}\.\d{3}(?:\.\d{3})?-(?:\d|k|K)$/;
const PERIODO_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/;

export function isValidRutChileno(value) {
  if (typeof value !== 'string') return false;
  const rut = value.trim().replace(/\./g, '').toUpperCase();
  if (!/^\d{7,8}-[\dK]$/.test(rut)) return false;
  const [cuerpo, dv] = rut.split('-');
  let sum = 0;
  let multiplier = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    sum += Number(cuerpo[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected =
    remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return dv === expected;
}

export function makeError(field, code, message, context) {
  const result = { field, code, message };
  if (context !== undefined) result.context = context;
  return result;
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (isBlank(value)) return NaN;
  return Number(value);
}

function isPositiveInteger(value) {
  const number = toNumber(value);
  return Number.isInteger(number) && number > 0;
}

export function validateCustomFields(record, target, config = {}) {
  const errors = [];
  const fields = (config.customFields || []).filter(
    (field) => field.target === target
  );
  const values =
    record.customFields && typeof record.customFields === 'object'
      ? record.customFields
      : {};

  for (const field of fields) {
    const value = values[field.key];
    if (field.required && isBlank(value)) {
      errors.push(
        makeError(
          `customFields.${field.key}`,
          'REQUIRED',
          `${field.label} es obligatorio.`
        )
      );
      continue;
    }
    if (isBlank(value)) continue;

    if (field.type === 'number' && !Number.isFinite(Number(value))) {
      errors.push(
        makeError(
          `customFields.${field.key}`,
          'INVALID_NUMBER',
          `${field.label} debe ser un número válido.`
        )
      );
    }
    if (field.type === 'date' && !isValidDate(String(value))) {
      errors.push(
        makeError(
          `customFields.${field.key}`,
          'INVALID_DATE',
          `${field.label} debe usar el formato AAAA-MM-DD.`
        )
      );
    }
    if (
      field.type === 'select' &&
      Array.isArray(field.options) &&
      !field.options.includes(String(value))
    ) {
      errors.push(
        makeError(
          `customFields.${field.key}`,
          'INVALID_FORMAT',
          `${field.label} debe ser una de las opciones permitidas.`
        )
      );
    }
  }

  return errors;
}

export function validateEntity(entity, { config = {}, existing = [] } = {}) {
  const errors = [];

  if (isBlank(entity.name)) {
    errors.push(makeError('name', 'REQUIRED', 'El nombre es obligatorio.'));
  }
  if (isBlank(entity.code)) {
    errors.push(makeError('code', 'REQUIRED', 'El código es obligatorio.'));
  } else {
    const normalizedCode = normalizeText(entity.code);
    const duplicate = existing.some(
      (item) =>
        item &&
        item.entity_id !== entity.entity_id &&
        normalizeText(item.code) === normalizedCode
    );
    if (duplicate) {
      errors.push(
        makeError(
          'code',
          'DUPLICATE_CODE',
          'El código ya está en uso por otra entidad.'
        )
      );
    }
  }

  if (
    !isBlank(entity.email) &&
    !EMAIL_PATTERN.test(String(entity.email).trim())
  ) {
    errors.push(
      makeError(
        'email',
        'INVALID_EMAIL',
        'El correo electrónico no tiene un formato válido.'
      )
    );
  }

  if (!isBlank(entity.creditLimit)) {
    const creditLimit = toNumber(entity.creditLimit);
    if (!Number.isFinite(creditLimit)) {
      errors.push(
        makeError(
          'creditLimit',
          'INVALID_NUMBER',
          'El límite de crédito debe ser un número.'
        )
      );
    } else if (creditLimit < 0) {
      errors.push(
        makeError(
          'creditLimit',
          'NEGATIVE_NOT_ALLOWED',
          'El límite de crédito no puede ser negativo.'
        )
      );
    }
  }

  if (!isBlank(entity.targetDate) && !isValidDate(String(entity.targetDate))) {
    errors.push(
      makeError(
        'targetDate',
        'INVALID_DATE',
        'La fecha objetivo debe usar el formato AAAA-MM-DD.'
      )
    );
  }

  const declaresTipoTercero = (config.customFields || []).some(
    (field) => field.target === 'entity' && field.key === 'tipoTercero'
  );
  const tipoTercero = entity.customFields
    ? entity.customFields.tipoTercero
    : undefined;

  if (declaresTipoTercero && !isBlank(entity.taxId)) {
    if (!isValidRutChileno(String(entity.taxId))) {
      errors.push(
        makeError(
          'taxId',
          'INVALID_FORMAT',
          'El RUT no tiene formato chileno válido o su dígito verificador es incorrecto (módulo 11).'
        )
      );
    }
  }

  if (
    declaresTipoTercero &&
    !isBlank(tipoTercero) &&
    String(tipoTercero) !== 'cliente' &&
    !isBlank(entity.creditLimit)
  ) {
    errors.push(
      makeError(
        'creditLimit',
        'CREDIT_LIMIT_NOT_ALLOWED',
        'El límite de crédito solo aplica a terceros de tipo cliente.'
      )
    );
  }

  errors.push(...validateCustomFields(entity, 'entity', config));

  return errors;
}

export function validateDocument(
  document,
  { config = {}, entities = [], documents = [], previousStatus } = {}
) {
  const errors = [];
  const entityId = document.entity_id;
  const entity = entities.find((item) => item.entity_id === entityId);
  const tipoTercero =
    entity && entity.customFields ? entity.customFields.tipoTercero : undefined;
  const tipoFactura = document.customFields
    ? document.customFields.tipoFactura
    : undefined;
  const custom = document.customFields || {};
  const status = String(document.status || '');

  if (isBlank(entityId)) {
    errors.push(
      makeError(
        'entity_id',
        'MISSING_ENTITY_REF',
        'Debe seleccionar una entidad existente.'
      )
    );
  } else if (!entity) {
    errors.push(
      makeError(
        'entity_id',
        'MISSING_ENTITY_REF',
        'La entidad seleccionada no existe.'
      )
    );
  }

  const hasInvoiceType = (config.customFields || []).some(
    (field) => field.target === 'document' && field.key === 'tipoFactura'
  );
  if (hasInvoiceType && entity) {
    const allowedTypes =
      tipoFactura === 'venta'
        ? ['cliente']
        : tipoFactura === 'compra'
          ? ['proveedor', 'personal']
          : [];
    if (
      allowedTypes.length > 0 &&
      !allowedTypes.includes(String(tipoTercero))
    ) {
      const detalle =
        tipoFactura === 'venta'
          ? 'cliente'
          : 'tercero de tipo proveedor o personal';
      errors.push(
        makeError(
          'entity_id',
          'INCOMPATIBLE_ENTITY_TYPE',
          `Una factura de ${tipoFactura} solo puede asociarse a un ${detalle}.`
        )
      );
    }
  }

  if (isBlank(document.folio)) {
    errors.push(makeError('folio', 'REQUIRED', 'El folio es obligatorio.'));
  } else if (!isPositiveInteger(document.folio)) {
    errors.push(
      makeError(
        'folio',
        'INVALID_FOLIO',
        'El folio debe ser un entero positivo.'
      )
    );
  }

  const startValid =
    !isBlank(document.startDate) && isValidDate(String(document.startDate));
  if (isBlank(document.startDate)) {
    errors.push(
      makeError('startDate', 'REQUIRED', 'La fecha de inicio es obligatoria.')
    );
  } else if (!startValid) {
    errors.push(
      makeError(
        'startDate',
        'INVALID_DATE',
        'La fecha de inicio debe usar el formato AAAA-MM-DD.'
      )
    );
  }

  const endValid =
    !isBlank(document.endDate) && isValidDate(String(document.endDate));
  if (isBlank(document.endDate)) {
    errors.push(
      makeError('endDate', 'REQUIRED', 'La fecha de fin es obligatoria.')
    );
  } else if (!endValid) {
    errors.push(
      makeError(
        'endDate',
        'INVALID_DATE',
        'La fecha de fin debe usar el formato AAAA-MM-DD.'
      )
    );
  }

  if (
    startValid &&
    endValid &&
    String(document.endDate) < String(document.startDate)
  ) {
    errors.push(
      makeError(
        'endDate',
        'END_BEFORE_START',
        'La fecha de fin no puede ser anterior a la fecha de inicio.'
      )
    );
  }

  if (!isBlank(document.quantity) && !isPositiveInteger(document.quantity)) {
    errors.push(
      makeError(
        'quantity',
        'INTEGER_REQUIRED',
        'La cantidad debe ser un entero positivo.'
      )
    );
  }

  for (const field of ['subtotal', 'discount', 'taxAmount', 'totalAmount']) {
    if (isBlank(document[field])) continue;
    const value = toNumber(document[field]);
    if (!Number.isFinite(value)) {
      errors.push(
        makeError(
          field,
          'INVALID_NUMBER',
          'El importe debe ser un número válido.'
        )
      );
    } else if (value < 0) {
      errors.push(
        makeError(
          field,
          'NEGATIVE_NOT_ALLOWED',
          'El importe no puede ser negativo.'
        )
      );
    }
  }

  if (!isBlank(document.subtotal) && !isBlank(document.discount)) {
    const subtotal = toNumber(document.subtotal);
    const discount = toNumber(document.discount);
    if (
      Number.isFinite(subtotal) &&
      Number.isFinite(discount) &&
      discount > subtotal
    ) {
      errors.push(
        makeError(
          'discount',
          'DISCOUNT_EXCEEDS_SUBTOTAL',
          'El descuento no puede superar el subtotal.'
        )
      );
    }
  }

  const lifecycle = config.statusLifecycle;
  if (lifecycle && !isBlank(document.status)) {
    if (!lifecycle.statuses.includes(status)) {
      errors.push(
        makeError(
          'status',
          'INVALID_FORMAT',
          'El estado no pertenece al ciclo de vida configurado.'
        )
      );
    } else if (previousStatus && previousStatus !== status) {
      const allowed = lifecycle.transitions[previousStatus] || [];
      if (!allowed.includes(status)) {
        errors.push(
          makeError(
            'status',
            'INVALID_TRANSITION',
            `No se permite pasar de "${previousStatus}" a "${status}".`
          )
        );
      }
    }
  }

  const duplicated = hasInvoiceType
    ? isDuplicateInvoice(documents, document)
    : false;
  if (duplicated) {
    errors.push(
      makeError(
        'folio',
        'DUPLICATE_FOLIO',
        'La combinación de tipo de factura, serie y folio ya existe.'
      )
    );
  }

  applyModuleRules(errors, {
    document,
    custom,
    status,
    tipoFactura,
    tipoTercero,
    hasInvoiceType,
    startValid,
  });

  errors.push(...validateCustomFields(document, 'document', config));

  return errors;
}

function applyModuleRules(
  errors,
  {
    document,
    custom,
    status,
    tipoFactura,
    tipoTercero,
    hasInvoiceType,
    startValid,
  }
) {
  const isEmitted = status === 'Emitida' || status === 'Pagada';

  if (hasInvoiceType && isEmitted) {
    const total = toNumber(document.totalAmount);
    if (isBlank(document.totalAmount)) {
      errors.push(
        makeError(
          'totalAmount',
          'REQUIRED',
          'El monto total es obligatorio para emitir la factura.'
        )
      );
    } else if (Number.isFinite(total) && total <= 0) {
      errors.push(
        makeError(
          'totalAmount',
          'TOTAL_NOT_POSITIVE',
          'El monto total debe ser mayor que cero para emitir la factura.'
        )
      );
    }
  }

  if (hasInvoiceType && tipoFactura === 'venta') {
    if (
      custom.salesOrderId !== undefined &&
      String(custom.salesOrderId).trim() === ''
    ) {
      errors.push(
        makeError(
          'customFields.salesOrderId',
          'INVALID_FORMAT',
          'La referencia de orden de venta no puede estar vacía cuando se ingresa.'
        )
      );
    }
  }

  if (hasInvoiceType && tipoFactura === 'compra') {
    if (isEmitted && isBlank(custom.centroCosto)) {
      errors.push(
        makeError(
          'customFields.centroCosto',
          'REQUIRED',
          'El centro de costo es obligatorio para emitir una factura de compra: elija Activo o Consumible.'
        )
      );
    }

    if (tipoTercero === 'personal') {
      if (isBlank(custom.periodoLiquidacion)) {
        errors.push(
          makeError(
            'customFields.periodoLiquidacion',
            'REQUIRED',
            'El período de liquidación es obligatorio cuando el tercero es de tipo personal.'
          )
        );
      } else if (!PERIODO_PATTERN.test(String(custom.periodoLiquidacion))) {
        errors.push(
          makeError(
            'customFields.periodoLiquidacion',
            'INVALID_FORMAT',
            'El período de liquidación debe usar el formato AAAA-MM.'
          )
        );
      } else if (
        startValid &&
        String(document.startDate).slice(0, 7) <
          String(custom.periodoLiquidacion)
      ) {
        errors.push(
          makeError(
            'customFields.periodoLiquidacion',
            'PERIODO_AFTER_START',
            'El período de liquidación no puede ser posterior a la fecha de emisión.'
          )
        );
      }
    } else if (
      tipoTercero === 'proveedor' &&
      !isBlank(custom.periodoLiquidacion)
    ) {
      errors.push(
        makeError(
          'customFields.periodoLiquidacion',
          'NOT_APPLICABLE',
          'El período de liquidación no aplica a facturas de compra dirigidas a proveedores.'
        )
      );
    }
  }

  if (status === 'Pagada') {
    const total = toNumber(document.totalAmount);
    if (isBlank(custom.montoPagado)) {
      errors.push(
        makeError(
          'customFields.montoPagado',
          'REQUIRED',
          'El monto pagado es obligatorio para marcar la factura como Pagada.'
        )
      );
    } else {
      const montoPagado = Number(custom.montoPagado);
      if (!Number.isFinite(montoPagado)) {
        errors.push(
          makeError(
            'customFields.montoPagado',
            'INVALID_NUMBER',
            'El monto pagado debe ser un número válido.'
          )
        );
      } else if (Number.isFinite(total) && montoPagado !== total) {
        errors.push(
          makeError(
            'customFields.montoPagado',
            'PAYMENT_AMOUNT_MISMATCH',
            'El monto pagado debe ser igual al monto total; los pagos parciales quedan fuera de esta versión.'
          )
        );
      }
    }
    if (isBlank(custom.fechaPago)) {
      errors.push(
        makeError(
          'customFields.fechaPago',
          'REQUIRED',
          'La fecha de pago es obligatoria para marcar la factura como Pagada.'
        )
      );
    }
  }
}

export function isDuplicateInvoice(documents, document) {
  const tipoFactura = document.customFields
    ? document.customFields.tipoFactura
    : undefined;
  if (!tipoFactura || !isPositiveInteger(document.folio)) return false;
  return (documents || []).some(
    (other) =>
      other &&
      other.document_id !== document.document_id &&
      other.customFields &&
      String(other.customFields.tipoFactura) === String(tipoFactura) &&
      Number(other.folio) === Number(document.folio) &&
      String(other.series ?? '') === String(document.series ?? '')
  );
}

export function allowedNextStatuses(lifecycle, previousStatus) {
  if (!lifecycle) return [];
  if (!previousStatus) return [...lifecycle.statuses];
  const allowed = lifecycle.transitions[previousStatus] || [];
  return lifecycle.statuses.filter(
    (status) => status === previousStatus || allowed.includes(status)
  );
}
