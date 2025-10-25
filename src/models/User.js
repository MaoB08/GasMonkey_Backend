import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('Staff', {
  STF_ID: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false,
    field: 'stf_id' // ✅ Nombre real en la BD
  },
  STF_Document_Number: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    field: 'stf_document_number' // ✅ Minúsculas
  },
  STF_First_Name: {
    type: DataTypes.STRING(15),
    allowNull: false,
    field: 'stf_first_name'
  },
  STF_Middle_Name: {
    type: DataTypes.STRING(15),
    allowNull: true,
    field: 'stf_middle_name'
  },
  STF_First_Surname: {
    type: DataTypes.STRING(15),
    allowNull: false,
    field: 'stf_first_surname'
  },
  STF_Second_Surname: {
    type: DataTypes.STRING(15),
    allowNull: true,
    field: 'stf_second_surname'
  },
  STF_User: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    field: 'stf_user'
  },
  STF_Password: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'stf_password'
  },
  STF_Active: {
    type: DataTypes.CHAR(1),
    allowNull: false,
    defaultValue: '1',
    field: 'stf_active'
  },
  STF_Email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    field: 'stf_email'
  }
}, {
  tableName: 'staff',
  schema: 'personal', // Si usas esquema
  timestamps: false
});

export default User;
