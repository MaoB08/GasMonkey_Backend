import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Invoice = sequelize.define('Invoice', {
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
  resolution_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'resolutions',
      key: 'id'
    }
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  // Numeración
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
  // Fechas
  issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  issue_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  due_date: {
    type: DataTypes.DATEONLY
  },
  // Montos
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
  // DIAN
  cufe: {
    type: DataTypes.STRING(100)
  },
  qr_code: {
    type: DataTypes.TEXT
  },
  xml_content: {
    type: DataTypes.TEXT
  },
  xml_signed_path: {
    type: DataTypes.STRING(255)
  },
  pdf_path: {
    type: DataTypes.STRING(255)
  },
  // Estado
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'draft',
    comment: 'draft, sent, accepted, rejected, cancelled'
  },
  dian_response: {
    type: DataTypes.JSON
  },
  dian_sent_at: {
    type: DataTypes.DATE
  },
  // Notas
  notes: {
    type: DataTypes.TEXT
  },
  payment_method: {
    type: DataTypes.STRING(50),
    comment: 'Contado, Crédito'
  },
  payment_means: {
    type: DataTypes.STRING(50),
    comment: 'Efectivo, Transferencia, Tarjeta'
  }
}, {
  tableName: 'invoices',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'prefix', 'number']
    }
  ]
});

export default Invoice;