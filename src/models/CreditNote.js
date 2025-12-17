import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CreditNote = sequelize.define('CreditNote', {
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
  invoice_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'invoices',
      key: 'id'
    }
  },
  prefix: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  number: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  full_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  issue_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  tax_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  cude: {
    type: DataTypes.STRING(100)
  },
  xml_content: {
    type: DataTypes.TEXT
  },
  pdf_path: {
    type: DataTypes.STRING(255)
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'draft'
  }
}, {
  tableName: 'credit_notes',
  timestamps: true,
  underscored: true
});

export default CreditNote;