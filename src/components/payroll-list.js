const money = (value) =>
  Number(value || 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

export function renderPayrollList(container, options = {}) {
  const {
    settlements = [],
    entities = [],
    records = [],
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
        <th>Estado</th><th>Fecha de pago</th><th>Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  for (const settlement of settlements) {
    const entity = entityById.get(settlement.entity_id);
    const row = document.createElement('tr');
    row.dataset.id = settlement.document_id;
    const cells = [
      entity?.name || '',
      entity?.taxId || '',
      settlement.customFields?.periodoLiquidacion || '',
      money(settlement.totalAmount),
      settlement.status || '',
      settlement.customFields?.fechaPago || 'Sin pago registrado',
    ];
    for (const value of cells) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }

    const actions = document.createElement('td');
    actions.className = 'invoice-table-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.dataset.action = 'edit';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => onEdit(settlement.document_id));
    actions.append(editButton);

    if (!linkedIds.has(settlement.entity_id)) {
      const associateButton = document.createElement('button');
      associateButton.type = 'button';
      associateButton.dataset.action = 'associate';
      associateButton.textContent = 'Asociar acceso';
      associateButton.addEventListener('click', () =>
        onAssociate(settlement.document_id)
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
