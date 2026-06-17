import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dataDictionary from '../data/dicionario_dados.json';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Database, RefreshCw, Play, Settings, CheckCircle2, AlertCircle,
  Calendar, Building2, Users, Pill, Stethoscope, Wrench, UserCheck,
  FileText, CreditCard, Activity, Package, AlertTriangle, Scissors,
  Zap, Droplets, TrendingUp, Clock, DollarSign, ChevronRight, X,
  Download, Layers, TableProperties, Sparkles, BarChart2, ArrowLeft
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';
const TOKEN = '618a1ecc975393339a8f8c1a35c779cc142e7654';
const AUTH = { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json' };

const ICON_MAP = {
  Calendar, Building2, Users, Pill, Stethoscope, Wrench, UserCheck,
  FileText, CreditCard, Activity, Package, AlertTriangle, Scissors,
  Zap, Droplets, TrendingUp, Clock, DollarSign,
};

const DIM_COLOR  = '#6366f1';
const FACT_COLOR = '#a855f7';
const CHART_COLORS = [
  '#6366f1','#8b5cf6','#a855f7','#c084fc',
  '#818cf8','#4f46e5','#7c3aed','#9333ea',
  '#22d3ee','#06b6d4','#0ea5e9','#3b82f6',
  '#10b981','#14b8a6','#2dd4bf','#34d399',
  '#f59e0b','#fbbf24','#f43f5e',
];

// ─── Tooltip personalizado ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.4)',
      borderRadius: '10px', padding: '10px 14px', backdropFilter: 'blur(8px)'
    }}>
      <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{label}</p>
      <p style={{ color: payload[0].color || '#6366f1', fontWeight: 700, margin: '4px 0 0' }}>
        {payload[0].value?.toLocaleString('pt-BR')} registros
      </p>
    </div>
  );
};

// ─── Badge tipo ────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => (
  <span style={{
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
    padding: '2px 8px', borderRadius: '999px',
    background: type === 'dim' ? 'rgba(99,102,241,0.15)' : 'rgba(168,85,247,0.15)',
    color: type === 'dim' ? DIM_COLOR : FACT_COLOR,
    border: `1px solid ${type === 'dim' ? 'rgba(99,102,241,0.3)' : 'rgba(168,85,247,0.3)'}`,
  }}>
    {type === 'dim' ? 'DIMENSÃO' : 'FATO'}
  </span>
);

// ─── Seed Drawer ───────────────────────────────────────────────────────
function SeedDrawer({ open, onClose, onSuccess }) {
  const [records, setRecords] = useState(500);
  const [mode, setMode] = useState('db');
  const [clear, setClear] = useState(false);
  const [dimsOnly, setDimsOnly] = useState(false);
  const [factsOnly, setFactsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState('');
  const [status, setStatus] = useState(null); // null | 'ok' | 'error'

  const handleGenerate = async () => {
    setLoading(true);
    setLog('');
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE}/admin/seed-data/`, {
        method: 'POST',
        headers: AUTH,
        body: JSON.stringify({ records, mode, clear, dims_only: dimsOnly, facts_only: factsOnly }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setStatus('ok');
        setLog(data.log || 'Dados gerados com sucesso!');
        onSuccess && onSuccess();
      } else {
        setStatus('error');
        setLog(data.log || data.erro || data.mensagem || 'Erro desconhecido.');
      }
    } catch (e) {
      setStatus('error');
      setLog(`Erro de conexão: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        width: '440px', height: '100vh', overflowY: 'auto',
        background: 'linear-gradient(180deg,#0f172a,#1e1b4b)',
        borderLeft: '1px solid rgba(99,102,241,0.3)',
        padding: '32px 28px',
        animation: 'slideIn .25s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={18} color={DIM_COLOR} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Gerador de Dados</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Seed para todas as 18 tabelas</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
            transition: 'color .2s',
          }}><X size={20} /></button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Quantidade */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '12px' }}>
              📊 Registros por tabela fato
            </label>
            <input
              type="range" min="50" max="10000" step="50" value={records}
              onChange={e => setRecords(Number(e.target.value))}
              style={{ width: '100%', accentColor: DIM_COLOR, marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>50</span>
              <span style={{
                fontSize: '22px', fontWeight: 800, color: '#f1f5f9',
                background: 'rgba(99,102,241,0.15)', padding: '4px 16px', borderRadius: '8px'
              }}>{records.toLocaleString('pt-BR')}</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>10.000</span>
            </div>
            <input
              type="number" min="1" max="50000" value={records}
              onChange={e => setRecords(Math.min(50000, Math.max(1, Number(e.target.value))))}
              style={{
                width: '100%', marginTop: '10px', padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '8px', color: '#f1f5f9', fontSize: '13px',
                boxSizing: 'border-box',
              }}
              placeholder="Ou digite um valor até 50.000"
            />
          </div>

          {/* Modo de saída */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '12px' }}>
              💾 Destino dos dados
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { val: 'db', label: '🗄️ Banco', desc: 'PostgreSQL' },
                { val: 'csv', label: '📄 CSV', desc: 'Arquivos' },
                { val: 'both', label: '🔀 Ambos', desc: 'DB + CSV' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setMode(opt.val)}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: '8px', cursor: 'pointer',
                    border: mode === opt.val ? `1px solid ${DIM_COLOR}` : '1px solid rgba(255,255,255,0.08)',
                    background: mode === opt.val ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                    color: mode === opt.val ? '#f1f5f9' : '#64748b',
                    fontSize: '12px', fontWeight: 600, transition: 'all .2s',
                  }}
                >
                  <div>{opt.label}</div>
                  <div style={{ fontSize: '10px', opacity: .7 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            {mode !== 'db' && (
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', margin: '8px 0 0' }}>
                📁 CSVs salvos em: <code style={{ color: '#a5b4fc' }}>backend/output/seed_data/</code>
              </p>
            )}
          </div>

          {/* Opções */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '12px' }}>
              ⚙️ Opções avançadas
            </label>
            {[
              { key: 'clear', val: clear, set: setClear, label: '🗑️ Limpar dados existentes antes de gerar', warn: true },
              { key: 'dimsOnly', val: dimsOnly, set: v => { setDimsOnly(v); if (v) setFactsOnly(false); }, label: '📐 Gerar apenas Dimensões' },
              { key: 'factsOnly', val: factsOnly, set: v => { setFactsOnly(v); if (v) setDimsOnly(false); }, label: '📊 Gerar apenas Fatos (requer dims existentes)' },
            ].map(opt => (
              <label key={opt.key} style={{
                display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                padding: '8px', borderRadius: '8px', marginBottom: '4px',
                background: opt.val ? 'rgba(99,102,241,0.08)' : 'transparent',
                border: opt.val && opt.warn ? '1px solid rgba(244,63,94,0.3)' : '1px solid transparent',
              }}>
                <input
                  type="checkbox" checked={opt.val} onChange={e => opt.set(e.target.checked)}
                  style={{ accentColor: opt.warn && opt.val ? '#f43f5e' : DIM_COLOR, width: 14, height: 14 }}
                />
                <span style={{
                  fontSize: '12px',
                  color: opt.val && opt.warn ? '#f43f5e' : '#cbd5e1',
                  fontWeight: opt.val ? 600 : 400,
                }}>{opt.label}</span>
              </label>
            ))}
            {clear && (
              <div style={{
                marginTop: '8px', padding: '8px 12px', borderRadius: '8px',
                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                fontSize: '11px', color: '#f43f5e',
              }}>
                ⚠️ Atenção: todos os dados existentes serão apagados permanentemente.
              </div>
            )}
          </div>

          {/* Resumo */}
          <div style={{
            padding: '12px', borderRadius: '10px',
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            fontSize: '12px', color: '#94a3b8',
          }}>
            <strong style={{ color: '#f1f5f9' }}>Estimativa:</strong> {
              dimsOnly ? '9 dimensões' :
              factsOnly ? '9 tabelas fato' :
              '9 dimensões + 9 tabelas fato'
            } → aprox. <strong style={{ color: '#a5b4fc' }}>
              {dimsOnly ? '≈ fixo (dims mestres)' :
               `≈ ${(records * (dimsOnly ? 0 : 9) + (factsOnly ? 0 : 0)).toLocaleString('pt-BR')}+ registros totais`}
            </strong>
          </div>

          {/* Botão */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '14px', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              background: loading
                ? 'rgba(99,102,241,0.3)'
                : 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff', fontSize: '14px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all .2s',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Gerando dados... (pode levar alguns minutos)
              </>
            ) : (
              <><Play size={16} /> Gerar {records.toLocaleString('pt-BR')} Registros</>
            )}
          </button>

          {/* Log Output */}
          {log && (
            <div style={{
              borderRadius: '10px', overflow: 'hidden',
              border: `1px solid ${status === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(244,63,94,0.3)'}`,
            }}>
              <div style={{
                padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px',
                background: status === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)',
                fontSize: '12px', fontWeight: 700,
                color: status === 'ok' ? '#4ade80' : '#f87171',
              }}>
                {status === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {status === 'ok' ? 'Geração concluída com sucesso!' : 'Erro durante a geração'}
              </div>
              <pre style={{
                margin: 0, padding: '12px 14px',
                background: '#0a0f1e', color: '#94a3b8',
                fontSize: '11px', fontFamily: 'monospace',
                maxHeight: '260px', overflowY: 'auto', whiteSpace: 'pre-wrap',
              }}>{log}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ENDPOINT_MAP = {
  DimTempo: 'tempo',
  DimUnidade: 'unidades',
  DimPaciente: 'pacientes',
  DimMedicamento: 'medicamentos',
  DimTipoProcedimento: 'tipos-procedimento',
  DimEquipamento: 'equipamentos',
  DimMedico: 'medicos',
  DimProtocolo: 'protocolos',
  DimConvenio: 'convenios',
  FatoAtendimentos: 'atendimentos',
  FatoEstoque: 'estoque',
  FatoErrosMedicao: 'erros-medicao',
  FatoProcedimentos: 'procedimentos',
  FatoInfraestrutura: 'infraestrutura',
  FatoHigienizacao: 'higienizacao',
  FatoDesempenhoClinico: 'desempenho-clinico',
  FatoEscalaMedica: 'escala-medica',
  FatoFinanceiro: 'financeiro',
};

function TableRecordsModal({ open, tableName, tableLabel, onClose, initialTab = 'registros' }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalTab, setModalTab] = useState('registros');

  useEffect(() => {
    if (open) {
      setModalTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open || !tableName) return;

    const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      setRecords([]);
      setSearchTerm('');
      
      const endpoint = ENDPOINT_MAP[tableName];
      if (!endpoint) {
        setError(`Tabela ${tableName} não mapeada para API.`);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/${endpoint}/`, { headers: AUTH });
        if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.results || []);
        setRecords(rows);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [open, tableName]);

  if (!open) return null;

  const filteredRecords = records.filter(rec => {
    if (!searchTerm) return true;
    return Object.values(rec).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const columns = records.length > 0 ? Object.keys(records[0]) : [];
  const dictFields = dataDictionary[tableName] || [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        width: '90%', maxWidth: '1000px', maxHeight: '85vh',
        background: 'linear-gradient(180deg, #0f172a, #1e1b4b)',
        border: '1px solid rgba(99,102,241,0.35)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '24px', display: 'flex', flexDirection: 'column',
        animation: 'fadeIn .2s ease',
        boxSizing: 'border-box'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} color={DIM_COLOR} />
              {modalTab === 'registros' ? `Registros de ${tableLabel}` : `Dicionário de ${tableLabel}`} ({tableName})
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              {modalTab === 'registros' 
                ? 'Exibindo registros carregados diretamente do banco de dados' 
                : 'Definição dos campos e regras de negócio da modelagem de dados'}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
            transition: 'color .2s', padding: '4px'
          }}><X size={20} /></button>
        </div>

        {/* Modal Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
          <button
            onClick={() => setModalTab('registros')}
            style={{
              padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '12px', fontWeight: 600,
              background: modalTab === 'registros' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: modalTab === 'registros' ? '#a5b4fc' : '#64748b',
              transition: 'all .2s'
            }}
          >
            📋 Registros da Tabela
          </button>
          <button
            onClick={() => setModalTab('dicionario')}
            style={{
              padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '12px', fontWeight: 600,
              background: modalTab === 'dicionario' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: modalTab === 'dicionario' ? '#a5b4fc' : '#64748b',
              transition: 'all .2s'
            }}
          >
            📖 Dicionário de Dados
          </button>
        </div>

        {modalTab === 'registros' ? (
          <>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Filtrar registros nesta visualização..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  flex: 1, minWidth: '200px', padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: '8px', color: '#f1f5f9', fontSize: '13px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(99,102,241,0.12)', padding: '6px 12px', borderRadius: '6px' }}>
                Total carregado: <strong>{records.length}</strong> {records.length !== filteredRecords.length && <>· Filtrados: <strong>{filteredRecords.length}</strong></>}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
                  <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
                  <span>Buscando registros...</span>
                </div>
              ) : error ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#f87171' }}>
                  <AlertCircle size={24} style={{ marginBottom: '8px', display: 'inline-block' }} />
                  <p style={{ margin: 0 }}>Erro ao carregar dados: {error}</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum registro encontrado.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {columns.map(col => (
                          <th key={col} style={{ padding: '10px 14px', fontWeight: 700, color: '#94a3b8', textTransform: 'capitalize' }}>
                            {col.replace('id_', '').replace('_id', '')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.slice(0, 200).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                          {columns.map(col => {
                            const val = row[col];
                            let renderedVal = String(val === null || val === undefined ? '-' : val);
                            if (typeof val === 'boolean') renderedVal = val ? 'Sim ✅' : 'Não ❌';
                            return (
                              <td key={col} style={{ padding: '10px 14px', color: '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '220px' }}>
                                {renderedVal}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecords.length > 200 && (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      Exibindo as primeiras 200 linhas de {filteredRecords.length}. Utilize o campo de busca acima para encontrar registros específicos.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {dictFields.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Nenhuma especificação encontrada para esta tabela.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#94a3b8', width: '30%' }}>Campo</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#94a3b8' }}>Descrição / Regra de Negócio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dictFields.map((field, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '12px 16px', color: '#a5b4fc', fontFamily: 'monospace', fontWeight: 600 }}>
                          {field.campo}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#cbd5e1', lineHeight: '1.6' }}>
                          {field.descricao}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#cbd5e1', fontSize: '13px', fontWeight: 600, transition: 'all .2s'
          }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────
export default function AdminDatabaseDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' | 'dimensoes' | 'fatos'
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [modalInitialTab, setModalInitialTab] = useState('registros');

  const openTableModal = (tabela, label, initialTab = 'registros') => {
    setSelectedTable(tabela);
    setSelectedLabel(label);
    setModalInitialTab(initialTab);
    setModalOpen(true);
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/database-stats/`, { headers: AUTH });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Prepare chart data
  const allRows = data
    ? [
        ...data.dimensoes.map(d => ({ ...d, type: 'dim' })),
        ...data.fatos.map(f => ({ ...f, type: 'fato' })),
      ]
    : [];

  const filteredRows = activeTab === 'todos' ? allRows
    : activeTab === 'dimensoes' ? allRows.filter(r => r.type === 'dim')
    : allRows.filter(r => r.type === 'fato');

  const pieData = data ? [
    { name: 'Dimensões', value: data.summary.total_dimensoes, color: DIM_COLOR },
    { name: 'Fatos', value: data.summary.total_fatos, color: FACT_COLOR },
  ] : [];

  const kpis = data ? [
    { label: 'Total de Registros', value: data.summary.total_geral.toLocaleString('pt-BR'), icon: Database, color: '#6366f1', sub: 'em todas as tabelas' },
    { label: 'Tabelas Dimensão', value: data.dimensoes.length, icon: Layers, color: DIM_COLOR, sub: `${data.summary.total_dimensoes.toLocaleString('pt-BR')} registros` },
    { label: 'Tabelas Fato', value: data.fatos.length, icon: TableProperties, color: FACT_COLOR, sub: `${data.summary.total_fatos.toLocaleString('pt-BR')} registros` },
    { label: 'Maior Tabela', value: data.summary.maior_tabela_label, icon: BarChart2, color: '#f59e0b', sub: `${data.summary.maior_tabela_count.toLocaleString('pt-BR')} registros` },
  ] : [];

  return (
    <div className="container">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .admin-card { animation: fadeIn .4s ease; }
        .admin-row:hover { background: rgba(99,102,241,0.06) !important; }
        .tab-btn:hover { background: rgba(99,102,241,0.12) !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={20} /> Voltar para Home
        </button>
      </div>

      {/* Header */}
      <header className="header" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
              border: '1px solid rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Database size={26} color="#a5b4fc" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px' }}>Administração do Banco de Dados</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                Contagem de registros · 9 Dimensões · 9 Fatos
                {data && <span style={{ marginLeft: 8, color: '#475569', fontSize: '12px' }}>
                  · Atualizado às {new Date(data.summary.ultima_atualizacao).toLocaleTimeString('pt-BR')}
                </span>}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchStats} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontSize: '13px', fontWeight: 600, transition: 'all .2s',
            }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Atualizar
            </button>
            <button onClick={() => setDrawerOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff', fontSize: '13px', fontWeight: 700, transition: 'all .2s',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}>
              <Sparkles size={14} />
              Gerar Dados
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div style={{
          padding: '16px', borderRadius: '12px', marginBottom: '20px',
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
          color: '#f87171', display: 'flex', gap: '10px', alignItems: 'center',
        }}>
          <AlertCircle size={16} /> Erro ao carregar: {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>Carregando estatísticas...</p>
        </div>
      ) : data && (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
            {kpis.map((k, i) => (
              <div key={i} className="glass-card admin-card" style={{ padding: '22px', animationDelay: `${i * 0.05}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {k.label}
                    </p>
                    <p style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>
                      {k.value}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>{k.sub}</p>
                  </div>
                  <div style={{
                    width: 42, height: 42, borderRadius: '10px',
                    background: `rgba(${k.color === '#6366f1' ? '99,102,241' : k.color === '#a855f7' ? '168,85,247' : k.color === '#f59e0b' ? '245,158,11' : '99,102,241'},0.15)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <k.icon size={20} color={k.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', marginBottom: '24px' }}>

            {/* Bar Chart */}
            <div className="glass-card admin-card" style={{ padding: '24px', animationDelay: '0.2s' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={16} color={DIM_COLOR} />
                Registros por Tabela
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={allRows} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }}
                    angle={-40} textAnchor="end" interval={0}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {allRows.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={entry.type === 'dim' ? DIM_COLOR : FACT_COLOR} 
                        opacity={0.85}
                        style={{ cursor: 'pointer' }}
                        onClick={() => openTableModal(entry.tabela, entry.label)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '3px', background: DIM_COLOR, display: 'inline-block' }} />
                  Dimensão
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '3px', background: FACT_COLOR, display: 'inline-block' }} />
                  Fato
                </span>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="glass-card admin-card" style={{ padding: '24px', animationDelay: '0.25s' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Proporção</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={4}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString('pt-BR')} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                      {d.name}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: d.color }}>
                      {d.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail Table */}
          <div className="glass-card admin-card" style={{ padding: '24px', animationDelay: '0.3s' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TableProperties size={16} color={FACT_COLOR} />
                Detalhamento por Tabela
              </h3>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px' }}>
                {[
                  { key: 'todos', label: 'Todas' },
                  { key: 'dimensoes', label: 'Dimensões' },
                  { key: 'fatos', label: 'Fatos' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className="tab-btn"
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: '6px 14px', borderRadius: '7px', cursor: 'pointer',
                      border: 'none', fontSize: '12px', fontWeight: 600,
                      background: activeTab === tab.key ? 'rgba(99,102,241,0.25)' : 'transparent',
                      color: activeTab === tab.key ? '#a5b4fc' : '#64748b',
                      transition: 'all .2s',
                    }}
                  >{tab.label}</button>
                ))}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Tipo', 'Tabela', 'Label', 'Registros', 'Proporção', 'Dicionário'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px', fontSize: '11px',
                      fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
                      letterSpacing: '.05em', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => {
                  const IconComp = ICON_MAP[row.icon] || Database;
                  const pct = data.summary.total_geral > 0
                    ? ((row.count / data.summary.total_geral) * 100).toFixed(1) : 0;
                  return (
                    <tr key={i} className="admin-row" style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background .2s',
                      cursor: 'pointer'
                    }} onClick={() => openTableModal(row.tabela, row.label)}>
                      <td style={{ padding: '12px 14px' }}><TypeBadge type={row.type} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '7px',
                            background: row.type === 'dim' ? 'rgba(99,102,241,0.15)' : 'rgba(168,85,247,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <IconComp size={14} color={row.type === 'dim' ? DIM_COLOR : FACT_COLOR} />
                          </div>
                          <code style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{row.tabela}</code>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#cbd5e1' }}>{row.label}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                          {row.count.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', minWidth: '140px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            flex: 1, height: 6, borderRadius: '3px',
                            background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${pct}%`, height: '100%', borderRadius: '3px',
                              background: row.type === 'dim'
                                ? `linear-gradient(90deg, ${DIM_COLOR}, #818cf8)`
                                : `linear-gradient(90deg, ${FACT_COLOR}, #c084fc)`,
                              transition: 'width 1s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b', minWidth: '36px' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTableModal(row.tabela, row.label, 'dicionario');
                          }}
                          style={{
                            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
                            borderRadius: '6px', color: '#a5b4fc', cursor: 'pointer',
                            padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'all .2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(99,102,241,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(99,102,241,0.08)';
                          }}
                        >
                          📖 Ver Campos
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid rgba(99,102,241,0.2)' }}>
                  <td colSpan={3} style={{ padding: '14px', fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>
                    TOTAL ({filteredRows.length} tabelas)
                  </td>
                  <td style={{ padding: '14px', fontSize: '18px', fontWeight: 800, color: '#f1f5f9' }}>
                    {filteredRows.reduce((s, r) => s + r.count, 0).toLocaleString('pt-BR')}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Seed Drawer */}
      <SeedDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => { setDrawerOpen(false); setTimeout(fetchStats, 1000); }}
      />

      {/* Table Records Modal */}
      <TableRecordsModal
        open={modalOpen}
        tableName={selectedTable}
        tableLabel={selectedLabel}
        initialTab={modalInitialTab}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
