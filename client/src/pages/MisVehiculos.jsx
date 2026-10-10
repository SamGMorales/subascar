import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import BadgeDanio from '../components/BadgeDanio';
import { quetzales, fechaHora } from '../utils';

const nombreEstado = { activa: 'Activa', proxima: 'Próxima', cerrada: 'Cerrada' };

export default function MisVehiculos() {
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api.misVehiculos(busqueda)
        .then(setLista)
        .catch(e => setError(e.message))
        .finally(() => setCargando(false));
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  return (
    <div>
      <div className="encabezado-pagina">
        <h1>Mis publicaciones</h1>
        <Link to="/publicar" className="btn btn-primario">+ Publicar vehículo</Link>
      </div>

      <input
        className="buscador"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar mis publicaciones por marca, modelo o año..."
      />

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="vacio">Cargando...</p>
      ) : lista.length === 0 ? (
        <p className="vacio">No tienes publicaciones{busqueda ? ' con esa búsqueda' : ''}.</p>
      ) : (
        <div className="lista-mios">
          {lista.map(v => (
            <div key={v.id} className="item-mio">
              {v.miniatura && <img src={v.miniatura} alt="" />}
              <div className="item-info">
                <h3>{v.anio} {v.marca} {v.modelo}</h3>
                <BadgeDanio danio={v.danio} corto />
                <p className="nota">
                  {nombreEstado[v.estado]} · Cierra {fechaHora(v.fin)}
                </p>
              </div>
              <div className="item-precio">
                <small>{v.ofertaActual ? 'Oferta actual' : 'Precio base'}</small>
                <strong>{quetzales(v.ofertaActual || v.precioBase)}</strong>
                <small>{v.totalPujas} ofertas</small>
              </div>
              <div className="item-acciones">
                <Link to={'/vehiculo/' + v.id} className="btn btn-borde btn-sm">Ver</Link>
                {v.estado !== 'cerrada' && (
                  <Link to={'/editar/' + v.id} className="btn btn-primario btn-sm">Editar</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
