import { Link } from 'react-router-dom';
import { quetzales, numeroLote } from '../utils';

// franja con la actividad de pujas (se mueve sola)
export default function Ticker({ items }) {
  if (!items.length) {
    return (
      <div className="ticker">
        <span className="ticker-etiqueta"><span className="punto-vivo" /> EN VIVO</span>
        <div className="ticker-vacio">Aún no hay ofertas. ¡Sé el primero en ofertar!</div>
      </div>
    );
  }

  // se duplica la lista para que la animacion sea continua
  const lista = [...items, ...items];

  return (
    <div className="ticker">
      <span className="ticker-etiqueta"><span className="punto-vivo" /> EN VIVO</span>
      <div className="ticker-ventana">
        <div className="ticker-pista" style={{ animationDuration: Math.max(20, items.length * 6) + 's' }}>
          {lista.map((it, i) => (
            <Link key={i} to={'/vehiculo/' + it.id} className="ticker-item">
              <b>Lote {numeroLote(it.id)}</b> {it.titulo}
              <span className="ticker-monto">{quetzales(it.monto)}</span>
              {it.nueva && <span className="ticker-nueva">nueva oferta</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
