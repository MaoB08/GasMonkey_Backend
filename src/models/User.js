import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('Staff', {
  STF_ID: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false
  },
  STF_Document_Number: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  STF_First_Name: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  STF_Middle_Name: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  STF_First_Surname: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  STF_Second_Surname: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  STF_User: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true
  },
  STF_Password: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  STF_Active: {
    type: DataTypes.CHAR(1),
    allowNull: false,
    defaultValue: '1'
  },
  STF_Email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  }
}, {
  tableName: 'staff',
  timestamps: false
});

export default User;
