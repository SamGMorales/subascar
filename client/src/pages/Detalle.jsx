import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { socket } from '../socket';
import { useAuth } from '../AuthContext';
import Carrusel from '../components/Carrusel';
import Contador from '../components/Contador';
import BadgeDanio from '../components/BadgeDanio';
import { quetzales, fechaHora } from '../utils';

export default function Detalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [v, setV] = useState(null);
  const [error, setError] = useState('');
  const [monto, setMonto] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState(null);
  const [resaltar, setResaltar] = useState(false);

  const cargar = useCallback(() => {
    api.vehiculo(id)
      .then(datos => {
        setV(datos);
        setEstado(datos.estado);
      })
      .catch(e => setError(e.message));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar, usuario]);

  // sala del vehiculo para recibir las pujas en vivo
  useEffect(() => {
    const unirse = () => socket.emit('unirse', id);
    unirse();
    socket.on('connect', unirse);

    function nuevaPuja(d) {
      if (d.vehiculoId !== id) return;
      setV(prev => {
        if (!prev) return prev;
        const yaEsta = prev.pujas.some(p => p.fecha === d.puja.fecha && p.monto === d.puja.monto);
        return {
          ...prev,
          ofertaActual: d.ofertaActual,
          totalPujas: d.totalPujas,
          ofertaMinima: d.ofertaMinima,
          pujas: yaEsta ? prev.pujas : [{ ...d.puja, mia: false }, ...prev.pujas]
        };
      });
      setResaltar(true);
      setTimeout(() => setResaltar(false), 1200);
    }
    function estadoPuja(d) {
      if (d.vehiculoId !== id) return;
      setV(prev => prev && { ...prev, miEstado: d.estado });
      if (d.estado === 'superado') setMensaje(null);
    }
    function cerrada(d) {
      if (d.vehiculoId === id) cargar();
    }
    function editado(d) {
      if (d.vehiculoId === id) cargar();
    }

    socket.on('nueva-puja', nuevaPuja);
    socket.on('estado-puja', estadoPuja);
    socket.on('subasta-cerrada', cerrada);
    socket.on('vehiculo-editado', editado);

    return () => {
      socket.emit('salir', id);
      socket.off('connect', unirse);
      socket.off('nueva-puja', nuevaPuja);
      socket.off('estado-puja', estadoPuja);
      socket.off('subasta-cerrada', cerrada);
      socket.off('vehiculo-editado', editado);
    };
  }, [id, cargar]);

  async function ofertar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      const r = await api.ofertar(id, Number(monto));
      setMensaje({ tipo: 'exito', texto: r.mensaje });
      setMonto('');
      cargar(); // para que la oferta propia salga como "Tú" en el historial
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  if (error) return <div className="alerta alerta-error">{error} · <Link to="/">Volver al inventario</Link></div>;
  if (!v) return <p className="vacio">Cargando...</p>;

  const ficha = [
    ['Año', v.anio],
    ['Tipo de artículo', v.tipo],
    ['Marca', v.marca],
    ['Modelo', v.modelo],
    ['Motor', v.motor],
    ['Transmisión', v.transmision],
    ['Combustible', v.combustible],
    ['Tren de manejo', v.traccion],
    ['Cilindros', v.cilindros],
    ['Precio base', quetzales(v.precioBase)],
    ['Inicio de subasta', fechaHora(v.inicio)],
    ['Cierre de subasta', fechaHora(v.fin)]
  ];

  const cerrada = estado === 'cerrada';
  const resultado = v.resultado || (v.totalPujas > 0 ? 'vendido' : 'desierta');

  return (
    <div className="detalle">
      <Link to="/" className="volver">← Volver al inventario</Link>

      <div className="detalle-grid">
        <div>
          <Carrusel fotos={v.fotos} />

          <div className="panel">
            <h2>Ficha técnica</h2>
            <table className="ficha">
              <tbody>
                {ficha.map(([k, val]) => (
                  <tr key={k}><th>{k}</th><td>{val}</td></tr>
                ))}
                <tr><th>Estado de daño</th><td><BadgeDanio danio={v.danio} /></td></tr>
              </tbody>
            </table>
            {v.descripcion && <p className="descripcion">{v.descripcion}</p>}
          </div>
        </div>

        <aside className="panel panel-subasta">
          <h1>{v.anio} {v.marca} {v.modelo}</h1>
          <BadgeDanio danio={v.danio} />

          <Contador inicio={v.inicio} fin={v.fin} grande onCambioEstado={setEstado} />

          <div className={'oferta-actual' + (resaltar ? ' resaltar' : '')}>
            <small>{v.ofertaActual ? 'Oferta actual' : 'Precio base'}</small>
            <strong>{quetzales(v.ofertaActual || v.precioBase)}</strong>
            <span>{v.totalPujas} {v.totalPujas === 1 ? 'oferta' : 'ofertas'} · base {quetzales(v.precioBase)}</span>
          </div>

          {usuario && v.miEstado === 'ganando' && !cerrada && (
            <div className="estado-puja ganando">¡Vas ganando esta subasta!</div>
          )}
          {usuario && v.miEstado === 'superado' && !cerrada && (
            <div className="estado-puja superado">Tu oferta ha sido superada. ¡Haz tu oferta ahora antes de que termine el tiempo!</div>
          )}

          {cerrada ? (
            <div className={'resultado grande resultado-' + resultado}>
              {resultado === 'vendido'
                ? `Oferta cerrada · Vendido en ${quetzales(v.ofertaActual)}`
                : 'Oferta cerrada · Subasta desierta (no se alcanzó el monto base)'}
              {usuario && v.miEstado === 'ganando' && resultado === 'vendido' && <div>¡Ganaste esta subasta!</div>}
            </div>
          ) : !usuario ? (
            <div className="bloqueo">
              <p>Para ofertar debes iniciar sesión.</p>
              <Link to="/login" state={{ desde: '/vehiculo/' + id }} className="btn btn-primario">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn-borde">Crear cuenta</Link>
            </div>
          ) : v.esMio ? (
            <div className="bloqueo">
              <p>Esta es tu publicación. No puedes ofertar por tu propio vehículo.</p>
              <Link to={'/editar/' + id} className="btn btn-borde">Editar publicación</Link>
            </div>
          ) : estado === 'proxima' ? (
            <div className="bloqueo"><p>La subasta aún no inicia. Podrás ofertar cuando empiece.</p></div>
          ) : (
            <form className="form-puja" onSubmit={ofertar}>
              <label>Tu oferta (mínimo {quetzales(v.ofertaMinima)})
                <div className="input-q">
                  <span>Q</span>
                  <input
                    type="number"
                    min={v.ofertaMinima}
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    placeholder={String(v.ofertaMinima)}
                    required
                  />
                </div>
              </label>
              <button type="button" className="link" onClick={() => setMonto(String(v.ofertaMinima))}>
                Usar oferta mínima
              </button>
              <button className="btn btn-acento btn-bloque" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Ofertar'}
              </button>
              <small className="nota">Cada oferta debe superar la actual por al menos 10%.</small>
            </form>
          )}

          {mensaje && <div className={'alerta alerta-' + mensaje.tipo}>{mensaje.texto}</div>}

          <div className="historial">
            <h3>Historial de ofertas</h3>
            {v.pujas.length === 0 ? (
              <p className="nota">Todavía no hay ofertas.</p>
            ) : (
              <ul>
                {v.pujas.slice(0, 10).map((p, i) => (
                  <li key={p.fecha + '-' + i}>
                    <span>{p.mia ? 'Tú' : 'Postor anónimo'}</span>
                    <strong>{quetzales(p.monto)}</strong>
                    <small>{fechaHora(p.fecha)}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
