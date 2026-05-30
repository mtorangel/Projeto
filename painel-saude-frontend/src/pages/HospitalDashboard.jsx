import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, BedDouble, Droplets, Zap, Users } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';

function HospitalDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado de Filtros (Inicializado do LocalStorage para persistência)
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('active_filters');
    return saved ? JSON.parse(saved) : { ano: '2025', mes: '7', unidade: '', convenio: '' };
  });

  useEffect(() => {
    setLoading(true);
    // Construir Query String baseada nos filtros
    const params = new URLSearchParams();
    if (filters.ano) params.append('ano', filters.ano);
    if (filters.mes) params.append('mes', filters.mes);
    if (filters.unidade) params.append('unidade', filters.unidade);
    if (filters.convenio) params.append('convenio', filters.convenio);

    axios.get(`http://${window.location.hostname}:8000/api/infraestrutura/hospital_stats/?${params.toString()}`)
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar dados:", err);
        setLoading(false);
      });
  }, [filters]); // Recarrega sempre que o filtro mudar

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
        <h1>Infraestrutura e Hotelaria Hospitalar</h1>
        <p style={{ color: '#94a3b8' }}>Segurança do Paciente, Eficiência Energética e Gestão de Leitos</p>
      </header>

      {/* BARRA DE FILTROS GLOBAL */}
      <FilterBar 
        filters={filters} 
        setFilters={setFilters} 
        onClear={handleClearFilters} 
      />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#2dd4bf' }}>Atualizando indicadores com base nos filtros...</div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '3rem' }}>
            <KPICard icon={ShieldAlert} title="Taxa IRAS (Infecção)" value={`${stats.taxa_iras}%`} color="#f87171" infoKey="iras" />
            <KPICard icon={BedDouble} title="Substituição de Leito" value={`${stats.intervalo_substituicao} min`} color={stats.intervalo_substituicao > 120 ? "#f87171" : "#818cf8"} infoKey="substituicao_leito" />
            <KPICard icon={Droplets} title="Consumo Água/Energia" value="Monitorado" color="#3b82f6" infoKey="consumo_recursos" />
            <KPICard icon={Users} title="Densidade RH" value={`${stats.densidade_rh} prof/leito`} color="#fbbf24" infoKey="densidade_rh" />
          </div>

          <div className="grid">
            <div className="glass-card" style={{ padding: '2rem', height: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                <Droplets color="#3b82f6" />
                <h3>Consumo de Água (m³)</h3>
              </div>
              <ResponsiveContainer width="100%" height="70%">
                <AreaChart data={stats.consumo_tendencia}>
                  <defs>
                    <linearGradient id="colorAgua" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="id_tempo__data_registro" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                  <Area type="monotone" dataKey="agua" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAgua)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: '2rem', height: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                <Zap color="#fbbf24" />
                <h3>Consumo de Energia (kWh)</h3>
              </div>
              <ResponsiveContainer width="100%" height="70%">
                <AreaChart data={stats.consumo_tendencia}>
                  <defs>
                    <linearGradient id="colorEnergia" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/><stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="id_tempo__data_registro" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                  <Area type="monotone" dataKey="energia" stroke="#fbbf24" fillOpacity={1} fill="url(#colorEnergia)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default HospitalDashboard;
