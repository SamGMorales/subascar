import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { socket } from '../socket';
import { useAuth } from '../AuthContext';
import Carrusel from '../components/Carrusel';
import Contador from '../components/Contador';
import BadgeDanio from '../components/BadgeDanio';
import EstadoSubasta from '../components/EstadoSubasta';
import Icono from '../components/Icono';
import { quetzales, fechaHora, numeroLote, haceCuanto, nombresDanio } from '../utils';

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
    ['calendario', 'Año', v.anio],
    ['ruta', 'Tipo de artículo', v.tipo],
    ['escudo', 'Marca', v.marca],
    ['escudo', 'Modelo', v.modelo],
    ['motor', 'Motor', v.motor],
    ['engranaje', 'Cilindros', v.cilindros],
    ['engranaje', 'Transmisión', v.transmision],
    ['gota', 'Combustible', v.combustible],
    ['ruta', 'Tren de manejo', v.traccion]
  ];

  const cerrada = estado === 'cerrada';
  const resultado = v.resultado || (v.totalPujas > 0 ? 'vendido' : 'desierta');
  const minima = v.ofertaMinima;
  // botones de puja rapida
  const rapidas = [minima, Math.ceil(minima * 1.05), Math.ceil(minima * 1.15)];

  return (
    <div className="detalle">
      <div className="migas">
        <Link to="/">Inventario</Link> / <span>{v.marca}</span> / <span>{v.modelo}</span> / <b>Lote {numeroLote(v.id)}</b>
      </div>

      <div className="detalle-encabezado">
        <div>
          <span className="fila-lote">LOTE {numeroLote(v.id)}</span>
          <h1>{v.anio} {v.marca} {v.modelo}</h1>
          <div className="detalle-etiquetas">
            <EstadoSubasta v={{ ...v, estado: estado || v.estado, resultado }} />
            <BadgeDanio danio={v.danio} />
            <span className="etiqueta-gris"><Icono nombre="camara" tam={15} /> {v.fotos.length} fotos</span>
            <span className="etiqueta-gris"><Icono nombre="martillo" tam={15} /> {v.totalPujas} ofertas</span>
          </div>
        </div>
      </div>

      <div className="detalle-grid">
        <div>
          <Carrusel fotos={v.fotos} />

          <div className="panel">
            <h2>Ficha técnica</h2>
            <div className="ficha-grid">
              {ficha.map(([ico, k, val]) => (
                <div key={k} className="ficha-item">
                  <Icono nombre={ico} tam={20} />
                  <div><small>{k}</small><strong>{val}</strong></div>
                </div>
              ))}
            </div>

            <div className={'danio-detalle danio-' + v.danio}>
              <span className="punto" />
              <div>
                <small>Clasificación por estado de daño</small>
                <strong>{v.danio.charAt(0).toUpperCase() + v.danio.slice(1)} · {nombresDanio[v.danio]}</strong>
              </div>
            </div>

            {v.descripcion && (
              <>
                <h3 className="subtitulo">Descripción del vendedor</h3>
                <p className="descripcion">{v.descripcion}</p>
              </>
            )}
          </div>

          <div className="panel">
            <h2>Información de la subasta</h2>
            <div className="info-subasta">
              <div><small>Precio base</small><strong>{quetzales(v.precioBase)}</strong></div>
              <div><small>Inicio</small><strong>{fechaHora(v.inicio)}</strong></div>
              <div><small>Cierre</small><strong>{fechaHora(v.fin)}</strong></div>
              <div><small>Incremento mínimo</small><strong>10% sobre la oferta actual</strong></div>
            </div>
          </div>
        </div>

        <aside className="panel-subasta">
          <div className="panel panel-puja">
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
                <Icono nombre="usuario" tam={28} />
                <p>Para ofertar debes iniciar sesión.</p>
                <Link to="/login" state={{ desde: '/vehiculo/' + id }} className="btn btn-primario">Iniciar sesión</Link>
                <Link to="/registro" className="btn btn-borde">Crear cuenta gratis</Link>
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
                <span className="etiqueta-form">Puja rápida</span>
                <div className="pujas-rapidas">
                  {rapidas.map((m, i) => (
                    <button key={i} type="button" className={'puja-rapida' + (Number(monto) === m ? ' activa' : '')} onClick={() => setMonto(String(m))}>
                      {quetzales(m)}
                      <small>{i === 0 ? 'mínima' : i === 1 ? '+5%' : '+15%'}</small>
                    </button>
                  ))}
                </div>
                <label>O escribe tu oferta (mínimo {quetzales(minima)})
                  <div className="input-q">
                    <span>Q</span>
                    <input
                      type="number"
                      min={minima}
                      value={monto}
                      onChange={e => setMonto(e.target.value)}
                      placeholder={String(minima)}
                      required
                    />
                  </div>
                </label>
                <button className="btn btn-acento btn-bloque btn-ofertar" disabled={enviando}>
                  <Icono nombre="martillo" /> {enviando ? 'Enviando...' : 'Ofertar ahora'}
                </button>
                <small className="nota">Las ofertas son anónimas. Cada oferta debe superar la actual por al menos 10%.</small>
              </form>
            )}

            {mensaje && <div className={'alerta alerta-' + mensaje.tipo}>{mensaje.texto}</div>}
          </div>

          <div className="panel historial">
            <h3>Historial de ofertas</h3>
            {v.pujas.length === 0 ? (
              <p className="nota">Todavía no hay ofertas. ¡Sé el primero!</p>
            ) : (
              <ul>
                {v.pujas.slice(0, 10).map((p, i) => (
                  <li key={p.fecha + '-' + i} className={(p.mia ? 'mia ' : '') + (i === 0 ? 'primera' : '')}>
                    <span className="avatar-postor">{p.mia ? 'Tú' : <Icono nombre="usuario" tam={14} />}</span>
                    <div>
                      <span>{p.mia ? 'Tu oferta' : 'Postor anónimo'}</span>
                      <small>{haceCuanto(p.fecha)}</small>
                    </div>
                    <strong>{quetzales(p.monto)}</strong>
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
