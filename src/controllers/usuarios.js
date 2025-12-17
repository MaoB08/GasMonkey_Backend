import User from '../models/User.js'; 
import bcrypt from 'bcrypt';

// Crear usuario
export const crearUsuario = async (req, res) => {
    try {
      const {
        STF_Document_Number,
        STF_First_Name,
        STF_Middle_Name,
        STF_First_Surname,
        STF_Second_Surname,
        STF_User,
        STF_Password,
        STF_Email,
        STF_Role,
        STF_Department,
        STF_Active
      } = req.body;
  
      const passHash = await bcrypt.hash(STF_Password, 10);
  
      await User.create({
        STF_ID: crypto.randomUUID().slice(0, 4),
        STF_Document_Number,
        STF_First_Name,
        STF_Middle_Name,
        STF_First_Surname,
        STF_Second_Surname,
        STF_User,
        STF_Password: passHash,
        STF_Email,
        STF_Role,
        STF_Department,
        STF_Active
      });
  
      res.json({ message: "✅ Usuario registrado correctamente" });
    } catch (error) {
      console.log("❌ Error al crear usuario:", error);
      res.status(500).json({ error: "Error al crear usuario" });
    }
  };

// Listar usuarios
export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: [
        'STF_ID',
        'STF_Document_Number',
        'STF_First_Name',
        'STF_Middle_Name',
        'STF_First_Surname',
        'STF_Second_Surname',
        'STF_User',
        'STF_Email',
        'STF_Active'
      ],
      order: [['STF_ID', 'ASC']]
    });

    // Formatear datos para enviar al frontend
    const data = usuarios.map(u => ({
      id: u.STF_ID,
      documento: u.STF_Document_Number,
      nombre_completo: `${u.STF_First_Name} ${u.STF_Middle_Name ?? ''} ${u.STF_First_Surname} ${u.STF_Second_Surname ?? ''}`.trim(),
      usuario: u.STF_User,
      email: u.STF_Email,
      estado: u.STF_Active === '1' ? 'Activo' : 'Inactivo'
    }));

    res.json(data);
  } catch (error) {
    console.error('❌ Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Editar usuario
export const editarUsuario = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        STF_First_Name,
        STF_Middle_Name,
        STF_First_Surname,
        STF_Second_Surname,
        STF_User,
        STF_Email,
        STF_Active
      } = req.body;
  
      const usuario = await User.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      await usuario.update({
        STF_First_Name,
        STF_Middle_Name,
        STF_First_Surname,
        STF_Second_Surname,
        STF_User,
        STF_Email,
        STF_Active
      });
  
      res.json({ message: '✅ Usuario actualizado correctamente' });
    } catch (error) {
      console.error('❌ Error al editar usuario:', error);
      res.status(500).json({ message: 'Error al actualizar usuario' });
    }
  };
  
  // Eliminar usuario
  export const eliminarUsuario = async (req, res) => {
    try {
      const { id } = req.params;
  
      const usuario = await User.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      await usuario.destroy();
      res.json({ message: '🗑️ Usuario eliminado correctamente' });
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      res.status(500).json({ message: 'Error al eliminar usuario' });
    }
  };
  
