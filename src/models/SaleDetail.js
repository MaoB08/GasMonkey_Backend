import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SaleDetail = sequelize.define('SaleDetail', {
    item_line_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'item_line_id'
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    unit_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        },
        comment: 'Precio total de la línea (quantity * unit_price)'
    },
    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sales',
            key: 'cod_sale'
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'inventory_products',
            key: 'id'
        },
        comment: 'ID del producto de inventario (inventory_products)'
    },
    dian_product_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID del producto DIAN (products table)'
    },
    product_source: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['INVENTORY', 'DIAN']]
        },
        comment: 'Origen del producto: INVENTORY o DIAN'
    },
    product_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Nombre del producto (guardado para histórico)'
    },
    discount_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        },
        comment: 'Descuento en porcentaje para esta línea'
    },
    discount_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        },
        comment: 'Monto del descuento aplicado'
    },
    tax_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 19,
        validate: {
            min: 0,
            max: 100
        },
        comment: 'Porcentaje de IVA aplicado'
    },
    tax_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        },
        comment: 'Monto del impuesto'
    }
}, {
    tableName: 'sale_details',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['sale_id']
        },
        {
            fields: ['product_id']
        }
    ]
});

export default SaleDetail;
