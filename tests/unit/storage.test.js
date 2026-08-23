import { describe, it, expect, beforeEach } from 'vitest';
import { clearAll, loadEntities, addEntity, updateEntity, deleteEntity, validateEntity, searchEntities, loadDocuments, addDocument, updateDocument, deleteDocument, deleteDocumentsForEntity, validateDocument } from '../../src/storage.js';
import { setActiveConfig } from '../../src/module-config.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

beforeEach(() => {
  store.clear();
  setActiveConfig(null);
});

describe('entity storage', () => {
  it('validates entity name and code', () => {
    expect(validateEntity({name:'', code:''}).valid).toBe(false);
    expect(validateEntity({name:'Acme', code:''}).valid).toBe(false);
    expect(validateEntity({name:'A', code:'B'}).valid).toBe(true);
  });

  it('adds and loads entities', () => {
    const e = addEntity({name:'Acme', code:'AC-001'});
    const all = loadEntities();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(e.id);
  });

  it('generates a unique entity_id for each entity', () => {
    const e1 = addEntity({name:'Acme', code:'AC-001'});
    const e2 = addEntity({name:'Globex', code:'GL-002'});
    expect(e1.entity_id).toBeDefined();
    expect(e1.entity_id).not.toBe(e2.entity_id);
    expect(loadEntities()[0].entity_id).toBe(e1.entity_id);
  });

  it('updates an entity', () => {
    const e = addEntity({name:'X', code:'X-1'});
    const updated = updateEntity(e.id, { name: 'X2' });
    expect(updated.name).toBe('X2');
  });

  it('deletes an entity', () => {
    const e1 = addEntity({name:'A', code:'A-1'});
    const e2 = addEntity({name:'C', code:'C-1'});
    deleteEntity(e1.id);
    const all = loadEntities();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(e2.id);
  });

  it('accepts a valid target date', () => {
    const res = validateEntity({name:'A', code:'B', targetDate:'2026-08-06'});
    expect(res.valid).toBe(true);
  });

  it('rejects an invalid target date', () => {
    const res = validateEntity({name:'A', code:'B', targetDate:'2026-13-45'});
    expect(res.valid).toBe(false);
    expect(res.errors.targetDate).toBeDefined();
  });

  it('allows an empty target date', () => {
    const res = validateEntity({name:'A', code:'B', targetDate:''});
    expect(res.valid).toBe(true);
  });

  it('persists target date on create and update', () => {
    const e = addEntity({name:'Acme', code:'AC-001', targetDate:'2026-09-01'});
    expect(loadEntities()[0].targetDate).toBe('2026-09-01');
    const updated = updateEntity(e.id, { targetDate:'2026-10-01' });
    expect(updated.targetDate).toBe('2026-10-01');
  });

  it('searches by target date', () => {
    addEntity({name:'Acme', code:'AC-001', targetDate:'2026-09-01'});
    addEntity({name:'Globex', code:'GL-002', targetDate:'2026-11-20'});
    const results = searchEntities('2026-09-01');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Acme');
  });

  it('validates required custom fields declared in configuration', () => {
    setActiveConfig({
      customFields: [{ target: 'entity', key: 'creditLimit', label: 'Credit limit', type: 'number', required: true }]
    });
    const res = validateEntity({name:'A', code:'B'});
    expect(res.valid).toBe(false);
    expect(res.errors.creditLimit).toContain('required');
    expect(validateEntity({name:'A', code:'B', creditLimit: 500}).valid).toBe(true);
  });

  it('rejects non-numeric values for number custom fields', () => {
    setActiveConfig({
      customFields: [{ target: 'entity', key: 'creditLimit', label: 'Credit limit', type: 'number' }]
    });
    const res = validateEntity({name:'A', code:'B', creditLimit: 'lots'});
    expect(res.valid).toBe(false);
    expect(res.errors.creditLimit).toContain('number');
  });

  it('persists custom field values alongside base fields without schema changes', () => {
    setActiveConfig({
      customFields: [{ target: 'entity', key: 'region', label: 'Region', type: 'text' }]
    });
    const e = addEntity({name:'Acme', code:'AC-001', region:'EMEA'});
    expect(loadEntities()[0].region).toBe('EMEA');
    const updated = updateEntity(e.id, { region: 'APAC' });
    expect(updated.region).toBe('APAC');
    expect(updated.name).toBe('Acme');
  });

  it('includes custom field values in search results', () => {
    setActiveConfig({
      customFields: [{ target: 'entity', key: 'region', label: 'Region', type: 'text' }]
    });
    addEntity({name:'Acme', code:'AC-001', region:'EMEA'});
    addEntity({name:'Globex', code:'GL-002', region:'APAC'});
    const results = searchEntities('emea');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Acme');
  });

  it('ignores undeclared custom keys when persisting', () => {
    const e = addEntity({name:'Acme', code:'AC-001', rogueField:'x'});
    expect(e.rogueField).toBeUndefined();
  });
});

describe('document storage', () => {
  let entity;
  beforeEach(() => {
    entity = addEntity({name:'Acme', code:'AC-001'});
  });

  it('validates a document against base rules', () => {
    const base = { entityId:entity.entity_id, reference:'SO-1', startDate:'2026-08-01', endDate:'2026-08-05' };
    expect(validateDocument(base).valid).toBe(true);
    expect(validateDocument({...base, entityId:'missing'}).valid).toBe(false);
    expect(validateDocument({...base, reference:''}).valid).toBe(false);
    expect(validateDocument({...base, endDate:'2026-08-01', startDate:'2026-08-05'}).valid).toBe(false);
    expect(validateDocument({...base, quantity:0}).valid).toBe(false);
    expect(validateDocument({...base, quantity:2.5}).valid).toBe(false);
    expect(validateDocument({...base, quantity:3}).valid).toBe(true);
    expect(validateDocument({...base, totalAmount:-1}).valid).toBe(false);
    expect(validateDocument({...base, totalAmount:99.5}).valid).toBe(true);
  });

  it('adds and loads documents linked by entity_id', () => {
    const d = addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05', quantity:2, totalAmount:500, currency:'EUR', status:'pending'});
    const all = loadDocuments();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(d.id);
    expect(all[0].entity_id).toBe(entity.entity_id);
    expect(all[0].quantity).toBe(2);
    expect(all[0].totalAmount).toBe(500);
  });

  it('updates a document', () => {
    const d = addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05'});
    const updated = updateDocument(d.id, { reference: 'REF-2' });
    expect(updated.reference).toBe('REF-2');
  });

  it('deletes a document', () => {
    const d1 = addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05'});
    const d2 = addDocument({entityId:entity.entity_id, reference:'REF-2', startDate:'2026-08-02', endDate:'2026-08-06'});
    deleteDocument(d1.id);
    const all = loadDocuments();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(d2.id);
  });

  it('deletes documents for an entity', () => {
    const other = addEntity({name:'Globex', code:'GL-002'});
    addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05'});
    addDocument({entityId:entity.entity_id, reference:'REF-2', startDate:'2026-08-02', endDate:'2026-08-06'});
    addDocument({entityId:other.entity_id, reference:'REF-3', startDate:'2026-08-03', endDate:'2026-08-07'});
    deleteDocumentsForEntity(entity.entity_id);
    const all = loadDocuments();
    expect(all.length).toBe(1);
    expect(all[0].entity_id).toBe(other.entity_id);
  });

  it('cascades document deletion when an entity is deleted', () => {
    const other = addEntity({name:'Globex', code:'GL-002'});
    addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05'});
    addDocument({entityId:other.entity_id, reference:'REF-2', startDate:'2026-08-02', endDate:'2026-08-06'});
    deleteEntity(entity.id);
    const docs = loadDocuments();
    expect(docs.length).toBe(1);
    expect(docs[0].entity_id).toBe(other.entity_id);
  });

  it('persists declared document custom fields', () => {
    setActiveConfig({
      customFields: [{ target: 'document', key: 'paymentTerms', label: 'Payment terms', type: 'select', options: ['net30','net60'] }]
    });
    const d = addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05', paymentTerms:'net30'});
    expect(loadDocuments()[0].paymentTerms).toBe('net30');
    expect(validateDocument({entityId:entity.entity_id, reference:'R', startDate:'2026-08-01', endDate:'2026-08-05', paymentTerms:'net90'}).errors.paymentTerms).toContain('must be one of');
  });
});

describe('document status lifecycle', () => {
  let entity;
  beforeEach(() => {
    entity = addEntity({name:'Acme', code:'AC-001'});
  });

  it('keeps status free-form when no lifecycle is configured', () => {
    const d = addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05', status:'whatever'});
    expect(loadDocuments()[0].status).toBe('whatever');
    const updated = updateDocument(d.id, { status: 'anything else' });
    expect(updated.status).toBe('anything else');
  });

  it('rejects unknown statuses on creation when a lifecycle is configured', () => {
    setActiveConfig({
      statusLifecycle: { statuses:['quote','order','invoiced'], transitions:{ quote:['order'], order:['invoiced'], invoiced:[] } }
    });
    const res = validateDocument({entityId:entity.entity_id, reference:'R', startDate:'2026-08-01', endDate:'2026-08-05', status:'bogus'});
    expect(res.valid).toBe(false);
    expect(res.errors.status).toContain('must be one of');
  });

  it('allows any configured status on creation', () => {
    setActiveConfig({
      statusLifecycle: { statuses:['quote','order','invoiced'], transitions:{ quote:['order'], order:['invoiced'], invoiced:[] } }
    });
    const d = addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05', status:'order'});
    expect(loadDocuments()[0].status).toBe('order');
  });

  it('enforces permitted transitions on update regardless of how a change is submitted', () => {
    setActiveConfig({
      statusLifecycle: { statuses:['quote','order','invoiced'], transitions:{ quote:['order'], order:['invoiced'], invoiced:[] } }
    });
    const d = addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05', status:'quote'});
    expect(() => updateDocument(d.id, { status: 'invoiced' })).toThrow(/Invalid status transition/);
    expect(loadDocuments()[0].status).toBe('quote');
    const updated = updateDocument(d.id, { status: 'order' });
    expect(updated.status).toBe('order');
    expect(updateDocument(d.id, { status: 'invoiced' }).status).toBe('invoiced');
  });

  it('allows keeping the same status on update', () => {
    setActiveConfig({
      statusLifecycle: { statuses:['draft'], transitions:{ draft: [] } }
    });
    const d = addDocument({entityId:entity.entity_id, reference:'REF-1', startDate:'2026-08-01', endDate:'2026-08-05', status:'draft'});
    expect(updateDocument(d.id, { reference: 'REF-1b' }).status).toBe('draft');
  });
});

describe('clearAll', () => {
  it('empties both stores', () => {
    const e = addEntity({name:'A', code:'A-1'});
    addDocument({entityId:e.entity_id, reference:'R', startDate:'2026-08-01', endDate:'2026-08-02'});
    clearAll();
    expect(loadEntities().length).toBe(0);
    expect(loadDocuments().length).toBe(0);
  });
});
