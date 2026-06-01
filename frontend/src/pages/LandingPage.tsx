import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as THREE from 'three';
import axios from 'axios';

// Variable de entorno dinámica para despliegue
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Truco maestro para Vite
(window as any).THREE = THREE;

// @ts-ignore
import 'vanta/dist/vanta.net.min';

export default function LandingPage() {
  const navigate = useNavigate();
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  // --- ESTADOS DINÁMICOS DEL PORTAL ---
  const [videoUrl, setVideoUrl] = useState("https://vriunap.pe/vriadds/etica/img/videoetica.mp4");
  const [avisos, setAvisos] = useState<any[]>([]);
  const [formatos, setFormatos] = useState<any[]>([]);
  
  // Estado para la ventana de "Ver todos los avisos"
  const [modalAvisosAbierto, setModalAvisosAbierto] = useState(false);

  // Inicializar Vanta.js
  useEffect(() => {
    let vantaInstance: any = null;
    if (vantaRef.current && (window as any).VANTA) {
      vantaInstance = (window as any).VANTA.NET({
        el: vantaRef.current,
        THREE: THREE,
        color: 0xeab308, 
        backgroundColor: 0x0f172a, 
        points: 13.00,
        maxDistance: 20.00,
        spacing: 20.00,
        showDots: true
      });
      setVantaEffect(vantaInstance);
    }
    return () => {
      if (vantaInstance) vantaInstance.destroy();
    };
  }, []);

  // --- CONEXIÓN CON EL BACKEND ---
  useEffect(() => {
    const cargarContenidoPortal = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/portal/contenido`);
        if (response.data.videoUrl) setVideoUrl(response.data.videoUrl);
        if (response.data.avisos) setAvisos(response.data.avisos);
      } catch (error) {
        console.log("No se pudo cargar el portal dinámico.");
      }
    };

    const cargarFormatos = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/portal/formatos/metadatos`);
        setFormatos(res.data);
      } catch (error) {
        console.error("Error cargando formatos");
      }
    };

    cargarContenidoPortal();
    cargarFormatos();
  }, []);

  // Solo mostramos los 4 más recientes en la vista principal
  const avisosRecientes = avisos.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col scroll-smooth selection:bg-red-500 selection:text-white">
      
      {/* NAVEGACIÓN */}
      <nav className="fixed w-full top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-20 items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <img src="/logo.png" alt="Logo CIEI" className="h-12 hover:scale-105 transition-transform" />
            <div className="hidden sm:flex flex-col border-l-2 border-slate-300 pl-3">
              <span className="font-extrabold tracking-tight text-slate-900 text-xl leading-tight">CIEI</span>
              <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest">UNA Puno</span>
            </div>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm font-bold text-slate-600">
            <a href="#procedimientos" className="hover:text-red-600 transition-colors">Procedimientos</a>
            <a href="#formatos" className="hover:text-red-600 transition-colors">Formatos Oficiales</a>
            <a href="#avisos" className="hover:text-red-600 transition-colors">Avisos</a>
          </div>
          
          <div>
            <Link to="/login" className="bg-slate-900 hover:bg-slate-800 text-yellow-400 px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-lg hover:-translate-y-1 border border-slate-700 block">
              Portal del Sistema
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* SECCIÓN HERO */}
        <section ref={vantaRef} className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 min-h-screen flex items-center border-b-8 border-red-600">
          <div className="max-w-7xl mx-auto px-4 relative z-10 w-full grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-yellow-400 text-sm font-bold uppercase tracking-widest mb-8 backdrop-blur-md shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping absolute"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 relative"></span>
                Plataforma Activa
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tight leading-[1.05] drop-shadow-2xl">
                Comité de Ética en <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-white">
                  Investigación Científica
                </span>
              </h1>
              <p className="text-lg md:text-2xl text-slate-300 mb-10 font-medium leading-relaxed max-w-2xl backdrop-blur-sm bg-slate-900/40 p-5 rounded-2xl border border-white/10 shadow-xl">
                Sistematizamos y agilizamos la evaluación de protocolos de investigación para proteger la vida, los derechos y la dignidad en estudios con humanos y animales.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login" className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_25px_rgba(220,38,38,0.6)] px-8 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
                  Iniciar Sesión
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </Link>
                <Link to="/registro" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-bold transition-all backdrop-blur-md flex items-center justify-center text-lg">
                  Registrarse
                </Link>
              </div>
            </div>

            {/* VIDEO KODIAK INTELIGENTE */}
            <div className="lg:col-span-5 relative group perspective w-full">
              <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-yellow-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black aspect-video transform transition-transform duration-500 hover:scale-[1.02]">
                
                {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${
                      videoUrl.includes('v=') ? videoUrl.split('v=')[1].split('&')[0] : videoUrl.split('youtu.be/')[1]?.split('?')[0]
                    }?autoplay=1&mute=1&loop=1&playlist=${
                      videoUrl.includes('v=') ? videoUrl.split('v=')[1].split('&')[0] : videoUrl.split('youtu.be/')[1]?.split('?')[0]
                    }`}
                    title="Video Institucional"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video controls autoPlay loop muted className="w-full h-full object-contain bg-black" src={videoUrl} />
                )}

              </div>
              <div className="absolute -bottom-4 right-4 z-20">
                <span className="bg-slate-900 border border-slate-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Video Institucional
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* SECCIÓN AVISOS DINÁMICA */}
        <section id="avisos" className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-red-600 font-black tracking-widest uppercase text-sm mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Últimas Noticias
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900">Avisos del Comité</h2>
              </div>
              {avisos.length > 4 && (
                <button 
                  onClick={() => setModalAvisosAbierto(true)}
                  className="text-slate-500 hover:text-red-600 font-bold flex items-center gap-1 transition-colors bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
                >
                  Ver todos los avisos ({avisos.length}) <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              )}
            </div>

            {avisos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                <p className="text-slate-500 font-bold">No hay avisos publicados en este momento.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {avisosRecientes.map((aviso) => (
                  <div key={aviso.id} className="bg-white p-8 rounded-3xl shadow-[0_10px_30px_rgb(0,0,0,0.04)] border border-slate-200 hover:border-yellow-400 hover:shadow-xl transition-all group flex flex-col">
                    
                    {aviso.imagen_url && (
                      <div className="w-full h-48 mb-6 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                        <img src={aviso.imagen_url} alt="Imagen adjunta" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <span className={`bg-${aviso.color}-100 text-${aviso.color}-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>
                        {aviso.tipo}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">Publicado: {aviso.fecha}</span>
                    </div>
                    
                    <h3 className="text-2xl font-extrabold text-slate-800 mb-4 group-hover:text-red-600 transition-colors">
                      {aviso.titulo}
                    </h3>
                    <p className="text-slate-600 mb-6 whitespace-pre-wrap flex-1">{aviso.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECCIÓN FORMATOS OFICIALES DINÁMICOS */}
        <section id="formatos" className="bg-slate-900 py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <span className="text-yellow-400 font-black tracking-widest uppercase text-sm mb-2 block">Descargas Necesarias</span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Formatos Oficiales</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">Descargue las plantillas, complételas y adjúntelas dentro de la plataforma al enviar su expediente.</p>
            </div>
            
            {formatos.length === 0 ? (
              <div className="text-center py-10 bg-slate-800/50 rounded-3xl border border-slate-700 border-dashed">
                <p className="text-slate-400 font-bold">El administrador aún no ha subido los formatos oficiales.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {formatos.map((formato) => {
                  const esPDF = formato.titulo.toLowerCase().includes('pdf');
                  return (
                    <div key={formato.id} className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-yellow-400 hover:-translate-y-2 transition-all duration-300 group flex flex-col">
                      <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center text-yellow-400 mb-6 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-all">
                        {esPDF ? (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        ) : (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        )}
                      </div>
                      <h3 className="font-black text-white text-xl mb-3 flex-1">{formato.titulo}</h3>
                      
                      {formato.nombre_archivo_original ? (
                        <button onClick={() => window.open(`${API_URL}/api/portal/formatos/descargar/${formato.id}`)} className="w-full bg-slate-700 text-white font-extrabold py-3.5 mt-4 rounded-xl flex items-center justify-center gap-2 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors shadow-lg">
                          Descargar Archivo <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        </button>
                      ) : (
                        <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-3.5 mt-4 rounded-xl flex items-center justify-center gap-2 border border-slate-700 cursor-not-allowed">
                          Archivo no disponible
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* PIE DE PÁGINA (Con Tooltip KODIAK) */}
      <footer className="bg-slate-950 text-slate-400 pt-20 pb-8 border-t-8 border-red-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-5">
              <img src="/logovri.png" alt="VRI UNA Puno" className="h-16 mb-6 drop-shadow-xl" />
              <p className="text-slate-400 font-medium leading-relaxed mb-6 max-w-sm">Plataforma de Investigación y Desarrollo, garantizando los más altos estándares éticos y metodológicos en la ciencia de nuestra región.</p>
            </div>
            <div className="md:col-span-3">
              <h4 className="text-white font-black text-xl mb-6 tracking-wide">Enlaces</h4>
              <ul className="space-y-4 font-medium">
                <li><a href="#" className="hover:text-red-500 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Mesa Virtual</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Repositorio</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Reglamentos</a></li>
              </ul>
            </div>
            <div className="md:col-span-4">
              <h4 className="text-white font-black text-xl mb-6 tracking-wide">Contacto Oficial</h4>
              <ul className="space-y-5 font-medium">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-red-500 shadow-inner"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                  <span className="mt-1.5">Av. Floral Nº 1153, Ciudad Universitaria<br/>Puno - Perú</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-red-500 shadow-inner"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>
                  <span>ciei.vri@unap.edu.pe</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-medium">
            <p className="text-slate-500">© 2026 Universidad Nacional del Altiplano. Todos los derechos reservados.</p>
            
            {/* TOOLTIP KODIAK */}
            <div className="relative group cursor-help flex items-center gap-3 bg-slate-900 px-5 py-2.5 rounded-full border border-slate-800 shadow-inner transition-all hover:border-red-500/30">
              <span className="text-slate-500">Desarrollado por</span>
              <span className="font-black tracking-widest text-white group-hover:text-red-500 transition-colors">@KODIAK</span>
              <img src="/kodiak.png" alt="Kodiak" className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.5)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              
              {/* Burbuja flotante con el correo */}
              <div className="absolute bottom-[110%] right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                <div className="bg-slate-800 border border-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl whitespace-nowrap flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  eduardobox2@gmail.com
                </div>
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
              </div>
            </div>

          </div>
        </div>
      </footer>

      {/* MODAL GIGANTE DE AVISOS HISTÓRICOS */}
      {modalAvisosAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-fade-in border border-slate-200">
            <div className="bg-white px-8 py-5 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-3 h-8 bg-red-600 rounded-full block"></span> Historial de Comunicados
              </h3>
              <button onClick={() => setModalAvisosAbierto(false)} className="w-10 h-10 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-full flex items-center justify-center font-bold transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {avisos.map((aviso) => (
                <div key={aviso.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                  {aviso.imagen_url && (
                    <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                      <img src={aviso.imagen_url} alt="Aviso" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`bg-${aviso.color}-100 text-${aviso.color}-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider`}>
                        {aviso.tipo}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">{aviso.fecha}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">{aviso.titulo}</h4>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{aviso.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}