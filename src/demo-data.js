import {
  addDocument,
  addEntity,
  loadDocuments,
  loadEntities,
  updateDocument,
} from './storage.js';

function addDays(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculaDigitoVerificador(dni) {
  let sum = 0;
  let multiplier = 2;
  for (let i = dni.length - 1; i >= 0; i -= 1) {
    sum += Number(dni[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  return remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
}

function formatoRut(dni) {
  const body =
    dni.length === 8
      ? `${dni.slice(0, 2)}.${dni.slice(2, 5)}.${dni.slice(5)}`
      : `${dni.slice(0, 1)}.${dni.slice(1, 4)}.${dni.slice(4)}`;
  return `${body}-${calculaDigitoVerificador(dni)}`;
}

function baseFactura(entity, { folio, serie = 'A' }) {
  return {
    entity_id: entity.entity_id,
    series: serie,
    folio,
    currency: 'CLP',
  };
}

export function hasStoredRecords() {
  return loadEntities().length > 0 || loadDocuments().length > 0;
}

export function loadDemoData(config) {
  if (hasStoredRecords()) {
    return {
      ok: false,
      reason: 'EXISTS',
      message:
        'El módulo ya contiene datos o registros previos; la carga de demostración requiere un módulo vacío. Se conservaron todos los registros.',
    };
  }
  return buildDemoData(config);
}

function buildDemoData(_config) {
  const clientes = [
    {
      name: 'Comercial Andina Ltda.',
      code: 'CL-001',
      dni: '12345678',
      tipo: 'cliente',
      custom: { referenciaOtroModulo: 'CRM: cli-0042' },
    },
    {
      name: 'Distribuidora Maino SpA',
      code: 'CL-002',
      dni: '76543210',
      tipo: 'cliente',
      custom: { referenciaOtroModulo: '' },
    },
  ];
  const proveedores = [
    {
      name: 'Proveedores del Sur S.A.',
      code: 'PV-001',
      dni: '11111111',
      tipo: 'proveedor',
      custom: { referenciaOtroModulo: 'Compras: ord-0089' },
    },
  ];
  const personal = [
    {
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      dni: '22222222',
      tipo: 'personal',
      custom: { referenciaOtroModulo: '' },
    },
    {
      name: 'Bruno Soto Vega',
      code: 'PE-002',
      dni: '45000000',
      tipo: 'personal',
      custom: { referenciaOtroModulo: '' },
    },
  ];

  for (const entry of [...clientes, ...proveedores, ...personal]) {
    const customFields = entry.custom || {};
    addEntity({
      name: entry.name,
      code: entry.code,
      taxId: formatoRut(entry.dni),
      customFields: { ...customFields, tipoTercero: entry.tipo },
    });
  }
  const entities = loadEntities();
  const byCode = (prefix) => entities.find((e) => e.code.startsWith(prefix));

  const cl1 = byCode('CL-001');
  const cl2 = byCode('CL-002');
  const pv1 = byCode('PV-001');
  const pe1 = byCode('PE-001');
  const pe2 = byCode('PE-002');

  // Facturas de venta
  const v1 = addDocument({
    ...baseFactura(cl1, { folio: 101 }),
    startDate: addDays(-1),
    endDate: addDays(29),
    totalAmount: 250000,
    customFields: {
      tipoFactura: 'venta',
      referenciaOtroModulo: 'Ventas: pedido PED-033',
    },
  });

  const v2 = addDocument({
    ...baseFactura(cl1, { folio: 102 }),
    startDate: addDays(-2),
    endDate: addDays(13),
    totalAmount: 180000,
    customFields: {
      tipoFactura: 'venta',
      salesOrderId: 'PED-036',
      referenciaOtroModulo: 'Ventas: pedido PED-036',
    },
  });

  const v3 = addDocument({
    ...baseFactura(cl2, { folio: 55 }),
    startDate: addDays(-40),
    endDate: addDays(-6),
    totalAmount: 320000,
    customFields: {
      tipoFactura: 'venta',
      salesOrderId: 'PED-035',
      referenciaOtroModulo: 'Ventas: pedido PED-035',
    },
  });

  const v4 = addDocument({
    ...baseFactura(cl2, { folio: 56 }),
    startDate: addDays(-35),
    endDate: addDays(-5),
    totalAmount: 150000,
    customFields: {
      tipoFactura: 'venta',
      salesOrderId: 'PED-034',
      referenciaOtroModulo: 'Ventas: pedido PED-034',
    },
  });

  const v5 = addDocument({
    ...baseFactura(cl1, { folio: 103 }),
    startDate: addDays(-10),
    endDate: addDays(5),
    totalAmount: 90000,
    customFields: {
      tipoFactura: 'venta',
      referenciaOtroModulo: 'Ventas: pedido PED-037',
    },
  });

  // Facturas de compra
  const c1 = addDocument({
    ...baseFactura(pv1, { folio: 88 }),
    startDate: addDays(-3),
    endDate: addDays(27),
    totalAmount: 420000,
    customFields: {
      tipoFactura: 'compra',
      referenciaOtroModulo: 'Compras: ord-0089',
    },
  });

  const c2 = addDocument({
    ...baseFactura(pe1, { folio: 1, serie: 'LIQ' }),
    startDate: addDays(-15),
    endDate: addDays(15),
    totalAmount: 700000,
    customFields: {
      tipoFactura: 'compra',
      periodoLiquidacion: addDays(-15).slice(0, 7),
      referenciaOtroModulo: 'Remuneraciones: oct-2026',
    },
  });

  const c3 = addDocument({
    ...baseFactura(pv1, { folio: 87 }),
    startDate: addDays(-30),
    endDate: addDays(-2),
    totalAmount: 260000,
    customFields: {
      tipoFactura: 'compra',
      referenciaOtroModulo: 'Compras: ord-0076',
    },
  });

  const c4 = addDocument({
    ...baseFactura(pe2, { folio: 2, serie: 'LIQ' }),
    startDate: addDays(-45),
    endDate: addDays(-10),
    totalAmount: 620000,
    customFields: {
      tipoFactura: 'compra',
      periodoLiquidacion: addDays(-45).slice(0, 7),
      referenciaOtroModulo: 'Remuneraciones: sep-2026',
    },
  });

  // Emisiones y pagos vía transiciones del ciclo de vida
  updateDocument(v1.document_id, { status: 'Emitida' });
  updateDocument(v2.document_id, { status: 'Emitida' });
  updateDocument(v3.document_id, { status: 'Emitida' });
  updateDocument(v4.document_id, { status: 'Emitida' });
  updateDocument(v4.document_id, {
    status: 'Pagada',
    customFields: {
      tipoFactura: 'venta',
      salesOrderId: 'PED-034',
      montoPagado: 150000,
      fechaPago: addDays(-1),
      referenciaOtroModulo: 'Ventas: pedido PED-034',
    },
  });
  updateDocument(v1.document_id, {
    status: 'Pagada',
    customFields: {
      tipoFactura: 'venta',
      referenciaOtroModulo: 'Ventas: pedido PED-033',
      montoPagado: 250000,
      fechaPago: addDays(0),
    },
  });

  const emitirCompra = (id, customFields) =>
    updateDocument(id, { status: 'Emitida', customFields });

  emitirCompra(c1.document_id, {
    tipoFactura: 'compra',
    centroCosto: 'Activo',
  });
  emitirCompra(c2.document_id, {
    tipoFactura: 'compra',
    centroCosto: 'Consumible',
    periodoLiquidacion: addDays(-15).slice(0, 7),
  });
  emitirCompra(c3.document_id, {
    tipoFactura: 'compra',
    centroCosto: 'Consumible',
  });
  emitirCompra(c4.document_id, {
    tipoFactura: 'compra',
    centroCosto: 'Consumible',
    periodoLiquidacion: addDays(-45).slice(0, 7),
  });

  updateDocument(c3.document_id, {
    status: 'Pagada',
    customFields: {
      tipoFactura: 'compra',
      centroCosto: 'Consumible',
      montoPagado: 260000,
      fechaPago: addDays(-1),
      referenciaOtroModulo: 'Compras: ord-0076',
    },
  });

  return {
    ok: true,
    entidades: [clientes.length, proveedores.length, personal.length],
    records: {
      terceros: loadEntities().length,
      facturas: loadDocuments().length,
      cobradas: [v1, v2, v3, v4, v5],
      compras: [c1, c2, c3, c4],
    },
  };
}
