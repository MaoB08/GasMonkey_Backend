import { SaleReturn, Sale, SaleDetail, InventoryProduct, Client } from '../models/index.js';
import { sequelize } from '../models/index.js';

// Listar devoluciones
export const listReturns = async (req, res) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status) {
            where.status = status;
        }

        const returns = await SaleReturn.findAll({
            where,
            include: [
                {
                    model: Sale,
                    as: 'sale',
                    include: [
                        { model: Client, as: 'client' }
                    ]
                }
            ],
            order: [['return_date', 'DESC']]
        });

        res.json({ returns });
    } catch (error) {
        console.error('Error listando devoluciones:', error);
        res.status(500).json({ error: 'Error al listar devoluciones' });
    }
};

// Aprobar devolución
export const approveReturn = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { staff_id } = req.body;

        const saleReturn = await SaleReturn.findByPk(id, {
            include: [{ model: Sale, as: 'sale' }]
        });

        if (!saleReturn) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Devolución no encontrada' });
        }

        if (saleReturn.status !== 'PENDING') {
            await transaction.rollback();
            return res.status(400).json({ error: 'La devolución ya fue procesada' });
        }

        // Actualizar estado de devolución
        await saleReturn.update({
            status: 'APPROVED',
            approved_by: staff_id,
            approval_date: new Date()
        }, { transaction });

        // Restaurar inventario
        const saleDetails = await SaleDetail.findAll({
            where: { sale_id: saleReturn.sale_id }
        });

        for (const detail of saleDetails) {
            if (detail.product_source === 'INVENTORY' && detail.product_id) {
                const product = await InventoryProduct.findByPk(detail.product_id);
                if (product) {
                    await product.update({
                        stock: product.stock + parseFloat(detail.quantity)
                    }, { transaction });
                }
            }
        }

        await transaction.commit();

        res.json({
            message: 'Devolución aprobada exitosamente. Inventario restaurado.',
            return: saleReturn
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error aprobando devolución:', error);
        res.status(500).json({ error: 'Error al aprobar devolución' });
    }
};

// Rechazar devolución
export const rejectReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { staff_id, rejection_reason } = req.body;

        const saleReturn = await SaleReturn.findByPk(id);

        if (!saleReturn) {
            return res.status(404).json({ error: 'Devolución no encontrada' });
        }

        if (saleReturn.status !== 'PENDING') {
            return res.status(400).json({ error: 'La devolución ya fue procesada' });
        }

        await saleReturn.update({
            status: 'REJECTED',
            approved_by: staff_id,
            approval_date: new Date(),
            rejection_reason
        });

        res.json({
            message: 'Devolución rechazada',
            return: saleReturn
        });
    } catch (error) {
        console.error('Error rechazando devolución:', error);
        res.status(500).json({ error: 'Error al rechazar devolución' });
    }
};
