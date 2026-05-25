import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Documento {
  id: number;
  tipo_anexo: string;
  nombre_archivo_original: string;
  fecha_subida: string;
}

interface SolicitudInfo {
  id: number;
  estado_actual: string;
  comentarios_comite?: string;
}

export default function ExpedienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipoAnexo, setTipoAnexo] = useState('proyecto');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [solicitud, setSolicitud] = useState<SolicitudInfo | null>(null);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 1. Cargar Documentos
      const resDocs = await axios.get(`http://localhost:3000/api/documentos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocumentos(resDocs.data.documentos);

      // 2. Cargar el estado del expediente
      const resSol = await axios.get(`http://localhost:3000/api/solicitudes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Buscamos el expediente actual en la lista del investigador
      const solActual = resSol.data.solicitudes.find((s: SolicitudInfo) => s.id === parseInt(id as string));
      if (solActual) {
        setSolicitud(solActual);
      }

    } catch (error) {
      console.error('Error al cargar datos', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const manejarSubida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) {
      setMensaje({ texto: 'Por favor, seleccione un archivo.', tipo: 'error' });
      return;
    }

    setCargando(true);
    setMensaje({ texto: '', tipo: '' });

    const formData = new FormData();
    formData.append('solicitud_id', id as string);
    formData.append('tipo_anexo', tipoAnexo);
    formData.append('archivo', archivo);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/documentos/subir', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMensaje({ texto: '¡Documento subido exitosamente!', tipo: 'exito' });
      setArchivo(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      cargarDatos();
    } catch (error: any) {
      setMensaje({ 
        texto: error.response?.data?.error || 'Error al subir el documento.', 
        tipo: 'error' 
      });
    } finally {
      setCargando(false);
    }
  };

  const enviarAlComite = async () => {
    if (documentos.length === 0) {
      setMensaje({ texto: 'Debe subir al menos un documento antes de enviar el expediente.', tipo: 'error' });
      return;
    }

    if(window.confirm('¿Está seguro de enviar este expediente a revisión? Ya no podrá modificar los documentos.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:3000/api/solicitudes/${id}/enviar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert('¡Expediente enviado a revisión con éxito!');
        navigate('/dashboard'); 
      } catch (error: any) {
        setMensaje({ texto: error.response?.data?.error || 'Error de conexión.', tipo: 'error' });
      }
    }
  };

  const enviarSubsanacion = async () => {
    if(window.confirm('¿Está seguro de enviar sus correcciones? El expediente regresará al comité.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:3000/api/solicitudes/${id}/subsanar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert('¡Subsanación enviada correctamente!');
        navigate('/dashboard'); 
      } catch (error: any) {
        setMensaje({ texto: error.response?.data?.error || 'Error de conexión.', tipo: 'error' });
      }
    }
  };

  // Variable para saber si el usuario puede subir archivos
  const esEditable = solicitud?.estado_actual === 'borrador' || solicitud?.estado_actual === 'observado';

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <nav className="bg-slate-900 text-white shadow-md z-10 p-4 border-b-4 border-blue-600">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors flex items-center gap-2 text-sm font-bold bg-white/10 px-3 py-1.5 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Volver
            </button>
            <span className="font-bold text-lg tracking-tight hidden sm:block">Gestión de Anexos | Expediente #{id}</span>
          </div>
          
          {/* BOTONES INTELIGENTES SEGÚN ESTADO */}
          {solicitud?.estado_actual === 'borrador' && (
            <button 
              onClick={enviarAlComite}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              Enviar al Comité
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          )}

          {solicitud?.estado_actual === 'observado' && (
            <button 
              onClick={enviarSubsanacion}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              Enviar Subsanación
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        
        {/* ALERTA DE OBSERVACIONES (Solo aparece si está observado) */}
        {solicitud?.estado_actual === 'observado' && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm">
            <h3 className="text-amber-800 font-extrabold text-lg flex items-center gap-2 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Observaciones del Comité de Ética
            </h3>
            <p className="text-amber-900 font-medium">
              {solicitud.comentarios_comite || "El comité ha solicitado correcciones en su proyecto. Por favor suba los documentos corregidos."}
            </p>
          </div>
        )}

        {/* MODO SOLO LECTURA (Si ya fue enviado/evaluado) */}
        {!esEditable && solicitud && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl font-bold text-center text-sm">
            Este expediente se encuentra en estado "{solicitud.estado_actual.toUpperCase()}". Los documentos están bloqueados y no pueden ser modificados.
          </div>
        )}

        {/* ZONA DE CARGA (Se oculta si no es editable) */}
        {esEditable && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">Subir Documentos</h2>
            <p className="text-slate-500 mb-6 text-sm">Adjunte los archivos requeridos para la evaluación del comité.</p>

            {mensaje.texto && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 ${
                mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {mensaje.texto}
              </div>
            )}

            <form onSubmit={manejarSubida} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Documento</label>
                <select
                  value={tipoAnexo}
                  onChange={(e) => setTipoAnexo(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                >
                  <option value="proyecto">Proyecto Completo</option>
                  <option value="consentimiento">Consentimiento Informado</option>
                  <option value="instrumento">Instrumento de Recolección</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Archivo (PDF/DOCX)</label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setArchivo(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl transition-all"
                />
              </div>

              <div className="md:col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={cargando || !archivo}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 shadow-md"
                >
                  {cargando ? 'Subiendo...' : 'Subir Documento al Expediente'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLA DE ARCHIVOS (Siempre visible) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-extrabold text-slate-800 text-lg">Archivos Adjuntos</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Archivo</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {documentos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                      Aún no hay documentos adjuntos en este expediente.
                    </td>
                  </tr>
                ) : (
                  documentos.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700 capitalize">
                        {doc.tipo_anexo}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                        {doc.nombre_archivo_original}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(doc.fecha_subida).toLocaleDateString('es-PE')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}