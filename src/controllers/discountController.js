import { Discount } from '../models/index.js';
import { sequelize } from '../models/index.js';

// Listar descuentos activos
export const listDiscounts = async (req, res) => {
    try {
        const { active_only = 'true' } = req.query;

        const where = {};
        if (active_only === 'true') {
            where.is_active = true;
        }

        const discounts = await Discount.findAll({
            where,
            order: [['created_at', 'DESC']]
        });

        res.json({ discounts });
    } catch (error) {
        console.error('Error listando descuentos:', error);
        res.status(500).json({ error: 'Error al listar descuentos' });
    }
};

// Crear descuento
export const createDiscount = async (req, res) => {
    try {
        const {
            code,
            type,
            value,
            valid_from,
            valid_to,
            max_uses,
            min_purchase_amount,
            description
        } = req.body;

        // Validar que el código no exista
        const existing = await Discount.findOne({ where: { code: code.toUpperCase() } });
        if (existing) {
            return res.status(400).json({ error: 'El código de descuento ya existe' });
        }

        // Validar fechas
        if (new Date(valid_from) > new Date(valid_to)) {
            return res.status(400).json({ error: 'La fecha de inicio debe ser anterior a la fecha de fin' });
        }

        const discount = await Discount.create({
            code: code.toUpperCase(),
            type,
            value: parseFloat(value),
            valid_from,
            valid_to,
            max_uses: max_uses ? parseInt(max_uses) : null,
            min_purchase_amount: min_purchase_amount ? parseFloat(min_purchase_amount) : null,
            description,
            is_active: true,
            current_uses: 0
        });

        res.status(201).json({
            message: 'Descuento creado exitosamente',
            discount
        });
    } catch (error) {
        console.error('Error creando descuento:', error);
        res.status(500).json({ error: 'Error al crear descuento' });
    }
};

// Validar código de descuento
export const validateDiscount = async (req, res) => {
    try {
        const { code } = req.params;
        const { purchase_amount } = req.query;

        const discount = await Discount.findOne({
            where: {
                code: code.toUpperCase(),
                is_active: true
            }
        });

        if (!discount) {
            return res.status(404).json({
                valid: false,
                error: 'Código de descuento no válido'
            });
        }

        // Validar fechas
        const today = new Date();
        const validFrom = new Date(discount.valid_from);
        const validTo = new Date(discount.valid_to);

        if (today < validFrom || today > validTo) {
            return res.status(400).json({
                valid: false,
                error: 'Código de descuento fuera de fecha de validez'
            });
        }

        // Validar usos máximos
        if (discount.max_uses && discount.current_uses >= discount.max_uses) {
            return res.status(400).json({
                valid: false,
                error: 'Código de descuento agotado'
            });
        }

        // Validar monto mínimo
        if (discount.min_purchase_amount && purchase_amount) {
            if (parseFloat(purchase_amount) < parseFloat(discount.min_purchase_amount)) {
                return res.status(400).json({
                    valid: false,
                    error: `Monto mínimo de compra no alcanzado. Requerido: $${discount.min_purchase_amount}`
                });
            }
        }

        // Calcular descuento
        let discountAmount = 0;
        if (purchase_amount) {
            if (discount.type === 'PERCENTAGE') {
                discountAmount = parseFloat(purchase_amount) * (parseFloat(discount.value) / 100);
            } else {
                discountAmount = parseFloat(discount.value);
            }
        }

        res.json({
            valid: true,
            discount: {
                id: discount.id,
                code: discount.code,
                type: discount.type,
                value: discount.value,
                description: discount.description,
                discountAmount
            }
        });
    } catch (error) {
        console.error('Error validando descuento:', error);
        res.status(500).json({ error: 'Error al validar descuento' });
    }
};

// Actualizar descuento
export const updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const discount = await Discount.findByPk(id);
        if (!discount) {
            return res.status(404).json({ error: 'Descuento no encontrado' });
        }

        // Si se actualiza el código, validar que no exista
        if (updateData.code && updateData.code.toUpperCase() !== discount.code) {
            const existing = await Discount.findOne({
                where: { code: updateData.code.toUpperCase() }
            });
            if (existing) {
                return res.status(400).json({ error: 'El código de descuento ya existe' });
            }
            updateData.code = updateData.code.toUpperCase();
        }

        await discount.update(updateData);

        res.json({
            message: 'Descuento actualizado exitosamente',
            discount
        });
    } catch (error) {
        console.error('Error actualizando descuento:', error);
        res.status(500).json({ error: 'Error al actualizar descuento' });
    }
};

// Desactivar descuento
export const deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;

        const discount = await Discount.findByPk(id);
        if (!discount) {
            return res.status(404).json({ error: 'Descuento no encontrado' });
        }

        await discount.update({ is_active: false });

        res.json({ message: 'Descuento desactivado exitosamente' });
    } catch (error) {
        console.error('Error desactivando descuento:', error);
        res.status(500).json({ error: 'Error al desactivar descuento' });
    }
};
