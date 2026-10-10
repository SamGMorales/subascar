const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { leerToken } = require('./middleware/auth');
const { router: authRouter } = require('./routes/auth');
const { router: catalogosRouter } = require('./routes/catalogos');
const vehiculosRouter = require('./routes/vehiculos');
const { iniciarRevisionCierres } = require('./subastas');
const { crearUsuariosPrueba } = require('./seed');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.set('io', io);
app.use(cors());
app.use(express.json({ limit: '25mb' })); // las fotos vienen en base64

app.use('/api/auth', authRouter);
app.use('/api/catalogos', catalogosRouter);
app.use('/api/vehiculos', vehiculosRouter);

// Frontend (React ya compilado)
const carpetaCliente = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(carpetaCliente));
app.get(/^\/(?!api|socket\.io).*/, (req, res) => {
  res.sendFile(path.join(carpetaCliente, 'index.html'));
});

// Tiempo real
io.on('connection', socket => {
  const datos = leerToken(socket.handshake.auth && socket.handshake.auth.token);
  socket.data.usuarioId = datos ? datos.id : null;

  socket.on('unirse', vehiculoId => socket.join('vehiculo:' + vehiculoId));
  socket.on('salir', vehiculoId => socket.leave('vehiculo:' + vehiculoId));
});

iniciarRevisionCierres(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log('Servidor corriendo en el puerto ' + PORT);
  try {
    await crearUsuariosPrueba();
  } catch (err) {
    console.error('No se pudieron crear los usuarios de prueba:', err.message);
  }
});
