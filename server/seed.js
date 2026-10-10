const db = require('./firebase');
const { registrarUsuario, llaveCorreo } = require('./routes/auth');

// Usuarios de prueba para que el catedratico pueda probar subastas entre varios navegadores
const usuariosPrueba = [
  { nombre: 'Gabriel', apellido: 'Morales', correo: 'gabriel.morales@subascar.com', telefono: '55550101', password: 'A123456' },
  { nombre: 'Aly', apellido: 'Padilla', correo: 'aly.padilla@subascar.com', telefono: '55550202', password: 'B5654987' },
  { nombre: 'Fernando', apellido: 'Galvez', correo: 'fernando.galvez@subascar.com', telefono: '55550303', password: 'C987654' }
];

async function crearUsuariosPrueba() {
  for (const u of usuariosPrueba) {
    const existe = await db.ref('correos/' + llaveCorreo(u.correo)).once('value');
    if (!existe.exists()) {
      await registrarUsuario(u);
      console.log('Usuario de prueba creado:', u.correo);
    }
  }
}

module.exports = { crearUsuariosPrueba };
