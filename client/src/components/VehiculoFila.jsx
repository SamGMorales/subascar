import { Link } from 'react-router-dom';
import BadgeDanio from './BadgeDanio';
import Contador from './Contador';
import EstadoSubasta from './EstadoSubasta';
import { quetzales, numeroLote } from '../utils';

// vista de lista, parecida a las tablas de los sitios de subastas
export default function VehiculoFila({ v, resaltar }) {
  return (
    <Link to={'/vehiculo/' + v.id} className={'fila-vehiculo' + (resaltar ? ' card-resaltar' : '')}>
      <div className="fila-foto">
        {v.miniatura && <img src={v.miniatura} alt="" />}
      </div>
      <div className="fila-info">
        <span className="fila-lote">LOTE {numeroLote(v.id)}</span>
        <h3>{v.anio} {v.marca} {v.modelo}</h3>
        <p>{v.tipo} · {v.motor} · {v.transmision} · {v.combustible} · {v.traccion}</p>
      </div>
      <div className="fila-col">
        <small>Daño</small>
        <BadgeDanio danio={v.danio} corto />
      </div>
      <div className="fila-col">
        <small>Estado</small>
        <EstadoSubasta v={v} />
      </div>
      <div className="fila-col fila-tiempo">
        <small>Tiempo</small>
        {v.estado === 'cerrada' ? <span className="nota">Finalizada</span> : <Contador inicio={v.inicio} fin={v.fin} />}
      </div>
      <div className="fila-col fila-precio">
        <small>{v.ofertaActual ? 'Oferta actual' : 'Precio base'}</small>
        <strong>{quetzales(v.ofertaActual || v.precioBase)}</strong>
        <span className="nota">{v.totalPujas} ofertas</span>
      </div>
    </Link>
  );
}
