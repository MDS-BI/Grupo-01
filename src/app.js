import { loadModuleConfig, normalizeConfig, setActiveConfig, labelFor } from './module-config.js';
import { loadEntities, addEntity, updateEntity, deleteEntity, validateEntity, searchEntities, loadDocuments, addDocument, updateDocument, deleteDocument, validateDocument } from './storage.js';
import { clearEntityForm, startEntityEdit, collectEntityPayload, showEntityErrors } from './components/entity-form.js';
import { renderEntityList, createEntityItem } from './components/entity-list.js';
import { clearDocumentForm, startDocumentEdit, collectDocumentPayload, showDocumentErrors } from './components/document-form.js';
import { renderDocumentList } from './components/document-list.js';
import { setupSearchBar, renderSearchResults } from './components/search-bar.js';

function qs(id){ return document.getElementById(id); }

const VIEWS = { welcome: 'view-welcome', manage: 'view-manage', search: 'view-search' };

let wired = false;

function showView(name){
  Object.entries(VIEWS).forEach(([key, id]) => { qs(id).hidden = key !== name; });
  if(name === 'manage'){
    showManageTab('entities');
    refreshManage();
  }
  if(name === 'search') refreshSearch();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showManageTab(tab){
  qs('panel-entities').hidden = tab !== 'entities';
  qs('panel-documents').hidden = tab !== 'documents';
  qs('tab-entities').classList.toggle('active', tab === 'entities');
  qs('tab-documents').classList.toggle('active', tab === 'documents');
  qs('tab-entities').setAttribute('aria-selected', String(tab === 'entities'));
  qs('tab-documents').setAttribute('aria-selected', String(tab === 'documents'));
}

function populateDocumentEntitySelect(){
  const select = qs('document-entity');
  const prev = select.value;
  select.innerHTML = '';
  loadEntities().forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.entity_id;
    opt.textContent = e.name;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function populateEditEntitySelect(){
  const select = qs('edit-entity');
  const prev = select.value;
  select.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = `-- Select an ${labelFor('entity')} --`;
  select.appendChild(none);
  loadEntities().forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.name} — ${e.code}`;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function populateEditDocumentSelect(){
  const select = qs('edit-document');
  const prev = select.value;
  select.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = `-- Select a ${labelFor('document')} --`;
  select.appendChild(none);
  const entities = loadEntities();
  loadDocuments().forEach(d => {
    const entity = entities.find(e => e.entity_id === d.entity_id);
    const label = `${entity ? entity.name : 'Unknown'} · ${d.reference} · ${d.startDate} → ${d.endDate}`;
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = label;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function refreshManage(){
  populateDocumentEntitySelect();
  populateEditEntitySelect();
  populateEditDocumentSelect();
}

function refreshSearch(){
  renderSearchResults(qs('search-results-list'), qs('search-empty'), searchEntities(qs('search-input').value), (e) => createEntityItem(e));
}

function onEditEntityChange(){
  const id = qs('edit-entity').value;
  if(!id){ clearEntityForm(); return; }
  const entity = loadEntities().find(e => e.id === id);
  if(entity) startEntityEdit(entity);
}

function handleDeleteSelectedEntity(){
  const id = qs('edit-entity').value;
  if(!id){ qs('error-edit-entity').textContent = `Select a ${labelFor('entity').toLowerCase()} to delete.`; return; }
  if(!confirm(`Delete this ${labelFor('entity').toLowerCase()}? Its ${labelFor('documents').toLowerCase()} will also be deleted.`)) return;
  deleteEntity(id);
  qs('error-edit-entity').textContent = '';
  clearEntityForm();
  refreshManage();
}

function onEditDocumentChange(){
  const id = qs('edit-document').value;
  if(!id){ clearDocumentForm(); return; }
  const doc = loadDocuments().find(d => d.id === id);
  if(doc) startDocumentEdit(doc);
}

function handleDeleteSelectedDocument(){
  const id = qs('edit-document').value;
  if(!id){ qs('error-edit-document').textContent = `Select a ${labelFor('document').toLowerCase()} to delete.`; return; }
  if(!confirm(`Delete this ${labelFor('document').toLowerCase()}?`)) return;
  deleteDocument(id);
  qs('error-edit-document').textContent = '';
  clearDocumentForm();
  refreshManage();
}

function handleEntitySubmit(ev){
  ev.preventDefault();
  const id = qs('entity-id').value;
  const payload = collectEntityPayload();
  const { valid, errors } = validateEntity(payload);
  showEntityErrors(errors);
  if(!valid) return;
  if(id){
    try{
      updateEntity(id, payload);
      clearEntityForm();
    }catch(e){ alert(e.message); }
  }else{
    addEntity(payload);
    clearEntityForm();
  }
  refreshManage();
}

function handleDocumentSubmit(ev){
  ev.preventDefault();
  const id = qs('document-id').value;
  const payload = collectDocumentPayload();
  const existing = id ? loadDocuments().find(d => d.id === id) : undefined;
  const { valid, errors } = validateDocument(payload, existing ? existing.status : undefined);
  showDocumentErrors(errors);
  if(!valid) return;
  try{
    if(id){
      updateDocument(id, payload);
    }else{
      addDocument(payload);
    }
    clearDocumentForm();
  }catch(e){
    alert(e.message);
    showDocumentErrors({ status: e.message });
  }
  refreshManage();
}

function applyLabels(config){
  document.title = config.moduleName;
  qs('welcome-heading').textContent = config.moduleName;
  qs('welcome-manage').textContent = `Manage ${config.labels.entities} & ${config.labels.documents}`;
  qs('welcome-search').textContent = `Search ${config.labels.entities}`;
  qs('manage-heading').textContent = `Manage ${config.labels.entities} & ${config.labels.documents}`;
  qs('tab-entities').textContent = config.labels.entities;
  qs('tab-documents').textContent = config.labels.documents;
  qs('entity-form-heading').textContent = `Add / Edit ${config.labels.entity}`;
  qs('edit-entity-heading').textContent = `Edit or remove a${/^[aeiou]/i.test(config.labels.entity) ? 'n' : ''} ${config.labels.entity.toLowerCase()}`;
  qs('document-form-heading').textContent = `Add / Edit ${config.labels.document}`;
  qs('edit-document-heading').textContent = `Edit or remove a ${config.labels.document.toLowerCase()}`;
  qs('search-view-heading').textContent = `Search ${config.labels.entities}`;
  qs('search-heading').textContent = `Find a${/^[aeiou]/i.test(config.labels.entity) ? 'n' : ''} ${config.labels.entity.toLowerCase()}`;
  qs('search-input').placeholder = 'Search by name, code, category...';
  qs('search-input').setAttribute('aria-label', `Search ${config.labels.entities.toLowerCase()}`);
  qs('search-empty').textContent = `No ${config.labels.entities.toLowerCase()} match your search.`;
  qs('delete-entity').textContent = `Delete selected ${config.labels.entity.toLowerCase()}`;
  qs('delete-document').textContent = `Delete selected ${config.labels.document.toLowerCase()}`;
}

function showConfigErrors(errors){
  const banner = qs('config-errors');
  if(errors && errors.length > 0){
    banner.textContent = `Module configuration problem: ${errors.join(' ')}`;
    banner.hidden = false;
  } else {
    banner.hidden = true;
    banner.textContent = '';
  }
}

function wireEvents(){
  if(wired) return;
  wired = true;
  qs('entity-form').addEventListener('submit', handleEntitySubmit);
  qs('cancel-edit').addEventListener('click', clearEntityForm);
  qs('document-form').addEventListener('submit', handleDocumentSubmit);
  qs('document-cancel-edit').addEventListener('click', clearDocumentForm);
  qs('welcome-manage').addEventListener('click', () => showView('manage'));
  qs('welcome-search').addEventListener('click', () => showView('search'));
  qs('back-from-search').addEventListener('click', () => showView('welcome'));
  setupSearchBar(qs('search-input'), () => refreshSearch());
  qs('tab-entities').addEventListener('click', () => showManageTab('entities'));
  qs('tab-documents').addEventListener('click', () => showManageTab('documents'));
  qs('tab-home').addEventListener('click', () => showView('welcome'));
  qs('edit-entity').addEventListener('change', onEditEntityChange);
  qs('edit-document').addEventListener('change', onEditDocumentChange);
  qs('delete-entity').addEventListener('click', handleDeleteSelectedEntity);
  qs('delete-document').addEventListener('click', handleDeleteSelectedDocument);
}

export function initApp(resolved){
  showConfigErrors(resolved.errors);
  setActiveConfig(resolved.config);
  applyLabels(resolved.config);
  wireEvents();
  clearEntityForm();
  clearDocumentForm();
  showView('welcome');
}

export async function boot(overrideConfig){
  const resolved = overrideConfig !== undefined ? normalizeConfig(overrideConfig) : await loadModuleConfig();
  initApp(resolved);
}
