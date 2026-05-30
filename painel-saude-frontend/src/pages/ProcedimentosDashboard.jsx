import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Scissors, Timer, CheckCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';

function ProcedimentosDashboard() {
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

    axios.get(`http://${window.location.hostname}:8000/api/procedimentos/procedure_stats/?${params.toString()}`)
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

  const dataSuspencao = stats ? [
    { name: 'Cancelados', value: stats.taxa_suspensao },
    { name: 'Realizados', value: Math.max(0, 100 - stats.taxa_suspensao) }
  ] : [];

  const COLORS = ['#f87171', '#2dd4bf'];

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
        <h1>Produção e Centro Cirúrgico</h1>
        <p style={{ color: '#94a3b8' }}>Eficiência de Sala, Suspensão e Produtividade de Equipamentos</p>
      </header>

      <FilterBar filters={filters} setFilters={setFilters} onClear={handleClearFilters} />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#2dd4bf' }}>Atualizando indicadores cirúrgicos...</div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '3rem' }}>
            <KPICard icon={Scissors} title="Taxa de Suspensão" value={`${stats.taxa_suspensao}%`} color="#f87171" infoKey="taxa_suspensao" />
            <KPICard icon={Timer} title="Giro de Sala" value={`${Math.round(stats.giro_medio_minutos)} min`} color="#818cf8" infoKey="giro_sala" />
            <KPICard icon={Activity} title="Produtividade" value={`${stats.produtividade_equipamento?.length} máquinas`} color="#2dd4bf" infoKey="produtividade_equipamento" />
            <KPICard icon={CheckCircle} title="Taxa Conversão" value={`${stats.taxa_conversao}%`} color="#fbbf24" infoKey="taxa_conversao" />
          </div>

          <div className="grid">
            <div className="glass-card" style={{ padding: '2rem', height: '400px' }}>
              <h3 style={{ marginBottom: '2rem' }}>Suspensão de Procedimentos</h3>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={dataSuspencao} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {dataSuspencao.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: '2rem', height: '400px' }}>
              <h3 style={{ marginBottom: '2rem' }}>Produtividade por Equipamento</h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={stats.produtividade_equipamento}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="id_equipamento__nome_maquina" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="total" fill="#818cf8" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProcedimentosDashboard;
