import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetCode } from '../config/mailer.js';

const passwordResetController = {
  // Paso 1: Solicitar código de recuperación
  requestReset: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'El email es requerido' });
      }

      console.log('🔍 Buscando usuario con email:', email);

      // Buscar usuario por email
      const user = await User.findOne({ 
        where: { STF_Email: email } 
      });

      if (!user) {
        // Por seguridad, no revelar si el email existe
        return res.json({ 
          message: 'Si el email existe, recibirás un código de recuperación' 
        });
      }

      // Verificar que el usuario esté activo
      if (user.STF_Active !== '1') {
        return res.status(403).json({ error: 'Usuario inactivo' });
      }

      // Generar código de 6 dígitos
      const code = crypto.randomInt(100000, 999999).toString();
      console.log('🔢 Código de recuperación generado:', code);

      // Calcular expiración (15 minutos)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Invalidar códigos anteriores del mismo usuario
      await PasswordResetToken.update(
        { used: true },
        { where: { userId: user.STF_ID, used: false } }
      );

      // Guardar nuevo código
      await PasswordResetToken.create({
        userId: user.STF_ID,
        email: user.STF_Email,
        code: code,
        expiresAt: expiresAt
      });

      // Enviar código por email
      const emailSent = await sendPasswordResetCode(user.STF_Email, code, user.STF_First_Name);

      if (!emailSent) {
        console.error('❌ Error al enviar email de recuperación');
        return res.status(500).json({ error: 'Error al enviar código de recuperación' });
      }

      console.log('✅ Código de recuperación enviado a:', email);

      res.json({
        message: 'Código de recuperación enviado',
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Ocultar parcialmente
      });
    } catch (error) {
      console.error('❌ Error en requestReset:', error);
      res.status(500).json({ error: 'Error al procesar solicitud' });
    }
  },

  // Paso 2: Verificar código
  verifyCode: async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: 'Email y código son requeridos' });
      }

      console.log('🔍 Verificando código para:', email);

      // Buscar código en la BD
      const resetToken = await PasswordResetToken.findOne({
        where: {
          email: email,
          code: code,
          used: false
        },
        order: [['createdAt', 'DESC']]
      });

      if (!resetToken) {
        return res.status(401).json({ error: 'Código de recuperación inválido' });
      }

      // Verificar si el código ha expirado
      if (new Date() > resetToken.expiresAt) {
        return res.status(401).json({ error: 'Código de recuperación expirado' });
      }

      console.log('✅ Código válido');

      res.json({
        message: 'Código verificado correctamente',
        tokenId: resetToken.id // Para el siguiente paso
      });
    } catch (error) {
      console.error('❌ Error en verifyCode:', error);
      res.status(500).json({ error: 'Error al verificar código' });
    }
  },

  // Paso 3: Restablecer contraseña
  resetPassword: async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ 
          error: 'Email, código y nueva contraseña son requeridos' 
        });
      }

      // Validar longitud de contraseña
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }

      console.log('🔍 Restableciendo contraseña para:', email);

      // Buscar código válido
      const resetToken = await PasswordResetToken.findOne({
        where: {
          email: email,
          code: code,
          used: false
        },
        order: [['createdAt', 'DESC']]
      });

      if (!resetToken) {
        return res.status(401).json({ error: 'Código de recuperación inválido' });
      }

      // Verificar expiración
      if (new Date() > resetToken.expiresAt) {
        return res.status(401).json({ error: 'Código de recuperación expirado' });
      }

      // Buscar usuario
      const user = await User.findByPk(resetToken.userId);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      user.STF_Password = hashedPassword;
      await user.save();

      // Marcar token como usado
      resetToken.used = true;
      await resetToken.save();

      console.log('✅ Contraseña actualizada exitosamente para:', user.STF_User);

      res.json({
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      console.error('❌ Error en resetPassword:', error);
      res.status(500).json({ error: 'Error al restablecer contraseña' });
    }
  },

  // Reenviar código
  resendCode: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'El email es requerido' });
      }

      // Buscar usuario
      const user = await User.findOne({ 
        where: { STF_Email: email } 
      });

      if (!user) {
        return res.json({ 
          message: 'Si el email existe, recibirás un código de recuperación' 
        });
      }

      // Generar nuevo código
      const code = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Invalidar códigos anteriores
      await PasswordResetToken.update(
        { used: true },
        { where: { userId: user.STF_ID, used: false } }
      );

      // Crear nuevo código
      await PasswordResetToken.create({
        userId: user.STF_ID,
        email: user.STF_Email,
        code: code,
        expiresAt: expiresAt
      });

      // Enviar email
      const emailSent = await sendPasswordResetCode(user.STF_Email, code, user.STF_First_Name);

      if (!emailSent) {
        return res.status(500).json({ error: 'Error al reenviar código' });
      }

      res.json({
        message: 'Código reenviado exitosamente',
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
    } catch (error) {
      console.error('❌ Error en resendCode:', error);
      res.status(500).json({ error: 'Error al reenviar código' });
    }
  }
};

export default passwordResetController;