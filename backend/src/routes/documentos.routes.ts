import { Router } from 'express';
import { subirDocumento, obtenerDocumentosPorSolicitud, descargarDocumento } from '../controllers/documentos.controller';
import { upload } from '../middlewares/upload.middleware';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/:id', verificarToken, obtenerDocumentosPorSolicitud);
router.post('/subir', verificarToken, upload.single('archivo'), subirDocumento);

// NUEVA RUTA: Para descargar el archivo
router.get('/descargar/:id', verificarToken, descargarDocumento);

export default router;