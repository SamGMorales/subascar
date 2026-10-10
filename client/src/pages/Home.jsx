import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { socket } from '../socket';
import { useAuth } from '../AuthContext';
import VehiculoCard from '../components/VehiculoCard';
import VehiculoFila from '../components/VehiculoFila';
import Ticker from '../components/Ticker';
import Contador from '../components/Contador';
import Icono from '../components/Icono';
import { quetzales, numeroLote } from '../utils';

const filtrosVacios = {
  q: '', tipo: '', marca: '', modelo: '', anioMin: '', anioMax: '',
  combustible: '', transmision: '', traccion: '', cilindros: '', danio: '', estado: ''
};

const ordenes = {
  cierre: { nombre: 'Cierran primero', fn: null },
  precioMenor: { nombre: 'Precio: menor a mayor', fn: (a, b) => (a.ofertaActual || a.precioBase) - (b.ofertaActual || b.precioBase) },
  precioMayor: { nombre: 'Precio: mayor a menor', fn: (a, b) => (b.ofertaActual || b.precioBase) - (a.ofertaActual || a.precioBase) },
  anio: { nombre: 'Año: más nuevo', fn: (a, b) => b.anio - a.anio },
  pujas: { nombre: 'Más ofertas', fn: (a, b) => b.totalPujas - a.totalPujas }
};

function leerVista() {
  try { return localStorage.getItem('vista') || 'cuadros'; } catch (e) { return 'cuadros'; }
}

export default function Home() {
  const { usuario } = useAuth();
  const [catalogos, setCatalogos] = useState(null);
  const [todos, setTodos] = useState([]); // sin filtros: opciones, estadisticas y "cierran pronto"
  const [vehiculos, setVehiculos] = useState([]);
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [orden, setOrden] = useState('cierre');
  const [vista, setVista] = useState(leerVista);
  const [busqueda, setBusqueda] = useState('');
  const [actividad, setActividad] = useState([]);
  const [recienPujados, setRecienPujados] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.catalogos().then(setCatalogos).catch(() => {});
  }, []);

  function cargarTodos() {
    api.vehiculos().then(lista => {
      setTodos(lista);
      // actividad inicial: lotes activos que ya tienen ofertas
      setActividad(prev => prev.length ? prev : lista
        .filter(v => v.estado === 'activa' && v.ofertaActual)
        .map(v => ({ id: v.id, titulo: `${v.anio} ${v.marca} ${v.modelo}`, monto: v.ofertaActual })));
    }).catch(() => {});
  }

  function cargar() {
    setError('');
    return api.vehiculos(filtros)
      .then(setVehiculos)
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargarTodos, [usuario]);

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
      setTodos(prev => {
        const v = prev.find(x => x.id === d.vehiculoId);
        if (v) {
          setActividad(act => [
            { id: v.id, titulo: `${v.anio} ${v.marca} ${v.modelo}`, monto: d.ofertaActual, nueva: true },
            ...act.filter(a => a.id !== v.id)
          ].slice(0, 12));
        }
        return actualizar(prev);
      });
      setRecienPujados(r => ({ ...r, [d.vehiculoId]: true }));
      setTimeout(() => setRecienPujados(r => ({ ...r, [d.vehiculoId]: false })), 1500);
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

  const ordenados = useMemo(() => {
    const fn = ordenes[orden].fn;
    return fn ? [...vehiculos].sort(fn) : vehiculos;
  }, [vehiculos, orden]);

  const cierranPronto = todos.filter(v => v.estado === 'activa').sort((a, b) => a.fin - b.fin).slice(0, 4);
  const activas = todos.filter(v => v.estado === 'activa').length;
  const totalOfertas = todos.reduce((s, v) => s + (v.totalPujas || 0), 0);
  const hayFiltros = Object.values(filtros).some(v => v !== '');

  function cambiar(e) {
    const { name, value } = e.target;
    setFiltros(f => ({ ...f, [name]: value, ...(name === 'marca' ? { modelo: '' } : {}) }));
  }

  function toggleDanio(color) {
    const actuales = filtros.danio ? filtros.danio.split(',') : [];
    const nuevos = actuales.includes(color) ? actuales.filter(c => c !== color) : [...actuales, color];
    setFiltros(f => ({ ...f, danio: nuevos.join(',') }));
  }

  function buscarDesdeHero(e) {
    e.preventDefault();
    setFiltros(f => ({ ...f, q: busqueda }));
    document.getElementById('inventario').scrollIntoView({ behavior: 'smooth' });
  }

  function cambiarVista(v) {
    setVista(v);
    try { localStorage.setItem('vista', v); } catch (e) { /* sin almacenamiento */ }
  }

  function elegirTipo(t) {
    setFiltros(f => ({ ...f, tipo: f.tipo === t ? '' : t }));
    document.getElementById('inventario').scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <Ticker items={actividad} />

      <section className="hero">
        <div className="hero-texto">
          <span className="hero-chip"><Icono nombre="martillo" tam={16} /> Subastas de vehículos importados</span>
          <h1>Encuentra tu próximo vehículo y <span>oferta en tiempo real</span></h1>
          <p>Autos, pickups y camionetas de subasta estilo EE. UU. Ve el estado de daño, revisa las fotos y puja en vivo sin recargar la página.</p>

          <form className="hero-busqueda" onSubmit={buscarDesdeHero}>
            <Icono nombre="buscar" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Busca por marca, modelo o año. Ej: Toyota Corolla" />
            <button className="btn btn-acento">Buscar</button>
          </form>

          <div className="hero-danios">
            <span>Buscar por daño:</span>
            {['verde', 'amarillo', 'rojo'].map(c => (
              <button key={c} type="button" className={'chip chip-' + c} onClick={() => { toggleDanio(c); document.getElementById('inventario').scrollIntoView({ behavior: 'smooth' }); }}>
                <span className="punto" />{c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-stat"><strong>{activas}</strong><span>Subastas en vivo</span></div>
          <div className="hero-stat"><strong>{todos.length}</strong><span>Vehículos publicados</span></div>
          <div className="hero-stat"><strong>{totalOfertas}</strong><span>Ofertas realizadas</span></div>
          {usuario
            ? <Link to="/publicar" className="btn btn-primario btn-bloque">Publicar mi vehículo</Link>
            : <Link to="/registro" className="btn btn-primario btn-bloque">Crear cuenta gratis</Link>}
        </div>
      </section>

      {catalogos && (
        <section className="categorias">
          {catalogos.tipos.map(t => (
            <button key={t} className={'categoria' + (filtros.tipo === t ? ' activa' : '')} onClick={() => elegirTipo(t)}>
              {t}
              <small>{todos.filter(v => v.tipo === t).length} lotes</small>
            </button>
          ))}
        </section>
      )}

      {cierranPronto.length > 0 && !hayFiltros && (
        <section className="seccion">
          <div className="seccion-titulo">
            <h2><Icono nombre="reloj" /> Cierran pronto</h2>
            <span className="nota">No dejes pasar estas subastas</span>
          </div>
          <div className="pronto-grid">
            {cierranPronto.map(v => (
              <Link key={v.id} to={'/vehiculo/' + v.id} className="pronto-item">
                {v.miniatura && <img src={v.miniatura} alt="" />}
                <div>
                  <span className="fila-lote">LOTE {numeroLote(v.id)}</span>
                  <h4>{v.anio} {v.marca} {v.modelo}</h4>
                  <strong>{quetzales(v.ofertaActual || v.precioBase)}</strong>
                  <Contador inicio={v.inicio} fin={v.fin} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="inventario" id="inventario">
        <aside className="filtros">
          <div className="filtros-titulo">
            <h2>Filtrar resultados</h2>
            {hayFiltros && <button className="link" onClick={() => setFiltros(filtrosVacios)}>Limpiar todo</button>}
          </div>

          <label>Buscar
            <input name="q" value={filtros.q} onChange={cambiar} placeholder="Marca, modelo, año..." />
          </label>

          <label>Estado de la subasta
            <select name="estado" value={filtros.estado} onChange={cambiar}>
              <option value="">Todas</option>
              <option value="activa">En vivo</option>
              <option value="proxima">Próximas</option>
              <option value="cerrada">Finalizadas</option>
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
          <div className="barra-resultados">
            <div>
              <h2>Vehículos en subasta</h2>
              <span className="nota">{ordenados.length} {ordenados.length === 1 ? 'resultado' : 'resultados'}{hayFiltros ? ' con los filtros aplicados' : ''}</span>
            </div>
            <div className="controles">
              <select value={orden} onChange={e => setOrden(e.target.value)} aria-label="Ordenar">
                {Object.entries(ordenes).map(([k, o]) => <option key={k} value={k}>{o.nombre}</option>)}
              </select>
              <div className="toggle-vista">
                <button className={vista === 'cuadros' ? 'activo' : ''} onClick={() => cambiarVista('cuadros')} aria-label="Ver en cuadros"><Icono nombre="cuadros" /></button>
                <button className={vista === 'lista' ? 'activo' : ''} onClick={() => cambiarVista('lista')} aria-label="Ver en lista"><Icono nombre="lista" /></button>
              </div>
            </div>
          </div>

          {!usuario && (
            <div className="aviso">
              <Icono nombre="escudo" /> Estás viendo el inventario en modo lectura. <Link to="/login">Inicia sesión</Link> o <Link to="/registro">regístrate</Link> para ofertar y publicar.
            </div>
          )}

          {error && <div className="alerta alerta-error">{error}</div>}

          {cargando ? (
            <p className="vacio">Cargando vehículos...</p>
          ) : ordenados.length === 0 ? (
            <div className="vacio">
              <p>No hay vehículos que coincidan con la búsqueda.</p>
              {hayFiltros && <button className="btn btn-borde" onClick={() => setFiltros(filtrosVacios)}>Quitar filtros</button>}
            </div>
          ) : vista === 'cuadros' ? (
            <div className="grid-vehiculos">
              {ordenados.map(v => <VehiculoCard key={v.id} v={v} resaltar={recienPujados[v.id]} />)}
            </div>
          ) : (
            <div className="lista-vehiculos">
              {ordenados.map(v => <VehiculoFila key={v.id} v={v} resaltar={recienPujados[v.id]} />)}
            </div>
          )}
        </section>
      </div>

      <section className="como-funciona">
        <h2>¿Cómo funciona?</h2>
        <div className="pasos">
          <div className="paso">
            <span>1</span>
            <h3>Regístrese</h3>
            <p>Crea tu cuenta gratis con tu nombre, correo y teléfono. Sin cuenta solo puedes ver el inventario.</p>
          </div>
          <div className="paso">
            <span>2</span>
            <h3>Encuentre</h3>
            <p>Usa los filtros por marca, modelo, año, combustible o nivel de daño para encontrar el vehículo ideal.</p>
          </div>
          <div className="paso">
            <span>3</span>
            <h3>Oferte</h3>
            <p>Puja en vivo. Cada oferta debe superar la actual por al menos 10% y te avisamos si alguien te supera.</p>
          </div>
        </div>
      </section>
    </>
  );
}
