import Company from '../models/Company.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import InvoiceItem from '../models/InvoiceItem.js';
import Resolution from '../models/Resolution.js';

async function seedDemoData() {
  console.log('🎓 Creando datos de demostración educativa...\n');

  // 1. Empresa ficticia
  const company = await Company.create({
    nit: '900999999',
    dv: '9',
    business_name: 'EMPRESA DEMO EDUCATIVA S.A.S',
    address: 'Calle Demo #00-00',
    city: 'Bogotá D.C.',
    department: 'Cundinamarca',
    phone: '601-0000000',
    email: 'demo@universidad.edu.co',
    tax_regime: 'Régimen Común',
    responsibilities: ['R-99-PN', 'O-13'],
    
    // Datos ficticios
    test_set_id: 'demo-test-set-001',
    software_id: '00000000-0000-0000-0000-000000000000',
    software_pin: '0000',
    certificate_path: './certificates/test-certificate.p12',
    certificate_password: 'test123'
  });

  console.log('✅ Empresa demo:', company.business_name);

  // 2. Resolución ficticia
  const resolution = await Resolution.create({
    company_id: company.id,
    resolution_number: 'DEMO-2024-001',
    resolution_date: '2024-01-01',
    prefix: 'DEMO',
    from_number: 1,
    to_number: 999999,
    current_number: 0,
    technical_key: 'demo-key-12345',
    valid_from: '2024-01-01',
    valid_to: '2099-12-31',
    is_active: true
  });

  console.log('✅ Resolución demo:', resolution.resolution_number);

  // 3. Clientes ficticios
  const customers = await Customer.bulkCreate([
    {
      company_id: company.id,
      customer_type: 'NIT',
      document_number: '800111222',
      dv: '3',
      business_name: 'CLIENTE CORPORATIVO DEMO LTDA',
      email: 'cliente1@demo.com',
      phone: '300-1111111',
      address: 'Carrera 1 #1-11',
      city: 'Medellín',
      department: 'Antioquia',
      tax_regime: 'Régimen Común'
    },
    {
      company_id: company.id,
      customer_type: 'CC',
      document_number: '1234567890',
      first_name: 'Juan',
      last_name: 'Pérez Demo',
      email: 'juan@demo.com',
      phone: '300-2222222',
      address: 'Calle 2 #2-22',
      city: 'Cali',
      department: 'Valle del Cauca',
      tax_regime: 'Persona Natural'
    },
    {
      company_id: company.id,
      customer_type: 'CE',
      document_number: 'CE98765432',
      first_name: 'María',
      last_name: 'García Demo',
      email: 'maria@demo.com',
      phone: '300-3333333',
      address: 'Avenida 3 #3-33',
      city: 'Barranquilla',
      department: 'Atlántico',
      tax_regime: 'Persona Natural'
    }
  ]);

  console.log('✅ Clientes demo:', customers.length);

  // 4. Productos ficticios
  const products = await Product.bulkCreate([
    {
      company_id: company.id,
      code: 'LAPTOP-001',
      name: 'Laptop Dell Inspiron 15',
      description: 'Laptop para estudiantes y profesionales',
      unit_measure: 'UNI',
      price: 2500000,
      iva_percentage: 19
    },
    {
      company_id: company.id,
      code: 'MOUSE-001',
      name: 'Mouse Inalámbrico Logitech',
      description: 'Mouse ergonómico inalámbrico',
      unit_measure: 'UNI',
      price: 80000,
      iva_percentage: 19
    },
    {
      company_id: company.id,
      code: 'TECLADO-001',
      name: 'Teclado Mecánico RGB',
      description: 'Teclado gaming con iluminación RGB',
      unit_measure: 'UNI',
      price: 350000,
      iva_percentage: 19
    },
    {
      company_id: company.id,
      code: 'MONITOR-001',
      name: 'Monitor LG 27" 4K',
      description: 'Monitor UltraHD para diseño',
      unit_measure: 'UNI',
      price: 1200000,
      iva_percentage: 19
    },
    {
      company_id: company.id,
      code: 'CONSULT-001',
      name: 'Consultoría Técnica',
      description: 'Hora de consultoría en desarrollo',
      unit_measure: 'HOR',
      price: 150000,
      iva_percentage: 19
    }
  ]);

  console.log('✅ Productos demo:', products.length);

  // 5. Crear algunas facturas de ejemplo
  const invoicesData = [
    {
      customer: customers[0],
      items: [
        { product: products[0], quantity: 2 },
        { product: products[3], quantity: 1 }
      ]
    },
    {
      customer: customers[1],
      items: [
        { product: products[1], quantity: 3 },
        { product: products[2], quantity: 1 }
      ]
    },
    {
      customer: customers[2],
      items: [
        { product: products[4], quantity: 10 }
      ]
    }
  ];

  for (const [index, invoiceData] of invoicesData.entries()) {
    let subtotal = 0;
    let taxTotal = 0;

    const items = invoiceData.items.map(item => {
      const itemSubtotal = item.quantity * item.product.price;
      const itemTax = itemSubtotal * (item.product.iva_percentage / 100);
      
      subtotal += itemSubtotal;
      taxTotal += itemTax;

      return {
        code: item.product.code,
        name: item.product.name,
        description: item.product.description,
        quantity: item.quantity,
        unit_price: item.product.price,
        iva_percentage: item.product.iva_percentage,
        iva_amount: itemTax,
        subtotal: itemSubtotal,
        total: itemSubtotal + itemTax,
        unit_measure: item.product.unit_measure
      };
    });

    const invoice = await Invoice.create({
      company_id: company.id,
      resolution_id: resolution.id,
      customer_id: invoiceData.customer.id,
      prefix: 'DEMO',
      number: index + 1,
      full_number: `DEMO${(index + 1).toString().padStart(6, '0')}`,
      issue_date: new Date().toISOString().split('T')[0],
      issue_time: new Date().toTimeString().split(' ')[0],
      subtotal: subtotal.toFixed(2),
      tax_total: taxTotal.toFixed(2),
      total: (subtotal + taxTotal).toFixed(2),
      payment_method: 'Contado',
      payment_means: 'Efectivo',
      status: 'accepted',
      cufe: `DEMO-CUFE-${crypto.randomBytes(32).toString('hex')}`
    });

    for (const [itemIndex, item] of items.entries()) {
      await InvoiceItem.create({
        invoice_id: invoice.id,
        line_number: itemIndex + 1,
        ...item
      });
    }

    console.log(`✅ Factura demo ${invoice.full_number} creada`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Datos de demostración creados exitosamente');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Datos generados:');
  console.log(`   - 1 Empresa demo`);
  console.log(`   - 1 Resolución`);
  console.log(`   - ${customers.length} Clientes`);
  console.log(`   - ${products.length} Productos`);
  console.log(`   - ${invoicesData.length} Facturas de ejemplo`);
  console.log('\n🎓 ¡Listo para practicar!');
}

import crypto from 'crypto';
seedDemoData().then(() => process.exit(0));