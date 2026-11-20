const money = (value) =>
  Number(value || 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

const valueOf = (settlement, key, fallbackKey) =>
  settlement?.[key] ?? settlement?.[fallbackKey] ?? '';

export function renderPayrollList(container, options = {}) {
  const {
    settlements = [],
    entities = [],
    records = [],
    canAssociate = true,
    onEdit = () => {},
    onAssociate = () => {},
  } = options;
  if (!container) return;
  container.textContent = '';

  const entityById = new Map(
    entities.map((entity) => [entity.entity_id, entity])
  );
  const linkedIds = new Set(
    records
      .filter((record) => record.active && record.role === 'trabajador')
      .map((record) => record.entityId)
  );

  const scroll = document.createElement('div');
  scroll.className = 'invoice-table-scroll';
  const table = document.createElement('table');
  table.className = 'invoice-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Trabajador</th><th>RUT</th><th>Período</th><th>Monto</th>
        <th>Estado</th><th>Fecha de pago</th><th>Factura vinculada</th><th>Acciones</th>
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
    const cells = [
      entity?.name || '',
      entity?.taxId || '',
      valueOf(settlement, 'periodo', 'customFields') || '',
      money(valueOf(settlement, 'monto', 'totalAmount')),
      valueOf(settlement, 'estado', 'status') || '',
      valueOf(settlement, 'fechaPago', 'customFields') || 'Sin pago registrado',
      documentId || '',
    ];
    for (const [index, value] of cells.entries()) {
      const cell = document.createElement('td');
      cell.textContent =
        index === 2 && typeof value === 'object'
          ? value?.periodoLiquidacion || ''
          : index === 5 && typeof value === 'object'
            ? value?.fechaPago || 'Sin pago registrado'
            : value;
      row.append(cell);
    }

    const actions = document.createElement('td');
    actions.className = 'invoice-table-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.dataset.action = 'edit';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => onEdit(settlementId));
    actions.append(editButton);

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

    row.append(actions);
    tbody.append(row);
  }

  scroll.append(table);
  container.append(scroll);
}
