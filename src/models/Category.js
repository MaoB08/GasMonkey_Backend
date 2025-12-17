import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: {
                msg: 'El nombre de la categoría es requerido'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    code_prefix: {
        type: DataTypes.STRING(4),
        allowNull: true,
        comment: 'Prefijo de 4 letras para generar códigos de productos (ej: ELEC, CLOT)'
    }
}, {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: (category) => {
            // Generar prefijo automáticamente si no se proporciona
            if (!category.code_prefix) {
                category.code_prefix = category.name
                    .substring(0, 4)
                    .toUpperCase()
                    .replace(/[^A-Z]/g, '')
                    .padEnd(4, 'X');
            }
        },
        beforeUpdate: (category) => {
            // Actualizar prefijo si el nombre cambia y no se proporciona uno nuevo
            if (category.changed('name') && !category.changed('code_prefix')) {
                category.code_prefix = category.name
                    .substring(0, 4)
                    .toUpperCase()
                    .replace(/[^A-Z]/g, '')
                    .padEnd(4, 'X');
            }
        }
    }
});

export default Category;
