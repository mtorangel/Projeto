import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, ClipboardCheck, UserX, BarChart3 } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  Treemap, Tooltip
} from 'recharts';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';
import AITrigger from '../components/AITrigger';

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

function MedicosDashboard() {
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

    axios.get(`http://${window.location.hostname}:8000/api/desempenho-clinico/medical_stats/?${params.toString()}`)
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

  const treemapData = stats ? stats.volume_especialidade.map((item, index) => ({
    name: item.id_medico__especialidade,
    size: item.total,
    fill: COLORS[index % COLORS.length]
  })) : [];

  const getStatusColor = (min) => {
    if (min < 60) return '#4ade80';
    if (min < 120) return '#fbbf24';
    return '#f87171';
  };

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
        <h1>Corpo Clínico e Desempenho Médico</h1>
        <p style={{ color: '#94a3b8' }}>Adesão a Protocolos, Produtividade e Qualidade de Registros</p>
      </header>

      <FilterBar filters={filters} setFilters={setFilters} onClear={handleClearFilters} filteredCount={stats?.registros_afetados} />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#2dd4bf' }}>Atualizando indicadores médicos...</div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '3rem' }}>
            <KPICard icon={ClipboardCheck} title="Adesão Protocolos" value={`${Math.round(stats.adesao_protocolo?.reduce((acc, curr) => acc + curr.valor, 0) / (stats.adesao_protocolo?.length || 1))}%`} color="#2dd4bf" infoKey="adesao_protocolos" />
            <KPICard icon={BarChart3} title="Tempo Prontuário" value={`${Math.round(stats.tempo_prontuario?.reduce((acc, curr) => acc + curr.media, 0) / (stats.tempo_prontuario?.length || 1))} min`} color="#818cf8" infoKey="tempo_prontuario" />
            <KPICard icon={UserX} title="Absenteísmo" value={`${stats.taxa_absenteismo}%`} color="#f87171" infoKey="absenteismo_medico" />
            <KPICard icon={Stethoscope} title="Volume Especialidade" value="Analítico" color="#fbbf24" infoKey="volume_especialidade" />
          </div>

          <div className="grid">
            <div className="glass-card" style={{ padding: '2rem', height: '450px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Adesão aos Protocolos por Área</h3>
                <AITrigger indicador="Adesão Protocolos" valorAtual="Geral" color="#2dd4bf" iconSize={15} buttonStyle={{ background: 'rgba(45, 212, 191, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="80%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.adesao_protocolo}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="id_protocolo__area_medica" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" tick={{ fill: '#94a3b8' }} />
                  <Radar name="Adesão (%)" dataKey="valor" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.6} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                </RadarChart>
              </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', height: '450px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Volume de Atendimentos (Especialidade)</h3>
                <AITrigger indicador="Tempo Prontuário" valorAtual="Geral" color="#8884d8" iconSize={15} buttonStyle={{ background: 'rgba(136, 132, 216, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="80%">
                <Treemap data={treemapData} dataKey="size" stroke="#1e293b" fill="#8884d8">
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                </Treemap>
              </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Tempo de Fechamento de Prontuário por Especialidade</h3>
              <AITrigger indicador="Tempo Prontuário" valorAtual="Geral" color="#818cf8" iconSize={15} buttonStyle={{ background: 'rgba(129, 140, 248, 0.1)', padding: '4px', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.tempo_prontuario.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <span style={{ color: '#f8fafc' }}>{item.id_medico__especialidade}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '100px', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min((item.media/300)*100, 100)}%`, height: '100%', background: getStatusColor(item.media) }}></div>
                    </div>
                    <span style={{ fontWeight: 'bold', minWidth: '60px' }}>{Math.round(item.media)} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MedicosDashboard;
