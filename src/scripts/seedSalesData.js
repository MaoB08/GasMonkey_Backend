import { PaymentMethod, TaxConfiguration } from '../models/index.js';
import { sequelize } from '../models/index.js';

const seedSalesData = async () => {
    try {
        console.log('🌱 Iniciando seed de datos de ventas...');

        // Crear métodos de pago por defecto
        const paymentMethods = [
            { name: 'Efectivo', description: 'Pago en efectivo' },
            { name: 'Transferencia Bancaria', description: 'Transferencia electrónica' },
            { name: 'Tarjeta de Crédito', description: 'Pago con tarjeta de crédito' },
            { name: 'Tarjeta de Débito', description: 'Pago con tarjeta de débito' },
            { name: 'Crédito', description: 'Pago a crédito' }
        ];

        for (const pm of paymentMethods) {
            console.log(`Checking payment method: ${pm.name}`);
            const existing = await PaymentMethod.findOne({ where: { name: pm.name } });
            if (!existing) {
                try {
                    const created = await PaymentMethod.create({
                        ...pm,
                        is_active: true
                    });
                    console.log(`✅ Método de pago creado: ${created.name} (ID: ${created.id})`);
                } catch (err) {
                    console.error(`❌ Error creating ${pm.name}:`, err.message);
                }
            } else {
                console.log(`ℹ️ Payment method exists: ${pm.name} (ID: ${existing.id}, Active: ${existing.is_active})`);
                if (!existing.is_active) {
                    await existing.update({ is_active: true });
                    console.log(`🔄 Reactivated ${pm.name}`);
                }
            }
        }

        // Crear configuración de impuestos por defecto
        const taxConfigs = [
            { tax_name: 'IVA', tax_rate: 19, is_default: true, description: 'Impuesto al Valor Agregado estándar en Colombia' },
            { tax_name: 'IVA Reducido', tax_rate: 5, is_default: false, description: 'IVA reducido para productos básicos' },
            { tax_name: 'Exento', tax_rate: 0, is_default: false, description: 'Productos exentos de IVA' }
        ];

        for (const tax of taxConfigs) {
            const existing = await TaxConfiguration.findOne({ where: { tax_name: tax.tax_name } });
            if (!existing) {
                await TaxConfiguration.create(tax);
                console.log(`✅ Configuración de impuesto creada: ${tax.tax_name} (${tax.tax_rate}%)`);
            }
        }

        console.log('✅ Seed de datos de ventas completado');
    } catch (error) {
        console.error('❌ Error en seed de datos de ventas:', error);
    }
};

// Ejecutar si se llama directamente
console.log('Script started...');
seedSalesData().then(() => {
    console.log('Seed completado, cerrando conexión...');
    sequelize.close();
}).catch(err => {
    console.error('Fatal error:', err);
});

export default seedSalesData;
