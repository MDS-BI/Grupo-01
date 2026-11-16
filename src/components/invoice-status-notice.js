const SECURITY_WARNING =
  'El control de acceso es una restricción de interfaz; los datos viven en el navegador y no deben usarse datos reales.';

export function renderInvoiceStatusNotice(
  container,
  { migration, unclassifiedCount = 0 } = {}
) {
  if (!container) return;
  container.textContent = '';

  const messages = [];
  if (migration && migration.ok === false) {
    messages.push(
      'La migración de facturas falló: se conservó la colección original. Revise los datos antes de continuar.'
    );
  }
  if (unclassifiedCount > 0) {
    messages.push(
      `Hay ${unclassifiedCount} documento(s) sin tipo que no se muestran como liquidaciones ni en las vistas de factura.`
    );
  }
  messages.push(SECURITY_WARNING);

  for (const message of messages) {
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    container.append(paragraph);
  }
}
