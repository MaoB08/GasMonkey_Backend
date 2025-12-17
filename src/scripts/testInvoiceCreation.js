import invoiceService from '../services/invoiceService.js';
import { sequelize } from '../models/index.js';

const testInvoice = async () => {
    try {
        console.log('🧪 Testing Invoice Creation...');

        console.log('🔍 Fetching test data from DB...');
        const company = await sequelize.models.Company.findOne();
        if (!company) throw new Error('No company found in DB to test with');

        const customer = await sequelize.models.Customer.findOne({ where: { company_id: company.id } });
        if (!customer) throw new Error('No customer found for this company');

        console.log(`Using Company: ${company.business_name} (${company.id})`);
        console.log(`Using Customer: ${customer.business_name || customer.first_name} (${customer.id})`);

        // Mock data similar to what saleController constructs
        const invoiceData = {
            company_id: company.id,
            customer_id: customer.id,
            payment_method: 'Contado',
            payment_means: 'Efectivo',
            due_days: 0,
            notes: 'Test invoice from script',
            items: [
                {
                    code: 'TEST-001',
                    name: 'Test Product',
                    description: 'Test Description',
                    quantity: 1,
                    unit_price: 1000,
                    iva_percentage: 19,
                    unit_measure: 'UNI'
                }
            ]
        };

        const invoice = await invoiceService.createInvoice(invoiceData);
        console.log('✅ Invoice created successfully:', invoice.full_number);
        console.log('CUFE:', invoice.cufe);

    } catch (error) {
        console.error('❌ Error creating invoice:', error.message);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
    } finally {
        await sequelize.close();
    }
};

testInvoice();
