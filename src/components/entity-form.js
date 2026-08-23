import { renderCustomFields, collectCustomFields, showCustomFieldErrors, clearCustomFieldErrors } from './custom-fields.js';

function qs(id){ return document.getElementById(id); }

export function clearEntityForm(){
  qs('entity-id').value = '';
  qs('name').value = '';
  qs('code').value = '';
  qs('category').value = '';
  qs('description').value = '';
  qs('targetDate').value = '';
  clearEntityErrors();
  renderCustomFields(qs('entity-custom-fields'), 'entity');
  qs('cancel-edit').hidden = true;
  qs('submit-button').textContent = 'Save';
}

export function clearEntityErrors(){
  ['name', 'code', 'targetDate'].forEach(f => { qs(`error-${f}`).textContent = ''; });
  clearCustomFieldErrors(qs('entity-custom-fields'));
}

export function startEntityEdit(entity){
  renderCustomFields(qs('entity-custom-fields'), 'entity', entity);
  qs('entity-id').value = entity.id;
  qs('name').value = entity.name || '';
  qs('code').value = entity.code || '';
  qs('category').value = entity.category || '';
  qs('description').value = entity.description || '';
  qs('targetDate').value = entity.targetDate || '';
  clearEntityErrors();
  qs('cancel-edit').hidden = false;
  qs('submit-button').textContent = 'Update';
}

export function collectEntityPayload(){
  return {
    name: qs('name').value,
    code: qs('code').value,
    category: qs('category').value,
    description: qs('description').value,
    targetDate: qs('targetDate').value,
    ...collectCustomFields(qs('entity-custom-fields'), 'entity')
  };
}

export function showEntityErrors(errors){
  qs('error-name').textContent = errors.name || '';
  qs('error-code').textContent = errors.code || '';
  qs('error-targetDate').textContent = errors.targetDate || '';
  showCustomFieldErrors(qs('entity-custom-fields'), 'entity', errors);
}
