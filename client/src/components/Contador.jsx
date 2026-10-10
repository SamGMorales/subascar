import { useEffect, useState } from 'react';

function partes(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60
  };
}

function texto(ms) {
  const { d, h, m, s } = partes(ms);
  const dos = n => String(n).padStart(2, '0');
  return (d > 0 ? d + 'd ' : '') + `${dos(h)}:${dos(m)}:${dos(s)}`;
}

// Reloj que se actualiza cada segundo sin recargar la pagina
export default function Contador({ inicio, fin, grande = false, onCambioEstado }) {
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const estado = ahora < inicio ? 'proxima' : ahora >= fin ? 'cerrada' : 'activa';

  useEffect(() => {
    if (onCambioEstado) onCambioEstado(estado);
  }, [estado]);

  const clase = 'contador ' + (grande ? 'contador-grande ' : '') + 'contador-' + estado;
  const urgente = estado === 'activa' && fin - ahora < 5 * 60 * 1000;

  if (estado === 'cerrada') {
    return <div className={clase}>Oferta cerrada</div>;
  }
  if (estado === 'proxima') {
    return <div className={clase}><small>Inicia en</small> {texto(inicio - ahora)}</div>;
  }
  return (
    <div className={clase + (urgente ? ' urgente' : '')}>
      <small>Cierra en</small> {texto(fin - ahora)}
    </div>
  );
}
