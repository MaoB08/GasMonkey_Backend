import * as dianReal from './dianService.js';
import * as dianMock from './dianServiceMock.js';

const IS_DEMO = process.env.DEMO_MODE === 'true';

/**
 * Adaptador que usa servicio real o mock según configuración
 */
export const sendInvoiceToDIAN = IS_DEMO 
  ? dianMock.sendInvoiceToDIANMock 
  : dianReal.sendInvoiceToDIAN;

export const getInvoiceStatus = IS_DEMO
  ? dianMock.getInvoiceStatusMock
  : dianReal.getInvoiceStatus;

export const sendTestSet = IS_DEMO
  ? dianMock.sendTestSetMock
  : dianReal.sendTestSet;

export const getTestSetStatus = IS_DEMO
  ? dianMock.getTestSetStatusMock
  : dianReal.getTestSetStatus;

// Log del modo activo
if (IS_DEMO) {
  console.log('🎭 MODO DEMO ACTIVO: Las facturas NO se envían a la DIAN real');
} else {
  console.log('🔴 MODO PRODUCCIÓN: Las facturas se enviarán a la DIAN real');
}