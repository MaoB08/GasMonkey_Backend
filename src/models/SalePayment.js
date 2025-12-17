import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SalePayment = sequelize.define('SalePayment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sales',
            key: 'cod_sale'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    payment_method_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'payment_methods',
            key: 'id'
        }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    staff_id: {
        type: DataTypes.STRING(4),
        allowNull: false,
        comment: 'Empleado que registró el pago'
    }
}, {
    tableName: 'sale_payments',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['sale_id']
        },
        {
            fields: ['payment_date']
        }
    ]
});

export default SalePayment;
