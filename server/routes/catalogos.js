const express = require('express');
const router = express.Router();

const catalogos = {
  tipos: ['Automóvil', 'Pickup', 'Camioneta / SUV', 'Motocicleta', 'Camión', 'Van'],
  marcas: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi', 'Hyundai', 'Kia', 'Ford',
    'Chevrolet', 'Jeep', 'Dodge', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Subaru',
    'Suzuki', 'Tesla', 'Lexus', 'Otra'],
  transmisiones: ['Automática', 'Manual', 'CVT'],
  combustibles: ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'],
  traccion: ['FWD', 'RWD', 'AWD', '4WD'],
  cilindros: [3, 4, 5, 6, 8, 10, 12],
  danios: [
    { valor: 'verde', nombre: 'Daño menor / Limpio' },
    { valor: 'amarillo', nombre: 'Daño medio / Reparable' },
    { valor: 'rojo', nombre: 'Daño severo / Salvamento' }
  ]
};

router.get('/', (req, res) => {
  res.json(catalogos);
});

module.exports = { router, catalogos };
