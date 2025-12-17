import { InventoryProduct, Category } from '../models/index.js';
import { Op } from 'sequelize';

// Función auxiliar para generar código de producto
const generateProductCode = async (categoryId) => {
    try {
        const category = await Category.findByPk(categoryId);

        if (!category) {
            throw new Error('Categoría no encontrada');
        }

        // Obtener el prefijo de la categoría
        const prefix = category.code_prefix || 'PROD';

        // Contar productos existentes en esta categoría
        const count = await InventoryProduct.count({
            where: { category_id: categoryId }
        });

        // Generar código: PREFIX-XXX (ej: ELEC-001, ELEC-002)
        const number = String(count + 1).padStart(3, '0');
        const code = `${prefix}-${number}`;

        // Verificar si el código ya existe (por si acaso)
        const existingProduct = await InventoryProduct.findOne({
            where: { code }
        });

        if (existingProduct) {
            // Si existe, buscar el siguiente número disponible
            const allProducts = await InventoryProduct.findAll({
                where: {
                    code: {
                        [Op.like]: `${prefix}-%`
                    }
                },
                attributes: ['code'],
                order: [['code', 'DESC']]
            });

            let maxNumber = 0;
            allProducts.forEach(product => {
                const parts = product.code.split('-');
                if (parts.length === 2) {
                    const num = parseInt(parts[1]);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                }
            });

            return `${prefix}-${String(maxNumber + 1).padStart(3, '0')}`;
        }

        return code;
    } catch (error) {
        console.error('Error al generar código:', error);
        throw error;
    }
};

// Obtener todos los productos con filtros
export const getAllProducts = async (req, res) => {
    try {
        const {
            search,
            category_id,
            low_stock,
            min_price,
            max_price,
            stock_threshold = 10
        } = req.query;

        // Construir condiciones de búsqueda
        const where = {};

        // Búsqueda por nombre o código
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Filtro por categoría
        if (category_id) {
            where.category_id = category_id;
        }

        // Filtro por stock bajo
        if (low_stock === 'true') {
            where.stock = { [Op.lt]: parseInt(stock_threshold) };
        }

        // Filtro por rango de precios
        if (min_price || max_price) {
            where.current_price = {};
            if (min_price) {
                where.current_price[Op.gte] = parseFloat(min_price);
            }
            if (max_price) {
                where.current_price[Op.lte] = parseFloat(max_price);
            }
        }

        const products = await InventoryProduct.findAll({
            where,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'code_prefix']
            }],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los productos',
            details: error.message
        });
    }
};

// Obtener un producto por ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await InventoryProduct.findByPk(id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'description', 'code_prefix']
            }]
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el producto',
            details: error.message
        });
    }
};

// Crear nuevo producto
export const createProduct = async (req, res) => {
    try {
        const { name, description, current_price, category_id, size, stock } = req.body;

        // Validaciones
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'El nombre del producto es requerido'
            });
        }

        if (!current_price || parseFloat(current_price) < 0) {
            return res.status(400).json({
                success: false,
                error: 'El precio debe ser mayor o igual a 0'
            });
        }

        if (!category_id) {
            return res.status(400).json({
                success: false,
                error: 'La categoría es requerida'
            });
        }

        // Verificar que la categoría existe
        const category = await Category.findByPk(category_id);
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'La categoría seleccionada no existe'
            });
        }

        // Generar código automáticamente
        const code = await generateProductCode(category_id);

        const product = await InventoryProduct.create({
            code,
            name: name.trim(),
            description: description?.trim() || null,
            current_price: parseFloat(current_price),
            category_id: parseInt(category_id),
            size: size?.trim() || null,
            stock: stock ? parseInt(stock) : 0
        });

        // Obtener el producto con la categoría incluida
        const productWithCategory = await InventoryProduct.findByPk(product.id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'code_prefix']
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: productWithCategory
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear el producto',
            details: error.message
        });
    }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, current_price, category_id, size, stock } = req.body;

        const product = await InventoryProduct.findByPk(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        // Validaciones
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'El nombre del producto es requerido'
            });
        }

        if (current_price !== undefined && parseFloat(current_price) < 0) {
            return res.status(400).json({
                success: false,
                error: 'El precio debe ser mayor o igual a 0'
            });
        }

        // Si cambió la categoría, regenerar el código
        let newCode = product.code;
        if (category_id && parseInt(category_id) !== product.category_id) {
            // Verificar que la nueva categoría existe
            const category = await Category.findByPk(category_id);
            if (!category) {
                return res.status(400).json({
                    success: false,
                    error: 'La categoría seleccionada no existe'
                });
            }
            newCode = await generateProductCode(category_id);
        }

        await product.update({
            code: newCode,
            name: name.trim(),
            description: description?.trim() || null,
            current_price: current_price ? parseFloat(current_price) : product.current_price,
            category_id: category_id ? parseInt(category_id) : product.category_id,
            size: size?.trim() || null,
            stock: stock !== undefined ? parseInt(stock) : product.stock
        });

        // Obtener el producto actualizado con la categoría
        const updatedProduct = await InventoryProduct.findByPk(id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'code_prefix']
            }]
        });

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: updatedProduct
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el producto',
            details: error.message
        });
    }
};

// Eliminar producto
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await InventoryProduct.findByPk(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        await product.destroy();

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el producto',
            details: error.message
        });
    }
};

// Endpoint para generar preview del código (útil para el frontend)
export const previewProductCode = async (req, res) => {
    try {
        const { category_id } = req.query;

        if (!category_id) {
            return res.status(400).json({
                success: false,
                error: 'category_id es requerido'
            });
        }

        const code = await generateProductCode(category_id);

        res.json({
            success: true,
            data: { code }
        });
    } catch (error) {
        console.error('Error al generar preview de código:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar el código',
            details: error.message
        });
    }
};
