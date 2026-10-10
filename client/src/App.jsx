import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Detalle from './pages/Detalle';
import Login from './pages/Login';
import Registro from './pages/Registro';
import FormVehiculo from './pages/FormVehiculo';
import MisVehiculos from './pages/MisVehiculos';
import { useAuth } from './AuthContext';

// Si no hay sesion lo manda al login y luego lo regresa a donde iba
function Privada({ children }) {
  const { usuario } = useAuth();
  const location = useLocation();
  if (!usuario) return <Navigate to="/login" state={{ desde: location.pathname }} replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="contenedor">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehiculo/:id" element={<Detalle />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/publicar" element={<Privada><FormVehiculo /></Privada>} />
          <Route path="/editar/:id" element={<Privada><FormVehiculo /></Privada>} />
          <Route path="/mis-publicaciones" element={<Privada><MisVehiculos /></Privada>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="footer-interno">
          <div>
            <div className="logo logo-footer"><img src="/icono.svg" alt="" /><span>Subas<b>Car</b></span></div>
            <p>Plataforma de subastas de vehículos importados en tiempo real. Regístrese, encuentre y oferte.</p>
          </div>
          <div>
            <h4>Subastas</h4>
            <Link to="/">Inventario</Link>
            <Link to="/publicar">Vender un vehículo</Link>
            <Link to="/registro">Crear cuenta</Link>
          </div>
          <div>
            <h4>Niveles de daño</h4>
            <span className="leyenda"><span className="punto" style={{ background: 'var(--verde)' }} /> Verde: daño menor / limpio</span>
            <span className="leyenda"><span className="punto" style={{ background: 'var(--amarillo)' }} /> Amarillo: daño medio / reparable</span>
            <span className="leyenda"><span className="punto" style={{ background: 'var(--rojo)' }} /> Rojo: daño severo / salvamento</span>
          </div>
        </div>
        <div className="footer-creditos">
          SubasCar · Proyecto de Desarrollo Web · Marjorie Samantha Giron Morales · 1890-22-19957
        </div>
      </footer>
    </>
  );
}
