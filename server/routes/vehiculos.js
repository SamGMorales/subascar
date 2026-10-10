const express = require('express');
const db = require('../firebase');
const { requiereLogin, loginOpcional } = require('../middleware/auth');
const { catalogos } = require('./catalogos');
const { estadoSubasta, vehiculoPublico, ofertaMinima, notificarEstados } = require('../subastas');

const router = express.Router();

const MAX_FOTO = 2.5 * 1024 * 1024; // por foto, ya comprimida en el navegador

function validarVehiculo(b) {
  const anioActual = new Date().getFullYear();
  const errores = [];

  const anio = Number(b.anio);
  if (!Number.isInteger(anio) || anio < 1950 || anio > anioActual + 1) errores.push('Año inválido');
  if (!catalogos.tipos.includes(b.tipo)) errores.push('Tipo de artículo inválido');
  if (!b.marca || !String(b.marca).trim()) errores.push('La marca es obligatoria');
  if (!b.modelo || !String(b.modelo).trim()) errores.push('El modelo es obligatorio');
  if (!b.motor || !String(b.motor).trim()) errores.push('El motor es obligatorio');
  if (!catalogos.transmisiones.includes(b.transmision)) errores.push('Transmisión inválida');
  if (!catalogos.combustibles.includes(b.combustible)) errores.push('Tipo de combustible inválido');
  if (!catalogos.traccion.includes(b.traccion)) errores.push('Tren de manejo inválido');
  if (!catalogos.cilindros.includes(Number(b.cilindros))) errores.push('Número de cilindros inválido');
  if (!['verde', 'amarillo', 'rojo'].includes(b.danio)) errores.push('Estado de daño inválido');

  const precio = Number(b.precioBase);
  if (!(precio > 0)) errores.push('El precio base debe ser mayor a 0');

  const inicio = Number(b.inicio);
  const fin = Number(b.fin);
  if (!inicio || !fin) errores.push('Fecha de inicio y cierre son obligatorias');
  else if (fin <= inicio) errores.push('La fecha de cierre debe ser después del inicio');

  if (!Array.isArray(b.fotos) || b.fotos.length < 5) {
    errores.push('Debes subir mínimo 5 fotografías');
  } else if (b.fotos.length > 12) {
    errores.push('Máximo 12 fotografías');
  } else if (b.fotos.some(f => typeof f !== 'string' || f.length > MAX_FOTO)) {
    errores.push('Una de las fotos es muy pesada');
  }

  return errores;
}

function datosLimpios(b) {
  return {
    anio: Number(b.anio),
    tipo: b.tipo,
    marca: String(b.marca).trim(),
    modelo: String(b.modelo).trim(),
    motor: String(b.motor).trim(),
    transmision: b.transmision,
    combustible: b.combustible,
    traccion: b.traccion,
    cilindros: Number(b.cilindros),
    danio: b.danio,
    descripcion: b.descripcion ? String(b.descripcion).trim().slice(0, 1000) : '',
    precioBase: Math.round(Number(b.precioBase)),
    inicio: Number(b.inicio),
    fin: Number(b.fin),
    miniatura: b.miniatura || b.fotos[0]
  };
}

// orden: primero las activas que cierran antes, luego las proximas y al final las cerradas
const ordenEstado = { activa: 0, proxima: 1, cerrada: 2 };

// Inventario publico con filtros
router.get('/', loginOpcional, async (req, res) => {
  try {
    const todos = (await db.ref('vehiculos').once('value')).val() || {};
    const uid = req.usuario ? req.usuario.id : null;
    let lista = Object.entries(todos).map(([id, v]) => vehiculoPublico(id, v, uid));

    const f = req.query;
    if (f.q) {
      const q = f.q.toLowerCase();
      lista = lista.filter(v => `${v.marca} ${v.modelo} ${v.anio} ${v.motor}`.toLowerCase().includes(q));
    }
    if (f.tipo) lista = lista.filter(v => v.tipo === f.tipo);
    if (f.marca) lista = lista.filter(v => v.marca === f.marca);
    if (f.modelo) lista = lista.filter(v => v.modelo.toLowerCase() === f.modelo.toLowerCase());
    if (f.anioMin) lista = lista.filter(v => v.anio >= Number(f.anioMin));
    if (f.anioMax) lista = lista.filter(v => v.anio <= Number(f.anioMax));
    if (f.combustible) lista = lista.filter(v => v.combustible === f.combustible);
    if (f.transmision) lista = lista.filter(v => v.transmision === f.transmision);
    if (f.traccion) lista = lista.filter(v => v.traccion === f.traccion);
    if (f.cilindros) lista = lista.filter(v => v.cilindros === Number(f.cilindros));
    if (f.danio) {
      const danios = f.danio.split(',');
      lista = lista.filter(v => danios.includes(v.danio));
    }
    if (f.estado) lista = lista.filter(v => v.estado === f.estado);

    lista.sort((a, b) => ordenEstado[a.estado] - ordenEstado[b.estado] || a.fin - b.fin);
    res.json(lista);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo cargar el inventario' });
  }
});

// Mis publicaciones (para buscarlas y editarlas)
router.get('/mios', requiereLogin, async (req, res) => {
  try {
    const todos = (await db.ref('vehiculos').once('value')).val() || {};
    const q = (req.query.q || '').toLowerCase();
    const lista = Object.entries(todos)
      .filter(([, v]) => v.publicadoPor === req.usuario.id)
      .map(([id, v]) => vehiculoPublico(id, v, req.usuario.id))
      .filter(v => !q || `${v.marca} ${v.modelo} ${v.anio}`.toLowerCase().includes(q))
      .sort((a, b) => b.inicio - a.inicio);
    res.json(lista);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudieron cargar tus publicaciones' });
  }
});

// Detalle con fotos e historial de pujas (sin nombres)
router.get('/:id', loginOpcional, async (req, res) => {
  try {
    const id = req.params.id;
    const v = (await db.ref('vehiculos/' + id).once('value')).val();
    if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });

    const fotos = (await db.ref('fotos/' + id).once('value')).val() || [];
    const pujasObj = (await db.ref('pujas/' + id).once('value')).val() || {};
    const uid = req.usuario ? req.usuario.id : null;

    const pujas = Object.values(pujasObj)
      .sort((a, b) => b.fecha - a.fecha)
      .map(p => ({ monto: p.monto, fecha: p.fecha, mia: !!uid && p.usuarioId === uid }));

    let miEstado = null;
    if (uid && pujas.some(p => p.mia)) {
      miEstado = v.ganadorId === uid ? 'ganando' : 'superado';
    }

    res.json({
      ...vehiculoPublico(id, v, uid),
      fotos,
      pujas,
      ofertaMinima: ofertaMinima(v),
      miEstado
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo cargar el vehículo' });
  }
});

// Publicar
router.post('/', requiereLogin, async (req, res) => {
  const errores = validarVehiculo(req.body || {});
  if (errores.length) return res.status(400).json({ error: errores.join('. ') });

  try {
    const ref = db.ref('vehiculos').push();
    await ref.set({
      ...datosLimpios(req.body),
      publicadoPor: req.usuario.id,
      ofertaActual: 0,
      totalPujas: 0,
      creado: Date.now()
    });
    await db.ref('fotos/' + ref.key).set(req.body.fotos);

    req.app.get('io').emit('inventario-actualizado');
    res.status(201).json({ id: ref.key, mensaje: 'Vehículo publicado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo publicar el vehículo' });
  }
});

// Editar (solo el que lo publico)
router.put('/:id', requiereLogin, async (req, res) => {
  const id = req.params.id;
  try {
    const v = (await db.ref('vehiculos/' + id).once('value')).val();
    if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
    if (v.publicadoPor !== req.usuario.id) {
      return res.status(403).json({ error: 'Solo puedes editar tus propias publicaciones' });
    }
    if (estadoSubasta(v) === 'cerrada') {
      return res.status(400).json({ error: 'La subasta ya cerró, no se puede editar' });
    }

    const errores = validarVehiculo(req.body || {});
    if (errores.length) return res.status(400).json({ error: errores.join('. ') });

    const nuevos = datosLimpios(req.body);
    if (v.totalPujas > 0) {
      // si ya hay ofertas no se puede cambiar el precio base ni la fecha de inicio
      const minuto = ms => Math.floor(ms / 60000);
      if (nuevos.precioBase !== v.precioBase || minuto(nuevos.inicio) !== minuto(v.inicio)) {
        return res.status(400).json({ error: 'Ya hay ofertas: no puedes cambiar el precio base ni la fecha de inicio' });
      }
    }

    if (v.totalPujas > 0) nuevos.inicio = v.inicio;

    await db.ref('vehiculos/' + id).update({ ...nuevos, cerrada: false, resultado: null });
    await db.ref('fotos/' + id).set(req.body.fotos);

    const io = req.app.get('io');
    io.emit('inventario-actualizado');
    io.to('vehiculo:' + id).emit('vehiculo-editado', { vehiculoId: id });
    res.json({ mensaje: 'Publicación actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo actualizar' });
  }
});

// Ofertar. Todas las reglas se validan aqui en el servidor.
router.post('/:id/pujas', requiereLogin, async (req, res) => {
  const id = req.params.id;
  const uid = req.usuario.id;
  const monto = Math.round(Number(req.body && req.body.monto));

  if (!(monto > 0)) return res.status(400).json({ error: 'Monto inválido' });

  let motivo = null;
  const ahora = Date.now();

  try {
    // transaccion para que dos ofertas al mismo tiempo no se pisen
    const resultado = await db.ref('vehiculos/' + id).transaction(v => {
      if (v === null) return v;
      motivo = null;

      const estado = estadoSubasta(v, ahora);
      if (estado === 'proxima') { motivo = 'La subasta todavía no ha iniciado'; return; }
      if (estado === 'cerrada') { motivo = 'Oferta cerrada: la subasta ya terminó'; return; }
      if (v.publicadoPor === uid) { motivo = 'No puedes ofertar por tu propio vehículo'; return; }
      if (v.ganadorId === uid) { motivo = 'Ya tienes la oferta más alta'; return; }

      if (monto < v.precioBase) {
        motivo = `La oferta no puede ser menor al monto base (Q ${v.precioBase.toLocaleString('en-US')})`;
        return;
      }
      if (v.ofertaActual) {
        const minimo = Math.ceil(v.ofertaActual * 110 / 100);
        if (monto <= v.ofertaActual || monto < minimo) {
          motivo = `La oferta debe superar la actual por al menos 10% (mínimo Q ${minimo.toLocaleString('en-US')})`;
          return;
        }
      }

      v.ofertaActual = monto;
      v.ganadorId = uid;
      v.totalPujas = (v.totalPujas || 0) + 1;
      return v;
    });

    if (!resultado.committed) {
      if (!resultado.snapshot.exists()) return res.status(404).json({ error: 'Vehículo no encontrado' });
      return res.status(400).json({ error: motivo || 'No se pudo registrar la oferta' });
    }

    const puja = { usuarioId: uid, monto, fecha: ahora };
    await db.ref('pujas/' + id).push(puja);

    const v = resultado.snapshot.val();
    const io = req.app.get('io');

    // a todos: solo el monto, nunca quien oferto
    io.emit('nueva-puja', {
      vehiculoId: id,
      ofertaActual: v.ofertaActual,
      totalPujas: v.totalPujas,
      ofertaMinima: ofertaMinima(v),
      puja: { monto, fecha: ahora }
    });
    await notificarEstados(io, id);

    res.status(201).json({ mensaje: '¡Oferta registrada!', ofertaActual: v.ofertaActual, ofertaMinima: ofertaMinima(v) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la oferta' });
  }
});

module.exports = router;
