import { Response } from 'express';
import { pool } from '../db';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middlewares/authMiddleware';

// CU-12: Obtener todos los usuarios (Solo Admin)
export const obtenerUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // VERIFICACIÓN ROBUSTA: Consultamos el rol real a la Base de Datos
        const usuarioReq = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.usuario.id]);
        
        if (usuarioReq.rowCount === 0 || usuarioReq.rows[0].rol !== 'admin') {
            res.status(403).json({ error: 'Acceso denegado. Área exclusiva de administración.' });
            return;
        }

        const result = await pool.query(
            `SELECT id, dni, nombres, apellidos, correo_institucional, rol, estado, created_at 
             FROM usuarios 
             ORDER BY created_at DESC`
        );

        res.json({ usuarios: result.rows });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Falla interna al cargar el directorio de usuarios.' });
    }
};

// CU-13: Crear un nuevo usuario desde el panel (Solo Admin)
export const crearUsuarioAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // VERIFICACIÓN ROBUSTA
        const usuarioReq = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.usuario.id]);
        
        if (usuarioReq.rowCount === 0 || usuarioReq.rows[0].rol !== 'admin') {
            res.status(403).json({ error: 'Acceso denegado.' });
            return;
        }

        const { dni, nombres, apellidos, correo_institucional, password, rol } = req.body;

        // Encriptamos la contraseña ingresada
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, rol) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, nombres, apellidos, rol`,
            [dni, nombres, apellidos, correo_institucional, password_hash, rol]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente en el sistema.',
            usuario: result.rows[0]
        });

    } catch (error: any) {
        console.error('Error al crear usuario:', error);
        // Código 23505 de PostgreSQL = Unique Violation (Dato repetido)
        if (error.code === '23505') {
            res.status(400).json({ error: 'El DNI o Correo institucional ya están registrados en el sistema.' });
            return;
        }
        res.status(500).json({ error: 'Falla interna al registrar el usuario.' });
    }
};
// CU-14: Cambiar el rol de un usuario (Solo Admin)
export const cambiarRol = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // VERIFICACIÓN ROBUSTA: Consultamos el rol real a la Base de Datos
        const usuarioReq = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.usuario.id]);
        
        if (usuarioReq.rowCount === 0 || usuarioReq.rows[0].rol !== 'admin') {
            res.status(403).json({ error: 'Acceso denegado. Área exclusiva de administración.' });
            return;
        }

        const { id } = req.params;
        const { rol } = req.body;

        // Actualizamos el rol en la base de datos
        await pool.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, id]);

        res.json({ message: 'Rol de usuario actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({ error: 'Falla interna al actualizar el rol del usuario.' });
    }
};