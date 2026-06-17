import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Smile, RotateCcw } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';
import AITrigger from '../components/AITrigger';

function PacientesDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [occupancyData, setOccupancyData] = useState([]);

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

    const query = params.toString();

    // Buscar estatísticas gerais e tendência em paralelo
    Promise.all([
      axios.get(`http://${window.location.hostname}:8000/api/atendimentos/dashboard_stats/?${query}`),
      axios.get(`http://${window.location.hostname}:8000/api/atendimentos/occupancy_trend/?${query}`)
    ]).then(([resStats, resTrend]) => {
      setStats(resStats.data);
      setOccupancyData(resTrend.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [filters]);

  const handleClearFilters = () => {
    const defaultFilters = { ano: '', mes: '', unidade: '', convenio: '' };
    setFilters(defaultFilters);
    localStorage.setItem('active_filters', JSON.stringify(defaultFilters));
  };

  if (!stats) return <div className="container"><h1>Carregando indicadores...</h1></div>;

  const dataReinternacao = stats ? [
    { name: 'Reinternados', value: stats.total_reinternacoes },
    { name: 'Altas Comuns', value: stats.total_atendimentos - stats.total_reinternacoes },
  ] : [];

  const COLORS = ['#f87171', '#2dd4bf'];
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

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
        <h1>Fluxo e Experiência do Paciente</h1>
        <p style={{ color: '#94a3b8' }}>Indicadores de Ocupação, Satisfação e Eficiência Clínica</p>
      </header>

      <FilterBar filters={filters} setFilters={setFilters} onClear={handleClearFilters} filteredCount={stats?.registros_afetados} />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#2dd4bf' }}>Atualizando fluxo de pacientes...</div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '3rem' }}>
            <KPICard icon={Users} title="Taxa de Ocupação" value={`${Math.round(stats.taxa_ocupacao)}%`} color="#2dd4bf" infoKey="taxa_ocupacao" />
            <KPICard icon={Clock} title="TMP (Permanência)" value={`${Math.round(stats.media_permanencia)} dias`} color="#818cf8" infoKey="tmp" />
            <KPICard icon={Smile} title="NPS (Satisfação)" value={stats.nps_medio?.toFixed(1)} color="#fbbf24" infoKey="nps" />
            <KPICard icon={RotateCcw} title="Taxa Reinternação" value={`${((stats.total_reinternacoes / stats.total_atendimentos) * 100).toFixed(1)}%`} color="#f87171" infoKey="reinternacao" />
          </div>

          <div className="grid">
            <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Tendência de Ocupação</h3>
                <AITrigger indicador="Taxa de Ocupação Média" valorAtual="Geral" color="#2dd4bf" iconSize={15} buttonStyle={{ background: 'rgba(45, 212, 191, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="data" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                  <Line type="monotone" dataKey="total" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Distribuição de Reinternação (30 dias)</h3>
                <AITrigger indicador="Taxa Reinternação" valorAtual="Geral" color="#f87171" iconSize={15} buttonStyle={{ background: 'rgba(248, 113, 113, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataReinternacao} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {dataReinternacao.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid" style={{ marginTop: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Atendimentos por Unidade de Saúde</h3>
                <AITrigger indicador="Atendimentos por Unidade" valorAtual="Geral" color="#818cf8" iconSize={15} buttonStyle={{ background: 'rgba(129, 140, 248, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.atendimentos_por_unidade || []} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                    <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Distribuição por Convênio / Plano</h3>
                <AITrigger indicador="Distribuição por Convênio" valorAtual="Geral" color="#f59e0b" iconSize={15} buttonStyle={{ background: 'rgba(245, 158, 11, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.atendimentos_por_convenio || []} innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {stats.atendimentos_por_convenio?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PacientesDashboard;
