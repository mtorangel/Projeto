import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Pill, Activity, Building2, Stethoscope, Wallet, Settings } from 'lucide-react';

const categories = [
  { id: 'pacientes', title: 'Pacientes', icon: Users, desc: 'Experiência, Fluxo e TMP', color: '#2dd4bf' },
  { id: 'medicamentos', title: 'Medicamentos', icon: Pill, desc: 'Farmácia e Segurança', color: '#fbbf24' },
  { id: 'procedimentos', title: 'Procedimentos', icon: Activity, desc: 'Produção e Eficiência', color: '#f87171' },
  { id: 'hospital', title: 'Hospital', icon: Building2, desc: 'Infraestrutura e IRAS', color: '#818cf8' },
  { id: 'medicos', title: 'Médicos', icon: Stethoscope, desc: 'Corpo Clínico e Desempenho', color: '#c084fc' },
  { id: 'financeiro', title: 'Financeiro', icon: Wallet, desc: 'EBITDA e Ticket Médio', color: '#4ade80' },
  { id: 'integracoes', title: 'Integrações', icon: Settings, desc: 'Conexões e Sistemas', color: '#94a3b8' }
];

function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <header className="header">
        <h1>Painel de Indicadores de Saúde</h1>
        <p style={{ color: '#94a3b8' }}>Selecione uma categoria para visualizar os indicadores em tempo real</p>
      </header>

      <div className="grid">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            className="glass-card" 
            style={{ padding: '2.5rem' }}
            onClick={() => {
              if (cat.id === 'pacientes') navigate('/pacientes');
              if (cat.id === 'medicamentos') navigate('/medicamentos');
              if (cat.id === 'procedimentos') navigate('/procedimentos');
              if (cat.id === 'hospital') navigate('/hospital');
              if (cat.id === 'medicos') navigate('/medicos');
              if (cat.id === 'financeiro') navigate('/financeiro');
              if (cat.id === 'integracoes') navigate('/integracoes');
            }}
          >
            <cat.icon className="card-icon" style={{ color: cat.color }} strokeWidth={1.5} />
            <h2 className="card-title">{cat.title}</h2>
            <p className="card-desc">{cat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
