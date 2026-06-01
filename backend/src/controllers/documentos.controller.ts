import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';
import path from 'path';
import fs from 'fs';

export const subirDocumento = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { solicitudId } = req.body;
        const archivo = (req as any).file;

        if (!archivo || !solicitudId) {
            res.status(400).json({ error: 'Faltan datos para subir el documento.' });
            return;
        }

        // Usamos los nombres exactos que me diste:
        // solicitud_id, nombre_archivo_original, ruta_archivo, tipo_anexo, subido_por, fecha_subida
        const query = `
            INSERT INTO documentos (
                solicitud_id, 
                nombre_archivo_original, 
                ruta_archivo, 
                tipo_anexo, 
                subido_por, 
                fecha_subida
            ) 
            VALUES ($1, $2, $3, $4, $5, NOW()) 
            RETURNING *
        `;

        const values = [
            solicitudId,
            archivo.originalname,
            archivo.path,
            'Documento Principal', // Valor estándar como texto
            req.usuario.id,
            
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            mensaje: 'Documento subido correctamente',
            documento: result.rows[0]
        });

    } catch (error) {
        console.error('Error al subir documento:', error);
        res.status(500).json({ error: 'Falla interna al registrar el documento en la base de datos.' });
    }
};

// Obtener todos los documentos de una solicitud específica (Mantenemos tu código intacto)
export const obtenerDocumentosPorSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

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

// CU-09: Descargar el archivo físico de un documento (Mantenemos tu código intacto)
export const descargarDocumento = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT ruta_archivo, nombre_archivo_original FROM documentos WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Documento no encontrado en la base de datos.' });
            return;
        }

        const documento = result.rows[0];
        const rutaAbsoluta = path.resolve(documento.ruta_archivo);

        if (!fs.existsSync(rutaAbsoluta)) {
            res.status(404).json({ error: 'El archivo físico se perdió o fue eliminado del servidor.' });
            return;
        }

        res.download(rutaAbsoluta, documento.nombre_archivo_original);

    } catch (error) {
        console.error('Error al descargar documento:', error);
        res.status(500).json({ error: 'Falla interna al intentar descargar el anexo.' });
    }
};