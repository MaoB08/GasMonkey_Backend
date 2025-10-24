import User from '../models/User.js';
import VerificationCode from '../models/VerificationCode.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationCode } from '../config/mailer.js';

const authController = {
  // Paso 1: Login inicial (solicita 2FA)
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
      }

      // Buscar usuario
      const user = await User.findOne({ 
        where: { STF_User: username } 
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar si el usuario está activo
      if (user.STF_Active !== '1') {
        return res.status(403).json({ error: 'Usuario inactivo' });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.STF_Password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar código de 6 dígitos
      const code = crypto.randomInt(100000, 999999).toString();
      
      // Calcular expiración (5 minutos)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      // Guardar código en la BD
      await VerificationCode.create({
        userId: user.STF_ID,
        code: code,
        expiresAt: expiresAt
      });

      // Enviar código por email
      const emailSent = await sendVerificationCode(user.STF_Email, code);

      if (!emailSent) {
        return res.status(500).json({ error: 'Error al enviar código de verificación' });
      }

      // Crear un token temporal (válido solo para verificar 2FA)
      const tempToken = jwt.sign(
        { id: user.STF_ID, temp: true },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );

      res.json({
        message: 'Código de verificación enviado',
        requires2FA: true,
        tempToken: tempToken,
        email: user.STF_Email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Ocultar parcialmente el email
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  },

  // Paso 2: Verificar código 2FA
  verify2FA: async (req, res) => {
    try {
      const { code, tempToken } = req.body;

      if (!code || !tempToken) {
        return res.status(400).json({ error: 'Código y token temporal son requeridos' });
      }

      // Verificar token temporal
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (!decoded.temp) {
          return res.status(401).json({ error: 'Token inválido' });
        }
      } catch (err) {
        return res.status(401).json({ error: 'Token temporal expirado' });
      }

      // Buscar código en la BD
      const verificationCode = await VerificationCode.findOne({
        where: {
          userId: decoded.id,
          code: code,
          used: false
        },
        order: [['createdAt', 'DESC']]
      });

      if (!verificationCode) {
        return res.status(401).json({ error: 'Código de verificación inválido' });
      }

      // Verificar si el código ha expirado
      if (new Date() > verificationCode.expiresAt) {
        return res.status(401).json({ error: 'Código de verificación expirado' });
      }

      // Marcar código como usado
      verificationCode.used = true;
      await verificationCode.save();

      // Buscar usuario completo
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Generar token definitivo (válido por 24h)
      const token = jwt.sign(
        { id: user.STF_ID, username: user.STF_User },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login exitoso',
        token: token,
        user: {
          id: user.STF_ID,
          username: user.STF_User,
          email: user.STF_Email,
          firstName: user.STF_First_Name,
          lastName: user.STF_First_Surname
        }
      });
    } catch (error) {
      console.error('Error en verify2FA:', error);
      res.status(500).json({ error: 'Error al verificar código' });
    }
  },

  // Reenviar código 2FA
  resendCode: async (req, res) => {
    try {
      const { tempToken } = req.body;

      if (!tempToken) {
        return res.status(400).json({ error: 'Token temporal requerido' });
      }

      // Verificar token temporal
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (!decoded.temp) {
          return res.status(401).json({ error: 'Token inválido' });
        }
      } catch (err) {
        return res.status(401).json({ error: 'Token temporal expirado' });
      }

      // Buscar usuario
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Generar nuevo código
      const code = crypto.randomInt(100000, 999999).toString();
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      // Invalidar códigos anteriores
      await VerificationCode.update(
        { used: true },
        { where: { userId: user.STF_ID, used: false } }
      );

      // Crear nuevo código
      await VerificationCode.create({
        userId: user.STF_ID,
        code: code,
        expiresAt: expiresAt
      });

      // Enviar código
      const emailSent = await sendVerificationCode(user.STF_Email, code);

      if (!emailSent) {
        return res.status(500).json({ error: 'Error al enviar código' });
      }

      res.json({
        message: 'Código reenviado exitosamente',
        email: user.STF_Email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
    } catch (error) {
      console.error('Error en resendCode:', error);
      res.status(500).json({ error: 'Error al reenviar código' });
    }
  },
  // Registro de usuario
  register: async (req, res) => {
    try {
      const { 
        document, 
        firstName, 
        middleName, 
        firstSurname, 
        secondSurname, 
        username, 
        password, 
        email 
      } = req.body;

      // Validar campos requeridos
      if (!document || !firstName || !firstSurname || !username || !password || !email) {
        return res.status(400).json({ error: 'Todos los campos obligatorios deben ser proporcionados' });
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ 
        where: { STF_User: username } 
      });

      if (existingUser) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      // Verificar si el email ya existe
      const existingEmail = await User.findOne({ 
        where: { STF_Email: email } 
      });

      if (existingEmail) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      // Generar ID único para el usuario
      const lastUser = await User.findOne({
        order: [['STF_ID', 'DESC']]
      });
      
      let newId = 'S001';
      if (lastUser) {
        const lastNum = parseInt(lastUser.STF_ID.substring(1));
        newId = 'S' + String(lastNum + 1).padStart(3, '0');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const newUser = await User.create({
        STF_ID: newId,
        STF_Document_Number: document,
        STF_First_Name: firstName,
        STF_Middle_Name: middleName || null,
        STF_First_Surname: firstSurname,
        STF_Second_Surname: secondSurname || null,
        STF_User: username,
        STF_Password: hashedPassword,
        STF_Active: '1',
        STF_Email: email
      });

      // Generar token
      const token = jwt.sign(
        { id: newUser.STF_ID, username: newUser.STF_User },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: newUser.STF_ID,
          username: newUser.STF_User,
          email: newUser.STF_Email,
          firstName: newUser.STF_First_Name,
          lastName: newUser.STF_First_Surname
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  },
  // Obtener perfil del usuario autenticado
  profile: async (req, res) => {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: { exclude: ['STF_Password'] }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ error: 'Error al obtener perfil' });
    }
  }
};

export default authController;
