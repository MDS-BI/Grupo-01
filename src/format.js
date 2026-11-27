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

export function formatDateDDMMYYYY(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value ?? '');
}

export function formatRut(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const compact = raw.replace(/[.\s]/g, '');
  const match = /^(\d+)-?([\dkK])$/.exec(compact);
  if (!match) return raw;

  const body = match[1].replace(/^0+(?=\d)/, '');
  let grouped = '';
  for (
    let index = body.length - 1, group = 0;
    index >= 0;
    index -= 1, group += 1
  ) {
    grouped = body[index] + (group > 0 && group % 3 === 0 ? '.' : '') + grouped;
  }
  return `${grouped}-${match[2].toUpperCase()}`;
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
