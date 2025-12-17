import express from 'express';
import {
  listarUsuarios,
  editarUsuario,
  eliminarUsuario,
  crearUsuario
} from '../controllers/usuarios.js';

const router = express.Router();

// Crear usuario
router.post('/crear', crearUsuario);

// Listar usuarios
router.get('/listar', listarUsuarios);

// Editar usuario
router.put('/editar/:id', editarUsuario);

// Eliminar usuario
router.delete('/eliminar/:id', eliminarUsuario);

export default router;
