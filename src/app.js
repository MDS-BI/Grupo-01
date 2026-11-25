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
import { createTutorial } from './components/tutorial.js';
import { resolveAdminSettlements } from './payroll.js';
import { validateDocument, validateSettlement } from './validation.js';
import { loadMovements } from './movements.js';
import { computeDebtSummary } from './tracking.js';
import { formatCurrencyCLP } from './format.js';
import { loadDemoData } from './demo-data.js';
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
  backfillPayrollSettlements,
  loadPayrollSettlements,
  loadPurchaseInvoices,
  loadUnclassifiedDocuments,
  migrateLegacyDocuments,
  savePayrollSettlements,
} from './storage.js';
import {
  clearSession,
  dismissGuide,
  isGuideDismissed,
  isSessionValid,
  loadSession,
} from './session.js';
import { initialPassword, normalizeRut } from './auth.js';
import { generateId } from './utils.js';

const VIEWS = [
  'login',
  'dashboard',
  'entities',
  ...Object.values(INVOICE_VIEWS).map(({ module }) => module),
  'payroll-create',
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
  login: { administrador: true, finanzas: true, trabajador: true },
  dashboard: { administrador: true, finanzas: true, trabajador: false },
  entities: { administrador: false, finanzas: true, trabajador: false },
  'invoice-sale': { administrador: false, finanzas: true, trabajador: false },
  'invoice-purchase': {
    administrador: false,
    finanzas: true,
    trabajador: false,
  },
  'payroll-create': {
    administrador: true,
    finanzas: false,
    trabajador: false,
  },
  'payroll-admin': { administrador: true, finanzas: true, trabajador: false },
  access: { administrador: true, finanzas: false, trabajador: false },
  'dev-notifications': {
    administrador: false,
    finanzas: false,
    trabajador: false,
  },
  movements: { administrador: false, finanzas: true, trabajador: false },
  cashflow: { administrador: false, finanzas: true, trabajador: false },
  tracking: { administrador: false, finanzas: true, trabajador: false },
  search: { administrador: false, finanzas: true, trabajador: false },
  'payroll-worker': { administrador: false, finanzas: false, trabajador: true },
};

function hasSession(session) {
  return Boolean(session?.role && session.role !== 'invitado');
}

export function canAccess(view, session) {
  const allowed = ACCESS_MATRIX[view];
  if (!allowed || !hasSession(session)) return false;
  return allowed[session.role] === true;
}

export function resolveRoute(view, session) {
  if (canAccess(view, session)) return view;
  if (!hasSession(session)) return 'login';
  if (session.role === 'trabajador') return 'payroll-worker';
  if (session.role === 'finanzas') {
    return view === 'payroll-worker' ? 'payroll-admin' : 'dashboard';
  }
  if (session.role === 'administrador') return 'payroll-admin';
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
  payrollCreateForm: null,
  session: null,
  migration: null,
  accessAdmin: null,
  login: null,
  tutorial: null,
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
  setText('tracking-cobrar', formatCurrencyCLP(totalPorCobrar));
  setText('tracking-pagar', formatCurrencyCLP(totalPorPagar));
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
  refreshPayrollCreateList();
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

function refreshInvoiceStatusNotice() {
  renderInvoiceStatusNotice(byId('invoice-status-notice'), {
    migration: state.migration,
    unclassifiedCount: loadUnclassifiedDocuments().length,
    isAdmin: state.session?.role === 'administrador',
  });
}

function clearRestrictedViews() {
  if (!canAccess('dashboard', state.session)) {
    for (const id of [
      'summary-caja',
      'kpi-por-cobrar',
      'kpi-por-pagar',
      'kpi-vencidas',
    ]) {
      setText(id, '');
    }
  }
  if (!canAccess('cashflow', state.session)) {
    setText('cashflow-content', '');
  }
  if (!canAccess('tracking', state.session)) {
    for (const id of [
      'tracking-cobrar',
      'tracking-pagar',
      'tracking-vencidas',
      'tracking-by-entity',
    ]) {
      setText(id, '');
    }
  }
}

function applySession(session) {
  state.tutorial?.close({ returnFocus: false });
  state.session = session;
  state.shell = createShell({
    config: state.config,
    session,
    entities: loadEntities(),
    onNavigate: showModule,
    onLogout: handleLogout,
    onOpenGuide: (opener) => state.tutorial?.open(0, opener),
  });
  state.tutorial = createTutorial({
    config: state.config,
    root: byId('guide-panel'),
    session,
    canAccess,
    onNavigate: showModule,
  });
  const qaGuide = byId('qa-guide');
  if (qaGuide) {
    qaGuide.hidden = !canAccess('dashboard', session);
    qaGuide.onclick = qaGuide.hidden
      ? null
      : () => state.tutorial?.open(0, qaGuide);
  }
  wireGuideBanner({
    bannerId: 'guide-banner-dashboard',
    dismissId: 'guide-dismiss-dashboard',
    role: session?.role,
    visible: canAccess('dashboard', session),
  });
  clearRestrictedViews();
  refreshInvoiceStatusNotice();
}

function showLogin() {
  clearSession();
  applySession(null);
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
  state.accessDirty = false;
  state.payrollDirty = false;
  showLogin();
}

function findPayrollSettlement(id) {
  return loadPayrollSettlements().find(
    (item) => item?.settlementId === id || item?.documentId === id
  );
}

function combinedPayrollRecord(settlement) {
  const document = loadPurchaseInvoices().find(
    (item) => item?.document_id === settlement?.documentId
  );
  return {
    ...(document || {}),
    ...settlement,
    settlementId: settlement?.settlementId,
    documentId: settlement?.documentId,
    periodo: settlement?.periodo,
    sueldoBase: settlement?.sueldoBase,
    descuentos: settlement?.descuentos,
    bonos: settlement?.bonos,
    monto: settlement?.monto,
    estado: settlement?.estado,
    fechaPago: settlement?.fechaPago,
  };
}

function refreshPayrollAdmin() {
  const entities = loadEntities();
  const payrollSettlements = loadPayrollSettlements();
  const purchaseInvoices = loadPurchaseInvoices();
  const filters = {
    worker: byId('payroll-filter-worker')?.value || '',
    period: byId('payroll-filter-period')?.value || '',
    rut: byId('payroll-filter-rut')?.value || '',
  };
  const settlements = resolveAdminSettlements({
    settlements: payrollSettlements,
    purchaseInvoices,
    entities,
    filters,
  });
  const hasRecords =
    resolveAdminSettlements({
      settlements: payrollSettlements,
      purchaseInvoices,
      entities,
    }).length > 0;
  const empty = byId('payroll-admin-empty');
  if (empty) {
    empty.hidden = settlements.length > 0;
    const message = empty.querySelector('p') || empty;
    const query =
      filters.rut.trim() || filters.worker.trim() || filters.period.trim();
    message.textContent =
      hasRecords && query
        ? `Sin resultados para «${query}».`
        : 'No hay liquidaciones registradas.';
  }
  renderPayrollList(byId('payroll-admin-list'), {
    settlements,
    entities,
    documents: purchaseInvoices,
    records: loadAccessRecords(),
    canEdit: state.session?.role === 'administrador',
    canAssociate: state.session?.role === 'administrador',
    onEdit: editPayrollSettlement,
    onAssociate: associatePayrollAccess,
  });
}

function editPayrollSettlement(id) {
  if (state.session?.role !== 'administrador') return;
  const settlement = findPayrollSettlement(id);
  if (!settlement || !payrollForm) return;
  const entity = loadEntities().find(
    (item) => item.entity_id === settlement.entityId
  );
  payrollForm.setDocument({
    ...combinedPayrollRecord(settlement),
    workerLabel: [entity?.name, entity?.taxId].filter(Boolean).join(' · '),
  });
}

function associatePayrollAccess(id) {
  if (state.session?.role !== 'administrador') return;
  const settlement = findPayrollSettlement(id);
  const entity = loadEntities().find(
    (item) => item.entity_id === settlement?.entityId
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
        entityId: settlement.entityId,
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

function handlePayrollSave(id, values, _previous) {
  if (state.session?.role !== 'administrador') return;
  const settlement = findPayrollSettlement(id);
  if (!settlement) return;
  const customFields = {
    ...(loadPurchaseInvoices().find(
      (item) => item.document_id === settlement.documentId
    )?.customFields || {}),
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
    const updatedDocument = updateDocument(
      settlement.documentId,
      {
        totalAmount: values.totalAmount,
        status: values.status,
        startDate: values.startDate,
        endDate: values.endDate,
        customFields,
      },
      state.config
    );
    const settlements = loadPayrollSettlements();
    const index = settlements.findIndex(
      (item) => item.settlementId === settlement.settlementId
    );
    const updated = {
      ...settlement,
      periodo: values.periodoLiquidacion,
      sueldoBase: Number(values.sueldoBase) || 0,
      descuentos: Number(values.descuentos) || 0,
      bonos: Number(values.bonos) || 0,
      monto: Number(updatedDocument.totalAmount) || 0,
      estado: updatedDocument.status,
      fechaPago: updatedDocument.customFields?.fechaPago || null,
      updatedAt: new Date().toISOString(),
    };
    const errors = validateSettlement(updated, {
      entities: loadEntities(),
      documents: loadDocuments(),
      settlements: settlements.filter(
        (item) => item.settlementId !== settlement.settlementId
      ),
    });
    if (errors.length > 0) {
      payrollForm?.showErrors(errors);
      return;
    }
    settlements[index] = updated;
    savePayrollSettlements(settlements);
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

function showRouteMessage(text) {
  const message = byId('route-message');
  if (!message) return;
  message.textContent = text;
  message.hidden = false;
}

function clearRouteMessage() {
  const message = byId('route-message');
  if (!message) return;
  message.textContent = '';
  message.hidden = true;
}

function showModule(name) {
  const target = resolveRoute(name, state.session);
  if (!VIEWS.includes(target)) return;
  const redirected =
    Boolean(state.session) &&
    name !== target &&
    name !== 'login' &&
    VIEWS.includes(name);
  if (redirected) {
    showRouteMessage(
      'No tienes acceso a esta vista; se muestra tu vista permitida.'
    );
  } else {
    clearRouteMessage();
  }
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
  const settlement = refreshPayrollWorker(state.session, undefined, {
    entities,
    purchaseInvoices: loadPurchaseInvoices(),
    settlements: loadPayrollSettlements(),
  });
  const openGuide = byId('guide-open-worker');
  if (openGuide) {
    openGuide.onclick = () => state.tutorial?.open(0, openGuide);
  }
  wireGuideBanner({
    bannerId: 'guide-banner-worker',
    dismissId: 'guide-dismiss-worker',
    role: state.session?.role,
    visible: state.session?.role === 'trabajador',
  });
  return settlement;
}

// Banner descartable «¿Primera vez?» (spec 004, FR-029/FR-030).
function wireGuideBanner({ bannerId, dismissId, role, visible }) {
  const banner = byId(bannerId);
  if (!banner) return;
  banner.hidden = !visible || isGuideDismissed(role);
  const dismiss = byId(dismissId);
  if (dismiss) {
    dismiss.onclick = () => {
      dismissGuide(role);
      banner.hidden = true;
    };
  }
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

function syncSettlementFromDocument(document) {
  const settlements = loadPayrollSettlements();
  const index = settlements.findIndex(
    (item) => item?.documentId === document?.document_id
  );
  if (index === -1) return;
  settlements[index] = {
    ...settlements[index],
    monto: Number(document.totalAmount) || 0,
    estado: document.status,
    fechaPago: document.customFields?.fechaPago || null,
    updatedAt: new Date().toISOString(),
  };
  savePayrollSettlements(settlements);
}

function handleInvoiceSubmit(tipoFactura, values, editingId) {
  const form = state.invoiceForms[tipoFactura];
  values.customFields.tipoFactura = tipoFactura;
  try {
    if (editingId) {
      const updated = updateDocument(editingId, values, state.config);
      if (tipoFactura === 'compra') syncSettlementFromDocument(updated);
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

export function handlePayrollCreateSubmit(values, extras = {}, deps = {}) {
  const config = deps.config || state.config || userConfig;
  const saveEntity = deps.addEntity || addEntity;
  const registerAccess = deps.createAccessRecord || createAccessRecord;
  const saveDocument = deps.addDocument || addDocument;
  const notify = deps.appendDevNotification || appendDevNotification;
  const entities = deps.entities ?? loadEntities();
  const accessRecords = deps.accessRecords ?? loadAccessRecords();
  const documents = deps.documents ?? loadDocuments();

  const rut = normalizeRut(extras.rut);
  if (!rut) {
    throw new ValidationFailure([
      {
        field: 'rut',
        code: 'RUT_INVALID',
        message: 'El RUT ingresado no es válido.',
      },
    ]);
  }
  const nombreCompleto = String(extras.nombreCompleto ?? '').trim();
  if (!nombreCompleto) {
    throw new ValidationFailure([
      {
        field: 'nombreCompleto',
        code: 'REQUIRED',
        message: 'El nombre completo es obligatorio.',
      },
    ]);
  }

  const existingEntity = entities.find((entity) =>
    [entity?.customFields?.rut, entity?.taxId].some(
      (value) => normalizeRut(value) === rut
    )
  );
  if (
    existingEntity &&
    existingEntity.customFields?.tipoTercero !== 'personal'
  ) {
    notify({
      accessId: rut,
      role: 'trabajador',
      reason: 'ENTITY_NOT_PERSONAL',
      origin: 'payroll-create',
    });
    throw new ValidationFailure([
      {
        field: 'rut',
        code: 'ENTITY_NOT_PERSONAL',
        message: 'El RUT ya está asociado a un tercero que no es personal.',
      },
    ]);
  }

  const access = accessRecords.find(
    (record) =>
      record?.accessId === rut ||
      (existingEntity && record?.entityId === existingEntity.entity_id)
  );
  if (
    access &&
    (!access.active ||
      access.role !== 'trabajador' ||
      (existingEntity && access.entityId !== existingEntity.entity_id))
  ) {
    notify({
      accessId: rut,
      role: 'trabajador',
      reason: access.active ? 'INCOMPATIBLE_ACCESS' : 'INACTIVE_ACCESS',
      origin: 'payroll-create',
    });
    throw new ValidationFailure([
      {
        field: 'rut',
        code: 'ACCESS_CONFLICT',
        message: access.active
          ? 'El RUT ya está asociado a otro acceso.'
          : 'El acceso existe pero está inactivo.',
      },
    ]);
  }

  const candidateEntity = existingEntity ?? {
    entity_id: generateId('ent'),
    name: nombreCompleto,
    code: `RUT-${rut.split('-')[0]}`,
    taxId: rut,
    customFields: { tipoTercero: 'personal', rut },
  };
  const entitiesForValidation = existingEntity
    ? entities
    : [...entities, candidateEntity];
  const customFields = {
    ...(values?.customFields ?? {}),
    tipoFactura: 'compra',
  };
  if (!String(customFields.periodoLiquidacion ?? '').trim()) {
    customFields.periodoLiquidacion = String(values?.startDate ?? '').slice(
      0,
      7
    );
  }
  const document = {
    ...values,
    entity_id: candidateEntity.entity_id,
    customFields,
  };
  const errors = validateDocument(document, {
    config,
    entities: entitiesForValidation,
    documents,
  });
  if (errors.length > 0) throw new ValidationFailure(errors);

  const entity = existingEntity ?? saveEntity(candidateEntity, config);
  const accessRecord =
    access ??
    registerAccess(
      {
        accessId: rut,
        role: 'trabajador',
        entityId: entity.entity_id,
        password: initialPassword(rut),
      },
      { entities: entitiesForValidation, records: accessRecords }
    );
  const savedDocument = saveDocument(
    { ...document, entity_id: entity.entity_id },
    config
  );

  return {
    entity,
    access: accessRecord,
    document: savedDocument,
    reusedEntity: Boolean(existingEntity),
    reusedAccess: Boolean(access),
  };
}

function ensurePayrollSettlement(document) {
  const entity = loadEntities().find(
    (item) => item.entity_id === document.entity_id
  );
  if (entity?.customFields?.tipoTercero !== 'personal') return;
  const settlements = loadPayrollSettlements();
  const index = settlements.findIndex(
    (item) => item?.documentId === document.document_id
  );
  const previous = settlements[index] ?? {};
  const now = new Date().toISOString();
  const record = {
    ...previous,
    settlementId: previous.settlementId || generateId('set'),
    documentId: document.document_id,
    entityId: document.entity_id,
    periodo:
      document.customFields?.periodoLiquidacion ||
      String(document.startDate || '').slice(0, 7),
    sueldoBase: previous.sueldoBase ?? 0,
    descuentos: previous.descuentos ?? 0,
    bonos: previous.bonos ?? 0,
    monto: Number(document.totalAmount) || 0,
    estado: document.status || 'Borrador',
    fechaPago: document.customFields?.fechaPago || null,
    createdAt: previous.createdAt || document.createdAt || now,
    updatedAt: now,
  };
  if (index === -1) settlements.push(record);
  else settlements[index] = record;
  savePayrollSettlements(settlements);
}

function submitPayrollCreate(values, editingId, extras = {}) {
  const form = state.payrollCreateForm;
  try {
    const result = handlePayrollCreateSubmit(values, extras);
    ensurePayrollSettlement(result.document);
    form?.reset();
    refresh();
    form?.setFeedback(
      result.reusedAccess
        ? 'Liquidación guardada. El trabajador ya tenía acceso activo.'
        : 'Liquidación guardada y acceso de trabajador creado.'
    );
  } catch (error) {
    if (error instanceof ValidationFailure) {
      form?.showErrors(error.errors);
    } else {
      throw error;
    }
  }
}

function refreshPayrollCreateList() {
  const form = state.payrollCreateForm;
  if (!form) return;
  const entities = loadEntities();
  const personalIds = new Set(
    entities
      .filter((entity) => entity?.customFields?.tipoTercero === 'personal')
      .map((entity) => entity.entity_id)
  );
  const documents = loadDocuments().filter(
    (document) =>
      document?.customFields?.tipoFactura === 'compra' &&
      document?.customFields?.periodoLiquidacion &&
      personalIds.has(document?.entity_id)
  );
  const names = new Map(
    entities.map(({ entity_id, name }) => [entity_id, name])
  );
  form.setEntities(entities);
  form.setOptions(documents, names);
  renderPurchaseList(byId('payroll-create-list'), documents, names, {
    filterEntityId: form.getFilter(),
    onEdit: () => {},
    onDelete: () => {},
  });
}

function handleQuickAction(action) {
  if (action === 'new-payroll') {
    showModule('payroll-admin');
  } else if (action === 'create-payroll') {
    showModule('payroll-create');
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
  } else if (
    action === 'list-invoice-sale' ||
    action === 'list-invoice-purchase'
  ) {
    const tipoFactura = action === 'list-invoice-sale' ? 'venta' : 'compra';
    showModule(getInvoiceView(tipoFactura).module);
    renderInvoices(tipoFactura, loadEntities(), loadDocuments());
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

  const payrollRoot = byId('view-payroll-create');
  if (payrollRoot) {
    state.payrollCreateForm = createPurchaseForm({
      config,
      root: payrollRoot,
      onSubmit: submitPayrollCreate,
      onEdit: editDocument,
      onDelete: requestDeleteDocument,
      onFilter: () => refreshPayrollCreateList(),
      hideThirdParty: true,
      extraFields: [
        {
          key: 'rut',
          label: 'RUT',
          type: 'text',
          required: true,
          placeholder: 'Ej. 12.345.678-5',
        },
        {
          key: 'nombreCompleto',
          label: 'Nombre completo',
          type: 'text',
          required: true,
        },
      ],
      formTitle: config.labels.payrollCreate,
      submitLabel: 'Guardar liquidación',
      newLabel: 'Nueva liquidación',
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
  const payrollBackfill = backfillPayrollSettlements();
  state.migration = migration;
  state.payrollBackfill = payrollBackfill;

  applyTheme(config);
  applyLabels(config);

  applySession(state.session);
  initDashboard({
    config,
    onAction: handleQuickAction,
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
  for (const id of [
    'payroll-filter-worker',
    'payroll-filter-rut',
    'payroll-filter-period',
  ]) {
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
    onLoadDemoData: () => {
      const result = loadDemoData(state.config);
      if (result.ok) {
        showModule('login');
        const noAccesses = byId('login-no-accesses');
        if (noAccesses) noAccesses.hidden = true;
        state.login?.showDemoStatus(
          'Datos de demostración cargados. Ingresa con uno de los RUT y contraseñas de la demostración.'
        );
      } else {
        state.login?.showDemoStatus(result.message);
      }
    },
  });

  renderConfigBanner(errors);
  resetEntityForm();
  refresh();

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
    showLogin();
  }

  return { config, errors };
}

export { state as appState };

let payrollForm = null;
let devNotifications = null;
