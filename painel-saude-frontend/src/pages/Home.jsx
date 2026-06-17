import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Pill, Activity, Building2, Stethoscope, Wallet, Settings, Landmark, ListTodo, ShieldAlert, Database, Brain, Info } from 'lucide-react';

const categories = [
  { id: 'copilot', title: 'Copilot Executivo', icon: Brain, desc: 'Chat de IA & Resumo de Anomalias', color: '#e879f9' },
  { id: 'pacientes', title: 'Pacientes', icon: Users, desc: 'Experiência, Fluxo e TMP', color: '#2dd4bf' },
  { id: 'medicamentos', title: 'Medicamentos', icon: Pill, desc: 'Farmácia e Segurança', color: '#fbbf24' },
  { id: 'procedimentos', title: 'Procedimentos', icon: Activity, desc: 'Produção e Eficiência', color: '#f87171' },
  { id: 'hospital', title: 'Hospital', icon: Building2, desc: 'Infraestrutura e IRAS', color: '#818cf8' },
  { id: 'medicos', title: 'Médicos', icon: Stethoscope, desc: 'Corpo Clínico e Desempenho', color: '#c084fc' },
  { id: 'financeiro', title: 'Financeiro', icon: Wallet, desc: 'EBITDA e Ticket Médio', color: '#4ade80' },
  { id: 'auditoria-faturamento', title: 'Auditoria SUS', icon: Landmark, desc: 'Glosas, SIA/SIH e Prazos', color: '#60a5fa' },
  { id: 'regulacao-filas', title: 'Regulação e Filas', icon: ListTodo, desc: 'Ocupação, Backlog e AGHUse', color: '#f43f5e' },
  { id: 'matriz-risco', title: 'Matriz de Risco', icon: ShieldAlert, desc: 'RH e Incidentes Clínicos', color: '#a855f7' },
  { id: 'integracoes', title: 'Integrações', icon: Settings, desc: 'Conexões e Sistemas', color: '#94a3b8' },
  { id: 'admin-db', title: 'Admin DB', icon: Database, desc: 'Registros, Contagens e Seed', color: '#f59e0b' },
  { id: 'sobre', title: 'Sobre o Sistema', icon: Info, desc: 'Documentação Completa e KPIs', color: '#38bdf8' },
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
              if (cat.id === 'copilot') navigate('/copilot');
              if (cat.id === 'pacientes') navigate('/pacientes');
              if (cat.id === 'medicamentos') navigate('/medicamentos');
              if (cat.id === 'procedimentos') navigate('/procedimentos');
              if (cat.id === 'hospital') navigate('/hospital');
              if (cat.id === 'medicos') navigate('/medicos');
              if (cat.id === 'financeiro') navigate('/financeiro');
              if (cat.id === 'auditoria-faturamento') navigate('/auditoria-faturamento');
              if (cat.id === 'regulacao-filas') navigate('/regulacao-filas');
              if (cat.id === 'matriz-risco') navigate('/matriz-risco');
              if (cat.id === 'integracoes') navigate('/integracoes');
              if (cat.id === 'admin-db') navigate('/admin-db');
              if (cat.id === 'sobre') navigate('/sobre');
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
