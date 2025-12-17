// scripts/test-manual.js
import axios from 'axios';
import chalk from 'chalk';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Colores para el output
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
  title: (msg) => console.log(chalk.bold.cyan('\n' + '='.repeat(50) + '\n' + msg + '\n' + '='.repeat(50)))
};

const testData = {
  facturaValida: {
    company_id: "9e0500fb-6e79-42c8-809c-a3b83de41040",
    customer_id: "3733e830-eab4-424c-a7e8-31a0cf04056d",
    items: [
      {
        code: 'PROD001',
        name: 'Producto 1',
        description: 'Descripción del producto 1',
        quantity: 2,
        unit_price: 50000,
        iva_percentage: 19,
        unit_measure: 'UNI'
      },
      {
        code: 'PROD002',
        name: 'Producto 2',
        description: 'Descripción del producto 2',
        quantity: 1,
        unit_price: 80000,
        iva_percentage: 19,
        unit_measure: 'UNI'
      }
    ],
    payment_method: 'Contado',
    payment_means: '10', // Efectivo
    due_days: 0,
    notes: 'Factura de prueba generada automáticamente'
  }
};

let createdInvoiceId = null;
let createdCufe = null;

// Test 1: Crear Factura
async function testCrearFactura() {
  log.title('TEST 1: CREAR FACTURA');

  try {
    log.info('Enviando factura a la API...');
    const response = await axios.post(`${API_URL}/invoices`, testData.facturaValida);

    if (response.data.message) {
      log.success('Factura creada exitosamente');
      console.log(JSON.stringify(response.data, null, 2));

      createdInvoiceId = response.data.invoice.id;
      createdCufe = response.data.invoice.cufe;

      log.info(`ID: ${createdInvoiceId}`);
      log.info(`CUFE: ${createdCufe}`);
      log.info(`Estado: ${response.data.invoice.status}`);
      log.info(`Número: ${response.data.invoice.full_number}`);

      return true;
    }
  } catch (error) {
    log.error('Error al crear factura');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Test 2: Obtener Factura por ID
async function testObtenerFactura() {
  log.title('TEST 2: OBTENER FACTURA POR ID');

  if (!createdInvoiceId) {
    log.error('No hay ID de factura. Ejecuta primero testCrearFactura()');
    return false;
  }

  try {
    log.info(`Obteniendo factura ${createdInvoiceId}...`);
    const response = await axios.get(`${API_URL}/invoices/${createdInvoiceId}`);

    if (response.data.invoice) {
      log.success('Factura obtenida exitosamente');
      console.log(JSON.stringify(response.data.invoice, null, 2));
      return true;
    }
  } catch (error) {
    log.error('Error al obtener factura');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Test 3: Enviar a DIAN
async function testEnviarDIAN() {
  log.title('TEST 3: ENVIAR FACTURA A DIAN');

  if (!createdInvoiceId) {
    log.error('No hay ID de factura. Ejecuta primero testCrearFactura()');
    return false;
  }

  try {
    log.info(`Enviando factura ${createdInvoiceId} a DIAN...`);
    const response = await axios.post(`${API_URL}/invoices/${createdInvoiceId}/send-to-dian`);

    if (response.data.message) {
      log.success('Factura enviada a DIAN exitosamente');
      console.log(JSON.stringify(response.data, null, 2));

      if (process.env.DEMO_MODE === 'true') {
        log.warning('Modo DEMO activo - usando mock de DIAN');
      }

      return true;
    }
  } catch (error) {
    log.error('Error al enviar a DIAN');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Test 4: Listar Facturas
async function testListarFacturas() {
  log.title('TEST 4: LISTAR FACTURAS');

  try {
    log.info('Obteniendo lista de facturas...');
    const response = await axios.get(`${API_URL}/invoices?page=1&limit=10`);

    if (response.data.invoices) {
      log.success(`Se encontraron ${response.data.invoices.length} facturas`);
      console.log(JSON.stringify(response.data, null, 2));

      response.data.invoices.forEach((factura, index) => {
        console.log(`\n${index + 1}. ${factura.full_number} - ${factura.status} - $${factura.total}`);
      });

      return true;
    }
  } catch (error) {
    log.error('Error al listar facturas');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Test 5: Validación de Datos Inválidos
async function testDatosInvalidos() {
  log.title('TEST 5: VALIDACIÓN DE DATOS INVÁLIDOS');

  const testCases = [
    {
      name: 'Factura sin company_id',
      data: { ...testData.facturaValida, company_id: undefined }
    },
    {
      name: 'Factura sin customer_id',
      data: { ...testData.facturaValida, customer_id: undefined }
    },
    {
      name: 'Factura sin items',
      data: { ...testData.facturaValida, items: [] }
    }
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    try {
      log.info(`Probando: ${testCase.name}...`);
      await axios.post(`${API_URL}/invoices`, testCase.data);
      log.error(`${testCase.name}: Debió rechazarse pero fue aceptada`);
      allPassed = false;
    } catch (error) {
      if (error.response?.status === 400) {
        log.success(`${testCase.name}: Rechazada correctamente`);
      } else {
        log.error(`${testCase.name}: Error inesperado`);
        console.error(error.message);
        allPassed = false;
      }
    }
  }

  return allPassed;
}

// Test 6: Rendimiento
async function testRendimiento() {
  log.title('TEST 6: PRUEBA DE RENDIMIENTO');

  const numFacturas = 5;
  log.info(`Creando ${numFacturas} facturas secuencialmente...`);

  const start = Date.now();

  try {
    const results = [];

    // Crear facturas secuencialmente para evitar conflictos de numeración
    for (let i = 0; i < numFacturas; i++) {
      const response = await axios.post(`${API_URL}/invoices`, {
        ...testData.facturaValida
      });
      results.push(response);
      // Pequeña pausa para evitar race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = Date.now() - start;

    const successful = results.filter(r => r.data.message).length;

    log.success(`${successful}/${numFacturas} facturas creadas exitosamente`);
    log.info(`Tiempo total: ${duration}ms`);
    log.info(`Promedio: ${Math.round(duration / numFacturas)}ms por factura`);

    return true;
  } catch (error) {
    log.error('Error en prueba de rendimiento');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Test 7: Modo Demo vs Producción
async function testModoOperacion() {
  log.title('TEST 7: VERIFICAR MODO DE OPERACIÓN');

  try {
    log.info('Verificando modo de operación...');

    if (process.env.DEMO_MODE === 'true') {
      log.warning('Sistema en MODO DEMO');
      log.info('- Usando mock de DIAN');
      log.info('- No se envían datos reales');
      log.info('- Respuestas simuladas');
    } else {
      log.info('Sistema en MODO PRODUCCIÓN');
      log.info('- Usando DIAN real');
      log.info('- Enviando datos reales');
      log.info('- Respuestas oficiales');
    }

    return true;
  } catch (error) {
    log.error('Error al verificar modo');
    console.error(error.message);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log(chalk.bold.magenta('\n' + '█'.repeat(60)));
  console.log(chalk.bold.magenta('███ SUITE DE PRUEBAS - SISTEMA DE FACTURACIÓN ███'));
  console.log(chalk.bold.magenta('█'.repeat(60) + '\n'));

  const tests = [
    { name: 'Verificar Modo Operación', fn: testModoOperacion },
    { name: 'Crear Factura', fn: testCrearFactura },
    { name: 'Obtener Factura', fn: testObtenerFactura },
    { name: 'Enviar a DIAN', fn: testEnviarDIAN },
    { name: 'Listar Facturas', fn: testListarFacturas },
    { name: 'Validación Datos Inválidos', fn: testDatosInvalidos },
    { name: 'Rendimiento', fn: testRendimiento }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });

      // Pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ name: test.name, passed: false });
      log.error(`Test "${test.name}" falló con error: ${error.message}`);
    }
  }

  // Resumen
  log.title('RESUMEN DE PRUEBAS');

  results.forEach(result => {
    if (result.passed) {
      log.success(result.name);
    } else {
      log.error(result.name);
    }
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(chalk.bold(`\n${passed}/${total} pruebas pasaron exitosamente\n`));

  if (passed === total) {
    console.log(chalk.bold.green('🎉 ¡TODAS LAS PRUEBAS PASARON! 🎉\n'));
  } else {
    console.log(chalk.bold.red('⚠️  ALGUNAS PRUEBAS FALLARON ⚠️\n'));
  }
}

// Ejecutar
runAllTests().catch(error => {
  log.error('Error fatal en suite de pruebas');
  console.error(error);
  process.exit(1);
});