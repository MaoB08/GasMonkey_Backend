import { Resolution, Company } from '../models/index.js';
import { sequelize } from '../models/index.js';

const checkResolutions = async () => {
    try {
        console.log('--- Checking Resolutions ---');
        const companies = await Company.findAll();
        for (const c of companies) {
            console.log(`Company: ${c.business_name} (${c.id})`);
            const resolutions = await Resolution.findAll({ where: { company_id: c.id } });
            if (resolutions.length === 0) {
                console.log('  ❌ No resolutions found!');
            } else {
                resolutions.forEach(r => {
                    console.log(`  ✅ Resolution: ${r.resolution_number}, Prefix: ${r.prefix}, Active: ${r.is_active}, Current: ${r.current_number}/${r.to_number}`);
                });
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkResolutions();
