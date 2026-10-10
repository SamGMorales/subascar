const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'clave-local-desarrollo';

function crearToken(usuario) {
  return jwt.sign({ id: usuario.id, nombre: usuario.nombre }, SECRET, { expiresIn: '8h' });
}

function leerToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

function sacarToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Rutas que si o si necesitan sesion (publicar, ofertar, etc.)
function requiereLogin(req, res, next) {
  const datos = leerToken(sacarToken(req));
  if (!datos) {
    return res.status(401).json({ error: 'Debes iniciar sesión para realizar esta acción' });
  }
  req.usuario = datos;
  next();
}

// Rutas publicas que muestran algo extra si hay sesion
function loginOpcional(req, res, next) {
  const datos = leerToken(sacarToken(req));
  if (datos) req.usuario = datos;
  next();
}

module.exports = { crearToken, leerToken, requiereLogin, loginOpcional };
