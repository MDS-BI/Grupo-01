import { renderCustomFields, collectCustomFields, showCustomFieldErrors, clearCustomFieldErrors } from './custom-fields.js';
import { getConfig } from '../module-config.js';

function qs(id){ return document.getElementById(id); }

function allowedStatusesFor(currentStatus){
  const lc = getConfig().statusLifecycle;
  if(!lc) return null;
  if(currentStatus === undefined || currentStatus === null || currentStatus === ''){
    return [...lc.statuses];
  }
  const next = lc.transitions[currentStatus] || [];
  return [currentStatus, ...next.filter(s => s !== currentStatus)];
}

export function renderStatusControl(currentStatus){
  const container = qs('document-status-control');
  container.innerHTML = '';
  const allowed = allowedStatusesFor(currentStatus);
  const wrap = document.createElement('div');
  const label = document.createElement('label');
  label.setAttribute('for', 'status');
  label.textContent = 'Status';
  wrap.appendChild(label);
  let control;
  if(allowed){
    control = document.createElement('select');
    control.id = 'status';
    control.name = 'status';
    if(currentStatus === undefined || currentStatus === null || currentStatus === ''){
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '--';
      control.appendChild(blank);
    }
    for(const s of allowed){
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      control.appendChild(opt);
    }
  } else {
    control = document.createElement('input');
    control.id = 'status';
    control.name = 'status';
    control.type = 'text';
    control.placeholder = 'e.g. pending';
  }
  wrap.appendChild(control);
  const err = document.createElement('div');
  err.className = 'error';
  err.id = 'error-status';
  err.setAttribute('aria-live', 'polite');
  wrap.appendChild(err);
  container.appendChild(wrap);
}

export function clearDocumentForm(){
  qs('document-id').value = '';
  qs('reference').value = '';
  qs('startDate').value = '';
  qs('endDate').value = '';
  qs('quantity').value = '';
  qs('totalAmount').value = '';
  qs('currency').value = '';
  clearDocumentErrors();
  renderCustomFields(qs('document-custom-fields'), 'document');
  renderStatusControl('');
  qs('document-cancel-edit').hidden = true;
  qs('document-submit-button').textContent = 'Save Document';
}

export function clearDocumentErrors(){
  ['entityId', 'reference', 'startDate', 'endDate', 'quantity', 'totalAmount', 'status'].forEach(f => {
    const elId = f === 'entityId' ? 'error-document-entity' : `error-${f}`;
    const el = qs(elId);
    if(el) el.textContent = '';
  });
  clearCustomFieldErrors(qs('document-custom-fields'));
}

export function startDocumentEdit(doc){
  renderCustomFields(qs('document-custom-fields'), 'document', doc);
  qs('document-id').value = doc.id;
  qs('document-entity-id').value = doc.entity_id;
  qs('document-entity').value = doc.entity_id;
  qs('reference').value = doc.reference || '';
  qs('startDate').value = doc.startDate || '';
  qs('endDate').value = doc.endDate || '';
  qs('quantity').value = doc.quantity === undefined ? '' : doc.quantity;
  qs('totalAmount').value = doc.totalAmount === undefined ? '' : doc.totalAmount;
  qs('currency').value = doc.currency || '';
  renderStatusControl(doc.status);
  setStatusValue(doc.status);
  clearDocumentErrors();
  qs('document-cancel-edit').hidden = false;
  qs('document-submit-button').textContent = 'Update Document';
}

function setStatusValue(value){
  const control = qs('status');
  if(control) control.value = value || '';
}

export function collectDocumentPayload(){
  return {
    entityId: qs('document-entity-id').value || qs('document-entity').value,
    reference: qs('reference').value,
    startDate: qs('startDate').value,
    endDate: qs('endDate').value,
    quantity: qs('quantity').value,
    totalAmount: qs('totalAmount').value,
    currency: qs('currency').value,
    status: qs('status') ? qs('status').value : '',
    ...collectCustomFields(qs('document-custom-fields'), 'document')
  };
}

export function showDocumentErrors(errors){
  qs('error-document-entity').textContent = errors.entityId || '';
  qs('error-reference').textContent = errors.reference || '';
  qs('error-startDate').textContent = errors.startDate || '';
  qs('error-endDate').textContent = errors.endDate || '';
  qs('error-quantity').textContent = errors.quantity || '';
  qs('error-totalAmount').textContent = errors.totalAmount || '';
  const statusErr = qs('error-status');
  if(statusErr) statusErr.textContent = errors.status || '';
  showCustomFieldErrors(qs('document-custom-fields'), 'document', errors);
}
