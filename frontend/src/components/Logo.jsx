import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="PractiFP, ir al inicio">
      <span className="logo__marca" aria-hidden="true"><span>P</span></span>
      <span>Practi<b>FP</b></span>
    </Link>
  );
}
