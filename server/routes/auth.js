const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../firebase');
const { crearToken, requiereLogin } = require('../middleware/auth');

const router = express.Router();

// En Firebase las llaves no pueden llevar puntos
function llaveCorreo(correo) {
  return correo.trim().toLowerCase().replace(/\./g, ',');
}

// minimo 7 caracteres, al menos una mayuscula y un numero
function passwordValida(pw) {
  return typeof pw === 'string' && pw.length >= 7 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
}

async function registrarUsuario({ nombre, apellido, correo, telefono, password }) {
  const llave = llaveCorreo(correo);
  const existe = await db.ref('correos/' + llave).once('value');
  if (existe.exists()) {
    return null;
  }

  const ref = db.ref('usuarios').push();
  const hash = await bcrypt.hash(password, 10);
  await ref.set({
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    correo: correo.trim().toLowerCase(),
    telefono: telefono.trim(),
    password: hash,
    creado: Date.now()
  });
  await db.ref('correos/' + llave).set(ref.key);
  return { id: ref.key, nombre: nombre.trim(), apellido: apellido.trim(), correo: correo.trim().toLowerCase() };
}

router.post('/registro', async (req, res) => {
  const { nombre, apellido, correo, telefono, password } = req.body || {};

  if (!nombre || !apellido || !correo || !telefono || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!/^\S+@\S+\.\S+$/.test(correo)) {
    return res.status(400).json({ error: 'El correo no es válido' });
  }
  if (!/^[0-9]{8}$/.test(telefono.replace(/[\s-]/g, ''))) {
    return res.status(400).json({ error: 'El teléfono debe tener 8 dígitos' });
  }
  if (!passwordValida(password)) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 7 caracteres, una mayúscula y un número' });
  }

  try {
    const usuario = await registrarUsuario({ nombre, apellido, correo, telefono, password });
    if (!usuario) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }
    res.status(201).json({ token: crearToken(usuario), usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo registrar el usuario' });
  }
});

router.post('/login', async (req, res) => {
  const { correo, password } = req.body || {};
  if (!correo || !password) {
    return res.status(400).json({ error: 'Ingresa correo y contraseña' });
  }

  try {
    const idSnap = await db.ref('correos/' + llaveCorreo(correo)).once('value');
    if (!idSnap.exists()) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
    const id = idSnap.val();
    const u = (await db.ref('usuarios/' + id).once('value')).val();
    const coincide = u && await bcrypt.compare(password, u.password);
    if (!coincide) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const usuario = { id, nombre: u.nombre, apellido: u.apellido, correo: u.correo };
    res.json({ token: crearToken(usuario), usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/yo', requiereLogin, async (req, res) => {
  const u = (await db.ref('usuarios/' + req.usuario.id).once('value')).val();
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ id: req.usuario.id, nombre: u.nombre, apellido: u.apellido, correo: u.correo, telefono: u.telefono });
});

module.exports = { router, registrarUsuario, llaveCorreo };
