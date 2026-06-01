import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AsignarRevisorModal from '../components/AsignarRevisorModal';

// MAGIA: El sistema detectará automáticamente la URL según dónde esté publicado
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SolicitudComite {
  id: number;
  numero_expediente: string;
  titulo_proyecto: string;
  estado_actual: string;
  nombres: string;
  apellidos: string;
}

export default function PanelComite() {
  const navigate = useNavigate();

  // ==========================================
  // 1. ESTADOS DEL SISTEMA
  // ==========================================
  
  const [usuario, setUsuario] = useState<{ nombres: string; rol: string } | null>(null);
  const [pestañaActiva, setPestañaActiva] = useState<'expedientes' | 'usuarios' | 'portal' | 'reportes'>('expedientes');
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  
  // Expedientes y Buscador
  const [solicitudes, setSolicitudes] = useState<SolicitudComite[]>([]);
  const [busquedaExpediente, setBusquedaExpediente] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudActiva, setSolicitudActiva] = useState<number | null>(null);

  // Usuarios y Buscador
  const [listaUsuarios, setListaUsuarios] = useState<any[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  // Portal y Avisos (CMS)
  const [nuevoVideoUrl, setNuevoVideoUrl] = useState('');
  const [listaAvisos, setListaAvisos] = useState<any[]>([]);
  const [modalAvisoAbierto, setModalAvisoAbierto] = useState(false);
  const [avisoEnEdicion, setAvisoEnEdicion] = useState<number | null>(null);
  const [nuevoAviso, setNuevoAviso] = useState({
    tipo: 'Informativo', color: 'blue', titulo: '', texto: '', imagen_url: '' 
  });

  // ==========================================
  // 2. FUNCIONES DE EXPEDIENTES
  // ==========================================
  
  const cargarBandeja = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await axios.get(`${API_URL}/api/solicitudes/comite/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitudes(respuesta.data.solicitudes);
    } catch (error) {
      console.error('Error al cargar bandeja:', error);
    }
  };

  // NUEVA FUNCIÓN: Exigir Pago al Investigador
  const exigirPago = async (id: number) => {
    if (window.confirm('¿Solicitar pago de derechos? El investigador no podrá avanzar hasta que suba su voucher.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/solicitudes/${id}/exigir-pago`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('¡Proyecto retenido! Se ha habilitado la subida de voucher para el investigador.');
        cargarBandeja();
      } catch (error) {
        alert('Error al exigir el pago. Verifique las rutas del backend.');
      }
    }
  };

  const aprobarExpediente = async (id: number) => {
    if (window.confirm('¿Confirma que desea APROBAR este expediente de forma definitiva?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/solicitudes/${id}/aprobar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('¡Proyecto Aprobado Exitosamente!');
        cargarBandeja();
      } catch (error) {
        alert('Error al aprobar el expediente.');
      }
    }
  };

  const descargarConstanciaPDF = async (id: number, numero_expediente: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/solicitudes/${id}/resolucion`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `Resolucion_${numero_expediente}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) {
      alert('Error al descargar el PDF.');
    }
  };

  const abrirModalAsignacion = (id: number) => {
    setSolicitudActiva(id);
    setModalAbierto(true);
  };

  const expedientesFiltrados = solicitudes.filter(sol => 
    sol.numero_expediente.toLowerCase().includes(busquedaExpediente.toLowerCase()) ||
    sol.nombres.toLowerCase().includes(busquedaExpediente.toLowerCase()) ||
    sol.apellidos.toLowerCase().includes(busquedaExpediente.toLowerCase()) ||
    sol.estado_actual.toLowerCase().includes(busquedaExpediente.toLowerCase())
  );

  // ==========================================
  // 3. FUNCIONES DE USUARIOS
  // ==========================================
  
  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListaUsuarios(response.data.usuarios);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const actualizarRolUsuario = async (id: number, nuevoRol: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/usuarios/${id}/rol`, { rol: nuevoRol }, { headers: { Authorization: `Bearer ${token}` } });
      setListaUsuarios(listaUsuarios.map(u => u.id === id ? { ...u, rol: nuevoRol } : u));
      alert('¡Rol de usuario actualizado!');
    } catch (error) {
      alert('Error al cambiar el rol.');
    }
  };

  const usuariosFiltrados = listaUsuarios.filter(user => 
    user.nombres.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    user.apellidos.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    user.dni.includes(busquedaUsuario)
  );

  // ==========================================
  // 4. FUNCIONES DEL PORTAL (CMS)
  // ==========================================
  
  const cargarDatosPortal = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/portal/contenido`);
      if (response.data.videoUrl) setNuevoVideoUrl(response.data.videoUrl);
      if (response.data.avisos) setListaAvisos(response.data.avisos);
    } catch (error) {
      console.log('Error al cargar datos del portal');
    }
  };

  const [formatosMetadatos, setFormatosMetadatos] = useState<any[]>([]);

  const cargarMetadatosFormatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/portal/formatos/metadatos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormatosMetadatos(res.data);
    } catch (e) {
      console.log('Error al cargar metadatos de formatos');
    }
  };

  const crearNuevoFormato = async () => {
    const titulo = window.prompt('Ingrese el título del nuevo formato (Ej: Formato 04: Declaración Jurada):');
    if (!titulo) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/portal/formatos`, { titulo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarMetadatosFormatos();
    } catch (error) {
      alert('Error al crear el formato.');
    }
  };

  const editarTituloFormato = async (id: number, tituloActual: string) => {
    const nuevoTitulo = window.prompt('Edite el título del formato:', tituloActual);
    if (!nuevoTitulo || nuevoTitulo === tituloActual) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/portal/formatos/${id}/titulo`, { titulo: nuevoTitulo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarMetadatosFormatos();
    } catch (error) {
      alert('Error al editar el título.');
    }
  };

  const eliminarFormato = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este formato? Desaparecerá inmediatamente de la Landing Page.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/portal/formatos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        cargarMetadatosFormatos();
      } catch (error) {
        alert('Error al eliminar el formato.');
      }
    }
  };

  const manejarSubidaFormatoOficial = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('formato', file);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/portal/formatos/subir/${id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('¡Archivo adjuntado y actualizado con éxito!');
      cargarMetadatosFormatos();
    } catch (error) {
      alert('Error al subir el archivo del formato.');
    }
  };

  const actualizarVideoPortada = async () => {
    if (!nuevoVideoUrl) return alert('Por favor ingrese un enlace válido');
    try {
      const token = localStorage.getItem('token'); 
      await axios.put(`${API_URL}/api/portal/video`, { videoUrl: nuevoVideoUrl }, { headers: { Authorization: `Bearer ${token}` } });
      alert('¡Video de la portada actualizado con éxito!');
    } catch (error) { alert('Error al actualizar el video.'); }
  };

  const manejarSubidaImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onloadend = () => setNuevoAviso({ ...nuevoAviso, imagen_url: lector.result as string });
      lector.readAsDataURL(archivo);
    }
  };

  const abrirModalCrearAviso = () => {
    setAvisoEnEdicion(null);
    setNuevoAviso({ tipo: 'Informativo', color: 'blue', titulo: '', texto: '', imagen_url: '' });
    setModalAvisoAbierto(true);
  };

  const abrirModalEditarAviso = (aviso: any) => {
    setAvisoEnEdicion(aviso.id);
    setNuevoAviso({
      tipo: aviso.tipo, color: aviso.color, titulo: aviso.titulo, texto: aviso.texto, imagen_url: aviso.imagen_url || ''
    });
    setModalAvisoAbierto(true);
  };

  const guardarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const fechaHoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
      
      if (avisoEnEdicion) {
        await axios.put(`${API_URL}/api/portal/avisos/${avisoEnEdicion}`, 
          { ...nuevoAviso, fecha: fechaHoy }, { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('¡Aviso actualizado exitosamente!');
      } else {
        await axios.post(`${API_URL}/api/portal/avisos`, 
          { ...nuevoAviso, fecha: fechaHoy }, { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('¡Aviso publicado exitosamente!');
      }
      setModalAvisoAbierto(false); 
      cargarDatosPortal();
    } catch (error) {
      alert('Error al guardar el aviso.');
    }
  };

  const eliminarAviso = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este aviso?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/portal/avisos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        cargarDatosPortal();
      } catch (error) { alert('Error al eliminar el aviso.'); }
    }
  };

  // ==========================================
  // 5. EFECTOS Y NAVEGACIÓN
  // ==========================================
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('usuario');
    if (!token) { navigate('/login'); return; }
    if (userStr) setUsuario(JSON.parse(userStr));
    
    cargarBandeja();
    cargarDatosPortal();
  }, [navigate]);

  useEffect(() => {
    if (pestañaActiva === 'usuarios') cargarUsuarios();
    if (pestañaActiva === 'portal') cargarMetadatosFormatos();
  }, [pestañaActiva]);

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-red-500 selection:text-white">
      
      {/* NAVEGACIÓN SUPERIOR */}
      <nav className="bg-slate-950 text-white shadow-xl z-10 border-b border-slate-800 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
          
          {/* Logo con Link a Landing Page */}
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="CIEI Logo" className="h-10" />
            <div className="flex flex-col border-l border-slate-700 pl-4">
              <span className="font-black text-lg tracking-tight leading-none text-white">Sala de Control</span>
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">Volver al Inicio</span>
            </div>
            <span className="ml-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
              {usuario?.rol}
            </span>
          </div>
          
          {/* Menú de Perfil de Usuario */}
          <div className="relative">
            <div 
              className="flex items-center gap-4 cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition-colors"
              onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{usuario?.nombres}</p>
                <p className="text-xs text-slate-400 font-medium">Opciones ▼</p>
              </div>
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-black shadow-md border-2 border-slate-800">
                {usuario?.nombres.charAt(0)}
              </div>
            </div>

            {/* Menú Desplegable */}
            {menuPerfilAbierto && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in overflow-hidden">
                <button onClick={() => navigate('/perfil')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  Editar Perfil
                </button>
                <button className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center gap-2 border-b border-slate-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Configuración
                </button>
                <button onClick={cerrarSesion} className="w-full text-left px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            <button onClick={() => setPestañaActiva('expedientes')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-extrabold text-sm transition-colors ${pestañaActiva === 'expedientes' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              Bandeja de Expedientes
            </button>
            {(usuario?.rol === 'admin' || usuario?.rol === 'presidente') && (
              <>
                <button onClick={() => setPestañaActiva('usuarios')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-extrabold text-sm transition-colors ${pestañaActiva === 'usuarios' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  Gestión de Usuarios
                </button>
                <button onClick={() => setPestañaActiva('portal')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-extrabold text-sm transition-colors ${pestañaActiva === 'portal' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  Configuración del Portal
                </button>
                <button onClick={() => setPestañaActiva('reportes')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-extrabold text-sm transition-colors ${pestañaActiva === 'reportes' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  Reportes y Estadísticas
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* =========================================
            VISTA 1: EXPEDIENTES (Con Buscador)
            ========================================= */}
        {pestañaActiva === 'expedientes' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Evaluación de Proyectos</h2>
                <p className="text-slate-500 text-sm mt-1">Gestione y revise las solicitudes enviadas.</p>
              </div>
              
              {/* Buscador de Expedientes */}
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Buscar expediente o autor..." 
                  value={busquedaExpediente}
                  onChange={(e) => setBusquedaExpediente(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-medium"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_5px_20px_rgb(0,0,0,0.03)] border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase">Expediente</th>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase">Investigador</th>
                    <th className="px-6 py-5 text-center text-[11px] font-extrabold text-slate-500 uppercase">Estado</th>
                    <th className="px-6 py-5 text-right text-[11px] font-extrabold text-slate-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {expedientesFiltrados.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">No se encontraron expedientes.</td></tr>
                  ) : (
                    expedientesFiltrados.map((sol) => (
                      <tr key={sol.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5 text-sm font-black text-slate-900">{sol.numero_expediente}</td>
                        <td className="px-6 py-5 text-sm font-medium text-slate-600">{sol.nombres} {sol.apellidos}</td>
                        
                        {/* ESTADOS DEL PROYECTO (Con Amarillo) */}
                        <td className="px-6 py-5 text-center">
                          <span className={`px-3 py-1.5 inline-flex text-[11px] font-black uppercase tracking-wider rounded-lg border ${
                            sol.estado_actual === 'aprobado' ? 'bg-green-50 text-green-700 border-green-200' :
                            sol.estado_actual === 'observado' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            sol.estado_actual === 'pendiente_pago' ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
                            sol.estado_actual === 'enviado' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {sol.estado_actual.replace('_', ' ')}
                          </span>
                        </td>
                        
                        {/* BOTONES (Con Peaje) */}
                        <td className="px-6 py-5 text-right text-sm space-x-2">
                          
                          {/* Botones Peaje y Asignación (Solo Presidente/Admin) */}
                          {(usuario?.rol === 'presidente' || usuario?.rol === 'admin') && sol.estado_actual === 'enviado' && (
                            <>
                              <button onClick={() => exigirPago(sol.id)} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-3 py-2 rounded-xl font-bold text-xs shadow-sm" title="Detener y cobrar derechos">
                                Exigir Pago
                              </button>
                              <button onClick={() => abrirModalAsignacion(sol.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-sm">
                                Asignar Revisor
                              </button>
                            </>
                          )}

                          {/* Aviso de Espera de Pago */}
                          {(usuario?.rol === 'presidente' || usuario?.rol === 'admin') && sol.estado_actual === 'pendiente_pago' && (
                            <span className="text-xs font-bold text-yellow-600 italic bg-yellow-50 px-3 py-2 rounded-xl">
                              ⏳ Esperando Voucher del Investigador...
                            </span>
                          )}

                          {/* Demás botones del sistema */}
                          {(usuario?.rol === 'presidente' || usuario?.rol === 'admin') && (sol.estado_actual === 'en_revision' || sol.estado_actual === 'subsanado') && (
                            <button onClick={() => aprobarExpediente(sol.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs">Aprobar</button>
                          )}
                          {(usuario?.rol === 'revisor' || usuario?.rol === 'admin') && sol.estado_actual !== 'aprobado' && sol.estado_actual !== 'pendiente_pago' && (
                            <button onClick={() => navigate(`/comite/evaluar/${sol.id}`)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs">Evaluar</button>
                          )}
                          {sol.estado_actual === 'aprobado' && (
                            <button onClick={() => descargarConstanciaPDF(sol.id, sol.numero_expediente)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-xs">Resolución</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================
            VISTA 2: USUARIOS (Con Buscador)
            ========================================= */}
        {pestañaActiva === 'usuarios' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Gestión de Usuarios y Roles</h2>
                <p className="text-slate-500 text-sm mt-1">Administre los accesos y asigne los permisos.</p>
              </div>
              
              {/* Buscador de Usuarios */}
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Buscar por DNI o Nombre..." 
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-medium"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_5px_20px_rgb(0,0,0,0.03)] border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">DNI</th>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Usuario</th>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Correo Institucional</th>
                    <th className="px-6 py-5 text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Rol Actual</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {usuariosFiltrados.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">No se encontraron usuarios.</td></tr>
                  ) : (
                    usuariosFiltrados.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{user.dni}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{user.nombres} {user.apellidos}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">{user.correo_institucional}</td>
                        <td className="px-6 py-4 text-center">
                          <select 
                            value={user.rol}
                            onChange={(e) => actualizarRolUsuario(user.id, e.target.value)}
                            className={`text-xs font-bold uppercase px-3 py-2 rounded-xl border-2 outline-none cursor-pointer transition-colors ${
                              user.rol === 'admin' || user.rol === 'presidente' ? 'bg-red-50 text-red-700 border-red-200 focus:border-red-500' :
                              user.rol === 'revisor' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:border-amber-500' :
                              'bg-slate-100 text-slate-700 border-slate-200 focus:border-slate-500'
                            }`}
                          >
                            <option value="investigador">Investigador</option>
                            <option value="revisor">Revisor</option>
                            <option value="secretario">Secretario</option>
                            <option value="presidente">Presidente</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================
            VISTA 3: PORTAL (CMS con Edición)
            ========================================= */}
        {pestañaActiva === 'portal' && (
          
          <div className="animate-fade-in space-y-8">
            {/* NUEVA SECCIÓN: GESTIÓN DE FORMATOS OFICIALES DINÁMICOS */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_5px_20px_rgb(0,0,0,0.03)]">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Plantillas y Formatos Oficiales</h3>
                  <p className="text-slate-400 text-xs font-medium mt-1">Gestione los documentos que los tesistas descargarán en la Landing Page.</p>
                </div>
                <button onClick={crearNuevoFormato} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  Nuevo Formato
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formatosMetadatos.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-slate-500 text-sm font-medium">No hay formatos creados. Haga clic en "Nuevo Formato" para empezar.</div>
                ) : (
                  formatosMetadatos.map((formato) => (
                    <div key={formato.id} className="border border-slate-200 p-5 rounded-2xl bg-slate-50/50 flex flex-col justify-between group">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight pr-4">{formato.titulo}</h4>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => editarTituloFormato(formato.id, formato.titulo)} className="text-blue-500 hover:text-blue-700 bg-blue-100 p-1.5 rounded-md" title="Editar título">✎</button>
                            <button onClick={() => eliminarFormato(formato.id)} className="text-red-500 hover:text-red-700 bg-red-100 p-1.5 rounded-md" title="Eliminar formato">✕</button>
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 truncate">
                          <span className="font-bold text-slate-700">Archivo: </span> 
                          {formato.nombre_archivo_original ? formato.nombre_archivo_original : <span className="text-red-500 font-bold">Sin archivo subido</span>}
                        </p>
                      </div>
                      
                      <div className="mt-4">
                        <label className="w-full bg-slate-900 hover:bg-slate-800 text-yellow-400 text-xs font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          {formato.nombre_archivo_original ? 'Reemplazar Archivo' : 'Subir Archivo'}
                          <input 
                            type="file" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => manejarSubidaFormatoOficial(formato.id, e)} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_5px_20px_rgb(0,0,0,0.03)]">
              <h3 className="text-xl font-black text-slate-800 mb-6">Video de la Portada</h3>
              <div className="flex gap-4">
                <input type="text" value={nuevoVideoUrl} onChange={(e) => setNuevoVideoUrl(e.target.value)} placeholder="Link de YouTube o .mp4" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none" />
                <button onClick={actualizarVideoPortada} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all">Actualizar Video</button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_5px_20px_rgb(0,0,0,0.03)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Historial de Avisos y Cronogramas</h3>
                <button onClick={abrirModalCrearAviso} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  Crear Nuevo Aviso
                </button>
              </div>
              
              <div className="overflow-hidden border border-slate-200 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-extrabold text-slate-500 uppercase">Fecha</th>
                      <th className="px-6 py-4 text-left text-[11px] font-extrabold text-slate-500 uppercase">Título</th>
                      <th className="px-6 py-4 text-left text-[11px] font-extrabold text-slate-500 uppercase">Tipo</th>
                      <th className="px-6 py-4 text-right text-[11px] font-extrabold text-slate-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {listaAvisos.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">No hay avisos publicados.</td></tr>
                    ) : (
                      listaAvisos.map(aviso => (
                        <tr key={aviso.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{aviso.fecha}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-bold">{aviso.titulo}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`bg-${aviso.color}-100 text-${aviso.color}-800 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider`}>
                              {aviso.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {/* NUEVO BOTÓN EDITAR */}
                            <button onClick={() => abrirModalEditarAviso(aviso)} className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg">
                              Editar
                            </button>
                            <button onClick={() => eliminarAviso(aviso.id)} className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 px-3 py-1 rounded-lg">
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            VISTA 4: REPORTES Y ESTADÍSTICAS
            ========================================= */}
        {pestañaActiva === 'reportes' && (
          <div className="animate-fade-in space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Dashboard de Estadísticas</h2>
              <p className="text-slate-500 text-sm mt-1">Visión general del rendimiento del Comité de Ética.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Expedientes</p>
                  <p className="text-3xl font-black text-slate-900">{solicitudes.length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Proyectos Aprobados</p>
                  <p className="text-3xl font-black text-slate-900">{solicitudes.filter(s => s.estado_actual === 'aprobado').length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Usuarios Registrados</p>
                  <p className="text-3xl font-black text-slate-900">{listaUsuarios.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-3xl p-12 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <h3 className="text-2xl font-black text-white mb-2 relative z-10">Módulo de Gráficos</h3>
               <p className="text-slate-400 relative z-10">Próximamente conectaremos las gráficas avanzadas en PDF usando los datos históricos.</p>
            </div>
          </div>
        )}

      </main>

      {/* =========================================
          MODALES (VENTANAS EMERGENTES)
          ========================================= */}
          
      {/* MODAL 1: CREAR/EDITAR AVISO CMS */}
      {modalAvisoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in">
            <div className="bg-slate-900 p-6 flex justify-between items-center">
              <h3 className="text-xl font-black text-white">{avisoEnEdicion ? 'Editar Aviso Existente' : 'Publicar Nuevo Aviso'}</h3>
              <button onClick={() => setModalAvisoAbierto(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={guardarAviso} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                  <select value={nuevoAviso.tipo} onChange={(e) => setNuevoAviso({...nuevoAviso, tipo: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium rounded-xl outline-none focus:ring-2 focus:ring-red-500">
                    <option value="Informativo">Informativo</option>
                    <option value="Cronograma">Cronograma</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Color de Etiqueta</label>
                  <select value={nuevoAviso.color} onChange={(e) => setNuevoAviso({...nuevoAviso, color: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium rounded-xl outline-none focus:ring-2 focus:ring-red-500">
                    <option value="blue">Azul</option>
                    <option value="yellow">Amarillo</option>
                    <option value="red">Rojo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Título de la Noticia</label>
                <input required type="text" value={nuevoAviso.titulo} onChange={(e) => setNuevoAviso({...nuevoAviso, titulo: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium rounded-xl outline-none focus:ring-2 focus:ring-red-500" placeholder="Escriba el título principal..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Adjuntar Imagen (Opcional)</label>
                <input 
                  type="file" accept="image/png, image/jpeg, image/jpg" onChange={manejarSubidaImagen} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer" 
                />
                {nuevoAviso.imagen_url && <p className="text-xs text-green-600 font-bold mt-2">✓ Imagen cargada (Base64)</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cuerpo del Aviso</label>
                <textarea required value={nuevoAviso.texto} onChange={(e) => setNuevoAviso({...nuevoAviso, texto: e.target.value})} rows={3} className="w-full px-4 py-3 border border-slate-200 font-medium rounded-xl outline-none focus:ring-2 focus:ring-red-500 resize-none"></textarea>
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-md transition-all">
                {avisoEnEdicion ? 'Guardar Cambios' : 'Publicar Aviso Inmediatamente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASIGNAR REVISOR */}
      <AsignarRevisorModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} onSuccess={cargarBandeja} solicitudId={solicitudActiva} />
    </div>
  );
}