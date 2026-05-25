import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NuevoExpedienteModal from '../components/NuevoExpedienteModal'; // <-- Importamos tu nuevo Modal

// Definimos la estructura de los datos para TypeScript
interface Solicitud {
  id: number;
  numero_expediente: string;
  tipo_investigacion: string;
  titulo_proyecto: string;
  estado_actual: string;
  created_at: string;
  comentarios_comite?: string;
}

export default function Dashboard() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [usuario, setUsuario] = useState<{ nombres: string; apellidos: string; rol: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- Estado para controlar la ventana
  const navigate = useNavigate();

  // Función para ir a la base de datos a traer los expedientes
  const cargarExpedientes = async () => {
    const token = localStorage.getItem('token');
    try {
      const respuesta = await axios.get('http://localhost:3000/api/solicitudes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitudes(respuesta.data.solicitudes);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      localStorage.clear();
      navigate('/login');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('usuario');

    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userStr) setUsuario(JSON.parse(userStr));

    cargarExpedientes(); // Ejecutamos la búsqueda al entrar
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Barra de Navegación Superior */}
      <nav className="bg-blue-950 text-white shadow-md z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded md flex items-center justify-center font-bold text-yellow-400">U</div>
              <span className="font-bold tracking-tight">CIEI <span className="font-light text-white/70">Dashboard</span></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-200 hidden sm:block">
                Hola, <span className="font-bold text-white">{usuario?.nombres}</span>
              </span>
              <button 
                onClick={cerrarSesion}
                className="bg-white/10 hover:bg-red-500 text-white text-xs font-bold py-2 px-4 rounded transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Mis Expedientes</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Gestione el estado y documentos de sus proyectos de investigación.</p>
          </div>
          
          {/* BOTÓN QUE ABRE EL MODAL */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-700/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
            Nuevo Expediente
          </button>
        </div>

        {/* Tabla de Datos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Expediente</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Título del Proyecto</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <p className="text-base font-medium text-gray-500">Aún no tiene expedientes registrados.</p>
                        <p className="text-sm">Haga clic en "Nuevo Expediente" para comenzar.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((sol) => (
                    <tr key={sol.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                        {sol.numero_expediente}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                        <div className="font-medium truncate">{sol.titulo_proyecto}</div>
                        
                        {/* Si el comité dejó un comentario, se lo mostramos aquí abajo */}
                        {sol.comentarios_comite && (
                          <div className="mt-2 bg-slate-50 border-l-4 border-amber-500 p-2 rounded-r-md text-xs text-slate-600 whitespace-normal">
                            <span className="font-bold text-slate-800">Dictamen del Comité:</span> {sol.comentarios_comite}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {sol.tipo_investigacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-md ${
                          sol.estado_actual === 'borrador' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 
                          sol.estado_actual === 'enviado' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {sol.estado_actual.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
  onClick={() => navigate(`/expediente/${sol.id}`)} 
  className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
>
  <span>Gestionar</span>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* EL MODAL DE NUEVO EXPEDIENTE */}
        <NuevoExpedienteModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={cargarExpedientes} // Le pasamos la función para que actualice la tabla al terminar
        />

      </main>
    </div>
  );
}