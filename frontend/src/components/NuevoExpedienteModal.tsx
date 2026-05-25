import { useState } from 'react';
import axios from 'axios';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NuevoExpedienteModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('humanos');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Si el modal está cerrado, no renderizamos nada
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Hacemos el POST directo a nuestra ruta del backend
      await axios.post(
        'http://localhost:3000/api/solicitudes',
        { tipo_investigacion: tipo, titulo_proyecto: titulo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Si sale bien, limpiamos el formulario, avisamos al Dashboard y cerramos
      setTitulo('');
      setTipo('humanos');
      onSuccess();
      onClose();
    } catch (err) {
      setError('Ocurrió un error al crear el expediente. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    // Fondo oscuro semi-transparente
    <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      {/* Caja del Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        
        {/* Cabecera del Modal */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Iniciar Nuevo Expediente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Proyecto de Investigación</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none transition-all resize-none text-sm"
                placeholder="Ej. Análisis de datos en la región..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Investigación</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none transition-all text-sm appearance-none"
              >
                <option value="humanos">Estudio con Seres Humanos</option>
                <option value="animales">Estudio con Animales</option>
                
                {/* ¡AQUÍ ESTÁ LA MAGIA! Cambiamos "datos" por "datos_secundarios" */}
                <option value="datos_secundarios">Análisis de Datos Secundarios</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-8 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-md transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {cargando ? 'Guardando...' : 'Crear Expediente'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}