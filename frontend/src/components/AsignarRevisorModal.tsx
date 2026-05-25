import { useState, useEffect } from 'react';
import axios from 'axios';

interface Revisor {
  id: number;
  nombres: string;
  apellidos: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  solicitudId: number | null;
}

export default function AsignarRevisorModal({ isOpen, onClose, onSuccess, solicitudId }: ModalProps) {
  const [revisores, setRevisores] = useState<Revisor[]>([]);
  const [revisorSeleccionado, setRevisorSeleccionado] = useState('');
  const [cargando, setCargando] = useState(false);

  // Cargamos la lista de revisores cuando se abre la ventana
  useEffect(() => {
    if (isOpen) {
      const cargarRevisores = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:3000/api/solicitudes/revisores/lista', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRevisores(res.data.revisores);
        } catch (error) {
          console.error("Error cargando revisores", error);
        }
      };
      cargarRevisores();
    }
  }, [isOpen]);

  if (!isOpen || !solicitudId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!revisorSeleccionado) return;
    
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/solicitudes/${solicitudId}/asignar`,
        { revisor_id: parseInt(revisorSeleccionado) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
      onClose();
      setRevisorSeleccionado('');
    } catch (error) {
      alert('Error al asignar el revisor. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Asignar Revisor Principal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Seleccione un Miembro CIEI:</label>
          <select
            required
            value={revisorSeleccionado}
            onChange={(e) => setRevisorSeleccionado(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 mb-6"
          >
            <option value="" disabled>-- Elija un revisor de la lista --</option>
            {revisores.map(rev => (
              <option key={rev.id} value={rev.id}>
                {rev.nombres} {rev.apellidos}
              </option>
            ))}
          </select>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={cargando || !revisorSeleccionado} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
              {cargando ? 'Asignando...' : 'Confirmar Asignación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}