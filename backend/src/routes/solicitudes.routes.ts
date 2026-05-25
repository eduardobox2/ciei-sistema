import { Router } from 'express';
import { 
    crearSolicitudBorrador, 
    obtenerMisSolicitudes, 
    enviarSolicitud, 
    obtenerSolicitudesComite,
    dictaminarSolicitud,
    asignarRevisor,
    subsanarSolicitud,
    descargarResolucion,
    aprobarSolicitud // <-- ¡Aquí está la función que faltaba importar!
    
} from '../controllers/solicitudes.controller';
import { verificarToken } from '../middlewares/authMiddleware';
import { pool } from '../db'; 

const router = Router();

// Rutas del Presidente y Comité
router.get('/comite/todas', verificarToken, obtenerSolicitudesComite);
router.put('/:id/dictamen', verificarToken, dictaminarSolicitud);
router.put('/:id/asignar', verificarToken, asignarRevisor); 
router.put('/:id/aprobar', verificarToken, aprobarSolicitud);

// Ruta rápida para obtener la lista de usuarios con rol "revisor"
router.get('/revisores/lista', verificarToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, nombres, apellidos FROM usuarios WHERE rol = 'revisor'");
        res.json({ revisores: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar los revisores' });
    }
});

// Rutas del Investigador
router.get('/', verificarToken, obtenerMisSolicitudes);
router.put('/:id/subsanar', verificarToken, subsanarSolicitud); // <-- Ya no saldrá en rojo
router.post('/', verificarToken, crearSolicitudBorrador);
router.put('/:id/enviar', verificarToken, enviarSolicitud);
router.get('/:id/resolucion', verificarToken, descargarResolucion);

export default router;