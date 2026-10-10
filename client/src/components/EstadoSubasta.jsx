// etiqueta de estado: en vivo, proxima o cerrada
export default function EstadoSubasta({ v }) {
  if (v.estado === 'activa') {
    return <span className="estado estado-activa"><span className="punto-vivo" /> En vivo</span>;
  }
  if (v.estado === 'proxima') {
    return <span className="estado estado-proxima">Próxima</span>;
  }
  return (
    <span className={'estado estado-cerrada'}>
      {v.resultado === 'vendido' ? 'Vendido' : 'Desierta'}
    </span>
  );
}
