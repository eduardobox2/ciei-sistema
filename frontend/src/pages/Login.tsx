import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Íconos SVG simples para mejorar la experiencia visual
const MailIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Importante: La lógica de conexión sigue siendo la misma, no se rompe nada
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        correo_institucional: correo,
        password: password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      navigate('/dashboard');
    } catch (err) {
      // Manejo de error más visual y claro
      setError('Las credenciales ingresadas son incorrectas. Por favor, verifique su correo institucional y contraseña.');
    }
  };

  return (
    // Contenedor principal con diseño dividido y fondo suave
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* SECCIÓN IZQUIERDA: Branding e Imagen (Oculta en móviles) */}
      <div className="hidden lg:flex w-1/2 bg-blue-950 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Un sutil patrón de fondo académico (abstracto) */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#fff"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>
        </div>
        
        {/* Logo de UNAP (Placeholder) */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-xl text-yellow-400">U</div>
          <span className="text-xl font-bold tracking-tight">UNAP <span className="font-light text-white/70">| CIEI</span></span>
        </div>

        {/* Mensaje principal */}
        <div className="z-10 max-w-lg mb-20">
          <span className="inline-block bg-yellow-400 text-blue-950 px-3 py-1 rounded-full text-xs font-bold mb-4">PLATAFORMA OFICIAL</span>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tighter">Comité de Ética en la Investigación</h1>
          <p className="mt-6 text-xl text-blue-100 font-light">Garantizando la integridad, responsabilidad y excelencia en cada proyecto científico de la Universidad Nacional del Altiplano.</p>
        </div>

        {/* Footer de la sección */}
        <div className="z-10 text-sm text-white/50">
          Desarrollado con excelencia por KODIAK © 2026
        </div>
      </div>

      {/* SECCIÓN DERECHA: Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-white">
        <div className="w-full max-w-md">
          
          {/* Encabezado del Formulario */}
          <div className="mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tighter">Bienvenido</h2>
            <p className="text-lg text-gray-500 mt-3 font-light">Inicie sesión con sus credenciales institucionales para acceder a la gestión de expedientes.</p>
          </div>

          {/* Alerta de Error estilizada */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-8 flex gap-3 items-center text-sm shadow-inner">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-7">
            
            {/* Campo: Correo */}
            <div className="relative group">
              <label className="text-xs font-bold text-gray-500 tracking-wide uppercase mb-1.5 block">Correo Institucional</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none transition-all duration-150 font-medium placeholder:font-normal placeholder:text-gray-300"
                  placeholder="ejemplo@unap.edu.pe"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div className="relative group">
              <label className="text-xs font-bold text-gray-500 tracking-wide uppercase mb-1.5 block">Contraseña</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10">
                  <LockIcon />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none transition-all duration-150 font-medium placeholder:font-normal placeholder:text-gray-300"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Link opcional de recuperar contraseña (estilo) */}
            <div className="text-right">
              <a href="#" className="text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors">¿Olvidó su contraseña?</a>
            </div>

            {/* Botón de envío potente */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-150 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Ingresar al Sistema</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}