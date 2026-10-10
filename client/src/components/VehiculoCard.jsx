import { Link } from 'react-router-dom';
import BadgeDanio from './BadgeDanio';
import Contador from './Contador';
import EstadoSubasta from './EstadoSubasta';
import Icono from './Icono';
import { quetzales, numeroLote } from '../utils';

function siguienteMinima(v) {
  return v.ofertaActual ? Math.ceil(v.ofertaActual * 110 / 100) : v.precioBase;
}

export default function VehiculoCard({ v, resaltar }) {
  return (
    <Link to={'/vehiculo/' + v.id} className={'card-vehiculo' + (resaltar ? ' card-resaltar' : '')}>
      <div className="card-foto">
        {v.miniatura ? <img src={v.miniatura} alt={v.marca + ' ' + v.modelo} /> : <div className="sin-foto">Sin foto</div>}
        <div className="card-etiquetas">
          <EstadoSubasta v={v} />
          {v.esMio && <span className="etiqueta-mio">Mi publicación</span>}
        </div>
        <span className="card-lote">LOTE {numeroLote(v.id)}</span>
      </div>

      <div className="card-cuerpo">
        <div className="card-titulo">
          <h3>{v.anio} {v.marca} {v.modelo}</h3>
          <BadgeDanio danio={v.danio} corto />
        </div>

        <ul className="card-specs">
          <li><Icono nombre="motor" tam={15} />{v.motor} · {v.cilindros} cil.</li>
          <li><Icono nombre="engranaje" tam={15} />{v.transmision}</li>
          <li><Icono nombre="gota" tam={15} />{v.combustible}</li>
          <li><Icono nombre="ruta" tam={15} />{v.traccion}</li>
        </ul>

        <div className="card-precio">
          <div>
            <small>{v.ofertaActual ? 'Oferta actual' : 'Precio base'}</small>
            <strong>{quetzales(v.ofertaActual || v.precioBase)}</strong>
          </div>
          <div className="card-pujas">
            <Icono nombre="martillo" tam={15} /> {v.totalPujas} {v.totalPujas === 1 ? 'oferta' : 'ofertas'}
          </div>
        </div>

        {v.estado === 'cerrada' ? (
          <div className={'resultado resultado-' + v.resultado}>
            {v.resultado === 'vendido' ? 'Subasta finalizada · Vendido' : 'Subasta desierta'}
          </div>
        ) : (
          <>
            <Contador inicio={v.inicio} fin={v.fin} />
            <span className="btn btn-acento btn-bloque btn-card">
              {v.estado === 'activa' ? `Ofertar desde ${quetzales(siguienteMinima(v))}` : 'Ver lote'}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
