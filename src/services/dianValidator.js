import moment from 'moment';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateCUFE } from './cufeGenerator.js';

// Leer reglas de validación
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const validationRules = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../config/validation-rules.json'), 'utf-8')
);

/**
 * Validar factura completa según requisitos DIAN
 */
export function validateInvoiceForDIAN(invoice, company, customer, items, resolution) {
    const errors = [];
    const warnings = [];

    // Ejecutar todas las validaciones
    errors.push(...validateCompanyData(company));
    errors.push(...validateCustomerData(customer));
    errors.push(...validateResolution(invoice, resolution));
    errors.push(...validateDates(invoice));
    errors.push(...validateItems(items));
    errors.push(...validateTaxes(items, invoice));
    errors.push(...validateTotals(items, invoice));
    errors.push(...validateCUFE(invoice, company, customer, resolution));
    errors.push(...validatePaymentInfo(invoice));

    // Warnings (no bloquean pero alertan)
    warnings.push(...generateWarnings(invoice, company, customer, items));

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validar datos de la empresa (emisor)
 */
function validateCompanyData(company) {
    const errors = [];

    if (!company) {
        errors.push('Datos de la empresa no encontrados');
        return errors;
    }

    // NIT
    if (!company.nit) {
        errors.push('NIT del emisor es requerido');
    } else {
        // Validar formato NIT (solo números)
        if (!/^\d+$/.test(company.nit)) {
            errors.push('NIT debe contener solo números');
        }
    }

    // Dígito de verificación
    if (!company.dv) {
        errors.push('Dígito de verificación del NIT es requerido');
    } else {
        const calculatedDV = calculateDV(company.nit);
        if (company.dv !== calculatedDV) {
            errors.push(`Dígito de verificación incorrecto. Esperado: ${calculatedDV}, Recibido: ${company.dv}`);
        }
    }

    // Razón social
    if (!company.business_name || company.business_name.trim() === '') {
        errors.push('Razón social del emisor es requerida');
    }

    // Dirección
    if (!company.address || company.address.trim() === '') {
        errors.push('Dirección del emisor es requerida');
    }

    // Ciudad y departamento
    if (!company.city || company.city.trim() === '') {
        errors.push('Ciudad del emisor es requerida');
    }
    if (!company.department || company.department.trim() === '') {
        errors.push('Departamento del emisor es requerido');
    }

    // Email
    if (!company.email) {
        errors.push('Email del emisor es requerido');
    } else if (!isValidEmail(company.email)) {
        errors.push('Email del emisor no tiene formato válido');
    }

    // Software ID
    if (!company.software_id) {
        errors.push('Software ID no configurado');
    }

    // Certificado digital
    if (!company.certificate_path) {
        errors.push('Certificado digital no configurado');
    }

    return errors;
}

/**
 * Validar datos del cliente (adquirente)
 */
function validateCustomerData(customer) {
    const errors = [];

    if (!customer) {
        errors.push('Datos del cliente no encontrados');
        return errors;
    }

    // Tipo de documento
    if (!customer.customer_type) {
        errors.push('Tipo de documento del cliente es requerido');
    } else if (!validationRules.document_types.includes(customer.customer_type)) {
        errors.push(`Tipo de documento inválido. Debe ser uno de: ${validationRules.document_types.join(', ')}`);
    }

    // Número de documento
    if (!customer.document_number || customer.document_number.trim() === '') {
        errors.push('Número de documento del cliente es requerido');
    }

    // DV si es NIT
    if (customer.customer_type === 'NIT') {
        if (!customer.dv) {
            errors.push('Dígito de verificación del cliente es requerido para NIT');
        } else {
            const calculatedDV = calculateDV(customer.document_number);
            if (customer.dv !== calculatedDV) {
                errors.push(`Dígito de verificación del cliente incorrecto. Esperado: ${calculatedDV}, Recibido: ${customer.dv}`);
            }
        }
    }

    // Nombre o razón social
    const hasBusinessName = customer.business_name && customer.business_name.trim() !== '';
    const hasPersonName = (customer.first_name && customer.first_name.trim() !== '') ||
        (customer.last_name && customer.last_name.trim() !== '');

    if (!hasBusinessName && !hasPersonName) {
        errors.push('Nombre o razón social del cliente es requerido');
    }

    // Dirección
    if (!customer.address || customer.address.trim() === '') {
        errors.push('Dirección del cliente es requerida');
    }

    // Email
    if (!customer.email) {
        errors.push('Email del cliente es requerido');
    } else if (!isValidEmail(customer.email)) {
        errors.push('Email del cliente no tiene formato válido');
    }

    return errors;
}

/**
 * Validar resolución y numeración
 */
function validateResolution(invoice, resolution) {
    const errors = [];

    if (!resolution) {
        errors.push('Resolución DIAN no encontrada');
        return errors;
    }

    // Resolución activa
    if (!resolution.is_active) {
        errors.push('La resolución DIAN no está activa');
    }

    // Número dentro del rango
    if (invoice.number < resolution.from_number) {
        errors.push(`Número de factura ${invoice.number} está por debajo del rango autorizado (desde: ${resolution.from_number})`);
    }
    if (invoice.number > resolution.to_number) {
        errors.push(`Número de factura ${invoice.number} excede el rango autorizado (hasta: ${resolution.to_number})`);
    }

    // Prefijo correcto
    if (invoice.prefix !== resolution.prefix) {
        errors.push(`Prefijo de factura no coincide. Esperado: ${resolution.prefix}, Recibido: ${invoice.prefix}`);
    }

    // Vigencia de la resolución
    const today = moment().format('YYYY-MM-DD');
    if (moment(today).isBefore(resolution.valid_from)) {
        errors.push(`La resolución aún no está vigente. Vigencia desde: ${resolution.valid_from}`);
    }
    if (moment(today).isAfter(resolution.valid_to)) {
        errors.push(`La resolución ha vencido. Vigencia hasta: ${resolution.valid_to}`);
    }

    return errors;
}

/**
 * Validar fechas
 */
function validateDates(invoice) {
    const errors = [];

    // Fecha de emisión
    if (!invoice.issue_date) {
        errors.push('Fecha de emisión es requerida');
        return errors;
    }

    // Formato de fecha
    if (!moment(invoice.issue_date, 'YYYY-MM-DD', true).isValid()) {
        errors.push('Fecha de emisión tiene formato inválido. Debe ser YYYY-MM-DD');
    }

    // Fecha no puede ser futura
    const today = moment().format('YYYY-MM-DD');
    if (moment(invoice.issue_date).isAfter(today)) {
        errors.push('Fecha de emisión no puede ser futura');
    }

    // Fecha no puede ser muy antigua (máx 3 meses)
    const maxMonthsAgo = moment().subtract(validationRules.max_invoice_age_months, 'months').format('YYYY-MM-DD');
    if (moment(invoice.issue_date).isBefore(maxMonthsAgo)) {
        errors.push(`Fecha de emisión no puede ser anterior a ${validationRules.max_invoice_age_months} meses`);
    }

    // Hora de emisión
    if (invoice.issue_time && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(invoice.issue_time)) {
        errors.push('Hora de emisión tiene formato inválido. Debe ser HH:mm:ss');
    }

    // Fecha de vencimiento (si existe)
    if (invoice.due_date) {
        if (!moment(invoice.due_date, 'YYYY-MM-DD', true).isValid()) {
            errors.push('Fecha de vencimiento tiene formato inválido. Debe ser YYYY-MM-DD');
        } else if (moment(invoice.due_date).isBefore(invoice.issue_date)) {
            errors.push('Fecha de vencimiento no puede ser anterior a la fecha de emisión');
        }
    }

    return errors;
}

/**
 * Validar ítems de la factura
 */
function validateItems(items) {
    const errors = [];

    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push('La factura debe tener al menos un ítem');
        return errors;
    }

    items.forEach((item, index) => {
        const itemNum = index + 1;

        // Descripción
        if (!item.name || item.name.trim() === '') {
            errors.push(`Ítem ${itemNum}: Descripción es requerida`);
        } else if (item.name.length > validationRules.max_description_length) {
            errors.push(`Ítem ${itemNum}: Descripción excede ${validationRules.max_description_length} caracteres`);
        }

        // Cantidad
        if (item.quantity === undefined || item.quantity === null) {
            errors.push(`Ítem ${itemNum}: Cantidad es requerida`);
        } else if (Number(item.quantity) <= 0) {
            errors.push(`Ítem ${itemNum}: Cantidad debe ser mayor a 0`);
        }

        // Precio unitario
        if (item.unit_price === undefined || item.unit_price === null) {
            errors.push(`Ítem ${itemNum}: Precio unitario es requerido`);
        } else if (Number(item.unit_price) < 0) {
            errors.push(`Ítem ${itemNum}: Precio unitario no puede ser negativo`);
        }

        // Unidad de medida
        if (item.unit_measure && !validationRules.unit_measures.includes(item.unit_measure)) {
            errors.push(`Ítem ${itemNum}: Unidad de medida inválida. Debe ser una de: ${validationRules.unit_measures.join(', ')}`);
        }

        // Validar cálculo del subtotal
        const expectedSubtotal = roundToTwoDecimals(Number(item.quantity) * Number(item.unit_price));
        const actualSubtotal = roundToTwoDecimals(Number(item.subtotal));
        if (Math.abs(expectedSubtotal - actualSubtotal) > 0.01) {
            errors.push(`Ítem ${itemNum}: Subtotal incorrecto. Esperado: ${expectedSubtotal}, Recibido: ${actualSubtotal}`);
        }
    });

    return errors;
}

/**
 * Validar impuestos
 */
function validateTaxes(items, invoice) {
    const errors = [];

    let calculatedTaxTotal = 0;

    items.forEach((item, index) => {
        const itemNum = index + 1;

        // Porcentaje de IVA
        const ivaPercentage = Number(item.iva_percentage || 0);
        if (!validationRules.iva_percentages.includes(ivaPercentage)) {
            errors.push(`Ítem ${itemNum}: Porcentaje de IVA inválido (${ivaPercentage}%). Debe ser uno de: ${validationRules.iva_percentages.join(', ')}%`);
        }

        // Cálculo de IVA
        const expectedIVA = roundToTwoDecimals(Number(item.subtotal) * (ivaPercentage / 100));
        const actualIVA = roundToTwoDecimals(Number(item.iva_amount || 0));
        if (Math.abs(expectedIVA - actualIVA) > 0.01) {
            errors.push(`Ítem ${itemNum}: IVA calculado incorrectamente. Esperado: ${expectedIVA}, Recibido: ${actualIVA}`);
        }

        calculatedTaxTotal += actualIVA;
    });

    // Validar total de impuestos
    calculatedTaxTotal = roundToTwoDecimals(calculatedTaxTotal);
    const invoiceTaxTotal = roundToTwoDecimals(Number(invoice.tax_total));
    if (Math.abs(calculatedTaxTotal - invoiceTaxTotal) > 0.01) {
        errors.push(`Total de impuestos incorrecto. Esperado: ${calculatedTaxTotal}, Recibido: ${invoiceTaxTotal}`);
    }

    return errors;
}

/**
 * Validar totales
 */
function validateTotals(items, invoice) {
    const errors = [];

    // Calcular subtotal esperado
    let calculatedSubtotal = 0;
    items.forEach(item => {
        calculatedSubtotal += Number(item.subtotal || 0);
    });
    calculatedSubtotal = roundToTwoDecimals(calculatedSubtotal);

    const invoiceSubtotal = roundToTwoDecimals(Number(invoice.subtotal));
    if (Math.abs(calculatedSubtotal - invoiceSubtotal) > 0.01) {
        errors.push(`Subtotal incorrecto. Esperado: ${calculatedSubtotal}, Recibido: ${invoiceSubtotal}`);
    }

    // Validar total
    const expectedTotal = roundToTwoDecimals(invoiceSubtotal + Number(invoice.tax_total));
    const actualTotal = roundToTwoDecimals(Number(invoice.total));
    if (Math.abs(expectedTotal - actualTotal) > 0.01) {
        errors.push(`Total incorrecto. Esperado: ${expectedTotal}, Recibido: ${actualTotal}`);
    }

    // Total debe ser mayor a 0
    if (actualTotal < validationRules.min_total) {
        errors.push(`Total debe ser mayor a ${validationRules.min_total}`);
    }

    return errors;
}

/**
 * Validar CUFE
 */
function validateCUFE(invoice, company, customer, resolution) {
    const errors = [];

    if (!invoice.cufe) {
        errors.push('CUFE no generado');
        return errors;
    }

    // Longitud del CUFE
    if (invoice.cufe.length !== validationRules.cufe_length) {
        errors.push(`CUFE debe tener ${validationRules.cufe_length} caracteres. Actual: ${invoice.cufe.length}`);
    }

    // Recalcular CUFE y comparar
    try {
        const expectedCUFE = generateCUFE({
            invoiceNumber: invoice.full_number,
            issueDate: invoice.issue_date.replace(/-/g, ''),
            issueTime: invoice.issue_time || '00:00:00',
            subtotal: invoice.subtotal,
            taxTotal: invoice.tax_total,
            total: invoice.total,
            nit: company.nit,
            customerDocumentType: getDocumentTypeCode(customer.customer_type),
            customerDocumentNumber: customer.document_number,
            technicalKey: resolution?.technical_key || '',
            testSetId: company.test_set_id || ''
        });

        if (invoice.cufe !== expectedCUFE) {
            errors.push('CUFE calculado no coincide con el almacenado');
        }
    } catch (error) {
        errors.push(`Error al validar CUFE: ${error.message}`);
    }

    return errors;
}

/**
 * Validar información de pago
 */
function validatePaymentInfo(invoice) {
    const errors = [];

    // Forma de pago
    if (invoice.payment_method) {
        if (!validationRules.payment_methods.includes(invoice.payment_method)) {
            errors.push(`Forma de pago inválida. Debe ser una de: ${validationRules.payment_methods.join(', ')}`);
        }

        // Si es crédito, debe tener fecha de vencimiento
        if (invoice.payment_method.toLowerCase().includes('crédito') && !invoice.due_date) {
            errors.push('Fecha de vencimiento es requerida para pago a crédito');
        }
    }

    // Medio de pago
    if (invoice.payment_means) {
        if (!validationRules.payment_means.includes(invoice.payment_means)) {
            errors.push(`Medio de pago inválido. Debe ser uno de: ${validationRules.payment_means.join(', ')}`);
        }
    }

    return errors;
}

/**
 * Generar advertencias (no bloquean)
 */
function generateWarnings(invoice, company, customer, items) {
    const warnings = [];

    // Advertir si no hay teléfono
    if (!company.phone) {
        warnings.push('Empresa sin teléfono registrado');
    }
    if (!customer.phone) {
        warnings.push('Cliente sin teléfono registrado');
    }

    // Advertir si no hay régimen tributario
    if (!company.tax_regime) {
        warnings.push('Empresa sin régimen tributario definido');
    }

    // Advertir si hay ítems sin código
    items.forEach((item, index) => {
        if (!item.code) {
            warnings.push(`Ítem ${index + 1} sin código de producto`);
        }
    });

    // Advertir si la factura no tiene notas
    if (!invoice.notes) {
        warnings.push('Factura sin observaciones/notas');
    }

    return warnings;
}

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

/**
 * Validar formato de email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Redondear a 2 decimales
 */
function roundToTwoDecimals(value) {
    return Math.round(Number(value) * 100) / 100;
}

/**
 * Obtener código de tipo de documento según DIAN
 */
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
