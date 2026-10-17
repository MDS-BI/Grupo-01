# Plan de Desarrollo: Módulo de Cuentas por Cobrar

Este documento define la estrategia de implementación del MVP del módulo de Finanzas utilizando Spec Driven Development.

## Fase 1: Definición y Diseño (Actual)
- Definir las entidades críticas (Cliente) y los documentos transaccionales (Facturas).
- Diseñar el Modelo Entidad-Relación (MER).
- Crear la documentación técnica (spec.md, data-model.md).

## Fase 2: Configuración del Template ERP
- Modificar el archivo `src/module-config.js` para adaptar el template al idioma español.
- Configurar la variable `moduleName` a "Módulo de Finanzas".
- Configurar el objeto `labels` para usar los términos "Cliente" y "Factura".

## Fase 3: Implementación de Campos Personalizados
- Agregar los campos específicos de la entidad Cliente (tax_id, credit_limit).
- Agregar los campos específicos del documento Factura (due_date, status).
- Definir el ciclo de vida del documento en `statusLifecycle` (Borrador -> Emitida -> Pagada).

## Fase 4: Pruebas y Despliegue Local
- Ejecutar el entorno de desarrollo local con Vite (`npm run dev`).
- Probar el flujo completo: Crear un Cliente -> Emitir Factura -> Cambiar Estado de Factura.
- Preparar la demostración funcional (demo) para la presentación final.
