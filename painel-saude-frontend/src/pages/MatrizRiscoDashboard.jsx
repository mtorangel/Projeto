import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserX, Activity, ShieldAlert } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, LabelList
} from 'recharts';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';
import AITrigger from '../components/AITrigger';

function MatrizRiscoDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros Globais sincronizados
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('active_filters');
    return saved ? JSON.parse(saved) : { ano: '2025', mes: '7', unidade: '', convenio: '' };
  });

  // Paginação para a Tabela
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.ano) params.append('ano', filters.ano);
    if (filters.mes) params.append('mes', filters.mes);
    if (filters.unidade) params.append('unidade', filters.unidade);

    const token = '618a1ecc975393339a8f8c1a35c779cc142e7654';

    axios.get(`http://${window.location.hostname}:8000/api/desempenho-clinico/matriz-risco/?${params.toString()}`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
    .then(res => {
      setData(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Erro ao carregar dados da matriz de risco:", err);
      setError(err.response?.data?.erro || "Erro de conexão com a API de Matriz de Risco.");
      setLoading(false);
    });
  }, [filters]);

  const handleClearFilters = () => {
    const defaultFilters = { ano: '', mes: '', unidade: '', convenio: '' };
    setFilters(defaultFilters);
    localStorage.setItem('active_filters', JSON.stringify(defaultFilters));
  };

  if (loading && !data) return <div className="container"><h1>Carregando Matriz de Risco...</h1></div>;

  const kpis = data?.kpis || { densidade_rh: 0, taxa_absenteismo: 0, indice_erros: 0, unidades_criticas: 0 };
  const especialidadesChart = data?.especialidades_chart || [];
  const scatterData = data?.cause_effect_scatter || [];
  const tabelaData = data?.tabela_risco || [];

  // Lógica de Paginação da Tabela
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = tabelaData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(tabelaData.length / rowsPerPage);

  // Formatação condicional de background e texto com base no Score de Risco
  const getScoreBadgeStyles = (score) => {
    if (score > 60) {
      return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
    } else if (score >= 30) {
      return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
    } else {
      return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
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
        <h1>Matriz de Risco Assistencial & Alocação de RH</h1>
        <p style={{ color: '#94a3b8' }}>Correlação Preditiva entre Dimensionamento de Equipes, Absenteísmo e Segurança do Paciente (AGHUse)</p>
      </header>

      {/* Barra de Filtros */}
      <FilterBar filters={filters} setFilters={setFilters} onClear={handleClearFilters} filteredCount={data?.registros_afetados} />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#2dd4bf' }}>Atualizando matriz preditiva...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '3rem' }}>
            <KPICard 
              icon={Users} 
              title="Densidade de RH" 
              value={`${kpis.densidade_rh.toFixed(2)} prof/leito`} 
              color="#fbbf24" 
              infoKey="densidade_rh" 
            />
            <KPICard 
              icon={UserX} 
              title="Taxa de Absenteísmo" 
              value={`${kpis.taxa_absenteismo.toFixed(1)}%`} 
              color="#f87171" 
              infoKey="absenteismo_medico" 
            />
            <KPICard 
              icon={Activity} 
              title="Índice Erros (por 1.000)" 
              value={kpis.indice_erros.toFixed(1)} 
              color="#818cf8" 
              infoKey="erros_medicacao" 
            />
            <KPICard 
              icon={ShieldAlert} 
              title="Unidades Críticas (Score > 60)" 
              value={`${kpis.unidades_criticas} de ${tabelaData.length}`} 
              color="#f43f5e" 
              infoKey="iras" 
            />
          </div>

          {/* Gráficos */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', marginBottom: '3rem', gap: '2rem' }}>
            
            {/* Gráfico de Dispersão (Scatter) - Correlação Causa-Efeito */}
            <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>Correlação: Sobrecarga de Equipe vs. Segurança do Paciente</h3>
                <AITrigger indicador="Score de Risco Clínico" valorAtual="Geral" color="#fbbf24" iconSize={15} buttonStyle={{ background: 'rgba(251, 191, 36, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" dataKey="densidade_rh" name="Densidade de RH" unit=" prof/leito" stroke="#94a3b8" label={{ value: 'Densidade de Recursos Humanos (Prof/Leito)', position: 'insideBottom', offset: -10, fill: '#94a3b8', style: { fontSize: 10 } }} />
                    <YAxis type="number" dataKey="erros_por_1000" name="Taxa de Erros" unit="‰" stroke="#94a3b8" label={{ value: 'Índice de Erros de Medicação (por 1.000 Atendimentos)', angle: -90, position: 'insideLeft', fill: '#94a3b8', style: { fontSize: 10 } }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                    <Scatter name="Unidades Assistenciais" data={scatterData} fill="#f59e0b">
                      <LabelList dataKey="unidade" position="top" stroke="#94a3b8" fontSize={9} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Absenteísmo e Atrasos por Especialidade */}
            <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>Faltas e Atrasos Médicos por Especialidade</h3>
                <AITrigger indicador="Absenteísmo Médico" valorAtual="Geral" color="#f87171" iconSize={15} buttonStyle={{ background: 'rgba(248, 113, 113, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={especialidadesChart} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="especialidade" stroke="#94a3b8" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#818cf8" label={{ value: 'Horas Atraso Acumulado', angle: -90, position: 'insideLeft', fill: '#818cf8', style: { fontSize: 10 } }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f87171" label={{ value: 'Total de Faltas', angle: 90, position: 'insideRight', fill: '#f87171', style: { fontSize: 10 } }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="atrasos" name="Horas de Atraso" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="faltas" name="Faltas Registradas" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Matriz de Risco (Heatmap/Tabela) */}
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#f8fafc' }}>Alocação Preventiva e Score de Risco por Setor</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Setor / Unidade</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Capacidade</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>RH Ativo (Média)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Densidade (Prof/Leito)</span>
                        <AITrigger indicador="Densidade de RH" valorAtual="Geral" color="#fbbf24" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Absenteísmo Médico (%)</span>
                        <AITrigger indicador="Absenteísmo Médico" valorAtual="Geral" color="#f87171" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Erros (Incid.)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Erros por 1.000 Atd.</span>
                        <AITrigger indicador="Erros Medicação" valorAtual="Geral" color="#818cf8" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Infecções Hosp.</span>
                        <AITrigger indicador="Taxa IRAS (Infecção)" valorAtual="Geral" color="#fbbf24" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span>Score de Risco Clínico</span>
                        <AITrigger indicador="Score de Risco Clínico" valorAtual="Geral" color="#f43f5e" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => {
                    const badgeStyle = getScoreBadgeStyles(row.score_risco);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #1e293b', color: '#f8fafc' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.unidade}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{row.capacidade}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{row.colaboradores_ativos}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{row.densidade_rh.toFixed(2)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{row.absenteismo.toFixed(1)}%</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{row.erros}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{row.erros_por_1000.toFixed(1)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: row.infeccoes > 20 ? '#f87171' : '#f8fafc' }}>{row.infeccoes}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            ...badgeStyle 
                          }}>
                            {row.score_risco} - {row.score_risco > 60 ? 'CRÍTICO' : row.score_risco >= 30 ? 'ALERTA' : 'ESTÁVEL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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

export default MatrizRiscoDashboard;
