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
      <div className="navbar-interno">
        <Link to="/" className="logo">
          <img src="/icono.svg" alt="" />
          <span>Subas<b>Car</b></span>
        </Link>

        <nav className="menu">
          <NavLink to="/" end>Inventario</NavLink>
          {usuario && <NavLink to="/publicar">Publicar vehículo</NavLink>}
          {usuario && <NavLink to="/mis-publicaciones">Mis publicaciones</NavLink>}
        </nav>

        <div className="sesion">
          {usuario ? (
            <>
              <span className="saludo">Hola, {usuario.nombre}</span>
              <button className="btn btn-borde btn-sm" onClick={salir}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-borde btn-sm">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn-primario btn-sm">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
