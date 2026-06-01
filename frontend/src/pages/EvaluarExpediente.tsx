import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  const [datosProyecto, setDatosProyecto] = useState<any>(null); 
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [comentarios, setComentarios] = useState('');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [previewType, setPreviewType] = useState<string>('');

  useEffect(() => {
    const cargarDatosYAnexos = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Cargamos los Anexos (Archivos)
        const resDocs = await axios.get(`${API_URL}/api/documentos/solicitud/${id}`, { headers });
        setDocumentos(resDocs.data.documentos || []);

        // 2. Cargamos los Datos Generales del Proyecto
        try {
          const resDatos = await axios.get(`${API_URL}/api/solicitudes/${id}`, { headers });
          setDatosProyecto(resDatos.data.solicitud || resDatos.data || null);
        } catch (error) {
          console.warn("No se pudo cargar los detalles del proyecto.");
        }

      } catch (error) {
        console.error('Error al cargar la información del expediente', error);
      }
    };
    cargarDatosYAnexos();
  }, [id]);

  const procesarDictamen = async (estadoElegido: string) => {
    if (window.confirm(`¿Está seguro de cambiar el estado de este expediente a ${estadoElegido.toUpperCase()}?`)) {
      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/solicitudes/${id}/dictamen`, 
          { nuevo_estado: estadoElegido, comentarios: comentarios },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert(`Expediente actualizado y notificado con éxito.`);
        navigate('/comite'); 
      } catch (error) {
        setMensaje('Error al procesar el dictamen en el servidor.');
      } finally {
        setCargando(false);
      }
    }
  };

  const manejarDescarga = async (documentoId: number, nombreOriginal: string) => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await axios.get(`${API_URL}/api/documentos/descargar/${documentoId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', 
      });

      const url = window.URL.createObjectURL(new Blob([respuesta.data]));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.setAttribute('download', nombreOriginal);
      document.body.appendChild(enlace);
      enlace.click();
      
      enlace.parentNode?.removeChild(enlace);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Hubo un problema al intentar descargar el archivo.');
    }
  };

  const manejarPrevisualizacion = async (documentoId: number, nombreOriginal: string) => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await axios.get(`${API_URL}/api/documentos/descargar/${documentoId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', 
      });

      const extension = nombreOriginal.split('.').pop()?.toLowerCase() || '';
      const esPDF = extension === 'pdf';
      
      const blob = new Blob([respuesta.data], { 
        type: esPDF ? 'application/pdf' : (respuesta.headers['content-type'] as string || 'application/msword') 
      });
      const url = window.URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setPreviewName(nombreOriginal);
      setPreviewType(extension);
      
    } catch (error) {
      alert('Error al intentar abrir el visor.');
    }
  };

  // ==========================================
  // FUNCIONES DE MEJORA VISUAL (KODIAK)
  // ==========================================
  
  // Formatear la fecha para que se vea bonita (Ej: 31 may 2026, 14:30)
  const formatearFecha = (fechaISO: string) => {
    if (!fechaISO) return 'Fecha desconocida';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-PE', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // Ordenar documentos: El más nuevo SIEMPRE arriba
  const documentosOrdenados = [...documentos].sort((a, b) => 
    new Date(b.fecha_subida).getTime() - new Date(a.fecha_subida).getTime()
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      <nav className="bg-slate-900 text-white p-4 border-b-4 border-blue-500 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/comite')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
            ← Volver a la Bandeja
          </button>
          <span className="font-bold text-lg">Evaluación Técnica | Expediente #{id}</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="w-full lg:w-1/3 space-y-6 flex flex-col h-[800px] overflow-y-auto pr-2 pb-4">
          
          {mensaje && <div className="bg-red-100 text-red-700 p-4 rounded-xl font-bold shrink-0">{mensaje}</div>}

          {/* Bloque 1: Datos Generales */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              📋 Datos del Proyecto
            </h2>
            
            {datosProyecto ? (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Título de la Investigación</span>
                  <p className="font-bold text-slate-800 leading-snug">{datosProyecto.titulo_proyecto || datosProyecto.titulo || 'No especificado'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facultad</span>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{datosProyecto.facultad || '---'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escuela Prof.</span>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{datosProyecto.escuela_profesional || '---'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo</span>
                    <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-1 rounded uppercase tracking-wider">
                      {datosProyecto.tipo_investigacion || 'Estándar'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duración</span>
                    <p className="font-semibold text-slate-700">{datosProyecto.duracion_proyectada || datosProyecto.duracion || '---'}</p>
                  </div>
                </div>

                {datosProyecto.investigadores_asociados && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Equipo de Investigación</span>
                    <p className="font-medium text-slate-600 text-xs">{datosProyecto.investigadores_asociados}</p>
                  </div>
                )}

                {(datosProyecto.resumen || datosProyecto.objetivos) && (
                  <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
                    {datosProyecto.resumen && (
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resumen Científico</span>
                        <div className="text-xs text-slate-600 max-h-24 overflow-y-auto pr-1">
                          {datosProyecto.resumen}
                        </div>
                      </div>
                    )}
                    {datosProyecto.objetivos && (
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Objetivos</span>
                        <div className="text-xs text-slate-600 max-h-24 overflow-y-auto pr-1 whitespace-pre-wrap">
                          {datosProyecto.objetivos}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase animate-pulse">Buscando información...</p>
              </div>
            )}
          </div>

          {/* Bloque 2: Archivos con FECHAS Y ORDEN */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center justify-between">
              Archivos Adjuntos
              <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">Más recientes arriba</span>
            </h2>
            
            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2">
              {documentosOrdenados.length === 0 ? (
                <p className="text-slate-500 py-4 text-sm text-center">Este expediente no contiene archivos.</p>
              ) : (
                documentosOrdenados.map((doc, index) => {
                  const esElMasNuevo = index === 0;
                  const numeroVersion = documentosOrdenados.length - index;

                  return (
                    <div 
                      key={doc.id} 
                      className={`p-3 rounded-xl border transition-all ${
                        esElMasNuevo ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="shrink-0 pt-0.5">
                          {esElMasNuevo ? (
                            <span className="px-2 py-1 text-[10px] font-black bg-blue-600 text-white rounded shadow-sm flex flex-col items-center leading-tight">
                              <span>ACTUAL</span>
                              <span className="opacity-80">V{numeroVersion}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-[10px] font-black bg-slate-200 text-slate-600 rounded flex flex-col items-center leading-tight">
                              <span>HISTORIAL</span>
                              <span className="opacity-80">V{numeroVersion}</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${esElMasNuevo ? 'text-blue-900' : 'text-slate-700'}`} title={doc.nombre_archivo_original}>
                            {doc.nombre_archivo_original}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                            🕒 {formatearFecha(doc.fecha_subida)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => manejarPrevisualizacion(doc.id, doc.nombre_archivo_original)}
                          className="flex-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          👁️ Ver visor
                        </button>
                        <button 
                          onClick={() => manejarDescarga(doc.id, doc.nombre_archivo_original)}
                          className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                            esElMasNuevo ? 'text-blue-700 bg-blue-100 hover:bg-blue-200' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          ⬇️ Descargar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bloque 3: Dictamen */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-200 shrink-0 mb-4">
            <h2 className="text-lg font-black text-slate-900 mb-2">Dictamen Oficial</h2>
            <textarea
              rows={4}
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Escriba aquí las observaciones o conclusiones éticas..."
              className="w-full px-3 py-3 mb-4 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
            />
            <div className="flex flex-col gap-2">
              <button disabled={cargando} onClick={() => procesarDictamen('aprobado')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all text-sm">
                Aprobar Proyecto 👍
              </button>
              <button disabled={cargando} onClick={() => procesarDictamen('observado')} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all text-sm">
                Observar / Corregir ⚠️
              </button>
              <button disabled={cargando} onClick={() => procesarDictamen('rechazado')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all text-sm">
                Rechazar ❌
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Visor Interactivo Gigante */}
        <div className="w-full lg:w-2/3 bg-slate-300 rounded-2xl shadow-inner border border-slate-300 overflow-hidden flex flex-col h-[800px]">
          {previewUrl ? (
            <>
              <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
                <span className="font-bold text-sm truncate pr-4">📄 {previewName}</span>
                <button onClick={() => { setPreviewUrl(null); setPreviewName(''); }} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs font-bold transition-colors">
                  Cerrar Visor
                </button>
              </div>
              
              <div className="flex-1 w-full bg-white relative">
                {previewType === 'pdf' ? (
                  <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-none" title="Visor PDF" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                    <span className="text-6xl mb-4">📝</span>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Archivo Word Detectado</h3>
                    <p className="text-slate-600 font-medium max-w-md mb-6">
                      Los navegadores web no pueden previsualizar documentos de Microsoft Word de forma segura de manera nativa.
                    </p>
                    <button 
                      onClick={() => manejarDescarga(documentos.find(d => d.nombre_archivo_original === previewName)?.id || 0, previewName)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      Descargar archivo original
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <p className="font-bold text-lg">Visor de Documentos Inactivo</p>
              <p className="text-sm mt-1">Seleccione "Ver" en algún archivo de la lista para mostrarlo aquí.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}