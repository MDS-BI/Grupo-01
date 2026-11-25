import { formatCurrencyCLP, formatPeriod } from '../format.js';

const STATUS_TONES = {
  Borrador: 'draft',
  Emitida: 'issued',
  Pagada: 'paid',
  Anulada: 'void',
};

function readableDate(value) {
  const [year, month, day] = String(value ?? '')
    .slice(0, 10)
    .split('-');
  return day ? `${day}-${month}-${year}` : '';
}

function invoiceReference(document) {
  if (!document) return '—';
  const reference = [document.series, document.folio]
    .filter((part) => part !== undefined && part !== null && part !== '')
    .join('-');
  return reference ? `Compra ${reference}` : 'Compra';
}

const valueOf = (settlement, key, fallbackKey) =>
  settlement?.[key] ?? settlement?.[fallbackKey] ?? '';

export function renderPayrollList(container, options = {}) {
  const {
    settlements = [],
    entities = [],
    documents = [],
    records = [],
    canEdit = true,
    canAssociate = true,
    canRegisterPayment = false,
    onEdit = () => {},
    onAssociate = () => {},
    onRegisterPayment = () => {},
  } = options;
  if (!container) return;
  container.textContent = '';

  const entityById = new Map(
    entities.map((entity) => [entity.entity_id, entity])
  );
  const documentById = new Map(
    documents.map((document) => [document.document_id, document])
  );
  const linkedIds = new Set(
    records
      .filter((record) => record.active && record.role === 'trabajador')
      .map((record) => record.entityId)
  );

  const scroll = document.createElement('div');
  scroll.className = 'invoice-table-scroll';
  const table = document.createElement('table');
  table.className = 'invoice-table payroll-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Trabajador</th><th scope="col">RUT</th>
        <th scope="col">Período</th><th scope="col" class="amount">Monto líquido</th>
        <th scope="col">Estado</th><th scope="col">Fecha de pago</th>
        <th scope="col">Factura de compra</th><th scope="col">Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  for (const settlement of settlements) {
    const entityId = settlement?.entityId ?? settlement?.entity_id;
    const entity = entityById.get(entityId);
    const settlementId = settlement?.settlementId ?? settlement?.document_id;
    const documentId = settlement?.documentId ?? settlement?.document_id;
    const row = document.createElement('tr');
    row.dataset.id = settlementId;
    row.dataset.documentId = documentId;
    const custom = settlement?.customFields || {};
    const period = settlement?.periodo ?? custom.periodoLiquidacion ?? '';
    const status = valueOf(settlement, 'estado', 'status') || '';
    const paidAt = settlement?.fechaPago ?? custom.fechaPago ?? '';
    const cells = [
      entity?.name || '',
      entity?.taxId || '',
      formatPeriod(period),
      formatCurrencyCLP(valueOf(settlement, 'monto', 'totalAmount')),
      status,
      paidAt ? readableDate(paidAt) : 'Sin pago registrado',
      invoiceReference(documentById.get(documentId)),
    ];
    cells.forEach((value, index) => {
      const cell = document.createElement('td');
      if (index === 3) cell.className = 'amount';
      if (index === 4) {
        const badge = document.createElement('span');
        badge.className = `status-badge status-badge--${STATUS_TONES[value] || 'draft'}`;
        badge.textContent = value;
        cell.append(badge);
      } else {
        cell.textContent = value;
      }
      if (index === 6 && documentId) cell.title = documentId;
      row.append(cell);
    });

    const actions = document.createElement('td');
    actions.className = 'invoice-table-actions';
    if (canRegisterPayment) {
      if (status === 'Emitida') {
        const paymentButton = document.createElement('button');
        paymentButton.type = 'button';
        paymentButton.dataset.action = 'register-payment';
        paymentButton.dataset.id = settlementId;
        paymentButton.className = 'table-action';
        paymentButton.textContent = 'Registrar pago';
        paymentButton.addEventListener('click', () =>
          onRegisterPayment(settlementId)
        );
        actions.append(paymentButton);
      }
    } else {
      if (canEdit) {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.dataset.action = 'edit';
        editButton.className = 'table-action';
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', () => onEdit(settlementId));
        actions.append(editButton);
      }

      if (canAssociate && !linkedIds.has(entityId)) {
        const associateButton = document.createElement('button');
        associateButton.type = 'button';
        associateButton.dataset.action = 'associate';
        associateButton.textContent = 'Asociar acceso';
        associateButton.addEventListener('click', () =>
          onAssociate(settlementId)
        );
        actions.append(associateButton);

        const warning = document.createElement('span');
        warning.className = 'error';
        warning.textContent = ` El RUT ${entity?.taxId || ''} no tiene un acceso de trabajador activo.`;
        actions.append(warning);
      }
    }

    row.append(actions);
    tbody.append(row);
  }

  scroll.append(table);
  container.append(scroll);
}
