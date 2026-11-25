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

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// «2026-10» → «octubre 2026» (constitución v1.1.0, períodos legibles).
export function formatPeriod(value) {
  const match = /^(\d{4})-(\d{2})/.exec(String(value ?? ''));
  if (!match) return String(value ?? '');
  const name = MONTH_NAMES[Number(match[2]) - 1];
  return name ? `${name} ${match[1]}` : String(value);
}
