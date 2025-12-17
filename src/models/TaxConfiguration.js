import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const TaxConfiguration = sequelize.define('TaxConfiguration', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tax_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true
        },
        comment: 'Nombre del impuesto (ej: IVA, INC, etc.)'
    },
    tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        },
        comment: 'Tasa del impuesto en porcentaje'
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Si es el impuesto por defecto'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'tax_configurations',
    timestamps: true,
    underscored: true
});

export default TaxConfiguration;
