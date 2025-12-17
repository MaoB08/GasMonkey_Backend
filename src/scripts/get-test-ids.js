// scripts/get-test-ids.js
// Helper script to get real company_id and customer_id from database
import { sequelize } from '../models/index.js';
import Company from '../models/Company.js';
import Customer from '../models/Customer.js';

async function getTestIds() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a la base de datos\n');

        // Get first company
        const company = await Company.findOne({
            order: [['createdAt', 'ASC']]
        });

        // Get first customer
        const customer = await Customer.findOne({
            order: [['createdAt', 'ASC']]
        });

        if (!company) {
            console.error('❌ No se encontró ninguna empresa en la base de datos');
            console.log('\n💡 Necesitas crear una empresa primero.');
            process.exit(1);
        }

        if (!customer) {
            console.error('❌ No se encontró ningún cliente en la base de datos');
            console.log('\n💡 Necesitas crear un cliente primero.');
            process.exit(1);
        }

        console.log('📋 IDs encontrados:\n');
        console.log(`Company ID: "${company.id}"`);
        console.log(`  - Nombre: ${company.business_name}`);
        console.log(`  - NIT: ${company.nit}\n`);

        console.log(`Customer ID: "${customer.id}"`);
        console.log(`  - Nombre: ${customer.business_name || `${customer.first_name} ${customer.last_name}`}`);
        console.log(`  - Documento: ${customer.document_number}\n`);

        console.log('📝 Actualiza test-manual.js con estos valores:\n');
        console.log(`company_id: "${company.id}",`);
        console.log(`customer_id: "${customer.id}",\n`);

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

getTestIds();
