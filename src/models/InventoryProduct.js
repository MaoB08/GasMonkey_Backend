import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const InventoryProduct = sequelize.define('InventoryProduct', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Código auto-generado basado en categoría (ej: ELEC-001)'
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre del producto es requerido'
            },
            len: {
                args: [2, 200],
                msg: 'El nombre debe tener entre 2 y 200 caracteres'
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    current_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: {
                args: [0],
                msg: 'El precio debe ser mayor o igual a 0'
            }
        }
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    size: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Talla o tamaño del producto'
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El stock no puede ser negativo'
            }
        }
    }
}, {
    tableName: 'inventory_products',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['category_id']
        },
        {
            fields: ['code'],
            unique: true
        },
        {
            fields: ['stock']
        }
    ]
});

export default InventoryProduct;
