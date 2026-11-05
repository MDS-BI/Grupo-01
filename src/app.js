import {
  DEFAULT_ACCENT_COLOR,
  normalizeConfig,
  userConfig,
} from './module-config.js';
import { searchEntities } from './search.js';
import {
  addDocument,
  addEntity,
  deleteDocument,
  deleteEntity,
  loadDocuments,
  loadEntities,
  updateDocument,
  updateEntity,
  ValidationFailure,
} from './storage.js';
import { createShell } from './components/shell.js';
import { initDashboard, refreshDashboard } from './components/dashboard.js';
import {
  focusEntityForm,
  initEntityForm,
  resetEntityForm,
  setEntityFormEntity,
  showEntityErrors,
} from './components/entity-form.js';
import {
  focusDocumentForm,
  initDocumentForm,
  resetDocumentForm,
  setDocumentFormDocument,
  setDocumentFormEntities,
  setDocumentFormOptions,
  showDocumentErrors,
} from './components/document-form.js';
import { renderEntityList } from './components/entity-list.js';
import { renderDocumentList } from './components/document-list.js';
import { renderMovementsList } from './components/movements-list.js';
import { renderTrackingView } from './components/tracking.js';
import { loadMovements } from './movements.js';
import { loadDemoData } from './demo-data.js';
import { computeDebtSummary } from './tracking.js';
import { presetDocumentTipoFactura } from './components/document-form.js';
import {
  focusSearchInput,
  initSearchBar,
  renderSearchResults,
} from './components/search-bar.js';

const VIEWS = [
  'dashboard',
  'entities',
  'documents',
  'invoice-sale',
  'invoice-purchase',
  'movements',
  'tracking',
  'search',
];

const state = {
  config: null,
  errors: [],
  currentModule: 'dashboard',
  searchTerm: '',
  shell: null,
};

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function applyTheme(config) {
  const accent = config.theme.accentColor || DEFAULT_ACCENT_COLOR;
  document.documentElement.style.setProperty('--accent-color', accent);
}

function applyLabels(config) {
  const labels = config.labels;
  document.title = config.moduleName;

  setText('entities-title', labels.entities);
  setText('documents-title', labels.documents);
  setText('search-title', labels.search);

  const documentEntityLabel = document.querySelector(
    'label[for="document-entity"]'
  );
  if (documentEntityLabel) documentEntityLabel.textContent = labels.entity;

  const editEntityLabel = document.querySelector('label[for="edit-entity"]');
  if (editEntityLabel)
    editEntityLabel.textContent = `Editar ${labels.entity.toLowerCase()}`;

  const editDocumentLabel = document.querySelector(
    'label[for="edit-document"]'
  );
  if (editDocumentLabel)
    editDocumentLabel.textContent = `Editar ${labels.document.toLowerCase()}`;

  const documentSubmit = document.querySelector(
    '#document-form button[type="submit"]'
  );
  if (documentSubmit)
    documentSubmit.textContent = `Guardar ${labels.document.toLowerCase()}`;
}

function renderConfigBanner(errors) {
  const app = byId('app');
  if (!app) return;
  let banner = byId('config-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'config-banner';
    banner.className = 'config-banner';
    banner.setAttribute('role', 'status');
    app.prepend(banner);
  }
  if (errors.length === 0) {
    banner.hidden = true;
    banner.textContent = '';
    return;
  }
  banner.hidden = false;
  banner.textContent = `Problemas de configuración: ${errors.map((error) => error.message).join(' ')}`;
}

function populateEntitySelect(entities) {
  const select = byId('edit-entity');
  if (!select) return;
  const current = select.value;
  select.textContent = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Seleccione...';
  select.append(placeholder);

  for (const entity of entities) {
    const option = document.createElement('option');
    option.value = entity.entity_id;
    option.textContent = `${entity.name} (${entity.code})`;
    select.append(option);
  }

  if (current && entities.some((entity) => entity.entity_id === current)) {
    select.value = current;
  }
}

function renderDocuments(entities, documents) {
  const filterEntityId = byId('document-entity')
    ? byId('document-entity').value
    : '';
  const filterTipoFactura =
    state.currentModule === 'invoice-sale'
      ? 'venta'
      : state.currentModule === 'invoice-purchase'
        ? 'compra'
        : '';
  renderDocumentList(byId('document-list'), documents, entities, {
    config: state.config,
    filterEntityId,
    filterTipoFactura,
    onEdit: editDocument,
    onDelete: requestDeleteDocument,
  });
}

function refreshMovements() {
  renderMovementsList(byId('movements-list'), loadMovements(), loadEntities());
  const empty = byId('movements-empty');
  if (empty) {
    empty.hidden = loadMovements().length > 0;
  }
  setText('movements-title', 'Movimientos financieros');
}

function refreshTracking() {
  const entities = loadEntities();
  const documents = loadDocuments();
  const { totalPorCobrar, totalPorPagar, vencidas } = computeDebtSummary(
    entities,
    documents
  );
  setText('tracking-cobrar', String(totalPorCobrar));
  setText('tracking-pagar', String(totalPorPagar));
  setText('tracking-vencidas', String(vencidas.length));
  renderTrackingView(byId('tracking-by-entity'), entities, documents);
  const empty = byId('tracking-empty');
  if (empty) {
    empty.hidden = totalPorCobrar + totalPorPagar > 0 || vencidas.length > 0;
  }
}

function refresh() {
  const entities = loadEntities();
  const documents = loadDocuments();

  renderEntityList(byId('entity-list'), entities, {
    config: state.config,
    onEdit: editEntity,
    onDelete: requestDeleteEntity,
  });

  populateEntitySelect(entities);
  setDocumentFormEntities(entities);
  setDocumentFormOptions(documents, entities);
  renderDocuments(entities, documents);
  refreshDashboard();
  refreshMovements();
  refreshTracking();
  updateSearchResults();
}

function updateSearchResults() {
  renderSearchResults(
    byId('search-results'),
    searchEntities(loadEntities(), state.searchTerm, state.config),
    {
      config: state.config,
      emptyElement: byId('search-empty'),
      term: state.searchTerm,
    }
  );
}

const VIEW_ELEMENTS = {
  dashboard: 'dashboard',
  entities: 'entities',
  documents: 'documents',
  'invoice-sale': 'documents',
  'invoice-purchase': 'documents',
  movements: 'movements',
  tracking: 'tracking',
  search: 'search',
};

function showModule(name) {
  if (!VIEWS.includes(name)) return;
  state.currentModule = name;
  const activeView = VIEW_ELEMENTS[name];
  for (const view of [
    'dashboard',
    'entities',
    'documents',
    'search',
    'movements',
    'tracking',
  ]) {
    const element = byId(`view-${view}`);
    if (element) element.hidden = view !== activeView;
  }
  if (state.shell) state.shell.setActive(name);

  if (name === 'dashboard') refreshDashboard();
  if (name === 'entities' || name === 'documents') refresh();
  if (name === 'invoice-sale' || name === 'invoice-purchase') refresh();
  if (name === 'movements') refreshMovements();
  if (name === 'tracking') refreshTracking();
  if (name === 'search') updateSearchResults();
}

function confirmAction(message) {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return window.confirm(message);
  }
  return true;
}

function editEntity(id) {
  const entity = loadEntities().find((item) => item.entity_id === id);
  if (!entity) return;
  showModule('entities');
  setEntityFormEntity(entity);
  focusEntityForm();
}

function requestDeleteEntity(id) {
  const entity = loadEntities().find((item) => item.entity_id === id);
  if (!entity) return;
  const labels = state.config.labels;
  const message = `¿Eliminar ${labels.entity.toLowerCase()} "${entity.name}" y todos sus ${labels.documents.toLowerCase()}?`;
  if (!confirmAction(message)) return;
  deleteEntity(id);
  resetEntityForm();
  refresh();
}

function editDocument(id) {
  const documentRecord = loadDocuments().find(
    (item) => item.document_id === id || item.id === id
  );
  if (!documentRecord) return;
  showModule('documents');
  setDocumentFormEntities(loadEntities());
  setDocumentFormDocument(documentRecord);
  focusDocumentForm();
}

function requestDeleteDocument(id) {
  const documentRecord = loadDocuments().find(
    (item) => item.document_id === id || item.id === id
  );
  if (!documentRecord) return;
  const labels = state.config.labels;
  const message = `¿Eliminar ${labels.document.toLowerCase()} "#${documentRecord.folio ?? ''}"?`;
  if (!confirmAction(message)) return;
  deleteDocument(id);
  resetDocumentForm();
  refresh();
}

function handleEntitySubmit(values, editingId) {
  try {
    if (editingId) {
      updateEntity(editingId, values, state.config);
    } else {
      addEntity(values, state.config);
    }
    resetEntityForm();
    refresh();
  } catch (error) {
    if (error instanceof ValidationFailure) {
      showEntityErrors(error.errors);
    } else {
      throw error;
    }
  }
}

function handleDocumentSubmit(values, editingId) {
  try {
    if (editingId) {
      updateDocument(editingId, values, state.config);
    } else {
      addDocument(values, state.config);
    }
    resetDocumentForm();
    refresh();
  } catch (error) {
    if (error instanceof ValidationFailure) {
      showDocumentErrors(error.errors);
    } else {
      throw error;
    }
  }
}

function handleQuickAction(action) {
  if (action === 'new-entity') {
    showModule('entities');
    resetEntityForm();
    focusEntityForm();
  } else if (action === 'new-document') {
    showModule('documents');
    resetDocumentForm();
    focusDocumentForm();
  } else if (action === 'new-invoice-sale') {
    showModule('documents');
    resetDocumentForm();
    presetDocumentTipoFactura('venta');
    focusDocumentForm();
  } else if (action === 'new-invoice-purchase') {
    showModule('documents');
    resetDocumentForm();
    presetDocumentTipoFactura('compra');
    focusDocumentForm();
  } else if (action === 'tracking') {
    showModule('tracking');
  } else if (action === 'manage-entities') {
    showModule('entities');
  } else if (action === 'search') {
    showModule('search');
    focusSearchInput();
  }
}

function handleSearch(term) {
  state.searchTerm = term;
  updateSearchResults();
}

function handleLoadDemoData() {
  if (
    !confirmAction(
      '¿Cargar los datos de demostración ficticios? El módulo debe estar vacío; si ya tiene registros, no se modificará nada.'
    )
  ) {
    return;
  }
  const result = loadDemoData(state.config);
  const status = byId('demo-status');
  if (status) {
    status.textContent = result.ok
      ? 'Datos de demostración cargados correctamente.'
      : result.message;
    status.hidden = false;
  }
  refresh();
  showModule('dashboard');
}

function bindManagementControls() {
  const loadEntity = byId('load-entity');
  if (loadEntity) {
    loadEntity.onclick = () => {
      const id = byId('edit-entity') ? byId('edit-entity').value : '';
      if (id) editEntity(id);
    };
  }

  const deleteEntityButton = byId('delete-entity');
  if (deleteEntityButton) {
    deleteEntityButton.onclick = () => {
      const id = byId('edit-entity') ? byId('edit-entity').value : '';
      if (id) requestDeleteEntity(id);
    };
  }

  const loadDocument = byId('load-document');
  if (loadDocument) {
    loadDocument.onclick = () => {
      const id = byId('edit-document') ? byId('edit-document').value : '';
      if (id) editDocument(id);
    };
  }

  const deleteDocumentButton = byId('delete-document');
  if (deleteDocumentButton) {
    deleteDocumentButton.onclick = () => {
      const id = byId('edit-document') ? byId('edit-document').value : '';
      if (id) requestDeleteDocument(id);
    };
  }

  const documentEntity = byId('document-entity');
  if (documentEntity) {
    documentEntity.onchange = () =>
      renderDocuments(loadEntities(), loadDocuments());
  }
}

export function initApp(rawConfig = userConfig) {
  const { config, errors } = normalizeConfig(rawConfig);
  state.config = config;
  state.errors = errors;
  state.currentModule = 'dashboard';
  state.searchTerm = '';

  applyTheme(config);
  applyLabels(config);

  state.shell = createShell({ config, onNavigate: showModule });
  initDashboard({
    config,
    onAction: handleQuickAction,
    onLoadDemoData: handleLoadDemoData,
  });
  initEntityForm({ config, onSubmit: handleEntitySubmit });
  initDocumentForm({ config, onSubmit: handleDocumentSubmit });
  initSearchBar({ config, onSearch: handleSearch });
  bindManagementControls();

  renderConfigBanner(errors);
  resetEntityForm();
  resetDocumentForm();
  refresh();
  showModule('dashboard');

  return { config, errors };
}

export { state as appState };
