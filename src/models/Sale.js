import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Sale = sequelize.define('Sale', {
    cod_sale: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'cod_sale'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    tax: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    state: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
        validate: {
            isIn: [['PAID', 'PENDING', 'CREDIT']]
        },
        comment: 'Estado del pago: PAID, PENDING, CREDIT'
    },
    payment_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['CASH', 'TRANSFER', 'CREDIT', 'APARTADO', 'CARD']]
        },
        comment: 'Método de pago: CASH, TRANSFER, CREDIT, APARTADO, CARD'
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'clients',
            key: 'id'
        }
    },
    staff_id: {
        type: DataTypes.STRING(4),
        allowNull: false,
        field: 'staff_id'
    },
    payment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'payment_methods',
            key: 'id'
        }
    },
    discount_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'discounts',
            key: 'id'
        }
    },
    discount_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    initial_payment: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        validate: {
            min: 0
        },
        comment: 'Pago inicial para APARTADO'
    },
    invoice_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'NORMAL',
        validate: {
            isIn: [['NORMAL', 'ELECTRONIC']]
        },
        comment: 'Tipo de factura: NORMAL o ELECTRONIC (DIAN)'
    },
    invoice_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID de la factura electrónica DIAN si aplica'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'sales',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['client_id']
        },
        {
            fields: ['staff_id']
        },
        {
            fields: ['date']
        },
        {
            fields: ['state']
        },
        {
            fields: ['payment_status']
        }
    ]
});

export default Sale;
