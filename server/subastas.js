const db = require('./firebase');

function estadoSubasta(v, ahora = Date.now()) {
  if (ahora < v.inicio) return 'proxima';
  if (ahora >= v.fin) return 'cerrada';
  return 'activa';
}

// Lo que se le manda al cliente. Nunca se envia quien va ganando ni quien publico.
function vehiculoPublico(id, v, usuarioId) {
  const estado = estadoSubasta(v);
  const datos = {
    id,
    anio: v.anio,
    tipo: v.tipo,
    marca: v.marca,
    modelo: v.modelo,
    motor: v.motor,
    transmision: v.transmision,
    combustible: v.combustible,
    traccion: v.traccion,
    cilindros: v.cilindros,
    danio: v.danio,
    descripcion: v.descripcion || '',
    precioBase: v.precioBase,
    inicio: v.inicio,
    fin: v.fin,
    miniatura: v.miniatura || null,
    ofertaActual: v.ofertaActual || null,
    totalPujas: v.totalPujas || 0,
    estado,
    esMio: !!usuarioId && v.publicadoPor === usuarioId
  };
  if (estado === 'cerrada') {
    datos.resultado = datos.totalPujas > 0 ? 'vendido' : 'desierta';
  }
  return datos;
}

// oferta minima que se puede hacer en este momento
function ofertaMinima(v) {
  if (!v.ofertaActual) return v.precioBase;
  return Math.ceil(v.ofertaActual * 110 / 100);
}

// Le avisa a cada usuario conectado en la sala del vehiculo si va ganando o si lo superaron.
// Se hace socket por socket para que nadie reciba datos de los demas.
async function notificarEstados(io, vehiculoId) {
  const v = (await db.ref('vehiculos/' + vehiculoId).once('value')).val();
  if (!v) return;
  const pujas = (await db.ref('pujas/' + vehiculoId).once('value')).val() || {};
  const participantes = new Set(Object.values(pujas).map(p => p.usuarioId));

  const sockets = await io.in('vehiculo:' + vehiculoId).fetchSockets();
  for (const s of sockets) {
    const uid = s.data.usuarioId;
    if (!uid || !participantes.has(uid)) continue;
    s.emit('estado-puja', {
      vehiculoId,
      estado: v.ganadorId === uid ? 'ganando' : 'superado'
    });
  }
}

// Revisa cada cierto tiempo las subastas que ya vencieron para avisar a los clientes
function iniciarRevisionCierres(io) {
  setInterval(async () => {
    try {
      const todos = (await db.ref('vehiculos').once('value')).val() || {};
      const ahora = Date.now();
      for (const [id, v] of Object.entries(todos)) {
        if (!v.cerrada && ahora >= v.fin) {
          const resultado = v.totalPujas > 0 ? 'vendido' : 'desierta';
          await db.ref('vehiculos/' + id).update({ cerrada: true, resultado });
          io.emit('subasta-cerrada', { vehiculoId: id, resultado, ofertaActual: v.ofertaActual || null });
        }
      }
    } catch (err) {
      console.error('Error revisando cierres:', err.message);
    }
  }, 10000);
}

module.exports = { estadoSubasta, vehiculoPublico, ofertaMinima, notificarEstados, iniciarRevisionCierres };
