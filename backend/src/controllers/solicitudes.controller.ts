import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';
import PDFDocument from 'pdfkit';
import { enviarCorreo } from '../utils/mailer';

// CU-05: Crear solicitud (borrador)
export const crearSolicitudBorrador = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const investigador_id = req.usuario.id; 
        // ¡AQUÍ ESTÁ LA MAGIA! Atrapamos los nuevos campos del frontend
        const { 
            tipo_investigacion, titulo_proyecto, facultad, escuela_profesional,
            resumen, objetivos, metodologia, investigadores_asociados, duracion
        } = req.body; 

        const anio = new Date().getFullYear();
        const numero_aleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const numero_expediente = `CIEI-${anio}-${numero_aleatorio}`;

        // Insertamos absolutamente todo en la base de datos
        const result = await pool.query(
            `INSERT INTO solicitudes (
                numero_expediente, investigador_id, tipo_investigacion, titulo_proyecto, 
                facultad, escuela_profesional, resumen, objetivos, metodologia, 
                investigadores_asociados, duracion, estado_actual
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'borrador') RETURNING *`,
            [
                numero_expediente, investigador_id, tipo_investigacion, titulo_proyecto, 
                facultad || 'No especificada', escuela_profesional || 'No especificada',
                resumen || '', objetivos || '', metodologia || '', 
                investigadores_asociados || '', duracion || ''
            ]
        );

        res.status(201).json({
            mensaje: 'Borrador de solicitud creado exitosamente',
            solicitudId: result.rows[0].id, 
            solicitud: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear solicitud:', error);
        res.status(500).json({ error: 'Error interno al guardar la solicitud.' });
    }
};

// CU-02: Obtener mis solicitudes (Investigador)
export const obtenerMisSolicitudes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const investigador_id = req.usuario.id;
        const result = await pool.query(
            `SELECT id, numero_expediente, tipo_investigacion, titulo_proyecto, estado_actual, comentarios_comite, created_at 
             FROM solicitudes 
             WHERE investigador_id = $1 
             ORDER BY created_at DESC`,
            [investigador_id]
        );
        res.json({ mensaje: 'Solicitudes recuperadas', solicitudes: result.rows });
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ error: 'Falla interna al cargar los expedientes del investigador.' });
    }
};

// CU-07: Obtener todas las solicitudes para el panel del Comité (Admin)
export const obtenerSolicitudesComite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await pool.query(
            `SELECT s.id, s.numero_expediente, s.tipo_investigacion, s.titulo_proyecto, s.estado_actual, s.created_at, 
                    u.nombres, u.apellidos 
             FROM solicitudes s
             JOIN usuarios u ON s.investigador_id = u.id
             WHERE s.estado_actual != 'borrador'
             ORDER BY s.created_at ASC`
        );
        res.json({ mensaje: 'Solicitudes para revisión recuperadas', solicitudes: result.rows });
    } catch (error) {
        console.error('Error al obtener solicitudes para el comité:', error);
        res.status(500).json({ error: 'Falla interna al cargar la bandeja del comité.' });
    }
};

// CU-08: Dictaminar expediente (Aprobar, Observar, Rechazar) + ENVÍO DE CORREO
export const dictaminarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nuevo_estado, comentarios } = req.body; 
        const solicitudId = parseInt(id as string, 10);

        // 1. Actualizamos el estado en la base de datos
        const result = await pool.query(
            `UPDATE solicitudes 
             SET estado_actual = $1, comentarios_comite = $2, updated_at = NOW()
             WHERE id = $3 
             RETURNING *`,
            [nuevo_estado, comentarios || null, solicitudId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        const solicitud = result.rows[0];

        // 2. MAGIA KODIAK: Buscar el correo del investigador y enviar alerta
        try {
            const userRes = await pool.query('SELECT nombres, correo_institucional FROM usuarios WHERE id = $1', [solicitud.investigador_id]);
            
            if (userRes.rowCount !== null && userRes.rowCount > 0) {
                const investigador = userRes.rows[0];
                let asunto = '';
                let mensajeHtml = '';

                // Plantillas de correo según la decisión del comité
                if (nuevo_estado === 'aprobado') {
                    asunto = `✅ ¡Proyecto Aprobado! - Expediente ${solicitud.numero_expediente}`;
                    mensajeHtml = `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                            <div style="background-color: #10b981; padding: 20px; text-align: center; color: white;">
                                <h2 style="margin: 0;">¡Dictamen Favorable!</h2>
                            </div>
                            <div style="padding: 30px;">
                                <p>Estimado/a <b>${investigador.nombres}</b>,</p>
                                <p>Le informamos que su proyecto titulado <b>"${solicitud.titulo_proyecto}"</b> ha sido revisado y <b>APROBADO</b> satisfactoriamente.</p>
                                <p>Ya puede ingresar al sistema del CIEI para descargar su Constancia de Aprobación oficial en formato PDF.</p>
                                <br>
                                <p>Atentamente,<br><b>El Comité de Ética (CIEI) - UNA Puno</b></p>
                            </div>
                        </div>
                    `;
                } else if (nuevo_estado === 'observado') {
                    asunto = `⚠️ Observaciones en su Proyecto - Expediente ${solicitud.numero_expediente}`;
                    mensajeHtml = `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                            <div style="background-color: #f59e0b; padding: 20px; text-align: center; color: white;">
                                <h2 style="margin: 0;">Atención Requerida</h2>
                            </div>
                            <div style="padding: 30px;">
                                <p>Estimado/a <b>${investigador.nombres}</b>,</p>
                                <p>El comité ha revisado su proyecto <b>"${solicitud.titulo_proyecto}"</b> y ha emitido el siguiente dictamen con observaciones:</p>
                                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-style: italic;">
                                    ${comentarios}
                                </div>
                                <p>Por favor, ingrese al sistema para subsanar estas observaciones y subir la nueva versión corregida de sus documentos.</p>
                                <br>
                                <p>Atentamente,<br><b>El Comité de Ética (CIEI) - UNA Puno</b></p>
                            </div>
                        </div>
                    `;
                }

                // Disparamos el correo (No bloquea el código si el internet falla)
                if (asunto !== '') {
                    enviarCorreo(investigador.correo_institucional, asunto, mensajeHtml);
                }
            }
        } catch (mailError) {
            console.error('Error al intentar enviar el correo automático:', mailError);
        }

        // 3. Respondemos al frontend que todo fue un éxito
        res.json({ mensaje: `El expediente ha sido cambiado a: ${nuevo_estado}`, solicitud: result.rows[0] });

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

        const result = await pool.query(
            `UPDATE solicitudes 
             SET revisor_id = $1, estado_actual = 'en_revision', updated_at = NOW()
             WHERE id = $2 
             RETURNING *`,
            [revisor_id, solicitudId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }
        res.json({ mensaje: 'Revisor asignado exitosamente. El proyecto ahora está en revisión.', solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al asignar revisor:', error);
        res.status(500).json({ error: 'Falla interna al asignar el expediente.' });
    }
};

// CU-11: Subsanar un expediente observado (Mantenemos como respaldo por si acaso, aunque enviarSolicitud ya lo hace)
export const subsanarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const investigador_id = req.usuario.id;

        const result = await pool.query(
            `UPDATE solicitudes 
             SET estado_actual = 'subsanado', updated_at = NOW()
             WHERE id = $1 AND investigador_id = $2 AND estado_actual = 'observado'
             RETURNING *`,
            [id, investigador_id]
        );

        if (result.rowCount === 0) {
            res.status(400).json({ error: 'No se puede subsanar. Verifique que el expediente esté en estado "observado".' });
            return;
        }
        res.json({ mensaje: 'Observaciones subsanadas. El expediente ha sido reenviado al comité.', solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al subsanar expediente:', error);
        res.status(500).json({ error: 'Falla interna al enviar la subsanación.' });
    }
};

// CU-14: Generar Constancia de Aprobación en PDF
export const descargarResolucion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
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

        if (expediente.estado_actual !== 'aprobado') {
            res.status(400).json({ error: 'Solo se pueden emitir resoluciones de proyectos aprobados.' });
            return;
        }

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-disposition', `attachment; filename="Resolucion_${expediente.numero_expediente}.pdf"`);
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res); 

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

// CU-15: Aprobar Expediente
export const aprobarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (req.usuario.rol !== 'presidente' && req.usuario.rol !== 'admin') {
            res.status(403).json({ error: 'Solo el Presidente del CIEI puede aprobar proyectos.' });
            return;
        }
        const result = await pool.query(
            `UPDATE solicitudes SET estado_actual = 'aprobado', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );
        res.json({ mensaje: '¡Proyecto Aprobado Oficialmente!', solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al aprobar:', error);
        res.status(500).json({ error: 'Falla interna al aprobar el expediente.' });
    }
};

// ==========================================
// FUNCIONES KODIAK PARA LA SALA DE EDICIÓN
// ==========================================

// Obtener los detalles de UN solo expediente
export const obtenerSolicitudPorId = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM solicitudes WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }
        res.json({ solicitud: result.rows[0] });
    } catch (error) {
        console.error('[SOLICITUDES] Error al cargar detalles:', error);
        res.status(500).json({ error: 'Falla del servidor al cargar el expediente.' });
    }
};

// Enviar/Subsanar (Cambio de estado inteligente KODIAK)
export const enviarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const investigador_id = req.usuario.id;

        const checkRes = await pool.query('SELECT estado_actual FROM solicitudes WHERE id = $1 AND investigador_id = $2', [id, investigador_id]);
        
        if (checkRes.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado o no te pertenece.' });
            return;
        }

        const estadoActual = checkRes.rows[0].estado_actual;
        const nuevoEstado = estadoActual === 'observado' ? 'subsanado' : 'enviado';

        await pool.query(
            'UPDATE solicitudes SET estado_actual = $1, updated_at = NOW() WHERE id = $2',
            [nuevoEstado, id]
        );

        res.json({ message: `Expediente actualizado exitosamente a: ${nuevoEstado}` });
    } catch (error) {
        console.error('[SOLICITUDES] Error al enviar:', error);
        res.status(500).json({ error: 'Error al enviar el expediente al comité.' });
    }
};
export const cambiarEstadoAPendientePago = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query(
            "UPDATE solicitudes SET estado_actual = 'pendiente_pago', updated_at = CURRENT_TIMESTAMP WHERE id = $1", 
            [id]
        );
        res.json({ mensaje: "Estado actualizado a pendiente de pago" });
    } catch (error) {
        res.status(500).json({ error: "Error interno" });
    }
};