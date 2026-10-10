import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  function salir() {
    cerrarSesion();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="barra-superior">
        <div className="barra-superior-interno">
          <span><span className="punto-vivo" /> Subastas en vivo las 24 horas</span>
          <span className="ocultar-movil">Vehículos importados de EE. UU. · Precios en quetzales</span>
        </div>
      </div>

      <div className="navbar-interno">
        <Link to="/" className="logo">
          <img src="/icono.svg" alt="" />
          <span>Subas<b>Car</b></span>
        </Link>

        <nav className="menu">
          <NavLink to="/" end>Inventario</NavLink>
          <NavLink to="/publicar">Vender vehículo</NavLink>
          {usuario && <NavLink to="/mis-publicaciones">Mis publicaciones</NavLink>}
        </nav>

        <div className="sesion">
          {usuario ? (
            <>
              <span className="saludo">
                <span className="avatar">{usuario.nombre.charAt(0)}</span>
                {usuario.nombre} {usuario.apellido}
              </span>
              <button className="btn btn-borde btn-sm" onClick={salir}>Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-borde btn-sm">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn-acento btn-sm">Registrarse gratis</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
