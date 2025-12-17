import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index.js'; // ✅ Importar desde index
import authRoutes from './routes/auth.js';
import passwordResetRoutes from './routes/passwordReset.js';
import invoiceRoutes from './routes/invoices.js';
import usuariosRoutes from './routes/usuarios.js';
import customerRoutes from './routes/customers.js';
import categoryRoutes from './routes/categories.js';
import inventoryProductRoutes from './routes/inventoryProducts.js';
import cityRoutes from './routes/cities.js';
import clientRoutes from './routes/clients.js';
import salesRoutes from './routes/sales.js';
import discountsRoutes from './routes/discounts.js';
import paymentMethodRoutes from './routes/paymentMethods.js';
import taxConfigRoutes from './routes/taxConfig.js';
import saleReturnsRoutes from './routes/saleReturns.js';
import staffRoutes from './routes/staff.js';
import analyticsRoutes from './routes/analytics.js';
import supportRoutes from './routes/support.js';
// import testSetRoutes from './routes/testSet.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
  res.json({
    message: '✅ API Gas Monkey funcionando',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth, /api/auth/register',
      passwordReset: '/api/password-reset',
      invoices: '/api/invoices',
      usuarios: '/api/usuarios/listar',
      customers: '/api/customers/search',
      categories: '/api/categories',
      inventoryProducts: '/api/inventory-products',
      cities: '/api/cities',
      clients: '/api/clients',
      sales: '/api/sales',
      discounts: '/api/discounts',
      paymentMethods: '/api/payment-methods',
      taxConfig: '/api/tax-config',
      saleReturns: '/api/sale-returns',
      staff: '/api/staff',
      analytics: '/api/analytics',
      support: '/api/support/send'
      // testSet: '/api/test-set'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory-products', inventoryProductRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/discounts', discountsRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/tax-config', taxConfigRoutes);
app.use('/api/sale-returns', saleReturnsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/support', supportRoutes);
// app.use('/api/test-set', testSetRoutes);

// Manejo de errores
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Conexión a BD y arranque del servidor
const startServer = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL exitosa');

    // Sincronizar modelos (solo en desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true }); // ✅ Esto creará/actualizará las tablas
      console.log('✅ Modelos sincronizados');
    }

    app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;