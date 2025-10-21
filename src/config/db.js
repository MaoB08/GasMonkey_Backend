import { Sequelize } from 'sequelize';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:1234rewq@localhost:5432/GasMonkey';

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está definida');
  process.exit(1);
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

export default sequelize;