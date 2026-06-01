import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Expediente {
  id: number;
  numero_expediente: string;
  titulo_proyecto: string;
  tipo_investigacion: string;
  facultad: string;
  escuela_profesional: string;
  estado_actual: string;
  comentarios_comite?: string;
  nombre_archivo?: string;
  updated_at: string;
}

interface DocumentoHistorial {
  id: number;
  tipo_anexo: string;
  nombre_archivo_original: string;
  fecha_subida: string;
}

// Interfaz para controlar el Modal Post-Aprobación
interface ModalPostAprobacion {
  visible: boolean;
  tipo_documento: string;
  titulo: string;
  descripcion: string;
  colorTema: string;
}

export default function ExpedienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [historial, setHistorial] = useState<DocumentoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  // NUEVO: Estado para el Modal de acciones Post-Aprobación
  const [modalPost, setModalPost] = useState<ModalPostAprobacion | null>(null);

  const cargarDetalles = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const resExpediente = await axios.get(`${API_URL}/api/solicitudes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpediente(resExpediente.data.solicitud);

      const resHistorial = await axios.get(`${API_URL}/api/documentos/solicitud/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistorial(resHistorial.data.documentos || []);

    } catch (error) {
      console.error("Error al cargar el expediente:", error);
      alert("No se pudo obtener la información del expediente.");
      navigate('/dashboard');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDetalles();
  }, [id]);

  const validarArchivo = (file: File): boolean => {
    const extensionesPermitidas = ['.pdf', '.doc', '.docx'];
    const nombreArchivo = file.name.toLowerCase();
    const extValida = extensionesPermitidas.some(ext => nombreArchivo.endsWith(ext));
    
    if (!extValida) {
      alert("Formato no permitido. Solo se aceptan archivos PDF, DOC o DOCX.");
      return false;
    }

    const limitePeso = 20 * 1024 * 1024; 
    if (file.size > limitePeso) {
      alert("El archivo excede el límite permitido de 20MB.");
      return false;
    }
    return true;
  };

  // Drag & Drop Principal (Para Borrador/Observado)
  const manejarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (expediente?.estado_actual === 'borrador' || expediente?.estado_actual === 'observado') setArrastrando(true);
  };
  const manejarDragLeave = () => setArrastrando(false);
  const manejarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    if (expediente?.estado_actual !== 'borrador' && expediente?.estado_actual !== 'observado') return;
    const file = e.dataTransfer.files?.[0];
    if (file && validarArchivo(file)) setArchivo(file);
  };
  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validarArchivo(file)) setArchivo(file);
  };

  // Envío del proyecto principal o subsanación
  const enviarExpedienteComite = async () => {
    if (!archivo && !expediente?.nombre_archivo) {
      alert("Por favor, adjunte el documento antes de enviar.");
      return;
    }
    setSubiendo(true);
    const formData = new FormData();
    if (archivo) formData.append('archivo', archivo);
    formData.append('solicitudId', id || '');

    try {
      const token = localStorage.getItem('token');
      if (archivo) {
        await axios.post(`${API_URL}/api/documentos/subir`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      await axios.put(`${API_URL}/api/solicitudes/${id}/enviar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("¡Expediente enviado exitosamente al Comité de Ética!");
      setArchivo(null);
      cargarDetalles(); 
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al procesar el envío.");
    } finally {
      setSubiendo(false);
    }
  };

  // NUEVO: Envío de documentos Post-Aprobación (Enmiendas, Reportes, Eventos)
  const enviarDocumentoPostAprobacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo || !modalPost) return alert("Por favor seleccione un archivo.");

    setSubiendo(true);
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('solicitudId', id || '');
    formData.append('tipo_documento', modalPost.tipo_documento); // Etiqueta clave para el backend

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/documentos/subir`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      
      alert(`¡${modalPost.titulo} enviado exitosamente al comité!`);
      cerrarModalPost();
      cargarDetalles(); // Recargar para ver el nuevo documento en el historial
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al subir el documento especial.");
    } finally {
      setSubiendo(false);
    }
  };

  const abrirModalPost = (tipo: string, titulo: string, descripcion: string, colorTema: string) => {
    setArchivo(null); // Limpiamos cualquier archivo previo
    setModalPost({ visible: true, tipo_documento: tipo, titulo, descripcion, colorTema });
  };
  const cerrarModalPost = () => {
    setModalPost(null);
    setArchivo(null);
  };

  const descargarResolucionFinal = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/solicitudes/${id}/resolucion`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Resolucion_Aprobacion_${expediente?.numero_expediente}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Error al descargar el documento oficial.");
    }
  };

  const descargarArchivoHistorial = async (idDocumento: number, nombreOriginal: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/documentos/descargar/${idDocumento}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreOriginal);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Error al descargar el archivo del historial.");
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-bold animate-pulse text-lg">Cargando detalles del expediente...</p>
      </div>
    );
  }

  const puedeEditar = expediente?.estado_actual === 'borrador' || expediente?.estado_actual === 'observado';
  const estaAprobado = expediente?.estado_actual === 'aprobado';

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative">
      
      <nav className="bg-blue-950 text-white py-4 px-6 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Volver a Mis Expedientes
          </Link>
          <span className="text-xs bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg font-black tracking-widest uppercase">
            ID Código: #{expediente?.id}
          </span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10 w-full flex-1 space-y-8">
        
        {/* ENCABEZADO Y ESTADO SEMÁFORO */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-black tracking-widest uppercase text-blue-600 block">Número de Trámite</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{expediente?.numero_expediente || 'Borrador'}</h1>
            <p className="text-slate-700 font-bold text-lg leading-snug">{expediente?.titulo_proyecto}</p>
          </div>
          
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado Actual</span>
            <span className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border ${
              expediente?.estado_actual === 'borrador' ? 'bg-slate-100 text-slate-700 border-slate-300' :
              expediente?.estado_actual === 'enviado' ? 'bg-blue-100 text-blue-700 border-blue-300' :
              expediente?.estado_actual === 'en_revision' ? 'bg-purple-100 text-purple-700 border-purple-300' :
              expediente?.estado_actual === 'observado' ? 'bg-orange-50 text-orange-700 border-orange-300 animate-pulse' :
              expediente?.estado_actual === 'subsanado' ? 'bg-teal-100 text-teal-700 border-teal-300' :
              'bg-emerald-100 text-emerald-700 border-emerald-300'
            }`}>
              {expediente?.estado_actual.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* ALERTA CRÍTICA: SI TIENE OBSERVACIONES */}
        {expediente?.estado_actual === 'observado' && expediente.comentarios_comite && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-8 border-orange-500 rounded-2xl p-6 shadow-sm space-y-2">
            <h3 className="text-orange-900 font-black text-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Dictamen de Observaciones Emitido
            </h3>
            <p className="text-slate-700 text-sm font-medium whitespace-pre-wrap">{expediente.comentarios_comite}</p>
            <p className="text-xs text-orange-700 font-bold mt-4">⚠️ Instrucción: Modifique sus documentos locales según lo solicitado y arrastre la nueva versión en la zona inferior.</p>
          </div>
        )}

        {/* RECOMPENSA Y PANEL POST-APROBACIÓN */}
        {estaAprobado && (
          <div className="space-y-4">
            <div className="bg-emerald-600 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
              <div>
                <h3 className="text-2xl font-black mb-1">¡Proyecto Certificado con Éxito!</h3>
                <p className="text-emerald-100 text-sm font-medium">El Comité de Ética ha certificado que su protocolo cumple con los principios bioéticos vigentes.</p>
              </div>
              <button onClick={descargarResolucionFinal} className="bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-4 rounded-xl font-black text-sm flex items-center gap-2 transition-transform active:scale-95 shrink-0 shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Descargar Resolución PDF
              </button>
            </div>

            {/* LOS 3 MÓDULOS AVANZADOS (Solo visibles si está aprobado) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-lg mb-1">Gestión Continua del Proyecto</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Cumpla con los requisitos éticos posteriores a la aprobación del estudio.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => abrirModalPost('enmienda', 'Solicitud de Enmienda', 'Adjunte el documento detallando las modificaciones a su protocolo original.', 'blue')} className="group flex flex-col items-center justify-center p-6 border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50 rounded-2xl transition-all">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <span className="font-black text-slate-800 text-sm">Solicitar Enmienda</span>
                  <span className="text-xs text-slate-500 mt-1 text-center">Cambios en metodología o equipo</span>
                </button>

                <button onClick={() => abrirModalPost('reporte_avance', 'Reporte de Avance o Cierre', 'Suba su informe periódico o el informe final de conclusión del estudio.', 'teal')} className="group flex flex-col items-center justify-center p-6 border-2 border-slate-100 hover:border-teal-200 hover:bg-teal-50 rounded-2xl transition-all">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <span className="font-black text-slate-800 text-sm">Avance y Cierre</span>
                  <span className="text-xs text-slate-500 mt-1 text-center">Informes de cumplimiento ético</span>
                </button>

                <button onClick={() => abrirModalPost('evento_adverso', 'Reporte de Evento Adverso', 'Notificación urgente de riesgos, efectos secundarios o daños a participantes.', 'red')} className="group flex flex-col items-center justify-center p-6 border-2 border-red-100 hover:border-red-300 hover:bg-red-50 bg-red-50/30 rounded-2xl transition-all">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:animate-pulse">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  </div>
                  <span className="font-black text-red-700 text-sm">Evento Adverso</span>
                  <span className="text-xs text-red-500 mt-1 text-center font-medium">Notificación inmediata obligatoria</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUERPO CENTRAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: Ficha y TIMELINE */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3">Ficha del Protocolo</h3>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Tipo de Enfoque</span><p className="text-sm font-bold text-slate-700 capitalize">{expediente?.tipo_investigacion.replace('_', ' ')}</p></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Facultad Destino</span><p className="text-sm font-bold text-slate-700">{expediente?.facultad}</p></div>
            </div>

            {/* TIMELINE DE ARCHIVOS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Historial de Documentos
              </h3>
              
              {historial.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium italic text-center py-4">Aún no se han subido documentos.</p>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {historial.map((doc, index) => (
                    <div key={doc.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-blue-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10"></div>
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl border border-slate-100 bg-slate-50 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded">V{historial.length - index}</span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(doc.fecha_subida).toLocaleDateString('es-PE', { day:'2-digit', month:'short' })}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 truncate mb-2" title={doc.nombre_archivo_original}>
                          {doc.nombre_archivo_original}
                        </p>
                        <button onClick={() => descargarArchivoHistorial(doc.id, doc.nombre_archivo_original)} className="text-[10px] font-black text-slate-500 hover:text-blue-700 flex items-center gap-1 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> 
                          Descargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA GIGANTE: Zona de Archivos Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-800">Documentación Adjunta</h3>
              
              <div 
                onDragOver={manejarDragOver} onDragLeave={manejarDragLeave} onDrop={manejarDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[220px] relative ${
                  arrastrando ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' : 'border-slate-300 bg-slate-50/50'
                } ${!puedeEditar ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-100/30' : ''}`}
              >
                <input 
                  type="file" id="input-file" disabled={!puedeEditar} accept=".pdf,.doc,.docx"
                  onChange={manejarSeleccionArchivo} className="hidden"
                />
                
                <svg className={`w-14 h-14 mb-3 transition-colors ${arrastrando ? 'text-blue-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                
                {archivo && !modalPost ? (
                  <div className="space-y-1 z-10">
                    <p className="text-sm font-black text-slate-800">Archivo seleccionado para cargar:</p>
                    <p className="text-xs text-blue-600 font-bold truncate max-w-md bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100">{archivo.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Peso: {(archivo.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-slate-700">
                      {puedeEditar ? 'Arrastre y suelte su expediente aquí' : 'Carga principal bloqueada'}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {puedeEditar ? 'O si lo prefiere, haga clic para examinar sus archivos' : 'El expediente está en revisión o ya fue aprobado.'}
                    </p>
                    {puedeEditar && (
                      <label htmlFor="input-file" className="mt-4 inline-block bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-colors">
                        Examinar PC
                      </label>
                    )}
                  </div>
                )}
              </div>

              {puedeEditar && (
                <button 
                  onClick={enviarExpedienteComite} disabled={subiendo || (!archivo && !expediente?.nombre_archivo)}
                  className={`w-full py-4 rounded-xl font-black text-sm transition-all text-white shadow-md flex items-center justify-center gap-2 ${
                    subiendo || (!archivo && !expediente?.nombre_archivo)
                      ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                      : expediente?.estado_actual === 'observado'
                      ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                      : 'bg-blue-700 hover:bg-blue-800 shadow-blue-700/20'
                  }`}
                >
                  {subiendo ? 'Procesando y Subiendo Documentos...' : 
                   expediente?.estado_actual === 'observado' ? 'Enviar Subsanación de Observaciones' : 'Confirmar y Enviar al Comité de Ética'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL FLOTANTE PARA POST-APROBACIÓN */}
      {modalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl scale-100 transition-transform">
            
            <div className={`px-6 py-4 border-b flex justify-between items-center bg-${modalPost.colorTema}-50 border-${modalPost.colorTema}-100`}>
              <h3 className={`text-lg font-black text-${modalPost.colorTema}-800`}>{modalPost.titulo}</h3>
              <button onClick={cerrarModalPost} className="text-slate-400 hover:text-slate-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={enviarDocumentoPostAprobacion} className="p-6 space-y-6">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                {modalPost.descripcion}
              </p>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <input 
                  type="file" id="post-file" accept=".pdf,.doc,.docx" required
                  onChange={manejarSeleccionArchivo} className="hidden"
                />
                
                {archivo ? (
                  <div className="space-y-2">
                    <svg className={`w-10 h-10 mx-auto text-${modalPost.colorTema}-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className={`text-sm font-bold text-${modalPost.colorTema}-700 truncate`}>{archivo.name}</p>
                    <label htmlFor="post-file" className="text-xs text-slate-500 font-bold underline cursor-pointer hover:text-slate-700">Cambiar archivo</label>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <label htmlFor="post-file" className="text-sm font-bold text-slate-700 cursor-pointer hover:text-blue-600 transition-colors">
                      Haga clic aquí para seleccionar su documento
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Formatos: PDF, DOCX (Max 20MB)</p>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModalPost} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={subiendo || !archivo} className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md ${
                  subiendo || !archivo ? 'bg-slate-300 shadow-none cursor-not-allowed' : `bg-${modalPost.colorTema}-600 hover:bg-${modalPost.colorTema}-700`
                }`}>
                  {subiendo ? 'Enviando...' : 'Confirmar Envío'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}