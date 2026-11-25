function displayedValue(record, key) {
  const value = record[key] ?? record.customFields?.[key];
  if (value === undefined || value === null || value === '') return '—';
  if (key === 'folio')
    return [record.series, `#${value}`].filter(Boolean).join(' ');
  if (key === 'totalAmount' && record.currency)
    return `${value} ${record.currency}`;
  return String(value);
}

export function renderInvoiceList(
  container,
  documents,
  entities,
  {
    tipoFactura,
    columns,
    filterEntityId,
    onEdit,
    onDelete,
    readOnlyIds = new Set(),
  }
) {
  container.replaceChildren();
  container.dataset.tipoFactura = tipoFactura;
  const groups = new Map();
  for (const record of documents) {
    if (record.customFields?.tipoFactura !== tipoFactura) continue;
    if (filterEntityId && record.entity_id !== filterEntityId) continue;
    if (!groups.has(record.entity_id)) groups.set(record.entity_id, []);
    groups.get(record.entity_id).push(record);
  }

  if (groups.size === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = filterEntityId
      ? `No hay facturas de ${tipoFactura} para este tercero.`
      : `No hay facturas de ${tipoFactura} registradas.`;
    container.append(empty);
    return;
  }

  for (const [entityId, group] of groups) {
    const wrapper = document.createElement('div');
    wrapper.className = 'invoice-table-scroll';
    wrapper.tabIndex = 0;
    const table = document.createElement('table');
    table.className = 'invoice-table';
    const caption = table.createCaption();
    caption.textContent = entities.get(entityId) ?? entityId;
    const header = table.createTHead().insertRow();
    for (const label of [...columns.map(([, label]) => label), 'Acciones']) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      header.append(th);
    }

    const body = table.createTBody();
    for (const record of group) {
      const row = body.insertRow();
      row.dataset.id = record.document_id;
      for (const [key] of columns) {
        const cell = row.insertCell();
        const value = displayedValue(record, key);
        if (key === 'status') {
          const badge = document.createElement('span');
          badge.className = `invoice-badge invoice-badge--${tipoFactura === 'venta' ? 'sale' : 'purchase'}`;
          badge.textContent = value;
          cell.append(badge);
        } else {
          if (key === 'totalAmount') cell.className = 'invoice-total';
          cell.textContent = value;
        }
      }
      const actions = row.insertCell();
      actions.className = 'invoice-table-actions';
      if (readOnlyIds.has(record.document_id)) {
        const note = document.createElement('span');
        note.className = 'invoice-readonly-note error';
        note.textContent = 'Solo lectura';
        actions.append(note);
      } else {
        for (const [label, action, handler] of [
          ['Editar', 'edit', onEdit],
          ['Eliminar', 'delete', onDelete],
        ]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = label;
          button.dataset.action = action;
          button.dataset.id = record.document_id;
          button.setAttribute(
            'aria-label',
            `${label} factura ${displayedValue(record, 'folio')}`
          );
          button.onclick = () => handler(record.document_id);
          actions.append(button);
        }
      }
    }
    wrapper.append(table);
    container.append(wrapper);
  }
}
