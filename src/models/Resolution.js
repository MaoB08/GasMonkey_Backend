import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Resolution = sequelize.define('Resolution', {
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
  resolution_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  resolution_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  prefix: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  from_number: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  to_number: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  current_number: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  technical_key: {
    type: DataTypes.STRING(100)
  },
  valid_from: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  valid_to: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'resolutions',
  timestamps: true,
  underscored: true
});

export default Resolution;