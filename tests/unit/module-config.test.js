import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, BASE_FIELDS, FIELD_TYPES, normalizeConfig, loadModuleConfig, setActiveConfig, getConfig, labelFor } from '../../src/module-config.js';

const salesConfig = {
  moduleName: 'Sales',
  labels: { entity: 'Customer', entities: 'Customers', document: 'Sales Order', documents: 'Sales Orders' },
  customFields: [
    { target: 'entity', key: 'creditLimit', label: 'Credit limit', type: 'number', required: true },
    { target: 'document', key: 'paymentTerms', label: 'Payment terms', type: 'select', options: ['net30', 'net60'] }
  ],
  statusLifecycle: {
    statuses: ['quote', 'order', 'invoiced'],
    transitions: { quote: ['order'], order: ['invoiced'], invoiced: [] }
  }
};

describe('module-config', () => {
  it('falls back to built-in defaults when no configuration is provided', () => {
    const { config, errors } = normalizeConfig(null);
    expect(errors).toEqual([]);
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('returns defaults for undefined configuration too', () => {
    const { config, errors } = normalizeConfig(undefined);
    expect(errors).toEqual([]);
    expect(config.moduleName).toBe(DEFAULT_CONFIG.moduleName);
  });

  it('accepts a complete sales-style profile', () => {
    const { config, errors } = normalizeConfig(salesConfig);
    expect(errors).toEqual([]);
    expect(config.moduleName).toBe('Sales');
    expect(config.labels.entity).toBe('Customer');
    expect(config.customFields.length).toBe(2);
    expect(config.statusLifecycle.statuses).toEqual(['quote', 'order', 'invoiced']);
  });

  it('reports an invalid module name instead of failing silently', () => {
    const { errors } = normalizeConfig({ moduleName: '' });
    expect(errors.some(e => e.includes('moduleName'))).toBe(true);
  });

  it('rejects unknown custom field types', () => {
    const { errors } = normalizeConfig({
      customFields: [{ target: 'entity', key: 'x', label: 'X', type: 'floaty' }]
    });
    expect(errors.some(e => e.includes('type'))).toBe(true);
  });

  it('rejects custom field keys colliding with base fields', () => {
    for(const base of BASE_FIELDS.entity){
      const { errors } = normalizeConfig({
        customFields: [{ target: 'entity', key: base, label: 'X', type: 'text' }]
      });
      if(base === 'id'){
        // id is a base field; collision must be reported
        expect(errors.length).toBeGreaterThan(0);
        break;
      }
    }
    const { errors } = normalizeConfig({
      customFields: [{ target: 'entity', key: 'name', label: 'X', type: 'text' }]
    });
    expect(errors.some(e => e.includes('collides'))).toBe(true);
  });

  it('rejects select fields without options', () => {
    const { errors } = normalizeConfig({
      customFields: [{ target: 'document', key: 'terms', label: 'Terms', type: 'select' }]
    });
    expect(errors.some(e => e.includes('options'))).toBe(true);
  });

  it('rejects duplicate custom field keys per target', () => {
    const field = { target: 'entity', key: 'dup', label: 'Dup', type: 'text' };
    const { errors } = normalizeConfig({ customFields: [field, { ...field }] });
    expect(errors.some(e => e.includes('more than once'))).toBe(true);
  });

  it('rejects lifecycle transitions referencing unknown statuses', () => {
    const { errors } = normalizeConfig({
      statusLifecycle: { statuses: ['a'], transitions: { a: ['ghost'] } }
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('keeps unspecified labels at their defaults', () => {
    const { config, errors } = normalizeConfig({ labels: { entity: 'Product' } });
    expect(errors).toEqual([]);
    expect(config.labels.entity).toBe('Product');
    expect(config.labels.documents).toBe(DEFAULT_CONFIG.labels.documents);
  });

  it('treats null lifecycle as free-form status', () => {
    const { config, errors } = normalizeConfig({ statusLifecycle: null });
    expect(errors).toEqual([]);
    expect(config.statusLifecycle).toBeNull();
  });

  it('loadModuleConfig reflects the userConfig slot (null by default)', async () => {
    const { config, errors } = await loadModuleConfig();
    expect(errors).toEqual([]);
    expect(config.moduleName).toBe(DEFAULT_CONFIG.moduleName);
  });

  it('exposes active config and label helpers after setActiveConfig', () => {
    const { config } = normalizeConfig(salesConfig);
    setActiveConfig(config);
    expect(getConfig().moduleName).toBe('Sales');
    expect(labelFor('entity')).toBe('Customer');
    expect(labelFor('documents')).toBe('Sales Orders');
    setActiveConfig(null);
    expect(labelFor('entity')).toBe('Entity');
  });

  it('supports all declared field types', () => {
    expect(FIELD_TYPES).toContain('text');
    expect(FIELD_TYPES).toContain('number');
    expect(FIELD_TYPES).toContain('date');
    expect(FIELD_TYPES).toContain('select');
  });
});
