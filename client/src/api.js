// Funciones para consumir la API del backend
export function getToken() {
  return localStorage.getItem('token');
}

async function peticion(url, opciones = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch('/api' + url, { ...opciones, headers });
  let datos = null;
  try {
    datos = await res.json();
  } catch (e) {
    datos = null;
  }

  if (!res.ok) {
    throw new Error((datos && datos.error) || 'Error de conexión con el servidor');
  }
  return datos;
}

export const api = {
  login: (correo, password) => peticion('/auth/login', { method: 'POST', body: JSON.stringify({ correo, password }) }),
  registro: datos => peticion('/auth/registro', { method: 'POST', body: JSON.stringify(datos) }),
  catalogos: () => peticion('/catalogos'),
  vehiculos: (filtros = {}) => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) params.append(k, v);
    });
    const qs = params.toString();
    return peticion('/vehiculos' + (qs ? '?' + qs : ''));
  },
  misVehiculos: q => peticion('/vehiculos/mios' + (q ? '?q=' + encodeURIComponent(q) : '')),
  vehiculo: id => peticion('/vehiculos/' + id),
  publicar: datos => peticion('/vehiculos', { method: 'POST', body: JSON.stringify(datos) }),
  editar: (id, datos) => peticion('/vehiculos/' + id, { method: 'PUT', body: JSON.stringify(datos) }),
  ofertar: (id, monto) => peticion('/vehiculos/' + id + '/pujas', { method: 'POST', body: JSON.stringify({ monto }) })
};
