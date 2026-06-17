import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark, Percent, ShieldCheck, Receipt, Clock } from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';
import KPICard from '../components/KPICard';
import AITrigger from '../components/AITrigger';
import FilterBar from '../components/FilterBar';

function AuditoriaFaturamentoDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('active_filters');
    return saved ? JSON.parse(saved) : { ano: '2025', mes: '7', unidade: '', convenio: '' };
  });

  // Paginação para a Tabela Analítica
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    setLoading(true);
    // Token fornecido na documentação do projeto
    const token = '618a1ecc975393339a8f8c1a35c779cc142e7654';

    const params = new URLSearchParams();
    if (filters.ano) params.append('ano', filters.ano);
    if (filters.mes) params.append('mes', filters.mes);
    if (filters.unidade) params.append('unidade', filters.unidade);
    if (filters.convenio) params.append('convenio', filters.convenio);

    axios.get(`http://${window.location.hostname}:8000/api/financeiro/auditoria/?${params.toString()}`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
    .then(res => {
      setData(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Erro ao carregar dados de auditoria:", err);
      setError(err.response?.data?.erro || "Erro de conexão com a API de Auditoria.");
      setLoading(false);
    });
  }, [filters]);

  const handleClearFilters = () => {
    const defaultFilters = { ano: '', mes: '', unidade: '', convenio: '' };
    setFilters(defaultFilters);
    localStorage.setItem('active_filters', JSON.stringify(defaultFilters));
  };

  if (error) return <div className="container"><h1>Erro: {error}</h1><button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '20px' }}>Voltar</button></div>;
  if (!data && loading) return <div className="container"><h1>Carregando Auditoria de Faturamento SUS...</h1></div>;

  const kpis = data?.kpis || { faturamento_sus: 0, indice_glosa_inicial: 0, taxa_recuperacao: 0, evasao_receita: 0 };
  const evolucaoData = data?.evolucao_temporal || [];
  const scatterData = data?.correlacao_prontuario || [];
  const tabelaData = data?.tabela_analitica || [];

  // Lógica de Paginação da Tabela
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = tabelaData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(tabelaData.length / rowsPerPage);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={20} /> Voltar para Home
        </button>
      </div>

      <header className="header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <h1>Auditoria de Faturamento & Regras SUS (SIA/SIH)</h1>
        <p style={{ color: '#94a3b8' }}>Monitoramento de Glosas, Evasão de Receita e Prazos de Prontuários (AGHUse / CEOPE / Hemocentro)</p>
      </header>

      <FilterBar filters={filters} setFilters={setFilters} onClear={handleClearFilters} filteredCount={data?.registros_afetados} />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#2dd4bf' }}>Atualizando faturamento do SUS...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '3rem' }}>
            <KPICard 
              icon={Landmark} 
              title="Faturamento SUS" 
              value={`R$ ${kpis.faturamento_sus.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              color="#3b82f6" 
              infoKey="faturamento_sus" 
            />
            <KPICard 
              icon={Percent} 
              title="Índice de Glosa Inicial" 
              value={`${kpis.indice_glosa_inicial.toFixed(2)} %`} 
              color="#f87171" 
              infoKey="indice_glosa" 
            />
            <KPICard 
              icon={ShieldCheck} 
              title="Taxa de Recuperação" 
              value={`${kpis.taxa_recuperacao.toFixed(2)} %`} 
              color="#4ade80" 
              infoKey="taxa_rec" 
            />
            <KPICard 
              icon={Receipt} 
              title="Evasão de Receita" 
              value={`R$ ${kpis.evasao_receita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              color="#fbbf24" 
              infoKey="evasao" 
            />
          </div>

          {/* Gráficos */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', marginBottom: '3rem', gap: '2rem' }}>
            
            {/* Gráfico Composto de Evolução Temporal */}
            <div className="glass-card" style={{ padding: '2rem', height: '420px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>Evolução de Receita SUS vs. Tendência de Glosa</h3>
                <AITrigger indicador="Índice de Glosa Inicial" valorAtual="Geral" color="#f87171" iconSize={15} buttonStyle={{ background: 'rgba(248, 113, 113, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolucaoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="mes_ano" stroke="#94a3b8" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#3b82f6" label={{ value: 'Faturamento (R$)', angle: -90, position: 'insideLeft', fill: '#3b82f6', offset: 0, style: { fontSize: 10 } }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f87171" label={{ value: 'Glosa Inicial (%)', angle: 90, position: 'insideRight', fill: '#f87171', offset: 0, style: { fontSize: 10 } }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar yAxisId="left" dataKey="receita_bruta" name="Faturamento SUS (R$)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="indice_glosa_inicial" name="Índice Glosa (%)" stroke="#f87171" strokeWidth={2.5} activeDot={{ r: 8 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Dispersão (Scatter) */}
            <div className="glass-card" style={{ padding: '2rem', height: '420px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>Correlação: Tempo de Prontuário vs. Impacto das Glosas</h3>
                <AITrigger indicador="Tempo Prontuário" valorAtual="Geral" color="#c084fc" iconSize={15} buttonStyle={{ background: 'rgba(192, 132, 252, 0.1)', padding: '4px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" dataKey="tempo_prontuario" name="Tempo Prontuário" unit="min" stroke="#94a3b8" label={{ value: 'Tempo Fechamento Prontuário (min)', position: 'insideBottom', offset: -10, fill: '#94a3b8', style: { fontSize: 10 } }} />
                    <YAxis type="number" dataKey="valor_glosado" name="Valor Glosado" unit="R$" stroke="#94a3b8" label={{ value: 'Valor Glosado Acumulado (R$)', angle: -90, position: 'insideLeft', fill: '#94a3b8', style: { fontSize: 10 } }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} />
                    <Scatter name="Dias Assistenciais" data={scatterData} fill="#c084fc" shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabela Analítica */}
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#f8fafc' }}>Gargalos Financeiros por Unidade e Especialidade</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Unidade</th>
                    <th style={{ padding: '12px' }}>Especialidade</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Faturamento (R$)</span>
                        <AITrigger indicador="Faturamento SUS" valorAtual="Geral" color="#3b82f6" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Glosa Inicial (R$)</span>
                        <AITrigger indicador="Índice de Glosa Inicial" valorAtual="Geral" color="#f87171" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Glosa Recuperada (R$)</span>
                        <AITrigger indicador="Taxa de Recuperação" valorAtual="Geral" color="#4ade80" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#fbbf24' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span style={{ color: '#fbbf24' }}>Evasão Receita (R$)</span>
                        <AITrigger indicador="Evasão de Receita" valorAtual="Geral" color="#fbbf24" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Índice Glosa (%)</span>
                        <AITrigger indicador="Índice de Glosa Inicial" valorAtual="Geral" color="#f87171" />
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span>Taxa Recuperação (%)</span>
                        <AITrigger indicador="Taxa de Recuperação" valorAtual="Geral" color="#4ade80" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b', color: '#f8fafc' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.unidade}</td>
                      <td style={{ padding: '12px' }}>{row.especialidade}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{row.receita_bruta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#f87171' }}>{row.glosa_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#4ade80' }}>{row.glosa_recuperada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#fbbf24' }}>{row.evasao_receita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{row.indice_glosa_inicial.toFixed(2)}%</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{row.taxa_recuperacao.toFixed(2)}%</td>
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

export default AuditoriaFaturamentoDashboard;
