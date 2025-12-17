import { TaxConfiguration } from '../models/index.js';

// Obtener configuraciones de impuestos
export const getTaxConfigurations = async (req, res) => {
    try {
        const { active_only = 'true' } = req.query;

        const where = {};
        if (active_only === 'true') {
            where.is_active = true;
        }

        const taxConfigs = await TaxConfiguration.findAll({
            where,
            order: [['is_default', 'DESC'], ['tax_name', 'ASC']]
        });

        res.json({ taxConfigurations: taxConfigs });
    } catch (error) {
        console.error('Error obteniendo configuraciones de impuestos:', error);
        res.status(500).json({ error: 'Error al obtener configuraciones de impuestos' });
    }
};

// Crear configuración de impuesto
export const createTaxConfig = async (req, res) => {
    try {
        const { tax_name, tax_rate, is_default, description } = req.body;

        // Si es por defecto, desactivar otros defaults
        if (is_default) {
            await TaxConfiguration.update(
                { is_default: false },
                { where: { is_default: true } }
            );
        }

        const taxConfig = await TaxConfiguration.create({
            tax_name,
            tax_rate: parseFloat(tax_rate),
            is_default: is_default || false,
            is_active: true,
            description
        });

        res.status(201).json({
            message: 'Configuración de impuesto creada exitosamente',
            taxConfiguration: taxConfig
        });
    } catch (error) {
        console.error('Error creando configuración de impuesto:', error);
        res.status(500).json({ error: 'Error al crear configuración de impuesto' });
    }
};

// Actualizar configuración de impuesto
export const updateTaxConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const taxConfig = await TaxConfiguration.findByPk(id);
        if (!taxConfig) {
            return res.status(404).json({ error: 'Configuración de impuesto no encontrada' });
        }

        // Si se marca como default, desactivar otros defaults
        if (updateData.is_default) {
            await TaxConfiguration.update(
                { is_default: false },
                { where: { is_default: true, id: { [require('sequelize').Op.ne]: id } } }
            );
        }

        await taxConfig.update(updateData);

        res.json({
            message: 'Configuración de impuesto actualizada exitosamente',
            taxConfiguration: taxConfig
        });
    } catch (error) {
        console.error('Error actualizando configuración de impuesto:', error);
        res.status(500).json({ error: 'Error al actualizar configuración de impuesto' });
    }
};
