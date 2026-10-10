import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const datos = await api.login(correo, password);
      iniciarSesion(datos);
      navigate((location.state && location.state.desde) || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="caja-form">
      <h1>Iniciar sesión</h1>
      <p className="nota">Necesitas una cuenta para ofertar y publicar vehículos.</p>
      <form onSubmit={enviar}>
        <label>Correo electrónico
          <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} required />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <div className="alerta alerta-error">{error}</div>}
        <button className="btn btn-primario btn-bloque" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <p className="nota centro">¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link></p>
    </div>
  );
}
