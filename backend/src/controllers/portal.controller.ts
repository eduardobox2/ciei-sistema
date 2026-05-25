import { Request, Response } from 'express';
import { pool } from '../db'; 

export const getContenido = async (req: Request, res: Response): Promise<void> => {
    try {
        const videoRes = await pool.query("SELECT valor FROM configuracion_portal WHERE clave = 'video_url'");
        
        // Magia: Traemos todos los avisos activos, ordenados del más nuevo al más viejo
        const avisosRes = await pool.query("SELECT * FROM avisos WHERE activo = true ORDER BY id DESC");
        
        res.json({
            videoUrl: videoRes.rows.length > 0 ? videoRes.rows[0].valor : null,
            avisos: avisosRes.rows 
        });
    } catch (error) {
        console.error('[PORTAL] Error al obtener contenido:', error);
        res.status(500).json({ error: 'Error al obtener contenido' });
    }
};

export const updateVideo = async (req: Request, res: Response): Promise<void> => {
    try {
        const { videoUrl } = req.body;
        await pool.query(
            "INSERT INTO configuracion_portal (clave, valor) VALUES ('video_url', $1) ON CONFLICT (clave) DO UPDATE SET valor = $1",
            [videoUrl]
        );
        res.json({ message: 'Video actualizado correctamente' });
    } catch (error) {
        console.error('[PORTAL] Error al actualizar video:', error);
        res.status(500).json({ error: 'Error al guardar el video' });
    }
};

// ¡NUEVA FUNCIÓN! Para guardar los avisos con su imagen
export const crearAviso = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tipo, color, fecha, titulo, texto, imagen_url } = req.body;
        await pool.query(
            "INSERT INTO avisos (tipo, color, fecha, titulo, texto, imagen_url) VALUES ($1, $2, $3, $4, $5, $6)",
            [tipo, color, fecha, titulo, texto, imagen_url || null]
        );
        res.json({ message: 'Aviso publicado en la Landing Page' });
    } catch (error) {
        console.error('[PORTAL] Error al crear aviso:', error);
        res.status(500).json({ error: 'Error al publicar el aviso' });
    }
};
// NUEVO: Función para eliminar un aviso del historial
export const eliminarAviso = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM avisos WHERE id = $1", [id]);
        res.json({ message: 'Aviso eliminado correctamente' });
    } catch (error) {
        console.error('[PORTAL] Error al eliminar aviso:', error);
        res.status(500).json({ error: 'Error al eliminar el aviso' });
    }
};
export const editarAviso = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { tipo, color, fecha, titulo, texto, imagen_url } = req.body;
        await pool.query(
            "UPDATE avisos SET tipo=$1, color=$2, fecha=$3, titulo=$4, texto=$5, imagen_url=$6 WHERE id=$7",
            [tipo, color, fecha, titulo, texto, imagen_url || null, id]
        );
        res.json({ message: 'Aviso editado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al editar el aviso' });
    }
};