import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExpedienteDetalle from './pages/ExpedienteDetalle';
import PanelComite from './pages/PanelComite';
import EvaluarExpediente from './pages/EvaluarExpediente';
import GestionUsuarios from './pages/GestionUsuarios'; // <-- 1. ¡Aquí está la importación que faltaba!
import RoleGuard from './components/RoleGuard';
import LandingPage from './pages/LandingPage';
import Registro from './pages/Registro';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        
        {/* ZONA PROTEGIDA: Solo para Investigadores */}
        <Route element={<RoleGuard rolPermitido="investigador" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expediente/:id" element={<ExpedienteDetalle />} />
        </Route>

        {/* ZONA PROTEGIDA VIP: Múltiples roles pueden entrar aquí ahora */}
        <Route element={<RoleGuard rolPermitido="admin,presidente,secretario,revisor" />}>
          <Route path="/comite" element={<PanelComite />} />
          <Route path="/comite/evaluar/:id" element={<EvaluarExpediente />} />
          
          {/* <-- 2. ¡Este es el lugar correcto, protegido por la zona VIP! */}
          <Route path="/admin/usuarios" element={<GestionUsuarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;