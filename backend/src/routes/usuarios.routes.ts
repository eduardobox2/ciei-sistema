import { Router } from 'express';
// ¡AQUÍ ESTABA EL DETALLE! Agregamos "obtenerMiPerfil" a la lista
import { 
    obtenerUsuarios, 
    crearUsuarioAdmin, 
    cambiarRol, 
    actualizarMiPerfil,
    obtenerMiPerfil // <-- ¡Esta es la pieza que faltaba!
} from '../controllers/usuarios.controller';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

// ==========================================
// RUTAS DEL PERFIL (Tu usuario)
// ==========================================
router.get('/perfil', verificarToken, obtenerMiPerfil);    // Leer datos (DNI, correo)
router.put('/perfil', verificarToken, actualizarMiPerfil); // Guardar cambios

// ==========================================
// RUTAS DE ADMINISTRACIÓN (Terceros)
// ==========================================
router.get('/', verificarToken, obtenerUsuarios);
router.post('/', verificarToken, crearUsuarioAdmin);
router.put('/:id/rol', verificarToken, cambiarRol);

export default router;