import React from 'react';
import { Info } from 'lucide-react';
import { indicadoresExplicacoes } from '../data/indicadores';

const KPICard = ({ icon: Icon, title, value, color, infoKey, borderStyle = {} }) => {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', ...borderStyle }}>
      <div className="info-trigger">
        <Info size={16} />
      </div>
      <div className="popover">
        <strong>Conceito Técnico:</strong><br />
        {indicadoresExplicacoes[infoKey] || "Explicação não disponível."}
      </div>
      
      <Icon color={color} style={{ marginBottom: '10px' }} />
      <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{title}</p>
      <h2 style={{ fontSize: '1.8rem' }}>{value}</h2>
    </div>
  );
};

export default KPICard;
