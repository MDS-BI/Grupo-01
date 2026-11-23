import { computeCashflow } from '../cashflow.js';
import { formatCurrencyCLP } from '../format.js';
import { loadMovements } from '../movements.js';
import { loadDocuments, loadEntities } from '../storage.js';

function createCell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

export function renderCashflowView(container) {
  if (!container) return;
  const { rows, ingresos, egresos, neto } = computeCashflow(
    loadDocuments(),
    loadEntities(),
    loadMovements()
  );
  container.textContent = '';

  const summary = document.createElement('div');
  summary.className = 'stats cashflow-summary';
  const cards = [
    ['cashflow-ingresos', 'Ingresos (cobros venta)', ingresos],
    ['cashflow-egresos', 'Egresos (compras y liquidaciones)', egresos],
    ['cashflow-neto', 'Saldo neto', neto],
  ];
  for (const [id, label, value] of cards) {
    const card = document.createElement('div');
    card.className = 'stat-card';
    const val = document.createElement('span');
    val.id = id;
    val.textContent = formatCurrencyCLP(value);
    const lab = document.createElement('span');
    lab.textContent = label;
    card.append(val, lab);
    summary.append(card);
  }
  container.append(summary);

  if (rows.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.id = 'cashflow-empty';
    empty.textContent =
      'No hay entradas ni salidas registradas. Se consolidan los cobros de facturas de venta pagadas y los pagos de facturas de compra y liquidaciones de sueldo.';
    container.append(empty);
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'invoice-table-scroll';
  const table = document.createElement('table');
  table.className = 'invoice-table cashflow-table';
  table.id = 'cashflow-table';
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  for (const h of [
    'Fecha',
    'Tipo',
    'Categoría',
    'Tercero',
    'Documento',
    'Monto',
  ]) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = h;
    hr.append(th);
  }
  thead.append(hr);
  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.dataset.tipo = row.tipo.toLowerCase();
    tr.append(
      createCell(row.fecha || ''),
      createCell(row.tipo),
      createCell(row.categoria),
      createCell(row.tercero),
      createCell(row.documento),
      createCell(formatCurrencyCLP(row.signo * row.monto))
    );
    tbody.append(tr);
  }
  table.append(thead, tbody);
  wrap.append(table);
  container.append(wrap);
}
