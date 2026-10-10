import { Link } from 'react-router-dom';
import BadgeDanio from './BadgeDanio';
import Contador from './Contador';
import { quetzales } from '../utils';

export default function VehiculoCard({ v }) {
  return (
    <Link to={'/vehiculo/' + v.id} className="card-vehiculo">
      <div className="card-foto">
        {v.miniatura ? <img src={v.miniatura} alt={v.marca + ' ' + v.modelo} /> : <div className="sin-foto">Sin foto</div>}
        <div className="card-etiquetas">
          <BadgeDanio danio={v.danio} corto />
          {v.esMio && <span className="etiqueta-mio">Mi publicación</span>}
        </div>
      </div>
      <div className="card-cuerpo">
        <h3>{v.anio} {v.marca} {v.modelo}</h3>
        <p className="card-specs">
          {v.motor} · {v.transmision} · {v.combustible} · {v.traccion}
        </p>
        <div className="card-precio">
          <div>
            <small>{v.ofertaActual ? 'Oferta actual' : 'Precio base'}</small>
            <strong>{quetzales(v.ofertaActual || v.precioBase)}</strong>
          </div>
          <div className="card-pujas">{v.totalPujas} {v.totalPujas === 1 ? 'oferta' : 'ofertas'}</div>
        </div>
        {v.estado === 'cerrada' ? (
          <div className={'resultado resultado-' + v.resultado}>
            {v.resultado === 'vendido' ? 'Subasta finalizada · Vendido' : 'Subasta desierta'}
          </div>
        ) : (
          <Contador inicio={v.inicio} fin={v.fin} />
        )}
      </div>
    </Link>
  );
}
