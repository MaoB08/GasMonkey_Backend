import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SaleReturn = sequelize.define('SaleReturn', {
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
    return_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    refund_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
        validate: {
            isIn: [['PENDING', 'APPROVED', 'REJECTED']]
        }
    },
    staff_id: {
        type: DataTypes.STRING(4),
        allowNull: false,
        comment: 'Empleado que procesó la devolución'
    },
    approved_by: {
        type: DataTypes.STRING(4),
        allowNull: true,
        comment: 'Empleado que aprobó/rechazó la devolución'
    },
    approval_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'sale_returns',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['sale_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['return_date']
        }
    ]
});

export default SaleReturn;
