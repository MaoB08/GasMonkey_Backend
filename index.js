import dotenv from 'dotenv';
dotenv.config();
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
console.log('🔍 JWT_SECRET:', process.env.JWT_SECRET ? 'Definido ✅' : 'No definido ❌');
import './src/app.js';