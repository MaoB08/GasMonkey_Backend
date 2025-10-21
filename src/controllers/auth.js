import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const authController = {
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

  // Login de usuario
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

      // Generar token
      const token = jwt.sign(
        { id: user.STF_ID, username: user.STF_User },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

       res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: user.STF_ID,
          username: user.STF_User,
          email: user.STF_Email,
          firstName: user.STF_First_Name,
          lastName: user.STF_First_Surname
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
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
