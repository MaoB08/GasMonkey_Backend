import { sendInvoiceToDIAN } from '../services/dianAdapter.js';

const testInvoice = {
  numero: 'TEST-001',
  cliente: { nit: '123', nombre: 'Test' },
  items: [{ descripcion: 'Test', cantidad: 1, precio: 100 }]
};

console.log('🧪 Probando adapter...\n');

const response = await sendInvoiceToDIAN(testInvoice);

console.log('📦 Respuesta:', response);
console.log(response.demo ? '🎭 MODO DEMO' : '🔌 MODO PRODUCCIÓN');