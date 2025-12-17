import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Product = sequelize.define('Product', {
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
  code: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  unit_measure: {
    type: DataTypes.STRING(20),
    defaultValue: 'UNI',
    comment: 'UNI, KGM, SER, HOR, etc.'
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  tax_included: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  iva_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 19.00
  },
  ico_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true
});

export default Product;