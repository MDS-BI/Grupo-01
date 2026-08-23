// ============================================================================
// Module Configuration — edit `userConfig` below to tailor this base module
// into a specific ERP module (e.g., Sales). No other file needs to change.
// ============================================================================

// Set to null to run with built-in defaults, or provide an object such as:
// {
//   moduleName: 'Sales',
//   labels: { entity: 'Customer', entities: 'Customers', document: 'Sales Order', documents: 'Sales Orders' },
//   customFields: [
//     { target: 'entity', key: 'creditLimit', label: 'Credit limit', type: 'number', required: true },
//     { target: 'document', key: 'paymentTerms', label: 'Payment terms', type: 'select', options: ['net30', 'net60'] }
//   ],
//   statusLifecycle: {
//     statuses: ['quote', 'order', 'invoiced'],
//     transitions: { quote: ['order'], order: ['invoiced'], invoiced: [] }
//   }
// }
export const userConfig = null;

// ---------------------------------------------------------------------------
// Core loader — you should not need to modify anything below this line.
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG = Object.freeze({
  moduleName: 'ERP Base Module',
  labels: Object.freeze({
    entity: 'Entity',
    entities: 'Entities',
    document: 'Document',
    documents: 'Documents'
  }),
  customFields: Object.freeze([]),
  statusLifecycle: null
});

export const FIELD_TYPES = ['text', 'number', 'date', 'select'];

export const BASE_FIELDS = Object.freeze({
  entity: Object.freeze(['id', 'entity_id', 'name', 'code', 'category', 'description', 'targetDate', 'createdAt', 'updatedAt']),
  document: Object.freeze(['id', 'entity_id', 'reference', 'startDate', 'endDate', 'quantity', 'totalAmount', 'currency', 'status', 'createdAt', 'updatedAt'])
});

function isNonEmptyString(v){ return typeof v === 'string' && v.trim().length > 0; }

function validateCustomFields(raw, errors){
  const seen = { entity: new Set(), document: new Set() };
  if(!Array.isArray(raw)) { errors.push('customFields must be an array'); return []; }
  const clean = [];
  raw.forEach((f, i) => {
    const where = `customFields[${i}]`;
    if(!f || typeof f !== 'object'){ errors.push(`${where} must be an object`); return; }
    if(f.target !== 'entity' && f.target !== 'document'){ errors.push(`${where}.target must be "entity" or "document"`); return; }
    if(!isNonEmptyString(f.key)){ errors.push(`${where}.key must be a non-empty string`); return; }
    if(BASE_FIELDS[f.target].includes(f.key)){ errors.push(`${where}.key "${f.key}" collides with a base ${f.target} field`); return; }
    if(seen[f.target].has(f.key)){ errors.push(`${where}.key "${f.key}" is declared more than once`); return; }
    if(!FIELD_TYPES.includes(f.type)){ errors.push(`${where}.type must be one of: ${FIELD_TYPES.join(', ')}`); return; }
    if(f.type === 'select' && !(Array.isArray(f.options) && f.options.length > 0)){ errors.push(`${where}.options must be a non-empty array for select fields`); return; }
    seen[f.target].add(f.key);
    clean.push({ target: f.target, key: f.key, label: isNonEmptyString(f.label) ? f.label : f.key, type: f.type, required: Boolean(f.required), options: Array.isArray(f.options) ? [...f.options] : undefined });
  });
  return clean;
}

function validateLifecycle(raw, errors){
  if(raw === null || raw === undefined) return null;
  if(typeof raw !== 'object' || !Array.isArray(raw.statuses) || raw.statuses.length === 0 || !raw.statuses.every(isNonEmptyString)){
    errors.push('statusLifecycle.statuses must be a non-empty array of status names');
    return null;
  }
  const statuses = new Set(raw.statuses);
  const transitions = {};
  if(raw.transitions !== undefined && (typeof raw.transitions !== 'object' || raw.transitions === null)){
    errors.push('statusLifecycle.transitions must be an object mapping status -> array of next statuses');
    return null;
  }
  const source = raw.transitions || {};
  for(const [from, toList] of Object.entries(source)){
    if(!statuses.has(from)){ errors.push(`statusLifecycle.transitions references unknown status "${from}"`); return null; }
    if(!Array.isArray(toList) || !toList.every((s) => statuses.has(s))){ errors.push(`statusLifecycle.transitions["${from}"] must list known statuses`); return null; }
    transitions[from] = [...toList];
  }
  return { statuses: [...raw.statuses], transitions };
}

export function normalizeConfig(raw){
  if(raw === null || raw === undefined){
    return { config: structuredClone(DEFAULT_CONFIG), errors: [] };
  }
  if(typeof raw !== 'object'){
    return { config: structuredClone(DEFAULT_CONFIG), errors: ['Module configuration must be an object'] };
  }
  const errors = [];
  const cfg = structuredClone(DEFAULT_CONFIG);
  if(raw.moduleName !== undefined){
    if(!isNonEmptyString(raw.moduleName)) errors.push('moduleName must be a non-empty string');
    else cfg.moduleName = raw.moduleName.trim();
  }
  if(raw.labels !== undefined){
    if(typeof raw.labels !== 'object' || raw.labels === null) errors.push('labels must be an object');
    else {
      for(const key of ['entity', 'entities', 'document', 'documents']){
        if(raw.labels[key] === undefined) continue;
        if(!isNonEmptyString(raw.labels[key])){ errors.push(`labels.${key} must be a non-empty string`); continue; }
        cfg.labels[key] = raw.labels[key].trim();
      }
    }
  }
  if(raw.customFields !== undefined && raw.customFields !== null){
    cfg.customFields = validateCustomFields(raw.customFields, errors);
  }
  if(raw.statusLifecycle !== undefined){
    const lc = validateLifecycle(raw.statusLifecycle, errors);
    if(lc) cfg.statusLifecycle = lc;
  }
  return { config: cfg, errors };
}

let activeConfig = structuredClone(DEFAULT_CONFIG);

export function setActiveConfig(config){
  activeConfig = normalizeConfig(config).config;
}

export function getConfig(){
  return activeConfig;
}

export function labelFor(kind){
  return activeConfig.labels[kind] || DEFAULT_CONFIG.labels[kind];
}

export async function loadModuleConfig(){
  const { config, errors } = normalizeConfig(userConfig);
  return { config, errors };
}
