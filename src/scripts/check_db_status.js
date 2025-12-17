import { PaymentMethod, Company, TaxConfiguration } from '../models/index.js';
import { sequelize } from '../models/index.js';

const checkDbStatus = async () => {
    try {
        console.log('--- Payment Methods ---');
        const pms = await PaymentMethod.findAll();
        if (pms.length === 0) {
            console.log('No Payment Methods found.');
        } else {
            pms.forEach(pm => {
                console.log(`ID: ${pm.id}, Name: ${pm.name}, Active: ${pm.is_active}`);
            });
        }

        console.log('\n--- Companies ---');
        const companies = await Company.findAll();
        if (companies.length === 0) {
            console.log('No Companies found.');
        } else {
            companies.forEach(c => {
                console.log(`ID: ${c.id}, Name: ${c.business_name}, NIT: ${c.nit}`);
            });
        }

        console.log('\n--- Tax Configurations ---');
        const taxes = await TaxConfiguration.findAll();
        taxes.forEach(t => {
            console.log(`Name: ${t.tax_name}, Rate: ${t.tax_rate}, Default: ${t.is_default}`);
        });

    } catch (error) {
        console.error('Error checking DB:', error);
    } finally {
        await sequelize.close();
    }
};

checkDbStatus();
