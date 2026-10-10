import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Registro() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', telefono: '', password: '', confirmar: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const pw = form.password;
  const reglas = [
    { ok: pw.length >= 7, texto: 'Mínimo 7 caracteres' },
    { ok: /[A-Z]/.test(pw), texto: 'Una letra mayúscula' },
    { ok: /[0-9]/.test(pw), texto: 'Un número' }
  ];

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (reglas.some(r => !r.ok)) return setError('La contraseña no cumple los requisitos');
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden');

    setCargando(true);
    try {
      const { confirmar, ...datos } = form;
      const r = await api.registro(datos);
      iniciarSesion(r);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="caja-form">
      <h1>Crear cuenta</h1>
      <p className="nota">Regístrate para ofertar en las subastas y publicar tus vehículos.</p>
      <form onSubmit={enviar}>
        <div className="fila-2">
          <label>Nombre
            <input name="nombre" value={form.nombre} onChange={cambiar} required />
          </label>
          <label>Apellido
            <input name="apellido" value={form.apellido} onChange={cambiar} required />
          </label>
        </div>
        <label>Correo electrónico
          <input type="email" name="correo" value={form.correo} onChange={cambiar} required />
        </label>
        <label>Teléfono
          <input name="telefono" value={form.telefono} onChange={cambiar} placeholder="5555-1234" required />
        </label>
        <label>Contraseña
          <input type="password" name="password" value={form.password} onChange={cambiar} required />
        </label>
        <ul className="reglas-pw">
          {reglas.map(r => <li key={r.texto} className={r.ok ? 'ok' : ''}>{r.ok ? '✓' : '•'} {r.texto}</li>)}
        </ul>
        <label>Confirmar contraseña
          <input type="password" name="confirmar" value={form.confirmar} onChange={cambiar} required />
        </label>
        {error && <div className="alerta alerta-error">{error}</div>}
        <button className="btn btn-primario btn-bloque" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>
      <p className="nota centro">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  );
}
