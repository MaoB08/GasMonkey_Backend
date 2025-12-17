import { Sale, SaleDetail, Client, InventoryProduct, PaymentMethod } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';

/**
 * Get overview statistics
 */
export const getOverview = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Today's stats
        const todaySales = await Sale.findAll({
            where: {
                date: { [Op.gte]: todayStart }
            }
        });

        const todayRevenue = todaySales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);

        // Calculate products sold manually to avoid GROUP BY issues
        let todayProductsSold = 0;
        if (todaySales.length > 0) {
            const saleIds = todaySales.map(s => s.cod_sale);
            const details = await SaleDetail.findAll({
                where: {
                    sale_id: { [Op.in]: saleIds }
                },
                attributes: ['quantity']
            });
            todayProductsSold = details.reduce((sum, d) => sum + parseInt(d.quantity || 0, 10), 0);
        }

        // Week's stats
        const weekSales = await Sale.findAll({
            where: {
                date: { [Op.gte]: weekStart }
            }
        });
        const weekRevenue = weekSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);

        // Previous week for comparison
        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekSales = await Sale.findAll({
            where: {
                date: {
                    [Op.gte]: prevWeekStart,
                    [Op.lt]: weekStart
                }
            }
        });
        const prevWeekRevenue = prevWeekSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
        const weekGrowth = prevWeekRevenue > 0
            ? ((weekRevenue - prevWeekRevenue) / prevWeekRevenue * 100).toFixed(1)
            : 0;

        // Month's stats
        const monthSales = await Sale.findAll({
            where: {
                date: { [Op.gte]: monthStart }
            }
        });
        const monthRevenue = monthSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);

        // Previous month for comparison
        const prevMonthStart = new Date(monthStart);
        prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
        const prevMonthSales = await Sale.findAll({
            where: {
                date: {
                    [Op.gte]: prevMonthStart,
                    [Op.lt]: monthStart
                }
            }
        });
        const prevMonthRevenue = prevMonthSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
        const monthGrowth = prevMonthRevenue > 0
            ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1)
            : 0;

        res.json({
            today: {
                sales: todaySales.length,
                revenue: todayRevenue,
                products_sold: todayProductsSold || 0,
                average_ticket: todaySales.length > 0 ? todayRevenue / todaySales.length : 0
            },
            week: {
                sales: weekSales.length,
                revenue: weekRevenue,
                growth: `${weekGrowth >= 0 ? '+' : ''}${weekGrowth}%`
            },
            month: {
                sales: monthSales.length,
                revenue: monthRevenue,
                growth: `${monthGrowth >= 0 ? '+' : ''}${monthGrowth}%`
            }
        });
    } catch (error) {
        console.error('Error getting overview:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas generales' });
    }
};

/**
 * Get sales trend data
 */
export const getSalesTrend = async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        const now = new Date();
        let startDate, labels, groupBy;

        switch (period) {
            case 'day':
                // Last 24 hours by hour
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
                groupBy = 'hour';
                break;
            case 'week':
                // Last 7 days
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                groupBy = 'day';
                break;
            case 'month':
                // Last 30 days
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                labels = Array.from({ length: 30 }, (_, i) => `Día ${i + 1}`);
                groupBy = 'day';
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                groupBy = 'day';
        }

        const sales = await Sale.findAll({
            where: {
                date: { [Op.gte]: startDate }
            },
            order: [['date', 'ASC']]
        });

        // Group sales by period
        const data = new Array(labels.length).fill(0);
        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            let index;

            if (groupBy === 'hour') {
                index = saleDate.getHours();
            } else if (groupBy === 'day') {
                const daysDiff = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
                index = labels.length - 1 - daysDiff;
            }

            if (index >= 0 && index < data.length) {
                data[index] += parseFloat(sale.total || 0);
            }
        });

        res.json({ labels, data });
    } catch (error) {
        console.error('Error getting sales trend:', error);
        res.status(500).json({ error: 'Error al obtener tendencia de ventas' });
    }
};

/**
 * Get top selling products
 */
export const getTopProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topProducts = await SaleDetail.findAll({
            attributes: [
                'product_id',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
                [sequelize.fn('SUM', sequelize.literal('quantity * unit_price')), 'total_revenue']
            ],
            include: [{
                model: InventoryProduct,
                as: 'product',
                attributes: ['name', 'code']
            }],
            group: ['product_id', 'product.id'],
            order: [[sequelize.literal('total_quantity'), 'DESC']],
            limit: parseInt(limit)
        });

        const formattedProducts = topProducts.map(item => ({
            product_name: item.product?.name || 'Producto desconocido',
            product_code: item.product?.code || 'N/A',
            quantity_sold: parseInt(item.dataValues.total_quantity),
            revenue: parseFloat(item.dataValues.total_revenue)
        }));

        res.json(formattedProducts);
    } catch (error) {
        console.error('Error getting top products:', error);
        res.status(500).json({ error: 'Error al obtener productos más vendidos' });
    }
};

/**
 * Get payment methods distribution
 */
export const getPaymentMethods = async (req, res) => {
    try {
        const paymentStats = await Sale.findAll({
            attributes: [
                'payment_status',
                [sequelize.fn('COUNT', sequelize.col('cod_sale')), 'count']
            ],
            group: ['payment_status']
        });

        const distribution = {};
        paymentStats.forEach(stat => {
            const method = stat.payment_status?.toLowerCase() || 'unknown';
            distribution[method] = parseInt(stat.dataValues.count);
        });

        res.json(distribution);
    } catch (error) {
        console.error('Error getting payment methods:', error);
        res.status(500).json({ error: 'Error al obtener métodos de pago' });
    }
};

/**
 * Get sales heatmap by hour
 */
export const getSalesHeatmap = async (req, res) => {
    try {
        const sales = await Sale.findAll({
            where: {
                date: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            }
        });

        const hourlyData = new Array(24).fill(0);
        sales.forEach(sale => {
            const hour = new Date(sale.date).getHours();
            hourlyData[hour]++;
        });

        res.json({
            hours: Array.from({ length: 24 }, (_, i) => i),
            data: hourlyData
        });
    } catch (error) {
        console.error('Error getting sales heatmap:', error);
        res.status(500).json({ error: 'Error al obtener mapa de calor de ventas' });
    }
};

/**
 * Get low stock products
 */
export const getLowStock = async (req, res) => {
    try {
        // Get products with stock less than 10 (since min_stock column doesn't exist)
        const lowStockProducts = await InventoryProduct.findAll({
            where: {
                stock: {
                    [Op.lte]: 10  // Consider low stock if <= 10 units
                }
            },
            attributes: ['id', 'name', 'code', 'stock'],
            order: [['stock', 'ASC']],
            limit: 20
        });

        const formattedProducts = lowStockProducts.map(product => ({
            product_name: product.name,
            product_code: product.code,
            current_stock: product.stock,
            min_stock: 10,  // Default threshold
            status: product.stock === 0 ? 'out_of_stock' : 'critical'
        }));

        res.json(formattedProducts);
    } catch (error) {
        console.error('Error getting low stock:', error);
        res.status(500).json({ error: 'Error al obtener productos con stock bajo' });
    }
};
