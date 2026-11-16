import fs from 'node:fs';
import path from 'node:path';
import { saveSession } from '../../src/session.js';
import { saveAccessRecords } from '../../src/access-storage.js';

export function loadAppMarkup() {
  const html = fs.readFileSync(
    path.resolve(process.cwd(), 'index.html'),
    'utf8'
  );
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = match ? match[1] : html;
  document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/gi, '');
}

export function submit(formId) {
  const form = document.getElementById(formId);
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

export function invoiceField(view, key) {
  return document.querySelector(`#${view}-form [data-field="${key}"]`);
}

// Prepara una sesión de administrador válida para pruebas que verifican
// vistas de negocio sin querer atravesar la pantalla de acceso.
export function setupAdminSession() {
  const now = new Date().toISOString();
  saveAccessRecords([
    {
      accessId: '11111111-1',
      role: 'administrador',
      entityId: null,
      password: '1111',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  saveSession({
    accessId: '11111111-1',
    role: 'administrador',
    entityId: null,
    startedAt: now,
  });
}
