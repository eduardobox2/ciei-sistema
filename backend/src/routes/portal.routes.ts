import { Router } from 'express';
// Asegúrate de importar eliminarAviso
import { getContenido, updateVideo, crearAviso, eliminarAviso, editarAviso } from '../controllers/portal.controller';

const router = Router();

router.get('/contenido', getContenido);
router.put('/video', updateVideo);
router.post('/avisos', crearAviso);
router.delete('/avisos/:id', eliminarAviso); // <-- Nueva ruta activada
router.put('/avisos/:id', editarAviso); // <-- Nueva ruta para editar avisos

export default router;