import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
        SubasCar · Proyecto de Desarrollo Web · Marjorie Samantha Giron Morales · 1890-22-19957
      </footer>
    </>
  );
}
