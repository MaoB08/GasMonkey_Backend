import express from 'express';
import cors from 'cors';
import sequelize from './config/db.js';
import authRoutes from './routes/auth.js';
import passwordResetRoutes from './routes/passwordReset.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares - CORS configurado correctamente
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas públicas
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ API Gas Monkey funcionando',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/login, /api/auth/register, /api/auth/verify-2fa',
      passwordReset: '/api/password-reset/request-reset'
    }
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ✅ IMPORTANTE: Esta función debe ser LLAMADA
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL exitosa');
    
    await sequelize.sync({ alter: false });
    console.log('✅ Modelos sincronizados');
    
    // ✅ ESTE ES EL CÓDIGO QUE FALTA
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

// ✅ LLAMAR A LA FUNCIÓN
startServer();

export default app;