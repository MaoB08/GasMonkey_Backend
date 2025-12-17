import { Sale, SaleDetail, SalePayment, Client, InventoryProduct, Product, PaymentMethod, TaxConfiguration, Discount, Invoice, City, SaleReturn } from '../models/index.js';
import { sequelize } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import invoiceService from '../services/invoiceService.js';
import Customer from '../models/Customer.js';

// Crear nueva venta
export const createSale = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            client_id,
            staff_id,
            payment_status,
            payment_id,
            discount_code,
            initial_payment,
            invoice_type = 'NORMAL',
            notes,
            items // Array de productos: [{ product_id, product_source, quantity, unit_price, discount_percentage, tax_percentage }]
        } = req.body;

        // Validar cliente
        const client = await Client.findByPk(client_id);
        if (!client) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        // Validar método de pago
        if (payment_id) {
            const paymentMethod = await PaymentMethod.findByPk(payment_id);
            if (!paymentMethod || !paymentMethod.is_active) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Método de pago no válido' });
            }
        }

        // Obtener configuración de impuestos por defecto
        const defaultTax = await TaxConfiguration.findOne({
            where: { is_default: true, is_active: true }
        });
        const defaultTaxRate = defaultTax ? parseFloat(defaultTax.tax_rate) : 19;

        // Validar y aplicar descuento si existe
        let discount = null;
        let discountAmount = 0;

        if (discount_code) {
            discount = await Discount.findOne({
                where: {
                    code: discount_code.toUpperCase(),
                    is_active: true
                }
            });

            if (!discount) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Código de descuento no válido' });
            }

            // Validar fechas
            const today = new Date();
            const validFrom = new Date(discount.valid_from);
            const validTo = new Date(discount.valid_to);

            if (today < validFrom || today > validTo) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Código de descuento fuera de fecha de validez' });
            }

            // Validar usos máximos
            if (discount.max_uses && discount.current_uses >= discount.max_uses) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Código de descuento agotado' });
            }
        }

        // Validar items y stock
        if (!items || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Debe incluir al menos un producto' });
        }

        let subtotal = 0;
        let totalTax = 0;
        const saleDetails = [];

        for (const item of items) {
            const { product_id, product_source, quantity, unit_price, discount_percentage = 0, tax_percentage } = item;

            let product = null;
            let productName = '';

            // Obtener producto según la fuente
            if (product_source === 'INVENTORY') {
                product = await InventoryProduct.findByPk(product_id);
                if (!product) {
                    await transaction.rollback();
                    return res.status(404).json({ error: `Producto de inventario ${product_id} no encontrado` });
                }

                // Validar stock solo si no es APARTADO
                if (payment_status !== 'APARTADO') {
                    if (product.stock < quantity) {
                        await transaction.rollback();
                        return res.status(400).json({
                            error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${quantity}`
                        });
                    }
                }

                productName = product.name;
            } else if (product_source === 'DIAN') {
                product = await Product.findByPk(product_id);
                if (!product) {
                    await transaction.rollback();
                    return res.status(404).json({ error: `Producto DIAN ${product_id} no encontrado` });
                }
                productName = product.name;
            } else {
                await transaction.rollback();
                return res.status(400).json({ error: 'Fuente de producto inválida' });
            }

            // Calcular precios
            const linePrice = parseFloat(quantity) * parseFloat(unit_price);
            const lineDiscountAmount = linePrice * (parseFloat(discount_percentage) / 100);
            const linePriceAfterDiscount = linePrice - lineDiscountAmount;
            const taxRate = tax_percentage !== undefined ? parseFloat(tax_percentage) : defaultTaxRate;
            const lineTaxAmount = linePriceAfterDiscount * (taxRate / 100);

            subtotal += linePriceAfterDiscount;
            totalTax += lineTaxAmount;

            saleDetails.push({
                product_id: product_source === 'INVENTORY' ? product_id : null,
                dian_product_id: product_source === 'DIAN' ? product_id : null,
                product_source,
                product_name: productName,
                quantity: parseFloat(quantity),
                unit_price: parseFloat(unit_price),
                price: linePrice,
                discount_percentage: parseFloat(discount_percentage),
                discount_amount: lineDiscountAmount,
                tax_percentage: taxRate,
                tax_amount: lineTaxAmount
            });
        }

        // Aplicar descuento global si existe
        if (discount) {
            if (discount.min_purchase_amount && subtotal < parseFloat(discount.min_purchase_amount)) {
                await transaction.rollback();
                return res.status(400).json({
                    error: `Monto mínimo de compra no alcanzado. Requerido: $${discount.min_purchase_amount}`
                });
            }

            if (discount.type === 'PERCENTAGE') {
                discountAmount = subtotal * (parseFloat(discount.value) / 100);
            } else {
                discountAmount = parseFloat(discount.value);
            }

            subtotal -= discountAmount;
            // Recalcular impuestos después del descuento
            totalTax = subtotal * (defaultTaxRate / 100);
        }

        const total = subtotal + totalTax;

        // Validar pago inicial para APARTADO
        if (payment_status === 'APARTADO') {
            if (!initial_payment || parseFloat(initial_payment) <= 0) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Debe especificar un pago inicial para APARTADO' });
            }
            if (parseFloat(initial_payment) > total) {
                await transaction.rollback();
                return res.status(400).json({ error: 'El pago inicial no puede ser mayor al total' });
            }
        }

        // Determinar estado de la venta
        let state = 'PENDING';
        if (payment_status === 'CASH' || payment_status === 'TRANSFER' || payment_status === 'CARD') {
            state = 'PAID';
        } else if (payment_status === 'CREDIT') {
            state = 'CREDIT';
        } else if (payment_status === 'APARTADO') {
            state = parseFloat(initial_payment) >= total ? 'PAID' : 'PENDING';
        }

        // Crear venta
        const sale = await Sale.create({
            date: new Date(),
            subtotal,
            tax: totalTax,
            total,
            state,
            payment_status,
            client_id,
            staff_id,
            payment_id,
            discount_id: discount ? discount.id : null,
            discount_amount: discountAmount,
            initial_payment: payment_status === 'APARTADO' ? parseFloat(initial_payment) : null,
            invoice_type,
            notes
        }, { transaction });

        // Crear detalles de venta
        for (const detail of saleDetails) {
            await SaleDetail.create({
                ...detail,
                sale_id: sale.cod_sale
            }, { transaction });
        }

        // Actualizar stock si no es APARTADO
        if (payment_status !== 'APARTADO') {
            for (const item of items) {
                if (item.product_source === 'INVENTORY') {
                    const product = await InventoryProduct.findByPk(item.product_id);
                    await product.update({
                        stock: product.stock - parseFloat(item.quantity)
                    }, { transaction });
                }
            }
        }

        // Registrar pago inicial si es APARTADO
        if (payment_status === 'APARTADO' && initial_payment) {
            await SalePayment.create({
                sale_id: sale.cod_sale,
                amount: parseFloat(initial_payment),
                payment_date: new Date(),
                payment_method_id: payment_id,
                staff_id,
                notes: 'Pago inicial APARTADO'
            }, { transaction });
        }

        // Actualizar contador de usos del descuento
        if (discount) {
            await discount.update({
                current_uses: discount.current_uses + 1
            }, { transaction });
        }

        // Si es factura electrónica, crear factura DIAN
        let dianInvoice = null;
        if (invoice_type === 'ELECTRONIC') {
            try {
                // Mapear datos de venta a formato DIAN
                const invoiceItems = saleDetails.map(detail => ({
                    code: detail.product_id || detail.dian_product_id,
                    name: detail.product_name,
                    description: detail.product_name,
                    quantity: detail.quantity,
                    unit_price: detail.unit_price,
                    iva_percentage: detail.tax_percentage,
                    unit_measure: 'UNI'
                }));

                // Buscar datos del cliente para mapear o crear Customer (DIAN)
                const clientRef = await Client.findByPk(client_id, { transaction });
                if (!clientRef) {
                    throw new Error(`Cliente con ID ${client_id} no encontrado`);
                }

                // Buscar si ya existe como Customer (DIAN)
                let customerForInvoice = await Customer.findOne({
                    where: { document_number: clientRef.document_number },
                    transaction
                });

                // Si no existe, crearlo
                if (!customerForInvoice) {
                    console.log(`Creating new Customer for DIAN based on Client ${clientRef.document_number}`);
                    customerForInvoice = await Customer.create({
                        company_id: '9e0500fb-6e79-42c8-809c-a3b83de41040',
                        customer_type: clientRef.document_type || 'CC',
                        document_number: clientRef.document_number,
                        first_name: clientRef.first_name,
                        last_name: `${clientRef.last_name1} ${clientRef.last_name2 || ''}`.trim(),
                        email: clientRef.email || 'noemail@example.com',
                        phone: clientRef.phone,
                        address: clientRef.address,
                        country: 'Colombia'
                    }, { transaction });
                }

                const invoiceData = {
                    company_id: '9e0500fb-6e79-42c8-809c-a3b83de41040', // ID de la compañía
                    customer_id: customerForInvoice.id, // Usar el UUID del Customer
                    payment_method: payment_status === 'CASH' ? 'Contado' : 'Crédito',
                    payment_means: payment_status === 'CASH' ? 'Efectivo' : payment_status === 'TRANSFER' ? 'Transferencia' : 'Tarjeta',
                    due_days: payment_status === 'CREDIT' ? 30 : 0,
                    notes: notes || '',
                    items: invoiceItems
                };

                // Crear factura DIAN usando el servicio
                const newInvoice = await invoiceService.createInvoice(invoiceData, transaction);

                await sale.update({
                    invoice_id: newInvoice.id
                }, { transaction });

            } catch (invoiceError) {
                console.error('Error creando factura electrónica:', invoiceError);
                // No revertir la transacción principal, pero registrar el error
                // Podríamos decidir revertir si la factura es obligatoria
            }
        }

        await transaction.commit();
        console.log('✅ Transaction committed. Created Sale ID:', sale.cod_sale);

        // Obtener venta completa con relaciones
        const completeSale = await Sale.findByPk(sale.cod_sale, {
            include: [
                {
                    model: Client,
                    as: 'client',
                    include: [{ model: City, as: 'city' }]
                },
                {
                    model: SaleDetail,
                    as: 'details',
                    include: [
                        { model: InventoryProduct, as: 'product' }
                    ]
                },
                { model: PaymentMethod, as: 'paymentMethod' },
                { model: Discount, as: 'discount' },
                { model: SalePayment, as: 'payments' }
            ]
        });

        res.status(201).json({
            message: 'Venta creada exitosamente',
            sale: completeSale
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error creando venta:', error);
        res.status(500).json({
            error: 'Error al crear la venta',
            details: error.message
        });
    }
};

// Listar ventas con filtros
export const listSales = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            client_id,
            staff_id,
            state,
            payment_status,
            date_from,
            date_to
        } = req.query;

        const where = {};

        if (client_id) where.client_id = client_id;
        if (staff_id) where.staff_id = staff_id;
        if (state) where.state = state;
        if (payment_status) where.payment_status = payment_status;

        if (date_from && date_to) {
            where.date = {
                [sequelize.Sequelize.Op.between]: [date_from, date_to]
            };
        } else if (date_from) {
            where.date = {
                [sequelize.Sequelize.Op.gte]: date_from
            };
        } else if (date_to) {
            where.date = {
                [sequelize.Sequelize.Op.lte]: date_to
            };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: sales } = await Sale.findAndCountAll({
            where,
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'first_name', 'middle_name', 'last_name1', 'last_name2', 'document_number']
                },
                {
                    model: PaymentMethod,
                    as: 'paymentMethod',
                    attributes: ['id', 'name']
                }
            ],
            order: [['date', 'DESC'], ['cod_sale', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            sales,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error listando ventas:', error);
        res.status(500).json({
            error: 'Error al listar ventas',
            details: error.message
        });
    }
};

// Obtener detalle de venta
export const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        const sale = await Sale.findByPk(id, {
            include: [
                {
                    model: Client,
                    as: 'client',
                    include: [{ model: City, as: 'city' }]
                },
                {
                    model: SaleDetail,
                    as: 'details',
                    include: [
                        { model: InventoryProduct, as: 'product' }
                    ]
                },
                { model: PaymentMethod, as: 'paymentMethod' },
                { model: Discount, as: 'discount' },
                {
                    model: SalePayment,
                    as: 'payments',
                    include: [{ model: PaymentMethod, as: 'paymentMethod' }],
                    order: [['payment_date', 'ASC']]
                },
                {
                    model: SaleReturn,
                    as: 'returns'
                }
            ]
        });

        if (!sale) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Calcular balance pendiente si es APARTADO o CREDIT
        let remainingBalance = 0;
        if (sale.payment_status === 'APARTADO' || sale.payment_status === 'CREDIT') {
            const totalPaid = sale.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
            remainingBalance = parseFloat(sale.total) - totalPaid;
        }

        res.json({
            sale,
            remainingBalance
        });

    } catch (error) {
        console.error('Error obteniendo venta:', error);
        res.status(500).json({
            error: 'Error al obtener venta',
            details: error.message
        });
    }
};

// Agregar pago a venta APARTADO/CREDIT
export const addPayment = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { amount, payment_method_id, staff_id, notes } = req.body;

        const sale = await Sale.findByPk(id, {
            include: [{ model: SalePayment, as: 'payments' }]
        });

        if (!sale) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        if (sale.payment_status !== 'APARTADO' && sale.payment_status !== 'CREDIT') {
            await transaction.rollback();
            return res.status(400).json({ error: 'Esta venta no permite pagos parciales' });
        }

        // Calcular balance pendiente
        const totalPaid = sale.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        const remainingBalance = parseFloat(sale.total) - totalPaid;

        if (parseFloat(amount) > remainingBalance) {
            await transaction.rollback();
            return res.status(400).json({
                error: 'El monto excede el balance pendiente',
                remainingBalance
            });
        }

        // Registrar pago
        await SalePayment.create({
            sale_id: id,
            amount: parseFloat(amount),
            payment_date: new Date(),
            payment_method_id,
            staff_id,
            notes
        }, { transaction });

        // Verificar si se completó el pago
        const newTotalPaid = totalPaid + parseFloat(amount);
        if (newTotalPaid >= parseFloat(sale.total)) {
            // Actualizar estado a PAID
            await sale.update({
                state: 'PAID'
            }, { transaction });

            // Si era APARTADO, actualizar inventario ahora
            if (sale.payment_status === 'APARTADO') {
                const details = await SaleDetail.findAll({
                    where: { sale_id: id }
                });

                for (const detail of details) {
                    if (detail.product_source === 'INVENTORY' && detail.product_id) {
                        const product = await InventoryProduct.findByPk(detail.product_id);
                        if (product) {
                            await product.update({
                                stock: product.stock - parseFloat(detail.quantity)
                            }, { transaction });
                        }
                    }
                }
            }
        }

        await transaction.commit();

        res.json({
            message: newTotalPaid >= parseFloat(sale.total)
                ? 'Pago completado. Venta pagada totalmente.'
                : 'Pago registrado exitosamente',
            newBalance: parseFloat(sale.total) - newTotalPaid,
            isPaid: newTotalPaid >= parseFloat(sale.total)
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error agregando pago:', error);
        res.status(500).json({
            error: 'Error al agregar pago',
            details: error.message
        });
    }
};

// Generar factura (PDF normal o electrónica)
export const generateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { type = 'normal' } = req.query;

        const sale = await Sale.findByPk(id, {
            include: [
                { model: Client, as: 'client' },
                { model: SaleDetail, as: 'details' },
                { model: PaymentMethod, as: 'paymentMethod' },
                { model: Discount, as: 'discount' },
                { model: SalePayment, as: 'payments' }
            ]
        });

        if (!sale) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        if (type === 'electronic') {
            // Redirigir a factura electrónica DIAN si existe
            if (sale.invoice_id) {
                return res.json({
                    message: 'Factura electrónica ya generada',
                    invoice_id: sale.invoice_id
                });
            } else {
                return res.status(400).json({
                    error: 'Esta venta no tiene factura electrónica asociada'
                });
            }
        } else {
            // Generar PDF normal
            const { generateInvoicePDF } = await import('../services/pdfService.js');

            // Crear directorio para PDFs si no existe
            const pdfDir = path.join(process.cwd(), 'invoices');
            if (!fs.existsSync(pdfDir)) {
                fs.mkdirSync(pdfDir, { recursive: true });
            }

            const pdfPath = path.join(pdfDir, `factura-${sale.cod_sale}.pdf`);

            await generateInvoicePDF(sale, pdfPath);

            // Enviar PDF como descarga
            res.download(pdfPath, `Factura-${sale.cod_sale}.pdf`, (err) => {
                if (err) {
                    console.error('Error enviando PDF:', err);
                    res.status(500).json({ error: 'Error al descargar la factura' });
                }
            });
        }

    } catch (error) {
        console.error('Error generando factura:', error);
        res.status(500).json({
            error: 'Error al generar factura',
            details: error.message
        });
    }
};
