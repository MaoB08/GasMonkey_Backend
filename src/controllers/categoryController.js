import { Category, InventoryProduct } from '../models/index.js';
import { Op } from 'sequelize';

// Obtener todas las categorías con conteo de productos
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: {
                include: [
                    [
                        // Subconsulta para contar productos
                        Category.sequelize.literal(`(
              SELECT COUNT(*)
              FROM inventory_products
              WHERE inventory_products.category_id = "Category"."id"
            )`),
                        'product_count'
                    ]
                ]
            },
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las categorías',
            details: error.message
        });
    }
};

// Obtener una categoría por ID
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id, {
            include: [{
                model: InventoryProduct,
                as: 'products',
                attributes: ['id', 'code', 'name', 'stock', 'current_price']
            }]
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Categoría no encontrada'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error al obtener categoría:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la categoría',
            details: error.message
        });
    }
};

// Crear nueva categoría
export const createCategory = async (req, res) => {
    try {
        const { name, description, code_prefix } = req.body;

        // Validar que el nombre no esté vacío
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'El nombre de la categoría es requerido'
            });
        }

        // Verificar si ya existe una categoría con ese nombre
        const existingCategory = await Category.findOne({
            where: { name: name.trim() }
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una categoría con ese nombre'
            });
        }

        const category = await Category.create({
            name: name.trim(),
            description: description?.trim() || null,
            code_prefix: code_prefix?.trim().toUpperCase() || null
        });

        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            data: category
        });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear la categoría',
            details: error.message
        });
    }
};

// Actualizar categoría
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, code_prefix } = req.body;

        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Categoría no encontrada'
            });
        }

        // Validar que el nombre no esté vacío
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'El nombre de la categoría es requerido'
            });
        }

        // Verificar si ya existe otra categoría con ese nombre
        const existingCategory = await Category.findOne({
            where: {
                name: name.trim(),
                id: { [Op.ne]: id }
            }
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe otra categoría con ese nombre'
            });
        }

        await category.update({
            name: name.trim(),
            description: description?.trim() || null,
            code_prefix: code_prefix?.trim().toUpperCase() || null
        });

        res.json({
            success: true,
            message: 'Categoría actualizada exitosamente',
            data: category
        });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la categoría',
            details: error.message
        });
    }
};

// Eliminar categoría
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Categoría no encontrada'
            });
        }

        // Verificar si tiene productos asociados
        const productCount = await InventoryProduct.count({
            where: { category_id: id }
        });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                error: `No se puede eliminar la categoría porque tiene ${productCount} producto(s) asociado(s)`,
                product_count: productCount
            });
        }

        await category.destroy();

        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la categoría',
            details: error.message
        });
    }
};
