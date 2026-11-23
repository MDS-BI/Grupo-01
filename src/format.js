const CLP_FORMATTER = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatCurrencyCLP(value) {
  const amount = Number(value || 0);
  const magnitude = CLP_FORMATTER.format(Math.abs(amount)).replace(
    /\$\s*/,
    '$'
  );
  return amount < 0 ? `-${magnitude}` : magnitude;
}
