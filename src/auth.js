import { ROLES } from './module-config.js';
import { isValidRutChileno } from './validation.js';

export function normalizeRut(input) {
  if (typeof input !== 'string') return null;
  const rut = input.trim().replace(/[.\s]/g, '').toUpperCase();
  return isValidRutChileno(rut) ? rut : null;
}

export function initialPassword(rut) {
  const normalized = normalizeRut(rut);
  if (!normalized) return null;
  const cuerpo = normalized.split('-')[0];
  return cuerpo.slice(0, 4);
}

export function makeError(field, code, message, context) {
  const result = { field, code, message };
  if (context !== undefined) result.context = context;
  return result;
}

export function validateAccessRecord(
  record,
  { entities = [], existing = [] } = {}
) {
  const errors = [];
  const normalized = normalizeRut(record?.accessId);
  const accessId =
    normalized ||
    (typeof record?.accessId === 'string'
      ? record.accessId.trim().toUpperCase()
      : '');

  if (!normalized) {
    errors.push(
      makeError(
        'accessId',
        'RUT_INVALID',
        'El RUT es obligatorio y debe ser válido.'
      )
    );
  }

  const role = record?.role;
  if (!ROLES.includes(role)) {
    errors.push(
      makeError(
        'role',
        'ROLE_INVALID',
        'El rol debe ser administrador, finanzas o trabajador.'
      )
    );
  }

  const password = typeof record?.password === 'string' ? record.password : '';
  const expectedPassword = normalized ? initialPassword(normalized) : null;
  if (!expectedPassword || password !== expectedPassword) {
    errors.push(
      makeError(
        'password',
        'PASSWORD_INVALID',
        'La contraseña debe ser la inicial derivada del RUT (4 dígitos).'
      )
    );
  }

  if (role === 'trabajador') {
    const entityId = record?.entityId || null;
    if (!entityId) {
      errors.push(
        makeError(
          'entityId',
          'ENTITY_REQUIRED',
          'El trabajador requiere un tercero personal.'
        )
      );
      return errors;
    }
    const entity = entities.find((item) => item?.entity_id === entityId);
    if (!entity) {
      errors.push(
        makeError(
          'entityId',
          'ENTITY_NOT_PERSONAL',
          'El tercero personal no existe.'
        )
      );
      return errors;
    }
    const tipoTercero = entity.customFields?.tipoTercero;
    if (tipoTercero !== 'personal') {
      errors.push(
        makeError(
          'entityId',
          'ENTITY_NOT_PERSONAL',
          'El tercero debe ser de tipo personal.'
        )
      );
      return errors;
    }
    const linked = (existing || []).some(
      (item) =>
        item?.entityId === entityId &&
        item?.accessId !== accessId &&
        item?.active
    );
    if (linked) {
      errors.push(
        makeError(
          'entityId',
          'ENTITY_ALREADY_LINKED',
          'Ya existe un acceso activo para ese tercero personal.'
        )
      );
    }
  }

  if ((role === 'administrador' || role === 'finanzas') && record?.entityId) {
    errors.push(
      makeError(
        'entityId',
        'ENTITY_NOT_ALLOWED',
        'Los roles administrador y finanzas no pueden tener un tercero personal asociado.'
      )
    );
  }

  const duplicated = (existing || []).some(
    (item) => item?.accessId === accessId
  );
  if (duplicated) {
    errors.push(
      makeError(
        'accessId',
        'RUT_DUPLICATE',
        'El RUT ya está registrado en otro acceso.'
      )
    );
  }

  return errors;
}

export function authenticate({
  rut,
  password,
  records = [],
  entities = [],
} = {}) {
  const normalized = normalizeRut(rut);
  if (!normalized) {
    return {
      ok: false,
      reason: 'INVALID_RUT',
      message: 'El RUT ingresado no es válido.',
      notifyDeveloper: true,
    };
  }

  const accessList = (records || []).filter(
    (item) => item?.accessId === normalized
  );
  if (accessList.length > 1) {
    return {
      ok: false,
      reason: 'DUPLICATE',
      message: 'El RUT ya está registrado en más de un acceso.',
      notifyDeveloper: true,
    };
  }

  const access = accessList[0];
  if (!access) {
    return {
      ok: false,
      reason: 'NOT_FOUND',
      message: 'El RUT no está registrado.',
      notifyDeveloper: true,
    };
  }

  if (!access.active) {
    return {
      ok: false,
      reason: 'INACTIVE',
      message: 'El acceso está inactivo.',
      notifyDeveloper: true,
    };
  }

  const expectedPassword = initialPassword(normalized);
  if (password !== expectedPassword) {
    return {
      ok: false,
      reason: 'WRONG_PASSWORD',
      message: 'La contraseña es incorrecta.',
      notifyDeveloper: false,
    };
  }

  if (access.role === 'trabajador') {
    const entity = (entities || []).find(
      (item) => item?.entity_id === access.entityId
    );
    const tipoTercero = entity?.customFields?.tipoTercero;
    if (!entity || tipoTercero !== 'personal') {
      return {
        ok: false,
        reason: 'BROKEN_ENTITY_LINK',
        message: 'El acceso no tiene un trabajador asociado válido.',
        notifyDeveloper: true,
      };
    }
  }

  return { ok: true, access };
}
