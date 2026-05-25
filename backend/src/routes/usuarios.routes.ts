import { Router } from 'express';
import { obtenerUsuarios, crearUsuarioAdmin, cambiarRol } from '../controllers/usuarios.controller';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

// Protegemos ambas rutas con el token de seguridad
router.get('/', verificarToken, obtenerUsuarios);
router.post('/', verificarToken, crearUsuarioAdmin);
router.put('/:id/rol', verificarToken, cambiarRol);
export default router;