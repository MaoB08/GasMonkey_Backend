import { PaymentMethod } from '../models/index.js';

// Listar métodos de pago
export const listPaymentMethods = async (req, res) => {
    try {
        const { active_only = 'true' } = req.query;

        const where = {};
        if (active_only === 'true') {
            where.is_active = true;
        }

        const paymentMethods = await PaymentMethod.findAll({
            where,
            order: [['name', 'ASC']]
        });

        res.json({ paymentMethods });
    } catch (error) {
        console.error('Error listando métodos de pago:', error);
        res.status(500).json({ error: 'Error al listar métodos de pago' });
    }
};

// Crear método de pago
export const createPaymentMethod = async (req, res) => {
    try {
        const { name, description } = req.body;

        const existing = await PaymentMethod.findOne({ where: { name } });
        if (existing) {
            return res.status(400).json({ error: 'El método de pago ya existe' });
        }

        const paymentMethod = await PaymentMethod.create({
            name,
            description,
            is_active: true
        });

        res.status(201).json({
            message: 'Método de pago creado exitosamente',
            paymentMethod
        });
    } catch (error) {
        console.error('Error creando método de pago:', error);
        res.status(500).json({ error: 'Error al crear método de pago' });
    }
};

// Actualizar método de pago
export const updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const paymentMethod = await PaymentMethod.findByPk(id);
        if (!paymentMethod) {
            return res.status(404).json({ error: 'Método de pago no encontrado' });
        }

        await paymentMethod.update(updateData);

        res.json({
            message: 'Método de pago actualizado exitosamente',
            paymentMethod
        });
    } catch (error) {
        console.error('Error actualizando método de pago:', error);
        res.status(500).json({ error: 'Error al actualizar método de pago' });
    }
};

// Desactivar método de pago
export const deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;

        const paymentMethod = await PaymentMethod.findByPk(id);
        if (!paymentMethod) {
            return res.status(404).json({ error: 'Método de pago no encontrado' });
        }

        await paymentMethod.update({ is_active: false });

        res.json({ message: 'Método de pago desactivado exitosamente' });
    } catch (error) {
        console.error('Error desactivando método de pago:', error);
        res.status(500).json({ error: 'Error al desactivar método de pago' });
    }
};
