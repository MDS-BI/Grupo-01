function fila(movement, entities) {
  const entity = (entities || []).find(
    (item) => item.entity_id === movement.entity_id
  );
  const item = document.createElement('li');
  item.className = 'record-card';
  item.dataset.id = movement.id;
  item.dataset.movement = movement.tipo;

  const title = document.createElement('h4');
  title.className = 'record-title';
  title.textContent = `${movement.tipo.toUpperCase()} — doc ${movement.document_id}`;
  item.append(title);

  const meta = document.createElement('p');
  meta.textContent = `Fecha: ${movement.fecha} — Tercero: ${entity ? entity.name : movement.entity_id}`;
  item.append(meta);

  const monto = document.createElement('p');
  monto.className = 'record-total';
  monto.textContent = `Monto: ${movement.monto}`;
  item.append(monto);

  for (const key of ['centroCosto', 'salesOrderId']) {
    if (movement[key] === undefined || movement[key] === '') continue;
    const detail = document.createElement('p');
    detail.className = 'record-custom-field';
    detail.textContent = `${key}: ${movement[key]}`;
    item.append(detail);
  }
  return item;
}

export function renderMovementsList(container, movements, entities) {
  if (!container) return;
  container.textContent = '';
  if (!movements || movements.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent =
      'No hay movimientos financieros todavía. Se generan automáticamente al emitir o pagar una factura.';
    container.append(empty);
    return;
  }
  const list = document.createElement('ul');
  list.className = 'record-list movements-list';
  for (const movement of movements) {
    const row = fila(movement, entities);
    for (const button of row.querySelectorAll('button')) {
      button.remove();
    }
    list.append(row);
  }
  container.append(list);
}
