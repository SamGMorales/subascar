import { nombresDanio } from '../utils';

export default function BadgeDanio({ danio, corto = false }) {
  return (
    <span className={'badge-danio danio-' + danio}>
      <span className="punto" />
      {corto ? danio.charAt(0).toUpperCase() + danio.slice(1) : nombresDanio[danio]}
    </span>
  );
}
