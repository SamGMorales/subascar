// iconos sencillos en SVG para no depender de librerias
const trazos = {
  camara: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  reloj: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  martillo: <><path d="M14 4l6 6-3 3-6-6z" /><path d="M11 9l-7 7 3 3 7-7" /></>,
  buscar: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></>,
  lista: <><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  cuadros: <><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></>,
  motor: <><path d="M5 10h3l2-2h5l2 2h2v6h-2l-2 2h-6l-2-2H5z" /><path d="M2 12v3" /></>,
  engranaje: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>,
  gota: <path d="M12 4c3 4 5 7 5 9.5a5 5 0 0 1-10 0C7 11 9 8 12 4z" />,
  ruta: <><circle cx="7" cy="17" r="2.5" /><circle cx="17" cy="17" r="2.5" /><path d="M4 17V9l3-3h9l4 5v6" /></>,
  calendario: <><rect x="4" y="5" width="16" height="15" rx="1" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  escudo: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />,
  usuario: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />
};

export default function Icono({ nombre, tam = 18 }) {
  return (
    <svg className="icono" width={tam} height={tam} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {trazos[nombre]}
    </svg>
  );
}
