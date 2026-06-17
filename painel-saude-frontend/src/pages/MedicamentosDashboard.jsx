import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';
import AITrigger from '../components/AITrigger';

function MedicamentosDashboard() {
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

    axios.get(`http://${window.location.hostname}:8000/api/atendimentos/medication_stats/?${params.toString()}`)
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
        <h1>Gestão de Medicamentos e Farmácia</h1>
        <p style={{ color: '#94a3b8' }}>Eficiência Logística, Custos e Segurança do Paciente</p>
      </header>

      <FilterBar filters={filters} setFilters={setFilters} onClear={handleClearFilters} filteredCount={stats?.registros_afetados} />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#2dd4bf' }}>Atualizando indicadores de farmácia...</div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '3rem' }}>
            <KPICard icon={TrendingUp} title="Giro de Estoque" value="4.2x" color="#2dd4bf" infoKey="giro_estoque" />
            <KPICard icon={Pill} title="Custo Total" value={`R$ ${stats.custo_total?.toLocaleString()}`} color="#818cf8" infoKey="custo_total" />
            <KPICard icon={AlertTriangle} title="Erros Medicação" value={stats.erros_por_tipo?.reduce((acc, curr) => acc + curr.quantidade, 0)} color="#fbbf24" infoKey="erros_medicacao" />
            <KPICard icon={Package} title="Taxa de Ruptura" value={`${stats.taxa_ruptura}%`} color="#f87171" infoKey="ruptura_estoque" />
          </div>

          <div className="grid">
            <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Giro por Medicamento (Saída vs Saldo)</h3>
                <AITrigger indicador="Giro de Estoque" valorAtual="Geral" color="#818cf8" iconSize={15} buttonStyle={{ background: 'rgba(129, 140, 248, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.giro_estoque} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="id_medicamento__nome_farmaco" type="category" stroke="#94a3b8" width={100} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                  <Bar dataKey="total_saida" fill="#818cf8" radius={[0, 5, 5, 0]} name="Total Saída" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Causas de Erros de Medicação</h3>
                <AITrigger indicador="Erros Medicação" valorAtual="Geral" color="#f87171" iconSize={15} buttonStyle={{ background: 'rgba(248, 113, 113, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.erros_por_tipo}>
                  <CartesianGrid stroke="#334155" />
                  <XAxis dataKey="tipo_erro" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                  <Bar dataKey="quantidade" fill="#f87171" radius={[5, 5, 0, 0]} />
                  <Line type="monotone" dataKey="quantidade" stroke="#fbbf24" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MedicamentosDashboard;
