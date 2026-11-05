import { computeDebtSummary } from '../tracking.js';

function filaTercero(entry) {
  const item = document.createElement('li');
  item.className = 'record-card';
  item.dataset.entityId = entry.entity_id;

  const title = document.createElement('h4');
  title.className = 'record-title';
  title.textContent = `${entry.name}${entry.tipoTercero ? ` (${entry.tipoTercero})` : ''}`;
  item.append(title);

  const cobrar = document.createElement('p');
  cobrar.className = 'record-total';
  cobrar.textContent = `Total por cobrar: ${entry.porCobrar}`;
  item.append(cobrar);

  const pagar = document.createElement('p');
  pagar.className = 'record-total';
  pagar.textContent = `Total por pagar: ${entry.porPagar}`;
  item.append(pagar);

  if (entry.vencidas > 0) {
    const vencidas = document.createElement('p');
    vencidas.className = 'record-status';
    vencidas.textContent = `Facturas vencidas: ${entry.vencidas}`;
    item.append(vencidas);
  }
  return item;
}

export function renderTrackingView(container, entities, documents) {
  if (!container) return;
  container.textContent = '';
  const { summary } = computeDebtSummary(entities, documents);
  const relevant = summary.filter(
    (entry) => entry.porCobrar > 0 || entry.porPagar > 0 || entry.vencidas > 0
  );
  if (relevant.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent =
      'Sin deuda registrada: no hay facturas Emitidas por cobrar ni por pagar.';
    container.append(empty);
    return;
  }
  const list = document.createElement('ul');
  list.className = 'record-list tracking-list';
  for (const entry of relevant) {
    list.append(filaTercero(entry));
  }
  container.append(list);
}
