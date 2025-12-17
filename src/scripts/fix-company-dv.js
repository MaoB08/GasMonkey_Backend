import sequelize from '../config/db.js';
import Company from '../models/Company.js';

/**
 * Calcular dígito de verificación del NIT
 */
function calculateDV(nit) {
    if (!nit) return '';

    const nitStr = nit.toString();
    const primes = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

    let sum = 0;
    for (let i = 0; i < nitStr.length; i++) {
        sum += parseInt(nitStr[nitStr.length - 1 - i]) * primes[i];
    }

    const remainder = sum % 11;
    const dv = remainder > 1 ? 11 - remainder : remainder;

    return dv.toString();
}

async function fixCompanyDV() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida\n');

        // Obtener todas las empresas
        const companies = await Company.findAll();

        if (companies.length === 0) {
            console.log('❌ No se encontraron empresas en la base de datos');
            process.exit(0);
        }

        console.log(`📊 Empresas encontradas: ${companies.length}\n`);

        let fixed = 0;
        let alreadyCorrect = 0;

        for (const company of companies) {
            const calculatedDV = calculateDV(company.nit);

            console.log(`\n${'='.repeat(60)}`);
            console.log(`Empresa: ${company.business_name}`);
            console.log(`NIT: ${company.nit}`);
            console.log(`DV actual: ${company.dv}`);
            console.log(`DV correcto: ${calculatedDV}`);

            if (company.dv !== calculatedDV) {
                console.log(`❌ DV incorrecto, corrigiendo...`);

                // Actualizar el DV
                await company.update({ dv: calculatedDV });

                console.log(`✅ DV actualizado de '${company.dv}' a '${calculatedDV}'`);
                fixed++;
            } else {
                console.log(`✅ DV ya es correcto`);
                alreadyCorrect++;
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`\n📊 Resumen:`);
        console.log(`   - Empresas corregidas: ${fixed}`);
        console.log(`   - Empresas ya correctas: ${alreadyCorrect}`);
        console.log(`   - Total: ${companies.length}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixCompanyDV();
