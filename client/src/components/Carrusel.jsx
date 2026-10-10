import { useState } from 'react';

export default function Carrusel({ fotos }) {
  const [actual, setActual] = useState(0);

  if (!fotos || fotos.length === 0) {
    return <div className="carrusel-vacio">Sin fotografías</div>;
  }

  const anterior = () => setActual((actual - 1 + fotos.length) % fotos.length);
  const siguiente = () => setActual((actual + 1) % fotos.length);

  return (
    <div className="carrusel">
      <div className="carrusel-principal">
        <img src={fotos[actual]} alt={'Foto ' + (actual + 1)} />
        <button className="flecha izq" onClick={anterior} aria-label="Anterior">‹</button>
        <button className="flecha der" onClick={siguiente} aria-label="Siguiente">›</button>
        <span className="contador-fotos">{actual + 1} / {fotos.length}</span>
      </div>
      <div className="carrusel-miniaturas">
        {fotos.map((f, i) => (
          <img
            key={i}
            src={f}
            alt={'Miniatura ' + (i + 1)}
            className={i === actual ? 'activa' : ''}
            onClick={() => setActual(i)}
          />
        ))}
      </div>
    </div>
  );
}
