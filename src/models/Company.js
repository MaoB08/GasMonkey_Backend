import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  business_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  nit: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true
  },
  dv: {
    type: DataTypes.CHAR(1),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(50),
    defaultValue: 'Colombia'
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING(100)
  },
  tax_regime: {
    type: DataTypes.STRING(50)
  },
  responsibilities: {
    type: DataTypes.JSON
  },
  // Configuración DIAN
  test_set_id: {
    type: DataTypes.STRING(100)
  },
  software_id: {
    type: DataTypes.STRING(100)
  },
  software_pin: {
    type: DataTypes.STRING(10)
  },
  certificate_path: {
    type: DataTypes.STRING(255)
  },
  certificate_password: {
    type: DataTypes.STRING(100)
  }
}, {
  tableName: 'companies',
  timestamps: true,
  underscored: true
});

export default Company;