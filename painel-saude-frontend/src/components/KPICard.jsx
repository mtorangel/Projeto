import React from 'react';
import { Info } from 'lucide-react';
import { indicadoresExplicacoes } from '../data/indicadores';
import AITrigger from './AITrigger';

const KPICard = ({ icon: Icon, title, value, color, infoKey, borderStyle = {} }) => {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', ...borderStyle }}>
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '10px', alignItems: 'center', zIndex: 10 }}>
        {/* Info popover trigger */}
        <div style={{ display: 'inline-block' }}>
          <div className="info-trigger" style={{ position: 'static', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Info size={16} />
          </div>
          <div className="popover">
            <strong>Conceito Técnico:</strong><br />
            {indicadoresExplicacoes[infoKey] || "Explicação não disponível."}
          </div>
        </div>

        {/* AI trigger button */}
        <AITrigger 
          indicador={title} 
          valorAtual={value} 
          color={color} 
          iconSize={16}
          buttonStyle={{
            background: 'rgba(129, 140, 248, 0.12)',
            border: '1px solid rgba(129, 140, 248, 0.25)',
            padding: '4px',
            borderRadius: '6px',
          }}
        />
      </div>
      
      <Icon color={color} style={{ marginBottom: '10px' }} />
      <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{title}</p>
      <h2 style={{ fontSize: '1.8rem' }}>{value}</h2>
    </div>
  );
};

export default KPICard;
