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

async function checkCompanyDV() {
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

        companies.forEach((company, index) => {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`Empresa ${index + 1}: ${company.business_name}`);
            console.log(`${'='.repeat(60)}`);
            console.log(`ID: ${company.id}`);
            console.log(`NIT almacenado: ${company.nit}`);
            console.log(`DV almacenado: ${company.dv}`);

            const calculatedDV = calculateDV(company.nit);
            console.log(`DV calculado: ${calculatedDV}`);

            if (company.dv === calculatedDV) {
                console.log('✅ DV CORRECTO');
            } else {
                console.log(`❌ DV INCORRECTO`);
                console.log(`   Se esperaba: ${calculatedDV}`);
                console.log(`   Se recibió: ${company.dv}`);
                console.log(`\n💡 Para corregir, ejecuta:`);
                console.log(`   UPDATE companies SET dv = '${calculatedDV}' WHERE id = '${company.id}';`);
            }
        });

        console.log(`\n${'='.repeat(60)}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkCompanyDV();
