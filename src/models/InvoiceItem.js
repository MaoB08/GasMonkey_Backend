import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoice_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'invoices',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  product_id: {
    type: DataTypes.UUID,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  line_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50)
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  quantity: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false
  },
  unit_measure: {
    type: DataTypes.STRING(20),
    defaultValue: 'UNI'
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  // Impuestos por item
  iva_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  iva_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  ico_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  ico_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  }
}, {
  tableName: 'invoice_items',
  timestamps: true,
  underscored: true
});

export default InvoiceItem;