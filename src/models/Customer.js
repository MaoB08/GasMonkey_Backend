import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  customer_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'NIT, CC, CE, Pasaporte, TI, RC'
  },
  document_number: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  dv: {
    type: DataTypes.CHAR(1),
    comment: 'Solo para NIT'
  },
  business_name: {
    type: DataTypes.STRING(200)
  },
  first_name: {
    type: DataTypes.STRING(100)
  },
  last_name: {
    type: DataTypes.STRING(100)
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  address: {
    type: DataTypes.STRING(200)
  },
  city: {
    type: DataTypes.STRING(100)
  },
  department: {
    type: DataTypes.STRING(100)
  },
  country: {
    type: DataTypes.STRING(50),
    defaultValue: 'Colombia'
  },
  tax_regime: {
    type: DataTypes.STRING(50)
  },
  responsibilities: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true
});

export default Customer;