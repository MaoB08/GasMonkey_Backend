import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import crypto from 'crypto';
import moment from 'moment';

import Invoice from '../models/Invoice.js';
import InvoiceItem from '../models/InvoiceItem.js';
import Company from '../models/Company.js';
import Customer from '../models/Customer.js';
import Resolution from '../models/Resolution.js';

import { generateCUFE } from './cufeGenerator.js';

function getDocumentTypeCode(customerType) {
    const codes = {
        'NIT': '31',
        'CC': '13',
        'CE': '22',
        'Pasaporte': '41',
        'TI': '12',
        'RC': '11'
    };
    return codes[customerType] || '13';
}

const invoiceService = {
    createInvoice: async (data, externalTransaction = null) => {
        // Si nos pasan una transacción, la usamos. Si no, creamos una nueva.
        // OJO: Si creamos una nueva, debemos encargarnos de commit/rollback.
        // Si usamos una externa, el llamador se encarga.
        const t = externalTransaction || await sequelize.transaction();
        const isExternalTransaction = !!externalTransaction;

        try {
            console.log('🚀 invoiceService.createInvoice params:', JSON.stringify(data));
            const {
                company_id,
                customer_id,
                items,
                payment_method,
                payment_means,
                due_days,
                notes,
                issue_date: overrideIssueDate // Para casos donde se quiera forzar fecha
            } = data;

            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new Error('Debe incluir al menos un item');
            }
            if (!company_id) throw new Error('company_id requerido');
            if (!customer_id) throw new Error('customer_id requerido');

            const company = await Company.findByPk(company_id, { transaction: t });
            if (!company) throw new Error('Empresa no encontrada');

            const resolution = await Resolution.findOne({
                where: { company_id, is_active: true },
                transaction: t
            });

            if (!resolution) throw new Error('No hay resolución activa');

            if (resolution.current_number >= resolution.to_number) {
                throw new Error('Resolución agotada');
            }

            const customer = await Customer.findByPk(customer_id, { transaction: t });
            if (!customer) throw new Error('Cliente no encontrado');

            // Procesar items y calcular totales
            let subtotal = 0;
            let taxTotal = 0;
            const processedItems = items.map((item, idx) => {
                // Asegurar valores numéricos
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unit_price) || 0;
                const ivaPercent = parseFloat(item.iva_percentage) || 0;

                const itemSubtotal = qty * price;
                const ivaAmount = itemSubtotal * (ivaPercent / 100);
                const itemTotal = itemSubtotal + ivaAmount;

                subtotal += itemSubtotal;
                taxTotal += ivaAmount;

                return {
                    line_number: idx + 1,
                    code: item.code || null,
                    name: item.name || null,
                    description: item.description || null,
                    quantity: qty,
                    unit_price: price,
                    iva_percentage: ivaPercent,
                    iva_amount: ivaAmount,
                    subtotal: itemSubtotal,
                    total: itemTotal,
                    unit_measure: item.unit_measure || 'UNI'
                };
            });

            const total = subtotal + taxTotal;

            const issueDate = overrideIssueDate || moment().format('YYYY-MM-DD');
            const issueTime = moment().format('HH:mm:ss');
            const dueDate = typeof due_days === 'number' ? moment(issueDate).add(due_days, 'days').format('YYYY-MM-DD') : null;

            // Bloquear resolución para obtener consecutivo
            const lockedResolution = await Resolution.findOne({
                where: { id: resolution.id },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!lockedResolution) {
                throw new Error('Resolución no encontrada al bloquear');
            }

            if (lockedResolution.current_number >= lockedResolution.to_number) {
                throw new Error('Resolución agotada');
            }

            const current = Number(resolution.current_number);
            const nextNumber = current + 1;
            const padded = String(nextNumber).padStart(6, '0');
            const fullNumber = `${lockedResolution.prefix}${padded}`;

            const existing = await Invoice.findOne({
                where: {
                    company_id,
                    prefix: lockedResolution.prefix,
                    number: nextNumber
                },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (existing) {
                throw new Error(`Número de factura ya existe: ${lockedResolution.prefix}${padded}`);
            }

            const newInvoice = await Invoice.create({
                company_id,
                resolution_id: lockedResolution.id,
                customer_id,
                prefix: lockedResolution.prefix,
                number: nextNumber,
                full_number: fullNumber,
                issue_date: issueDate,
                issue_time: issueTime,
                due_date: dueDate,
                subtotal: subtotal.toFixed(2),
                tax_total: taxTotal.toFixed(2),
                total: total.toFixed(2),
                payment_method: payment_method || null,
                payment_means: payment_means || null,
                notes: notes || null,
                status: 'draft'
            }, { transaction: t });

            for (const it of processedItems) {
                await InvoiceItem.create({
                    invoice_id: newInvoice.id,
                    line_number: it.line_number,
                    code: it.code,
                    name: it.name,
                    description: it.description,
                    quantity: it.quantity,
                    unit_price: it.unit_price,
                    iva_percentage: it.iva_percentage,
                    iva_amount: it.iva_amount,
                    subtotal: it.subtotal,
                    total: it.total,
                    unit_measure: it.unit_measure
                }, { transaction: t });
            }

            // Actualizar consecutivo
            lockedResolution.current_number = nextNumber;
            await lockedResolution.save({ transaction: t });

            // Generar CUFE
            const cufe = generateCUFE({
                invoiceNumber: newInvoice.full_number,
                issueDate: issueDate.replace(/-/g, ''),
                issueTime: issueTime,
                subtotal: newInvoice.subtotal,
                taxTotal: newInvoice.tax_total,
                total: newInvoice.total,
                nit: company.nit,
                customerDocumentType: getDocumentTypeCode(customer.customer_type),
                customerDocumentNumber: customer.document_number,
                technicalKey: lockedResolution.technical_key,
                testSetId: company.test_set_id
            });

            newInvoice.cufe = cufe;
            await newInvoice.save({ transaction: t });

            // Commit si somos dueños de la transacción
            if (!isExternalTransaction) {
                await t.commit();
            }

            // Devolver factura cruda (modelo sequelize) para que el controlador decida qué enviar
            // O podemos recargar con includes si es necesario, pero por ahora devolvemos la instancia base
            return newInvoice;

        } catch (error) {
            if (!isExternalTransaction) {
                await t.rollback();
            }
            throw error;
        }
    }
};

export default invoiceService;
