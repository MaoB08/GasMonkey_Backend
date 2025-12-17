import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const TestSetValidation = sequelize.define('TestSetValidation', {
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
  test_set_id: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  environment: {
    type: DataTypes.STRING(20),
    defaultValue: 'habilitacion'
  },
  test_case: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  test_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  document_type: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  invoice_id: {
    type: DataTypes.UUID,
    references: {
      model: 'invoices',
      key: 'id'
    }
  },
  document_number: {
    type: DataTypes.STRING(50)
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  track_id: {
    type: DataTypes.STRING(100)
  },
  dian_response: {
    type: DataTypes.JSON
  },
  validation_errors: {
    type: DataTypes.JSON
  },
  sent_at: {
    type: DataTypes.DATE
  },
  validated_at: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'test_set_validations',
  timestamps: true,
  underscored: true
});

export default TestSetValidation;