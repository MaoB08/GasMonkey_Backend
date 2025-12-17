import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const City = sequelize.define('City', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    department: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Departamento al que pertenece la ciudad'
    }
}, {
    tableName: 'cities',
    timestamps: false,
    underscored: true
});

export default City;
