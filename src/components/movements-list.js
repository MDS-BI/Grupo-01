import { formatCurrencyCLP, formatDateDDMMYYYY } from '../format.js';

const MOVEMENT_LABELS = {
  cargo: 'Venta emitida',
  abono: 'Compra emitida',
  pago: 'Pago',
};

function movementLabel(movement) {
  return MOVEMENT_LABELS[movement.tipo] ?? 'Movimiento';
}

function documentReference(document) {
  if (!document) return 'Documento';
  const prefix =
    document.customFields?.tipoFactura === 'compra' ? 'Compra' : 'Venta';
  const folio =
    document.folio === undefined ||
    document.folio === null ||
    document.folio === ''
      ? ''
      : [document.series, `#${document.folio}`].filter(Boolean).join(' ');
  return [prefix, folio].filter(Boolean).join(' ');
}

function fila(movement, entitiesById, documentsById) {
  const entity = entitiesById.get(movement.entity_id);
  const sourceDocument = documentsById.get(movement.document_id);
  const item = document.createElement('li');
  item.className = 'record-card';
  item.dataset.id = movement.id;
  item.dataset.movement = movement.tipo;

  const title = document.createElement('h4');
  title.className = 'record-title';
  title.textContent = `${movementLabel(movement)} — ${documentReference(sourceDocument)}`;
  item.append(title);

  const meta = document.createElement('p');
  meta.textContent = `Fecha: ${formatDateDDMMYYYY(movement.fecha)} — Tercero: ${entity?.name ?? '—'}`;
  item.append(meta);

  const monto = document.createElement('p');
  monto.className = 'record-total';
  monto.textContent = `Monto: ${formatCurrencyCLP(movement.monto)}`;
  item.append(monto);

  const order =
    movement.salesOrderId ?? sourceDocument?.customFields?.salesOrderId;
  if (order !== undefined && order !== null && order !== '') {
    const detail = document.createElement('p');
    detail.className = 'record-custom-field';
    detail.textContent = `Orden de venta: ${order}`;
    item.append(detail);
  }

  const costCenter =
    movement.centroCosto ?? sourceDocument?.customFields?.centroCosto;
  if (costCenter !== undefined && costCenter !== null && costCenter !== '') {
    const detail = document.createElement('p');
    detail.className = 'record-custom-field';
    detail.textContent = `Centro de costo: ${costCenter}`;
    item.append(detail);
  }
  return item;
}

export function renderMovementsList(
  container,
  movements,
  entities,
  documents = []
) {
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
  const entitiesById = new Map(
    (entities || []).map((entity) => [entity.entity_id, entity])
  );
  const documentsById = new Map(
    (documents || []).map((record) => [record.document_id, record])
  );
  const list = document.createElement('ul');
  list.className = 'record-list movements-list';
  for (const movement of movements) {
    const row = fila(movement, entitiesById, documentsById);
    for (const button of row.querySelectorAll('button')) {
      button.remove();
    }
    list.append(row);
  }
  container.append(list);
}
