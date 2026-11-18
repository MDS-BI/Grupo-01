import {
  DEFAULT_ACCENT_COLOR,
  getInvoiceView,
  INVOICE_VIEWS,
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
import {
  initDashboard,
  refreshDashboard,
  setDashboardSession,
} from './components/dashboard.js';
import {
  focusEntityForm,
  initEntityForm,
  resetEntityForm,
  setEntityFormEntity,
  showEntityErrors,
} from './components/entity-form.js';
import { createSaleForm } from './components/invoice-sale-form.js';
import { createPurchaseForm } from './components/invoice-purchase-form.js';
import { renderEntityList } from './components/entity-list.js';
import { renderSaleList } from './components/invoice-sale-list.js';
import { renderPurchaseList } from './components/invoice-purchase-list.js';
import { renderMovementsList } from './components/movements-list.js';
import { renderTrackingView } from './components/tracking.js';
import { renderCashflowView } from './components/cashflow.js';
import { initLogin } from './components/login.js';
import { initAccessAdmin } from './components/access-admin.js';
import { renderInvoiceStatusNotice } from './components/invoice-status-notice.js';
import { refreshPayrollWorker } from './components/payroll-worker.js';
import { renderPayrollList } from './components/payroll-list.js';
import { initPayrollForm } from './components/payroll-form.js';
import { initDevNotifications } from './components/dev-notifications.js';
import { resolveAdminSettlements } from './payroll.js';
import { loadMovements } from './movements.js';
import { loadDemoData } from './demo-data.js';
import { computeDebtSummary } from './tracking.js';
import {
  focusSearchInput,
  initSearchBar,
  renderSearchResults,
} from './components/search-bar.js';
import {
  loadAccessRecords,
  appendDevNotification,
  createAccessRecord,
} from './access-storage.js';
import {
  loadPurchaseInvoices,
  loadUnclassifiedDocuments,
  migrateLegacyDocuments,
} from './storage.js';
import {
  isSessionValid,
  loadSession,
  clearSession,
  saveSession,
  createGuestSession,
  isGuestSession,
} from './session.js';
import { initialPassword } from './auth.js';

const VIEWS = [
  'login',
  'dashboard',
  'entities',
  ...Object.values(INVOICE_VIEWS).map(({ module }) => module),
  'payroll-admin',
  'access',
  'dev-notifications',
  'payroll-worker',
  'movements',
  'cashflow',
  'tracking',
  'search',
];

const ACCESS_MATRIX = {
  login: { administrador: true, trabajador: true, invitado: true },
  dashboard: { administrador: true, trabajador: false, invitado: true },
  entities: { administrador: true, trabajador: false, invitado: true },
  'invoice-sale': { administrador: true, trabajador: false, invitado: true },
  'invoice-purchase': {
    administrador: true,
    trabajador: false,
    invitado: true,
  },
  'payroll-admin': { administrador: true, trabajador: false, invitado: false },
  access: { administrador: true, trabajador: false, invitado: false },
  'dev-notifications': {
    administrador: true,
    trabajador: false,
    invitado: false,
  },
  movements: { administrador: true, trabajador: false, invitado: true },
  cashflow: { administrador: true, trabajador: false, invitado: true },
  tracking: { administrador: true, trabajador: false, invitado: true },
  search: { administrador: true, trabajador: false, invitado: true },
  'payroll-worker': { administrador: false, trabajador: true, invitado: false },
};

export function canAccess(view, session) {
  const allowed = ACCESS_MATRIX[view];
  if (!allowed) return false;
  if (session?.role === 'trabajador') return allowed.trabajador === true;
  if (session?.role === 'administrador') return allowed.administrador === true;
  if (isGuestSession(session)) return allowed.invitado === true;
  return view === 'login';
}

export function resolveRoute(view, session) {
  if (canAccess(view, session)) return view;
  if (session?.role === 'trabajador') return 'payroll-worker';
  if (isGuestSession(session)) return 'dashboard';
  if (session?.role === 'administrador' && view === 'payroll-worker') {
    return 'payroll-admin';
  }
  return 'login';
}

const invoiceComponents = {
  venta: { createForm: createSaleForm, renderList: renderSaleList },
  compra: { createForm: createPurchaseForm, renderList: renderPurchaseList },
};

const state = {
  config: null,
  errors: [],
  currentModule: 'dashboard',
  searchTerm: '',
  shell: null,
  invoiceForms: {},
  session: null,
  accessAdmin: null,
  login: null,
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
  setText('search-title', labels.search);

  for (const { module, label } of Object.values(INVOICE_VIEWS)) {
    setText(`${module}-title`, `${labels.documents} de ${label}`);
    setText(
      `${module}-list-title`,
      `Registro de ${labels.documents.toLowerCase()}`
    );
  }

  const editEntityLabel = document.querySelector('label[for="edit-entity"]');
  if (editEntityLabel)
    editEntityLabel.textContent = `Editar ${labels.entity.toLowerCase()}`;
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

function renderInvoices(tipoFactura, entities, documents) {
  const { module } = getInvoiceView(tipoFactura);
  const names = new Map(
    entities.map(({ entity_id, name }) => [entity_id, name])
  );
  const form = state.invoiceForms[tipoFactura];
  if (!form) return;
  form.setOptions(documents, names);
  invoiceComponents[tipoFactura].renderList(
    byId(`${module}-list`),
    documents,
    names,
    {
      filterEntityId: form.getFilter(),
      onEdit: editDocument,
      onDelete: requestDeleteDocument,
    }
  );
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

function refreshCashflow() {
  renderCashflowView(byId('cashflow-content'));
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
  for (const [tipoFactura, form] of Object.entries(state.invoiceForms)) {
    if (
      form.getEditingId() &&
      !documents.some(({ document_id }) => document_id === form.getEditingId())
    )
      form.reset();
    form.setEntities(entities);
    renderInvoices(tipoFactura, entities, documents);
  }
  refreshDashboard();
  refreshMovements();
  refreshCashflow();
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

function applySession(session) {
  state.session = session;
  state.shell = createShell({
    config: state.config,
    session,
    onNavigate: showModule,
    onLogout: handleLogout,
    onLogin: showLogin,
  });
}

function showLogin() {
  if (isGuestSession(state.session)) {
    clearSession();
    applySession(null);
  }
  showModule('login');
  state.login?.reset();
}

function handleLogout() {
  if (state.accessDirty || state.payrollDirty) {
    const confirmed = confirmAction(
      'Hay cambios sin guardar. ¿Deseas cerrar sesión de todos modos?'
    );
    if (!confirmed) return;
  }
  clearSession();
  applySession(null);
  state.accessDirty = false;
  state.payrollDirty = false;
  showModule('login');
  state.login?.reset();
}

function refreshPayrollAdmin() {
  const entities = loadEntities();
  const filters = {
    worker: byId('payroll-filter-worker')?.value || '',
    period: byId('payroll-filter-period')?.value || '',
  };
  const settlements = resolveAdminSettlements({
    purchaseInvoices: loadPurchaseInvoices(),
    entities,
    filters,
  });
  const empty = byId('payroll-admin-empty');
  if (empty) empty.hidden = settlements.length > 0;
  renderPayrollList(byId('payroll-admin-list'), {
    settlements,
    entities,
    records: loadAccessRecords(),
    onEdit: editPayrollSettlement,
    onAssociate: associatePayrollAccess,
  });
}

function editPayrollSettlement(id) {
  const settlement = loadPurchaseInvoices().find(
    (document) => document.document_id === id
  );
  if (!settlement || !payrollForm) return;
  payrollForm.setDocument(settlement);
}

function associatePayrollAccess(id) {
  const settlement = loadPurchaseInvoices().find(
    (document) => document.document_id === id
  );
  const entity = loadEntities().find(
    (item) => item.entity_id === settlement?.entity_id
  );
  if (!entity || entity.customFields?.tipoTercero !== 'personal') return;
  const records = loadAccessRecords();
  if (records.some((item) => item.active && item.entityId === entity.entity_id))
    return;
  const rut = entity.taxId;
  try {
    createAccessRecord(
      {
        accessId: rut,
        role: 'trabajador',
        entityId: entity.entity_id,
        password: initialPassword(rut),
      },
      { entities: [entity], records }
    );
    refreshPayrollAdmin();
  } catch (error) {
    if (error instanceof ValidationFailure) {
      const errors = byId('payroll-form-errors');
      if (errors)
        errors.textContent = error.errors.map((item) => item.message).join(' ');
    }
  }
}

function handlePayrollSave(id, values, previous) {
  const customFields = {
    ...(previous.customFields || {}),
    tipoFactura: 'compra',
  };
  for (const key of [
    'periodoLiquidacion',
    'centroCosto',
    'montoPagado',
    'fechaPago',
  ]) {
    if (values[key] === '') delete customFields[key];
    else customFields[key] = values[key];
  }
  try {
    updateDocument(
      id,
      {
        totalAmount: values.totalAmount,
        status: values.status,
        startDate: values.startDate,
        endDate: values.endDate,
        customFields,
      },
      state.config
    );
    refreshPayrollAdmin();
    const feedback = document.querySelector(
      '#payroll-form [data-invoice-feedback]'
    );
    if (feedback) feedback.textContent = 'Cambios guardados.';
  } catch (error) {
    if (error instanceof ValidationFailure) {
      payrollForm?.showErrors(error.errors);
    } else {
      throw error;
    }
  }
}

function showModule(name) {
  const target = resolveRoute(name, state.session);
  if (!VIEWS.includes(target)) return;
  state.currentModule = target;
  const isLogin = target === 'login';
  byId('app').classList.toggle('login-screen', isLogin);
  byId('sidebar').hidden = isLogin;
  for (const view of VIEWS) {
    const element = byId(`view-${view}`);
    if (element) element.hidden = view !== target;
  }
  if (state.shell) state.shell.setActive(target);

  if (target === 'dashboard') {
    setDashboardSession(state.session);
    refreshDashboard();
  }
  if (target === 'entities' || target.startsWith('invoice-')) refresh();
  if (target === 'movements') refreshMovements();
  if (target === 'cashflow') refreshCashflow();
  if (target === 'tracking') refreshTracking();
  if (target === 'search') updateSearchResults();
  if (target === 'payroll-worker') refreshWorkerView();
  if (target === 'payroll-admin') refreshPayrollAdmin();
  if (target === 'dev-notifications') devNotifications?.render();
}

function refreshWorkerView() {
  const entities = loadEntities();
  const entity = entities.find(
    (item) => item?.entity_id === state.session?.entityId
  );
  if (!entity || entity.customFields?.tipoTercero !== 'personal') {
    appendDevNotification({
      accessId: state.session?.accessId || '',
      role: state.session?.role || 'desconocido',
      reason: 'BROKEN_ENTITY_LINK',
      origin: 'payroll',
    });
    clearSession();
    applySession(null);
    showModule('login');
    const loginError = document.getElementById('login-error');
    if (loginError) {
      loginError.textContent =
        'El acceso no tiene un trabajador asociado válido. Contacta al administrador.';
      loginError.hidden = false;
    }
    return null;
  }
  return refreshPayrollWorker(state.session);
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
  const tipoFactura = documentRecord?.customFields?.tipoFactura;
  const view = getInvoiceView(tipoFactura);
  const form = state.invoiceForms[tipoFactura];
  if (!view || !form) return;
  showModule(view.module);
  form.setDocument(documentRecord);
  renderInvoices(tipoFactura, loadEntities(), loadDocuments());
  form.focus();
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
  const form = state.invoiceForms[documentRecord.customFields?.tipoFactura];
  if (form?.getEditingId() === documentRecord.document_id) form.reset();
  refresh();
  form?.setFeedback('Factura eliminada.');
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

function handleInvoiceSubmit(tipoFactura, values, editingId) {
  const form = state.invoiceForms[tipoFactura];
  values.customFields.tipoFactura = tipoFactura;
  try {
    if (editingId) {
      updateDocument(editingId, values, state.config);
    } else {
      addDocument(values, state.config);
    }
    form.reset();
    refresh();
    form.setFeedback(editingId ? 'Cambios guardados.' : 'Factura guardada.');
  } catch (error) {
    if (error instanceof ValidationFailure) {
      form.showErrors(error.errors);
    } else {
      throw error;
    }
  }
}

function handleQuickAction(action) {
  if (action === 'new-payroll') {
    showModule('payroll-admin');
  } else if (
    action === 'new-invoice-sale' ||
    action === 'new-invoice-purchase'
  ) {
    const tipoFactura = action === 'new-invoice-sale' ? 'venta' : 'compra';
    const form = state.invoiceForms[tipoFactura];
    showModule(getInvoiceView(tipoFactura).module);
    form.reset();
    renderInvoices(tipoFactura, loadEntities(), loadDocuments());
    form.focus();
  } else if (action === 'cashflow') {
    showModule('cashflow');
  } else if (action === 'movements') {
    showModule('movements');
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
  return result.ok;
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
}

function initInvoiceForms(config) {
  state.invoiceForms = {};
  for (const [tipoFactura, { createForm }] of Object.entries(
    invoiceComponents
  )) {
    const root = byId(`view-${getInvoiceView(tipoFactura).module}`);
    if (!root) continue;
    state.invoiceForms[tipoFactura] = createForm({
      config,
      root,
      onSubmit: (values, id) => handleInvoiceSubmit(tipoFactura, values, id),
      onEdit: editDocument,
      onDelete: requestDeleteDocument,
      onFilter: () =>
        renderInvoices(tipoFactura, loadEntities(), loadDocuments()),
    });
  }
}

export function initApp(rawConfig = userConfig) {
  const { config, errors } = normalizeConfig(rawConfig);
  state.config = config;
  state.errors = errors;
  state.currentModule = 'dashboard';
  state.searchTerm = '';
  state.session = null;
  const migration = migrateLegacyDocuments();

  applyTheme(config);
  applyLabels(config);

  applySession(state.session);
  initDashboard({
    config,
    onAction: handleQuickAction,
    onLoadDemoData: handleLoadDemoData,
  });
  initEntityForm({ config, onSubmit: handleEntitySubmit });
  initInvoiceForms(config);
  initSearchBar({ config, onSearch: handleSearch });
  bindManagementControls();
  state.accessAdmin = initAccessAdmin({
    config,
    onDirtyChange: (dirty) => {
      state.accessDirty = dirty;
    },
  });
  payrollForm = initPayrollForm({
    config,
    root: byId('view-payroll-admin'),
    onSave: handlePayrollSave,
    onDirtyChange: (dirty) => {
      state.payrollDirty = dirty;
    },
  });
  devNotifications = initDevNotifications();
  for (const id of ['payroll-filter-worker', 'payroll-filter-period']) {
    const filter = byId(id);
    if (filter) filter.addEventListener('input', refreshPayrollAdmin);
  }
  state.login = initLogin({
    onAuthenticated: (session) => {
      applySession(session);
      const target =
        session?.role === 'trabajador' ? 'payroll-worker' : 'dashboard';
      showModule(target);
    },
    onGuest: () => {
      const guest = createGuestSession();
      saveSession(guest);
      applySession(guest);
      showModule('dashboard');
    },
  });

  renderConfigBanner(errors);
  renderInvoiceStatusNotice(byId('invoice-status-notice'), {
    migration,
    unclassifiedCount: loadUnclassifiedDocuments().length,
  });
  resetEntityForm();
  refresh();
  showModule('dashboard');

  const session = loadSession();
  const validSession =
    session &&
    isSessionValid(session, {
      records: loadAccessRecords(),
      entities: loadEntities(),
    });
  if (validSession) {
    applySession(session);
    showModule(session.role === 'trabajador' ? 'payroll-worker' : 'dashboard');
  } else {
    if (session) clearSession();
    applySession(null);
    showModule('login');
    state.login.reset();
  }

  return { config, errors };
}

export { state as appState };

let payrollForm = null;
let devNotifications = null;
