import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { pool } from '../db';
import PDFDocument from 'pdfkit';

// CU-05: Crear solicitud (borrador)
export const crearSolicitudBorrador = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Sacamos el ID del usuario directamente del token (¡es más seguro que pedirlo en el body!)
        const investigador_id = req.usuario.id; 
        const { tipo_investigacion, titulo_proyecto } = req.body;

        // Generar un número de expediente único (Ej: CIEI-2026-1234)
        const anio = new Date().getFullYear();
        const numero_aleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const numero_expediente = `CIEI-${anio}-${numero_aleatorio}`;

        // Insertar en la base de datos PostgreSQL
        const result = await pool.query(
            `INSERT INTO solicitudes (numero_expediente, investigador_id, tipo_investigacion, titulo_proyecto, estado_actual)
             VALUES ($1, $2, $3, $4, 'borrador') RETURNING *`,
            [numero_expediente, investigador_id, tipo_investigacion, titulo_proyecto]
        );

        res.status(201).json({
            mensaje: 'Borrador de solicitud creado exitosamente',
            solicitud: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear solicitud:', error);
        res.status(500).json({ error: 'Error interno al guardar la solicitud.' });
    }
    
};
// CU-03 / Dashboard: Obtener las solicitudes del investigador logueado
// CU-02: Obtener mis solicitudes (Investigador)
export const obtenerMisSolicitudes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Sacamos el ID del usuario del token
        const investigador_id = req.usuario.id;

        // ¡AQUÍ ESTÁ LA MAGIA! Agregamos comentarios_comite a la lista del SELECT
        const result = await pool.query(
            `SELECT id, numero_expediente, tipo_investigacion, titulo_proyecto, estado_actual, comentarios_comite, created_at 
             FROM solicitudes 
             WHERE investigador_id = $1 
             ORDER BY created_at DESC`,
            [investigador_id]
        );

        res.json({
            mensaje: 'Solicitudes recuperadas',
            solicitudes: result.rows
        });

    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ error: 'Falla interna al cargar los expedientes del investigador.' });
    }
};
// CU-04: Enviar la solicitud al comité (Cambiar estado)
export const enviarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const investigador_id = req.usuario.id;

        // SEGURO DE CALIDAD KODIAK: Convertimos el ID de texto a número entero
        const solicitudId = parseInt(id as string, 10);

        if (isNaN(solicitudId)) {
            res.status(400).json({ error: 'ID de expediente inválido.' });
            return;
        }

        // Ahora ejecutamos la consulta pasando el número limpio
        const result = await pool.query(
            `UPDATE solicitudes 
             SET estado_actual = 'enviado' 
             WHERE id = $1 AND investigador_id = $2 
             RETURNING *`,
            [solicitudId, investigador_id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado o no autorizado.' });
            return;
        }

        res.json({
            mensaje: 'Expediente enviado a revisión exitosamente',
            solicitud: result.rows[0]
        });

    } catch (error) {
        // Esto imprimirá el motivo exacto en la terminal si algo más falla
        console.error('Error detallado al enviar solicitud:', error);
        res.status(500).json({ error: 'Falla interna al actualizar el estado del expediente.' });
    }
};
// CU-07: Obtener todas las solicitudes para el panel del Comité (Admin)
export const obtenerSolicitudesComite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Hacemos un JOIN con la tabla usuarios para traer los nombres del investigador
        // Filtramos para que NO traiga los borradores (esos son privados del investigador)
        const result = await pool.query(
            `SELECT s.id, s.numero_expediente, s.tipo_investigacion, s.titulo_proyecto, s.estado_actual, s.created_at, 
                    u.nombres, u.apellidos 
             FROM solicitudes s
             JOIN usuarios u ON s.investigador_id = u.id
             WHERE s.estado_actual != 'borrador'
             ORDER BY s.created_at ASC`
        );

        res.json({
            mensaje: 'Solicitudes para revisión recuperadas',
            solicitudes: result.rows
        });

    } catch (error) {
        console.error('Error al obtener solicitudes para el comité:', error);
        res.status(500).json({ error: 'Falla interna al cargar la bandeja del comité.' });
    }
};
// CU-08: Dictaminar expediente (Aprobar, Observar, Rechazar)
// CU-08: Dictaminar expediente (Aprobar, Observar, Rechazar)
export const dictaminarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // NUEVO: Ahora también recibimos los comentarios desde React
        const { nuevo_estado, comentarios } = req.body; 
        
        const solicitudId = parseInt(id as string, 10);

        // Actualizamos el estado Y los comentarios al mismo tiempo
        const result = await pool.query(
            `UPDATE solicitudes 
             SET estado_actual = $1, comentarios_comite = $2 
             WHERE id = $3 
             RETURNING *`,
            [nuevo_estado, comentarios || null, solicitudId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        res.json({
            mensaje: `El expediente ha sido cambiado a: ${nuevo_estado}`,
            solicitud: result.rows[0]
        });

    } catch (error) {
        console.error('Error al dictaminar:', error);
        res.status(500).json({ error: 'Falla interna al procesar el dictamen.' });
    }
};
// CU-10: Asignar revisor a un expediente (Exclusivo del Presidente)
export const asignarRevisor = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { revisor_id } = req.body; 

        const solicitudId = parseInt(id as string, 10);

        // Actualizamos el expediente: Le ponemos revisor y lo pasamos a "en_revision"
        const result = await pool.query(
            `UPDATE solicitudes 
             SET revisor_id = $1, estado_actual = 'en_revision' 
             WHERE id = $2 
             RETURNING *`,
            [revisor_id, solicitudId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        res.json({
            mensaje: 'Revisor asignado exitosamente. El proyecto ahora está en revisión.',
            solicitud: result.rows[0]
        });

    } catch (error) {
        console.error('Error al asignar revisor:', error);
        res.status(500).json({ error: 'Falla interna al asignar el expediente.' });
    }
};
// CU-11: Subsanar un expediente observado (Exclusivo del Investigador)
export const subsanarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const investigador_id = req.usuario.id;

        // Solo permitimos subsanar si el proyecto le pertenece y está "observado"
        const result = await pool.query(
            `UPDATE solicitudes 
             SET estado_actual = 'subsanado' 
             WHERE id = $1 AND investigador_id = $2 AND estado_actual = 'observado'
             RETURNING *`,
            [id, investigador_id]
        );

        if (result.rowCount === 0) {
            res.status(400).json({ error: 'No se puede subsanar. Verifique que el expediente esté en estado "observado".' });
            return;
        }

        res.json({
            mensaje: 'Observaciones subsanadas. El expediente ha sido reenviado al comité.',
            solicitud: result.rows[0]
        });

    } catch (error) {
        console.error('Error al subsanar expediente:', error);
        res.status(500).json({ error: 'Falla interna al enviar la subsanación.' });
    }
};
// CU-14: Generar Constancia de Aprobación en PDF (Presidente / Investigador)
export const descargarResolucion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Buscamos los datos exactos del expediente
        const result = await pool.query(
            `SELECT s.numero_expediente, s.titulo_proyecto, s.estado_actual, u.nombres, u.apellidos
             FROM solicitudes s
             JOIN usuarios u ON s.investigador_id = u.id
             WHERE s.id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        const expediente = result.rows[0];

        // Validamos que nadie descargue constancias de proyectos no aprobados
        if (expediente.estado_actual !== 'aprobado') {
            res.status(400).json({ error: 'Solo se pueden emitir resoluciones de proyectos aprobados.' });
            return;
        }

        // --- CREACIÓN DEL PDF ---
        const doc = new PDFDocument({ margin: 50 });
        
        // Configuramos el servidor para que envíe un archivo descargable
        res.setHeader('Content-disposition', `attachment; filename="Resolucion_${expediente.numero_expediente}.pdf"`);
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res); 

        // Diseño del Certificado
        doc.fontSize(20).font('Helvetica-Bold').text('UNIVERSIDAD NACIONAL DEL ALTIPLANO', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text('Comité Institucional de Ética en Investigación (CIEI)', { align: 'center' });
        doc.moveDown(3);
        
        doc.fontSize(24).font('Helvetica-Bold').text('CONSTANCIA DE APROBACIÓN', { align: 'center' });
        doc.moveDown(3);

        doc.fontSize(12).font('Helvetica').text(`Por la presente, la presidencia del CIEI certifica que el proyecto de investigación titulado:`, { align: 'justify' });
        doc.moveDown();
        doc.font('Helvetica-Bold').text(`"${expediente.titulo_proyecto}"`, { align: 'center' });
        doc.moveDown();
        
        doc.font('Helvetica').text(`Presentado por el investigador(a) `, { continued: true });
        doc.font('Helvetica-Bold').text(`${expediente.nombres} ${expediente.apellidos}`, { continued: true });
        doc.font('Helvetica').text(`, con número de expediente `, { continued: true });
        doc.font('Helvetica-Bold').text(`${expediente.numero_expediente}`, { continued: true });
        doc.font('Helvetica').text(`, ha sido revisado y APROBADO satisfactoriamente por este comité, cumpliendo con todos los lineamientos éticos requeridos.`, { align: 'justify' });
        
        doc.moveDown(6);
        doc.font('Helvetica').text('__________________________________', { align: 'center' });
        doc.font('Helvetica-Bold').text('Firma del Presidente CIEI', { align: 'center' });
        doc.font('Helvetica').text('Universidad Nacional del Altiplano', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ error: 'Falla interna al generar la resolución.' });
    }
};
// CU-15: Aprobar Expediente (Exclusivo del Presidente)
export const aprobarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Solo el presidente (o el admin para pruebas) puede emitir la aprobación final
        if (req.usuario.rol !== 'presidente' && req.usuario.rol !== 'admin') {
            res.status(403).json({ error: 'Solo el Presidente del CIEI puede aprobar proyectos.' });
            return;
        }

        const result = await pool.query(
            `UPDATE solicitudes SET estado_actual = 'aprobado' WHERE id = $1 RETURNING *`,
            [id]
        );

        res.json({ mensaje: '¡Proyecto Aprobado Oficialmente!', solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al aprobar:', error);
        res.status(500).json({ error: 'Falla interna al aprobar el expediente.' });
    }
};