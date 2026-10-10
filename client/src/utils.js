export function quetzales(n) {
  if (n === null || n === undefined) return '—';
  return 'Q ' + Number(n).toLocaleString('en-US');
}

export function fechaHora(ms) {
  return new Date(ms).toLocaleString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// para los input datetime-local (usan la hora local, no UTC)
export function aInputFecha(ms) {
  const d = new Date(ms);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const nombresDanio = {
  verde: 'Daño menor / Limpio',
  amarillo: 'Daño medio / Reparable',
  rojo: 'Daño severo / Salvamento'
};

// reduce las fotos antes de mandarlas para que no pesen tanto
export function comprimirImagen(archivo, maxLado = 1200, calidad = 0.75) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.onerror = () => reject(new Error('No se pudo leer la imagen ' + archivo.name));
      img.src = lector.result;
    };
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}

export function miniaturaDe(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, 480 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// numero de lote a partir del id (para mostrarlo como en las subastas reales)
export function numeroLote(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 90000;
  return 10000 + h;
}

export function haceCuanto(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'hace un momento';
  if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
  return 'hace ' + Math.floor(s / 86400) + ' d';
}
