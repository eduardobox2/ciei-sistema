import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 1. Asegurar que la carpeta donde se guardarán exista
const uploadDir = 'uploads/documentos';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configurar dónde y con qué nombre se guardan
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Genera un nombre único: Fecha + Número aleatorio + Extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 3. Crear el filtro estricto (Reglas del CU-06)
export const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Límite exacto de 20MB
    fileFilter: (req, file, cb) => {
        const permitidos = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (permitidos.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Formato no permitido. El sistema solo acepta PDF o DOCX.'));
        }
    }
});