import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, TrendingDown, Clock, CreditCard } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';

function FinanceiroDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('active_filters');
    return saved ? JSON.parse(saved) : { ano: '2025', mes: '7', unidade: '', convenio: '' };
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.ano) params.append('ano', filters.ano);
    if (filters.mes) params.append('mes', filters.mes);
    if (filters.unidade) params.append('unidade', filters.unidade);
    if (filters.convenio) params.append('convenio', filters.convenio);

    axios.get(`http://${window.location.hostname}:8000/api/financeiro/financial_stats/?${params.toString()}`)
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar dados:", err);
        setLoading(false);
      });
  }, [filters]);

  const handleClearFilters = () => {
    const defaultFilters = { ano: '', mes: '', unidade: '', convenio: '' };
    setFilters(defaultFilters);
    localStorage.setItem('active_filters', JSON.stringify(defaultFilters));
  };

  if (loading && !stats) return <div className="container"><h1>Carregando indicadores...</h1></div>;

  const waterfallData = stats ? [
    { name: 'Receita', valor: stats.ebitda_components?.receita || 0, fill: '#4ade80' },
    { name: 'Custos', valor: -(stats.ebitda_components?.custos || 0), fill: '#f87171' },
    { name: 'Glosas', valor: -(stats.ebitda_components?.glosa_perda || 0), fill: '#fbbf24' },
    { name: 'EBITDA', valor: stats.ebitda_components?.ebitda || 0, fill: '#2dd4bf' }
  ] : [];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={20} /> Voltar para Home
        </button>
      </div>

      <header className="header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <h1>Gestão Orçamentária e Financeira</h1>
        <p style={{ color: '#94a3b8' }}>EBITDA, Fluxo de Caixa e Eficiência em Faturamento</p>
      </header>

      <FilterBar filters={filters} setFilters={setFilters} onClear={handleClearFilters} />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#2dd4bf' }}>Atualizando indicadores financeiros...</div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '3rem' }}>
            <KPICard icon={Wallet} title="EBITDA Operacional" value={`R$ ${stats.ebitda_components?.ebitda?.toLocaleString()}`} color="#2dd4bf" infoKey="ebitda" />
            <KPICard icon={Clock} title="PMR (Recebimento)" value={`${stats.pmr_dias} dias`} color="#fbbf24" infoKey="pmr" />
            <KPICard icon={TrendingDown} title="Ticket Médio" value={`R$ ${stats.ticket_medio?.toLocaleString()}`} color="#f87171" infoKey="ticket_medio" />
            <KPICard icon={CreditCard} title="Gestão de Glosas" value="Analítico" color="#818cf8" infoKey="glosas" />
          </div>

          <div className="grid">
            <div className="glass-card" style={{ padding: '2rem', height: '400px' }}>
              <h3 style={{ marginBottom: '2rem' }}>Decomposição do EBITDA (Waterfall)</h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} formatter={(value) => `R$ ${Math.abs(value).toLocaleString('pt-BR')}`} />
                  <Bar dataKey="valor" radius={[5, 5, 0, 0]}>
                    {waterfallData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: '2rem', height: '400px' }}>
              <h3 style={{ marginBottom: '2rem' }}>Eficiência de Recuperação de Glosas</h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={stats.glosas_convenio}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="id_convenio__nome_operadora" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} itemStyle={{ color: '#f8fafc' }} />
                  <Legend />
                  <Bar dataKey="faturado" name="Glosa Inicial" fill="#f87171" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="recebido" name="Glosa Recuperada" fill="#4ade80" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FinanceiroDashboard;
