import { computeCashflow } from './cashflow.js';
import { computeDebtSummary } from './tracking.js';

export function computeDashboardSummary(entities, documents, movements) {
  const { totalPorCobrar, totalPorPagar, vencidas } = computeDebtSummary(
    entities,
    documents
  );
  const { ingresos, egresos, neto } = computeCashflow(
    documents,
    entities,
    movements
  );

  return {
    saldo: totalPorCobrar - totalPorPagar,
    deuda: totalPorCobrar + totalPorPagar,
    caja: neto,
    ingresos,
    egresos,
    totalPorCobrar,
    totalPorPagar,
    vencidas,
  };
}
