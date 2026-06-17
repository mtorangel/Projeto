import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ListTodo, BedDouble, Activity, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';
import AITrigger from '../components/AITrigger';

function RegulacaoFilaDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros Globais sincronizados
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('active_filters');
    return saved ? JSON.parse(saved) : { ano: '2025', mes: '7', unidade: '', convenio: '' };
  });

  // Paginação para a Tabela de Regulação
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.ano) params.append('ano', filters.ano);
    if (filters.mes) params.append('mes', filters.mes);
    if (filters.unidade) params.append('unidade', filters.unidade);

    const token = '618a1ecc975393339a8f8c1a35c779cc142e7654';

    axios.get(`http://${window.location.hostname}:8000/api/procedimentos/regulacao/?${params.toString()}`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
    .then(res => {
      setData(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Erro ao carregar dados da regulação:", err);
      setError(err.response?.data?.erro || "Erro de conexão com a API de Regulação.");
      setLoading(false);
    });
  }, [filters]);

  const handleClearFilters = () => {
    const defaultFilters = { ano: '', mes: '', unidade: '', convenio: '' };
    setFilters(defaultFilters);
    localStorage.setItem('active_filters', JSON.stringify(defaultFilters));
  };

  if (loading && !data) return <div className="container"><h1>Carregando Regulação e Filas...</h1></div>;

  const kpis = data?.kpis || { backlog: 0, taxa_ocupacao_media: 0, taxa_suspensao: 0, tmp_medio: 0 };
  const funnelData = data?.funil_regulacao || [];
  const equipData = data?.gargalos_equipmento || [];
  const tabelaData = data?.tabela_regulacao || [];

  // Lógica de Paginação da Tabela
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = tabelaData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(tabelaData.length / rowsPerPage);

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
        <h1>Torre de Controle de Regulação & Filas (AGHUse)</h1>
        <p style={{ color: '#94a3b8' }}>Monitoramento de Fluxo Assistencial, Ocupação e Procedimentos Eletivos / Urgentes</p>
      </header>

      {/* Barra de Filtros */}
      <FilterBar filters={filters} setFilters={setFilters} onClear={handleClearFilters} filteredCount={data?.registros_afetados} />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#2dd4bf' }}>Atualizando dados da fila...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '3rem' }}>
            <KPICard 
              icon={ListTodo} 
              title="Fila de Espera (Backlog)" 
              value={`${kpis.backlog} pacientes`} 
              color="#f43f5e" 
              infoKey="fila_backlog" 
            />
            <KPICard 
              icon={BedDouble} 
              title="Taxa de Ocupação Média" 
              value={`${kpis.taxa_ocupacao_media.toFixed(1)}%`} 
              color="#2dd4bf" 
              infoKey="taxa_ocupacao" 
            />
            <KPICard 
              icon={Activity} 
              title="Taxa de Suspensão" 
              value={`${kpis.taxa_suspensao.toFixed(1)}%`} 
              color="#f87171" 
              infoKey="taxa_suspensao" 
            />
            <KPICard 
              icon={Clock} 
              title="TMP (Permanência)" 
              value={`${kpis.tmp_medio.toFixed(1)} dias`} 
              color="#818cf8" 
              infoKey="tmp" 
            />
          </div>

          {/* Gráficos */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', marginBottom: '3rem', gap: '2rem' }}>
            
            {/* Funil de Regulação */}
            <div className="glass-card" style={{ padding: '2rem', height: '380px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>Funil de Regulação (Volume de Agendamentos)</h3>
                <AITrigger indicador="Fila de Espera (Backlog)" valorAtual="Geral" color="#c084fc" iconSize={15} buttonStyle={{ background: 'rgba(192, 132, 252, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis type="category" dataKey="etapa" stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                    <Bar dataKey="quantidade" fill="#c084fc" radius={[0, 4, 4, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gargalos de Equipamentos */}
            <div className="glass-card" style={{ padding: '2rem', height: '380px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>Volume Represado por Equipamento</h3>
                <AITrigger indicador="Fila de Espera (Backlog)" valorAtual="Geral" color="#f43f5e" iconSize={15} buttonStyle={{ background: 'rgba(244, 63, 94, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equipData} layout="vertical" margin={{ top: 10, right: 30, left: 50, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis type="category" dataKey="equipamento" stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                    <Bar dataKey="backlog" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabela de Regulação */}
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#f8fafc' }}>Pressão Assistencial por Unidade de Saúde</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Unidade</th>
                    <th style={{ padding: '12px' }}>Tipo de Leito / Serviço</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Capacidade Nominal</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Pacientes Internados</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Taxa de Ocupação (%)</span>
                        <AITrigger indicador="Taxa de Ocupação Média" valorAtual="Geral" color="#2dd4bf" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#f43f5e' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span style={{ color: '#f43f5e' }}>Procedimentos em Fila</span>
                        <AITrigger indicador="Fila de Espera (Backlog)" valorAtual="Geral" color="#f43f5e" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b', color: '#f8fafc' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.unidade}</td>
                      <td style={{ padding: '12px' }}>{row.tipo_leito}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{row.capacidade}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{row.pacientes_ativos}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: row.ocupacao_atual > 80 ? '#f87171' : '#2dd4bf' }}>
                        {row.ocupacao_atual}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#f43f5e' }}>{row.fila_espera}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Página {currentPage} de {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Próximo
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default RegulacaoFilaDashboard;
