import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Documento {
  id: number;
  tipo_anexo: string;
  nombre_archivo_original: string;
  fecha_subida: string;
}

export default function EvaluarExpediente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [comentarios, setComentarios] = useState('');

  // Reutilizamos tu ruta para cargar los documentos de este expediente
  useEffect(() => {
    const cargarAnexos = async () => {
      try {
        const token = localStorage.getItem('token');
        const respuesta = await axios.get(`http://localhost:3000/api/documentos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDocumentos(respuesta.data.documentos);
      } catch (error) {
        console.error('Error al cargar anexos', error);
      }
    };
    cargarAnexos();
  }, [id]);

  // Función para enviar la resolución a la base de datos
  const procesarDictamen = async (estadoElegido: string) => {
    if (window.confirm(`¿Está seguro de cambiar el estado de este expediente a ${estadoElegido.toUpperCase()}?`)) {
      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:3000/api/solicitudes/${id}/dictamen`, 
  { nuevo_estado: estadoElegido, comentarios: comentarios }, // <-- Añadimos comentarios
  { headers: { Authorization: `Bearer ${token}` } }
);
        
        alert(`Expediente actualizado con éxito.`);
        navigate('/comite'); // Regresa a la bandeja del comité
      } catch (error) {
        setMensaje('Error al procesar el dictamen en el servidor.');
      } finally {
        setCargando(false);
      }
    }
  };
  // Función avanzada para descargar archivos protegidos con Token
  const manejarDescarga = async (documentoId: number, nombreOriginal: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Pedimos el archivo indicando que recibiremos datos crudos (blob)
      const respuesta = await axios.get(`http://localhost:3000/api/documentos/descargar/${documentoId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', 
      });

      // Creamos una URL temporal en la memoria del navegador
      const url = window.URL.createObjectURL(new Blob([respuesta.data]));
      
      // Creamos un enlace invisible, le hacemos clic y lo borramos
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.setAttribute('download', nombreOriginal);
      document.body.appendChild(enlace);
      enlace.click();
      
      // Limpieza de memoria
      enlace.parentNode?.removeChild(enlace);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Hubo un problema al intentar descargar el archivo.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      <nav className="bg-slate-900 text-white p-4 border-b-4 border-yellow-500 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/comite')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
            ← Volver a la Bandeja
          </button>
          <span className="font-bold text-lg">Evaluación Avanzada | Expediente #{id}</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {mensaje && <div className="bg-red-100 text-red-700 p-4 rounded-xl font-bold">{mensaje}</div>}

        {/* Bloque 1: Revisión de Archivos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Documentos Entregados por el Investigador</h2>
          <p className="text-sm text-slate-500 mb-4">Haga clic en los archivos para descargarlos y proceder con la lectura ética.</p>

          <div className="divide-y divide-slate-100">
            {documentos.length === 0 ? (
              <p className="text-slate-500 py-4 text-sm text-center">Este expediente no contiene archivos adjuntos.</p>
            ) : (
              documentos.map((doc) => (
                <div key={doc.id} className="py-3.5 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-md capitalize">{doc.tipo_anexo}</span>
                    <p className="text-sm font-semibold text-slate-700">{doc.nombre_archivo_original}</p>
                  </div>
                  {/* Simulamos la descarga por ahora */}
                  <button 
  onClick={() => manejarDescarga(doc.id, doc.nombre_archivo_original)}
  className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
  Descargar
</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bloque 2: Panel de Decisiones (Dictamen) */}
        <div className="bg-white p-8 rounded-2xl shadow-md border-2 border-slate-200 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Dictamen del Comité de Ética</h2>
          <p className="text-slate-500 text-sm mb-8">Seleccione una de las siguientes opciones para actualizar de manera oficial el estado legal del expediente en la UNAP.</p>
          {/* NUEVO: Caja de comentarios del comité */}
          <div className="mb-8 text-left">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Observaciones o Dictamen Final (Opcional)
            </label>
            <textarea
              rows={4}
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Ej. El proyecto es viable, pero falta adjuntar la firma del asesor en el Anexo 2..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* BOTÓN APROBAR */}
            <button
              disabled={cargando}
              onClick={() => procesarDictamen('aprobado')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-600/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Aprobar Proyecto 👍
            </button>

            {/* BOTÓN OBSERVAR */}
            <button
              disabled={cargando}
              onClick={() => procesarDictamen('observado')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-amber-500/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Observar / Corregir ⚠️
            </button>

            {/* BOTÓN RECHAZAR */}
            <button
              disabled={cargando}
              onClick={() => procesarDictamen('rechazado')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-red-600/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Rechazar Expediente ❌
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}