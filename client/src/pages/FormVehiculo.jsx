import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { aInputFecha, comprimirImagen, miniaturaDe, nombresDanio } from '../utils';

function formInicial() {
  const ahora = Date.now();
  return {
    anio: '', tipo: '', marca: '', modelo: '', motor: '', transmision: '', combustible: '',
    traccion: '', cilindros: '', danio: '', descripcion: '', precioBase: '',
    inicio: aInputFecha(ahora),
    fin: aInputFecha(ahora + 24 * 60 * 60 * 1000)
  };
}

export default function FormVehiculo() {
  const { id } = useParams(); // si viene id es edicion
  const navigate = useNavigate();
  const [catalogos, setCatalogos] = useState(null);
  const [form, setForm] = useState(formInicial);
  const [fotos, setFotos] = useState([]);
  const [tienePujas, setTienePujas] = useState(false);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.catalogos().then(setCatalogos);
  }, []);

  useEffect(() => {
    if (!id) {
      setForm(formInicial());
      setFotos([]);
      return;
    }
    api.vehiculo(id).then(v => {
      if (!v.esMio) {
        setError('Solo puedes editar tus propias publicaciones');
        return;
      }
      setForm({
        anio: v.anio, tipo: v.tipo, marca: v.marca, modelo: v.modelo, motor: v.motor,
        transmision: v.transmision, combustible: v.combustible, traccion: v.traccion,
        cilindros: v.cilindros, danio: v.danio, descripcion: v.descripcion,
        precioBase: v.precioBase, inicio: aInputFecha(v.inicio), fin: aInputFecha(v.fin)
      });
      setFotos(v.fotos || []);
      setTienePujas(v.totalPujas > 0);
    }).catch(e => setError(e.message));
  }, [id]);

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function agregarFotos(e) {
    const archivos = Array.from(e.target.files);
    e.target.value = '';
    if (!archivos.length) return;
    setProcesando(true);
    try {
      const nuevas = [];
      for (const a of archivos) {
        nuevas.push(await comprimirImagen(a));
      }
      setFotos(prev => [...prev, ...nuevas].slice(0, 12));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  function quitarFoto(i) {
    setFotos(fotos.filter((_, idx) => idx !== i));
  }

  function hacerPortada(i) {
    setFotos([fotos[i], ...fotos.filter((_, idx) => idx !== i)]);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');

    if (fotos.length < 5) return setError('Debes subir mínimo 5 fotografías (llevas ' + fotos.length + ')');
    const inicio = new Date(form.inicio).getTime();
    const fin = new Date(form.fin).getTime();
    if (fin <= inicio) return setError('La fecha de cierre debe ser después de la de inicio');

    setGuardando(true);
    try {
      const datos = {
        ...form,
        anio: Number(form.anio),
        cilindros: Number(form.cilindros),
        precioBase: Number(form.precioBase),
        inicio,
        fin,
        fotos,
        miniatura: await miniaturaDe(fotos[0])
      };
      if (id) {
        await api.editar(id, datos);
        navigate('/vehiculo/' + id);
      } else {
        const r = await api.publicar(datos);
        navigate('/vehiculo/' + r.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!catalogos) return <p className="vacio">Cargando...</p>;

  return (
    <div className="form-vehiculo">
      <div className="encabezado-pagina">
        <h1>{id ? 'Editar publicación' : 'Publicar vehículo para subasta'}</h1>
        {id && <Link to="/mis-publicaciones" className="btn btn-borde">Volver</Link>}
      </div>

      <form onSubmit={guardar}>
        <section className="panel">
          <h2>Ficha técnica</h2>
          <div className="grid-form">
            <label>Año
              <input type="number" name="anio" value={form.anio} onChange={cambiar} min="1950" max={new Date().getFullYear() + 1} required />
            </label>
            <label>Tipo de artículo
              <select name="tipo" value={form.tipo} onChange={cambiar} required>
                <option value="">Seleccione</option>
                {catalogos.tipos.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Marca
              <input name="marca" list="lista-marcas" value={form.marca} onChange={cambiar} required />
              <datalist id="lista-marcas">
                {catalogos.marcas.map(m => <option key={m} value={m} />)}
              </datalist>
            </label>
            <label>Modelo
              <input name="modelo" value={form.modelo} onChange={cambiar} placeholder="Ej. Corolla" required />
            </label>
            <label>Motor
              <input name="motor" value={form.motor} onChange={cambiar} placeholder="Ej. 2.0L" required />
            </label>
            <label>Transmisión
              <select name="transmision" value={form.transmision} onChange={cambiar} required>
                <option value="">Seleccione</option>
                {catalogos.transmisiones.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Tipo de combustible
              <select name="combustible" value={form.combustible} onChange={cambiar} required>
                <option value="">Seleccione</option>
                {catalogos.combustibles.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Tren de manejo
              <select name="traccion" value={form.traccion} onChange={cambiar} required>
                <option value="">Seleccione</option>
                {catalogos.traccion.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Número de cilindros
              <select name="cilindros" value={form.cilindros} onChange={cambiar} required>
                <option value="">Seleccione</option>
                {catalogos.cilindros.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div className="filtro-grupo">
            <span>Clasificación por estado de daño</span>
            <div className="opciones-danio">
              {['verde', 'amarillo', 'rojo'].map(c => (
                <label key={c} className={'opcion-danio danio-' + c + (form.danio === c ? ' activo' : '')}>
                  <input type="radio" name="danio" value={c} checked={form.danio === c} onChange={cambiar} required />
                  <span className="punto" />
                  <b>{c.charAt(0).toUpperCase() + c.slice(1)}</b>
                  <small>{nombresDanio[c]}</small>
                </label>
              ))}
            </div>
          </div>

          <label>Descripción (opcional)
            <textarea name="descripcion" rows="3" value={form.descripcion} onChange={cambiar}
              placeholder="Detalles del daño, kilometraje, si enciende, etc." />
          </label>
        </section>

        <section className="panel">
          <h2>Galería fotográfica <small className="nota">(mínimo 5 fotos, la primera es la portada)</small></h2>
          <label className="subir-fotos">
            <input type="file" accept="image/*" multiple onChange={agregarFotos} />
            {procesando ? 'Procesando fotos...' : '+ Agregar fotografías'}
          </label>
          <p className={'nota ' + (fotos.length >= 5 ? 'ok' : '')}>{fotos.length} de 5 fotos mínimas</p>
          <div className="grid-fotos">
            {fotos.map((f, i) => (
              <div key={i} className="foto-item">
                <img src={f} alt={'Foto ' + (i + 1)} />
                {i === 0 ? <span className="portada">Portada</span>
                  : <button type="button" className="mini-btn" onClick={() => hacerPortada(i)}>Usar de portada</button>}
                <button type="button" className="quitar" onClick={() => quitarFoto(i)} aria-label="Quitar">×</button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Parámetros de la subasta</h2>
          {tienePujas && <div className="aviso">Esta subasta ya tiene ofertas: el precio base y la fecha de inicio no se pueden cambiar.</div>}
          <div className="grid-form">
            <label>Precio / monto base (Q)
              <input type="number" name="precioBase" value={form.precioBase} onChange={cambiar}
                min="1" placeholder="20000" required disabled={tienePujas} />
            </label>
            <label>Fecha y hora de inicio
              <input type="datetime-local" name="inicio" value={form.inicio} onChange={cambiar} required disabled={tienePujas} />
            </label>
            <label>Fecha y hora de cierre
              <input type="datetime-local" name="fin" value={form.fin} onChange={cambiar} required />
            </label>
          </div>
        </section>

        {error && <div className="alerta alerta-error">{error}</div>}

        <button className="btn btn-acento btn-grande" disabled={guardando || procesando}>
          {guardando ? 'Guardando...' : id ? 'Guardar cambios' : 'Publicar vehículo'}
        </button>
      </form>
    </div>
  );
}
