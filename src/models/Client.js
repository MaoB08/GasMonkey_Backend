import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    document_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'CC, CE, Pasaporte, TI, RC, etc.'
    },
    document_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    middle_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    last_name1: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    last_name2: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    city_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'cities',
            key: 'id'
        }
    }
}, {
    tableName: 'clients',
    timestamps: true,
    underscored: true
});

export default Client;
