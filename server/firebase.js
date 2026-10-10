const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

// La cuenta de servicio se guarda como variable de entorno en Render
// (el contenido completo del JSON que da Firebase)
if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.FIREBASE_DB_URL) {
  console.error('Faltan las variables FIREBASE_SERVICE_ACCOUNT y/o FIREBASE_DB_URL');
  process.exit(1);
}

const cuenta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(cuenta),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = getDatabase();

module.exports = db;
