import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Discount = sequelize.define('Discount', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true,
            isUppercase: true
        },
        comment: 'Código promocional (ej: VERANO2024)'
    },
    type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['PERCENTAGE', 'FIXED']]
        },
        comment: 'Tipo de descuento: PERCENTAGE o FIXED'
    },
    value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        },
        comment: 'Valor del descuento (porcentaje o monto fijo)'
    },
    valid_from: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Fecha de inicio de validez'
    },
    valid_to: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Fecha de fin de validez'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    max_uses: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Número máximo de usos (null = ilimitado)'
    },
    current_uses: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Número de veces que se ha usado'
    },
    min_purchase_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Monto mínimo de compra para aplicar el descuento'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'discounts',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['code'],
            unique: true
        },
        {
            fields: ['valid_from', 'valid_to']
        }
    ]
});

export default Discount;
