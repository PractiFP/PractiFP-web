import Icono from './Icono.jsx';

export default function InsigniaVerificada({ verificada }) {
  return verificada
    ? <span className="insignia insignia--verificada" title="Empresa verificada por PractiFP"><Icono nombre="escudo" tamano={15} /> Verificada</span>
    : <span className="insignia" title="PractiFP todavía no ha verificado esta empresa"><Icono nombre="info" tamano={15} /> Sin verificar</span>;
}
