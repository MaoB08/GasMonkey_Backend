/**
 * Servicio MOCK de la DIAN para desarrollo y demos
 * Simula las respuestas de la DIAN sin conectarse realmente
 */

import crypto from 'crypto';

/**
 * Simula el envío de factura a la DIAN
 */
export async function sendInvoiceToDIANMock(invoiceData) {
  console.log('🎭 MODO DEMO: Simulando envío a DIAN...');
  
  // Simular delay de red
  await delay(2000);
  
  // Generar Track ID ficticio
  const trackId = `DEMO-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  
  // Simular respuesta exitosa de la DIAN
  return {
    success: true,
    trackId: trackId,
    statusCode: '00',
    statusDescription: 'Documento recibido exitosamente (DEMO)',
    response: {
      trackId: trackId,
      timestamp: new Date().toISOString(),
      message: '✅ Esta es una simulación. En producción se conectaría a la DIAN real.',
      demo: true
    }
  };
}

/**
 * Simula la consulta de estado en la DIAN
 */
export async function getInvoiceStatusMock(trackId, nit) {
  console.log('🎭 MODO DEMO: Simulando consulta de estado...');
  
  await delay(1500);
  
  // Simular validación exitosa
  return {
    success: true,
    status: 'ACEPTADO',
    statusCode: '00',
    statusDescription: 'Documento aceptado por la DIAN (DEMO)',
    errors: [],
    response: {
      trackId: trackId,
      documentStatus: 'ACEPTADO',
      validations: [
        {
          rule: 'XML bien formado',
          status: 'APROBADO',
          message: '✅ Estructura XML válida'
        },
        {
          rule: 'CUFE válido',
          status: 'APROBADO',
          message: '✅ CUFE calculado correctamente'
        },
        {
          rule: 'Firma digital',
          status: 'APROBADO',
          message: '✅ Firma digital válida (demo)'
        },
        {
          rule: 'Numeración',
          status: 'APROBADO',
          message: '✅ Numeración correcta'
        }
      ],
      demo: true,
      note: 'Esta es una simulación educativa. Los datos NO se envían a la DIAN real.'
    }
  };
}

/**
 * Simula el envío de SetPruebas
 */
export async function sendTestSetMock(testSetData) {
  console.log('🎭 MODO DEMO: Simulando envío de SetPruebas...');
  
  await delay(3000);
  
  const trackId = `TESTSET-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  
  return {
    success: true,
    trackId: trackId,
    statusCode: '00',
    statusDescription: 'SetPruebas recibido (DEMO)',
    response: {
      trackId: trackId,
      documentsReceived: testSetData.documents.length,
      message: '✅ En modo real, esto enviaría las facturas a la DIAN para validación',
      demo: true
    }
  };
}

/**
 * Simula consulta de estado del SetPruebas
 */
export async function getTestSetStatusMock(trackId, nit) {
  console.log('🎭 MODO DEMO: Simulando consulta de SetPruebas...');
  
  await delay(2000);
  
  // Simular algunos casos aprobados y otros rechazados para demo
  const demoValidations = [
    {
      documentKey: 'TEST1',
      documentType: '01',
      isValid: true,
      errors: [],
      statusCode: '00',
      statusDescription: 'Aprobado'
    },
    {
      documentKey: 'TEST2',
      documentType: '01',
      isValid: false,
      errors: ['Error de ejemplo: Campo XYZ requerido'],
      statusCode: '99',
      statusDescription: 'Rechazado (ejemplo educativo)'
    }
  ];
  
  return {
    success: true,
    status: 'PROCESADO',
    statusCode: '00',
    statusDescription: 'SetPruebas validado (DEMO)',
    errors: [],
    validations: demoValidations,
    demo: true
  };
}

/**
 * Función helper para simular delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generar respuesta de error simulada
 */
export function generateMockError(errorType = 'VALIDATION') {
  const errors = {
    'VALIDATION': {
      success: false,
      error: 'Error de validación (DEMO)',
      details: [
        'Campo obligatorio faltante',
        'CUFE no coincide',
        'Formato de fecha incorrecto'
      ]
    },
    'TIMEOUT': {
      success: false,
      error: 'Timeout (DEMO)',
      details: 'Tiempo de espera agotado'
    },
    'CERTIFICATE': {
      success: false,
      error: 'Error de certificado (DEMO)',
      details: 'Certificado vencido o inválido'
    }
  };
  
  return errors[errorType] || errors['VALIDATION'];
}