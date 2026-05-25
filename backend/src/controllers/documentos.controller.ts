import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';
import path from 'path';
import fs from 'fs';

export const subirDocumento = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { solicitud_id, tipo_anexo } = req.body;
        const investigador_id = req.usuario.id;
        const file = (req as any).file;

        if (!file) {
            res.status(400).json({ error: 'No se ha detectado ningún archivo adjunto.' });
            return;
        }

        // Insertar los metadatos del archivo en la base de datos
        const result = await pool.query(
            `INSERT INTO documentos (solicitud_id, tipo_anexo, nombre_archivo_original, ruta_archivo, subido_por)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [solicitud_id, tipo_anexo, file.originalname, file.path, investigador_id]
        );

        res.status(201).json({
            mensaje: 'Documento subido y registrado exitosamente',
            documento: result.rows[0]
        });

    } catch (error) {
        console.error('Error al subir documento:', error);
        res.status(500).json({ error: 'Falla interna al procesar el anexo.' });
    }
};
// Obtener todos los documentos de una solicitud específica
export const obtenerDocumentosPorSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Sacamos el ID de la solicitud de la URL

        const result = await pool.query(
            `SELECT id, tipo_anexo, nombre_archivo_original, fecha_subida 
             FROM documentos 
             WHERE solicitud_id = $1 
             ORDER BY fecha_subida DESC`,
            [id]
        );

        res.json({
            mensaje: 'Documentos recuperados',
            documentos: result.rows
        });

    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({ error: 'Falla interna al buscar los anexos.' });
    }
};
// CU-09: Descargar el archivo físico de un documento
export const descargarDocumento = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // 1. Buscamos la ruta del archivo en PostgreSQL
        const result = await pool.query(
            'SELECT ruta_archivo, nombre_archivo_original FROM documentos WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Documento no encontrado en la base de datos.' });
            return;
        }

        const documento = result.rows[0];
        
        // 2. Buscamos el archivo físico en el disco duro
        const rutaAbsoluta = path.resolve(documento.ruta_archivo);

        if (!fs.existsSync(rutaAbsoluta)) {
            res.status(404).json({ error: 'El archivo físico se perdió o fue eliminado del servidor.' });
            return;
        }

        // 3. Se lo enviamos al navegador forzando la descarga con su nombre original
        res.download(rutaAbsoluta, documento.nombre_archivo_original);

    } catch (error) {
        console.error('Error al descargar documento:', error);
        res.status(500).json({ error: 'Falla interna al intentar descargar el anexo.' });
    }
};