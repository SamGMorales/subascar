import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { socket } from '../socket';
import { useAuth } from '../AuthContext';
import VehiculoCard from '../components/VehiculoCard';

const filtrosVacios = {
  q: '', tipo: '', marca: '', modelo: '', anioMin: '', anioMax: '',
  combustible: '', transmision: '', traccion: '', cilindros: '', danio: '', estado: ''
};

export default function Home() {
  const { usuario } = useAuth();
  const [catalogos, setCatalogos] = useState(null);
  const [todos, setTodos] = useState([]); // sin filtros, para armar las opciones de modelo
  const [vehiculos, setVehiculos] = useState([]);
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.catalogos().then(setCatalogos).catch(() => {});
  }, []);

  function cargarTodos() {
    api.vehiculos().then(setTodos).catch(() => {});
  }

  function cargar() {
    setError('');
    return api.vehiculos(filtros)
      .then(setVehiculos)
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargarTodos, [usuario]);

  // espera un poco cuando escriben en el buscador
  useEffect(() => {
    const t = setTimeout(cargar, filtros.q ? 350 : 0);
    return () => clearTimeout(t);
  }, [filtros, usuario]);

  // tiempo real en el inventario
  useEffect(() => {
    function nuevaPuja(d) {
      const actualizar = lista => lista.map(v => v.id === d.vehiculoId
        ? { ...v, ofertaActual: d.ofertaActual, totalPujas: d.totalPujas }
        : v);
      setVehiculos(actualizar);
      setTodos(actualizar);
    }
    function recargar() {
      cargar();
      cargarTodos();
    }
    socket.on('nueva-puja', nuevaPuja);
    socket.on('inventario-actualizado', recargar);
    socket.on('subasta-cerrada', recargar);
    return () => {
      socket.off('nueva-puja', nuevaPuja);
      socket.off('inventario-actualizado', recargar);
      socket.off('subasta-cerrada', recargar);
    };
  }, [filtros]);

  const modelos = useMemo(() => {
    const lista = todos.filter(v => !filtros.marca || v.marca === filtros.marca).map(v => v.modelo);
    return [...new Set(lista)].sort();
  }, [todos, filtros.marca]);

  const marcasConVehiculos = useMemo(() => [...new Set(todos.map(v => v.marca))].sort(), [todos]);

  function cambiar(e) {
    const { name, value } = e.target;
    setFiltros(f => ({ ...f, [name]: value, ...(name === 'marca' ? { modelo: '' } : {}) }));
  }

  function toggleDanio(color) {
    const actuales = filtros.danio ? filtros.danio.split(',') : [];
    const nuevos = actuales.includes(color) ? actuales.filter(c => c !== color) : [...actuales, color];
    setFiltros(f => ({ ...f, danio: nuevos.join(',') }));
  }

  const activas = todos.filter(v => v.estado === 'activa').length;
  const hayFiltros = Object.values(filtros).some(v => v !== '');

  return (
    <>
      <section className="hero">
        <div>
          <h1>Subastas de vehículos importados en tiempo real</h1>
          <p>Regístrate, encuentra el vehículo que buscas y oferta en vivo. Sin recargar la página.</p>
          <div className="hero-pasos">
            <span><b>1</b> Regístrese</span>
            <span><b>2</b> Encuentre</span>
            <span><b>3</b> Oferte</span>
          </div>
        </div>
        <div className="hero-datos">
          <div><strong>{activas}</strong><span>subastas activas</span></div>
          <div><strong>{todos.length}</strong><span>vehículos publicados</span></div>
          {usuario
            ? <Link to="/publicar" className="btn btn-acento">Publicar mi vehículo</Link>
            : <Link to="/registro" className="btn btn-acento">Crear cuenta gratis</Link>}
        </div>
      </section>

      <div className="inventario">
        <aside className="filtros">
          <div className="filtros-titulo">
            <h2>Filtros</h2>
            {hayFiltros && <button className="link" onClick={() => setFiltros(filtrosVacios)}>Limpiar</button>}
          </div>

          <label>Buscar
            <input name="q" value={filtros.q} onChange={cambiar} placeholder="Marca, modelo, año..." />
          </label>

          <label>Estado de la subasta
            <select name="estado" value={filtros.estado} onChange={cambiar}>
              <option value="">Todas</option>
              <option value="activa">Activas</option>
              <option value="proxima">Próximas</option>
              <option value="cerrada">Cerradas</option>
            </select>
          </label>

          <div className="filtro-grupo">
            <span>Nivel de daño</span>
            <div className="chips">
              {['verde', 'amarillo', 'rojo'].map(c => (
                <button
                  key={c}
                  type="button"
                  className={'chip chip-' + c + (filtros.danio.split(',').includes(c) ? ' activo' : '')}
                  onClick={() => toggleDanio(c)}
                >
                  <span className="punto" />{c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <label>Tipo
            <select name="tipo" value={filtros.tipo} onChange={cambiar}>
              <option value="">Todos</option>
              {catalogos && catalogos.tipos.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>

          <label>Marca
            <select name="marca" value={filtros.marca} onChange={cambiar}>
              <option value="">Todas</option>
              {marcasConVehiculos.map(m => <option key={m}>{m}</option>)}
            </select>
          </label>

          <label>Modelo
            <select name="modelo" value={filtros.modelo} onChange={cambiar}>
              <option value="">Todos</option>
              {modelos.map(m => <option key={m}>{m}</option>)}
            </select>
          </label>

          <div className="fila-2">
            <label>Año desde
              <input name="anioMin" type="number" value={filtros.anioMin} onChange={cambiar} placeholder="2010" />
            </label>
            <label>Año hasta
              <input name="anioMax" type="number" value={filtros.anioMax} onChange={cambiar} placeholder="2025" />
            </label>
          </div>

          <label>Combustible
            <select name="combustible" value={filtros.combustible} onChange={cambiar}>
              <option value="">Todos</option>
              {catalogos && catalogos.combustibles.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label>Transmisión
            <select name="transmision" value={filtros.transmision} onChange={cambiar}>
              <option value="">Todas</option>
              {catalogos && catalogos.transmisiones.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>

          <div className="fila-2">
            <label>Tren de manejo
              <select name="traccion" value={filtros.traccion} onChange={cambiar}>
                <option value="">Todos</option>
                {catalogos && catalogos.traccion.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Cilindros
              <select name="cilindros" value={filtros.cilindros} onChange={cambiar}>
                <option value="">Todos</option>
                {catalogos && catalogos.cilindros.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
        </aside>

        <section className="resultados">
          <div className="resultados-titulo">
            <h2>Inventario</h2>
            <span>{vehiculos.length} {vehiculos.length === 1 ? 'vehículo' : 'vehículos'}</span>
          </div>

          {!usuario && (
            <div className="aviso">
              Estás viendo el inventario en modo lectura. <Link to="/login">Inicia sesión</Link> para ofertar o publicar.
            </div>
          )}

          {error && <div className="alerta alerta-error">{error}</div>}

          {cargando ? (
            <p className="vacio">Cargando vehículos...</p>
          ) : vehiculos.length === 0 ? (
            <p className="vacio">No hay vehículos que coincidan con los filtros.</p>
          ) : (
            <div className="grid-vehiculos">
              {vehiculos.map(v => <VehiculoCard key={v.id} v={v} />)}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
