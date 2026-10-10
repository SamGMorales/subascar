# SubasCar

Plataforma web de subastas de vehículos en tiempo real (caso Copart) - Desarrollo Web

Marjorie Samantha Giron Morales - 1890-22-19957

## Link del sitio

https://subascar-1890-22-19957.onrender.com

(está en Render gratis, si tarda en abrir la primera vez es porque el servidor se estaba "despertando", hay que esperar como 1 minuto)

## Usuarios de prueba

| Nombre | Correo | Contraseña |
|---|---|---|
| Gabriel Morales | gabriel.morales@subascar.com | A123456 |
| Aly Padilla | aly.padilla@subascar.com | B5654987 |
| Fernando Galvez | fernando.galvez@subascar.com | C987654 |

Para probar las pujas en tiempo real se puede abrir el mismo vehículo en dos navegadores (o uno en incógnito) con usuarios diferentes.

## Tecnologías usadas

- Frontend: React con Vite
- Backend: Node.js con Express
- Tiempo real: Socket.IO
- Base de datos: Firebase Realtime Database
- Hosting: Render

## Endpoints de la API

- POST /api/auth/registro
- POST /api/auth/login
- GET /api/catalogos
- GET /api/vehiculos (acepta filtros: marca, modelo, anioMin, anioMax, combustible, danio, etc.)
- GET /api/vehiculos/mios
- GET /api/vehiculos/:id
- POST /api/vehiculos
- PUT /api/vehiculos/:id
- POST /api/vehiculos/:id/pujas

## Correr en local

Se necesitan las variables de entorno FIREBASE_SERVICE_ACCOUNT, FIREBASE_DB_URL y JWT_SECRET.

```
npm install
npm run build
npm start
```
