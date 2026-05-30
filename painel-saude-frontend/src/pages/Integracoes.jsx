import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Database, UploadCloud, BarChart, CheckCircle, XCircle, 
  Clock, X, Terminal, ShieldCheck, FileSpreadsheet, Link as LinkIcon, Info, Code, Play, Send, FileText, AlertCircle
} from 'lucide-react';

const TABLES = [
  // DIMENSÕES (9)
  { id: 'dim_tempo', name: 'Dimensão: Tempo', fields: ['id_tempo', 'data_registro', 'mes', 'ano'] },
  { id: 'dim_unidade', name: 'Dimensão: Unidades', fields: ['id_unidade', 'nome_unidade', 'tipo_leito', 'capacidade_maxima'] },
  { id: 'dim_paciente', name: 'Dimensão: Pacientes', fields: ['id_paciente', 'pontuacao_nps', 'faixa_etaria'] },
  { id: 'dim_medicamento', name: 'Dimensão: Medicamentos', fields: ['id_medicamento', 'nome_farmaco', 'classe_terapeutica', 'custo_unitario', 'item_essencial'] },
  { id: 'dim_tipo_procedimento', name: 'Dimensão: Tipos de Procedimento', fields: ['id_tipo_procedimento', 'nome_procedimento', 'especialidade', 'valor_base'] },
  { id: 'dim_equipamento', name: 'Dimensão: Equipamentos', fields: ['id_equipamento', 'nome_maquina', 'modelo', 'ultima_manutencao'] },
  { id: 'dim_protocolo', name: 'Dimensão: Protocolos', fields: ['id_protocolo', 'nome_protocolo', 'area_medica'] },
  { id: 'dim_medico', name: 'Dimensão: Médicos', fields: ['id_medico', 'nome_medico', 'especialidade', 'crm'] },
  { id: 'dim_convenio', name: 'Dimensão: Convênios', fields: ['id_convenio', 'nome_operadora', 'tipo_contrato', 'prazo_contratual_pagamento'] },
  
  // FATOS (9)
  { id: 'fato_atendimentos', name: 'Fato: Atendimentos', fields: ['id_atendimento', 'id_tempo', 'id_unidade', 'id_paciente', 'tempo_permanencia_dias', 'status_alta', 'reinternacao_30d'] },
  { id: 'fato_estoque', name: 'Fato: Estoque', fields: ['id_movimentacao', 'id_medicamento', 'id_tempo', 'id_unidade', 'quantidade_saida', 'saldo_atual'] },
  { id: 'fato_erros_medicao', name: 'Fato: Erros Medicação', fields: ['id_evento', 'id_medicamento', 'id_paciente', 'id_tempo', 'tipo_erro', 'severidade'] },
  { id: 'fato_procedimentos', name: 'Fato: Procedimentos', fields: ['id_procedimento_instancia', 'id_tipo_procedimento', 'id_unidade', 'id_tempo', 'id_equipamento', 'tempo_preparo_minutos', 'tempo_execucao_minutos', 'tempo_limpeza_minutos', 'status_agendamento'] },
  { id: 'fato_infraestrutura', name: 'Fato: Infraestrutura', fields: ['id_registro', 'id_unidade', 'id_tempo', 'consumo_agua_m3', 'consumo_energia_kwh', 'total_colaboradores_ativos', 'eventos_infeccao'] },
  { id: 'fato_higienizacao', name: 'Fato: Higienização', fields: ['id_higienizacao', 'id_unidade', 'id_tempo', 'data_hora_saida_paciente', 'data_hora_liberacao_leito'] },
  { id: 'fato_desempenho_clinico', name: 'Fato: Desempenho Clínico', fields: ['id_registro', 'id_medico', 'id_tempo', 'id_protocolo', 'aderente_ao_protocolo', 'tempo_fechamento_prontuario_min'] },
  { id: 'fato_escala_medica', name: 'Fato: Escala Médica', fields: ['id_escala', 'id_medico', 'id_tempo', 'status_presenca', 'horas_atraso'] },
  { id: 'fato_financeiro', name: 'Fato: Financeiro', fields: ['id_transacao', 'id_tempo', 'id_unidade', 'id_convenio', 'receita_bruta', 'valor_glosa_inicial', 'valor_glosa_recuperada', 'custos_operacionais', 'data_pagamento_prevista', 'data_pagamento_real'] },
];

function Integracoes() {
  const navigate = useNavigate();
  const listRef = useRef(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTable, setSelectedTable] = useState(TABLES[9].id);
  const [viewingSchema, setViewingSchema] = useState('fato_atendimentos');
  const [testPayload, setTestPayload] = useState('');
  const [testToken, setTestToken] = useState('');
  const [testResponse, setTestResponse] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => { axios.get(`http://${window.location.hostname}:8000/api/integracoes/status/`).then(res => setSyncLogs(res.data)); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!testToken) {
      setUploadStatus({ type: 'error', message: 'Por favor, informe o Token de Autenticação acima.' });
      return;
    }

    setIsTesting(true);
    setUploadStatus({ type: 'loading', message: 'Enviando arquivo...' });
    
    try {
      const res = await axios.post(`http://${window.location.hostname}:8000/api/integracoes/sync/${selectedTable}/`, file, {
        headers: { 
          'Authorization': `Token ${testToken}`,
          'Content-Type': 'text/csv'
        }
      });
      setUploadStatus({ type: 'success', message: `Sucesso: ${res.data.registros_processados} registros carregados!` });
      axios.get(`http://${window.location.hostname}:8000/api/integracoes/status/`).then(res => setSyncLogs(res.data));
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.response?.data?.erro || 'Erro na conexão com o servidor.' });
    } finally {
      setIsTesting(false);
      // Limpar o input para permitir subir o mesmo arquivo novamente se necessário
      e.target.value = '';
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeModal !== 'api') return;
      const currentIndex = TABLES.findIndex(t => t.id === viewingSchema);
      if (e.key === 'ArrowDown' && currentIndex < TABLES.length - 1) {
        e.preventDefault();
        setViewingSchema(TABLES[currentIndex + 1].id);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        setViewingSchema(TABLES[currentIndex - 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, viewingSchema]);

  useEffect(() => {
    if (activeModal === 'api' && listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-id="${viewingSchema}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [viewingSchema, activeModal]);

  useEffect(() => {
    const table = TABLES.find(t => t.id === viewingSchema);
    if (table) {
      const example = {};
      table.fields.forEach(f => {
        const lowerF = f.toLowerCase();
        if (lowerF.includes('atraso') || lowerF.includes('permanencia') || lowerF.includes('execucao') || lowerF.includes('preparo') || lowerF.includes('limpeza') || lowerF.includes('fechamento')) {
          example[f] = 10;
        } else if (lowerF.includes('hora') || lowerF.includes('manutencao')) {
          example[f] = '2026-04-30T14:00:00Z';
        } else if (lowerF.includes('data') || lowerF.includes('prevista') || lowerF.includes('real')) {
          example[f] = '2026-04-30';
        } else if (lowerF.includes('reinternacao') || lowerF.includes('aderente') || lowerF.includes('essencial')) {
          example[f] = false;
        } else if (lowerF.startsWith('id_') || lowerF.endsWith('_id') || lowerF === 'id' || lowerF.includes('valor') || lowerF.includes('quantidade') || lowerF.includes('custo') || lowerF.includes('saldo') || lowerF.includes('receita') || lowerF.includes('glosa') || lowerF.includes('dias') || lowerF.includes('minutos') || lowerF.includes('min') || lowerF.includes('kwh') || lowerF.includes('m3') || lowerF.includes('nps') || lowerF.includes('capacidade') || lowerF.includes('horas') || lowerF.includes('registro') || lowerF.includes('ano') || lowerF.includes('mes') || lowerF.includes('pontuacao') || lowerF.includes('prazo') || lowerF.includes('ativos') || lowerF.includes('eventos')) {
          example[f] = 100;
        } else { example[f] = 'Exemplo'; }
      });
      setTestPayload(JSON.stringify([example], null, 2));
      setTestResponse(null);
    }
  }, [viewingSchema]);

  const handleTestApi = async () => {
    setIsTesting(true);
    try {
      const res = await axios.post(`http://${window.location.hostname}:8000/api/integracoes/sync/${viewingSchema}/`, JSON.parse(testPayload), { headers: { 'Authorization': `Token ${testToken}` } });
      setTestResponse({ status: res.status, data: res.data });
      axios.get(`http://${window.location.hostname}:8000/api/integracoes/status/`).then(res => setSyncLogs(res.data));
    } catch (err) { setTestResponse({ status: err.response?.status || 'Erro', data: err.response?.data || err.message }); }
    finally { setIsTesting(false); }
  };

  const Modal = ({ title, icon: Icon, children, onClose, maxWidth = '1200px', height = '80vh' }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.96)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(15px)', padding: '20px' }}>
      <div className="glass-card" style={{ width: '90%', maxWidth, height, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid #2dd4bf33', overflow: 'hidden' }}>
        <div style={{ padding: '1.2rem 1.5rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>{Icon && <Icon size={18} />} {title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', padding: '0.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><ArrowLeft size={20} /> Voltar</button>
      <header className="header" style={{ textAlign: 'left', marginBottom: '3rem' }}><h1>Integration Hub & Testing</h1><p style={{ color: '#94a3b8' }}>Pipeline de Ingestão Star Schema</p></header>
      
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '4rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}><Play color="#2dd4bf" size={32} style={{ marginBottom: '1rem' }} /><h3>API Explorer & Test</h3><p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0' }}>Exploração de schemas e inserção viva de dados.</p><button onClick={() => setActiveModal('api')} className="btn-primary" style={{ background: '#2dd4bf', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Abrir Console</button></div>
        <div className="glass-card" style={{ padding: '2rem' }}><FileSpreadsheet color="#818cf8" size={32} style={{ marginBottom: '1rem' }} /><h3>CSV Batch Import</h3><p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0' }}>Importação massiva via planilha.</p><button onClick={() => setActiveModal('upload')} className="btn-primary" style={{ background: '#818cf8', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Fazer Upload</button></div>
        <div className="glass-card" style={{ padding: '2rem' }}><Database color="#fbbf24" size={32} style={{ marginBottom: '1rem' }} /><h3>SQL Access</h3><p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0' }}>Conexão PostgreSQL para BI Externo.</p><button onClick={() => setActiveModal('bi')} className="btn-primary" style={{ background: '#fbbf24', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Ver Credenciais</button></div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}><Clock color="#2dd4bf" size={20} /><h2 style={{ fontSize: '1.2rem' }}>Monitor de Ingestão</h2></div>
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #1e293b', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px' }}>Tabela</th><th style={{ padding: '12px' }}>Status</th><th style={{ padding: '12px' }}>Registros</th><th style={{ padding: '12px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {syncLogs.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#f8fafc' }}>{log.categoria.replace(/_/g, ' ').toUpperCase()}</td>
                  <td style={{ padding: '12px' }}><span style={{ color: log.status === 'Sucesso' ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{log.status}</span></td>
                  <td style={{ padding: '12px' }}>{log.registros_processados}</td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{new Date(log.ultima_sincronizacao).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal === 'api' && (
        <Modal title="API Interactive Console" icon={Terminal} onClose={() => setActiveModal(null)} maxWidth="1100px" height="75vh">
          <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
            <div ref={listRef} style={{ width: '260px', overflowY: 'auto', borderRight: '1px solid #334155', paddingRight: '0.8rem', height: '100%' }}>
              {TABLES.map((t) => (
                <div key={t.id} data-id={t.id} onClick={() => setViewingSchema(t.id)} style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px', background: viewingSchema === t.id ? 'rgba(45, 212, 191, 0.2)' : 'transparent', border: viewingSchema === t.id ? '1px solid #2dd4bf' : '1px solid transparent', color: viewingSchema === t.id ? '#2dd4bf' : '#94a3b8', fontSize: '0.78rem', transition: 'all 0.1s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
              ))}
              <div style={{ height: '20px' }}></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', height: '100%' }}>
              <div style={{ marginBottom: '1rem' }}><h4 style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '4px' }}>TARGET URL:</h4><div style={{ background: '#0f172a', padding: '8px 12px', borderRadius: '6px', color: '#2dd4bf', border: '1px solid #1e293b', fontSize: '0.8rem' }}>POST /api/integracoes/sync/{viewingSchema}/</div></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }}>
                <div style={{ minWidth: '0' }}><h4 style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '4px' }}>AUTH & PAYLOAD:</h4><div style={{ display: 'flex', gap: '8px', marginBottom: '0.8rem' }}><input type="password" placeholder="Token" value={testToken} onChange={(e) => setTestToken(e.target.value)} style={{ flex: 1, padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.75rem' }} /><button onClick={handleTestApi} disabled={isTesting || !testToken} style={{ padding: '0 15px', background: '#2dd4bf', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', whiteSpace: 'nowrap', opacity: (isTesting || !testToken) ? 0.5 : 1 }}>{isTesting ? '...' : 'Enviar POST'}</button></div><textarea value={testPayload} onChange={(e) => setTestPayload(e.target.value)} style={{ width: '100%', height: '320px', background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.4', resize: 'none' }} /></div>
                <div style={{ minWidth: '0' }}><h4 style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '4px' }}>SERVER RESPONSE:</h4>{testResponse ? (<div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: `1px solid ${testResponse.status === 200 ? '#4ade80' : '#f87171'}`, height: '360px', overflowY: 'auto' }}><div style={{ color: testResponse.status === 200 ? '#4ade80' : '#f87171', fontWeight: 'bold', marginBottom: '10px', borderBottom: `1px solid ${testResponse.status === 200 ? '#4ade8033' : '#f8717133'}`, paddingBottom: '5px', fontSize: '0.75rem' }}>HTTP STATUS: {testResponse.status}</div><pre style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{JSON.stringify(testResponse.data, null, 2)}</pre></div>) : (<div style={{ border: '1px dashed #334155', height: '360px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>Aguardando POST...</div>)}</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'upload' && (
        <Modal title="CSV Batch Import" icon={UploadCloud} onClose={() => { setActiveModal(null); setUploadStatus(null); }} maxWidth="600px" height="auto">
          <div style={{ overflowY: 'auto', padding: '10px' }}>
            <div style={{ marginBottom: '1rem' }}><label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '6px' }}>Autenticação:</label><input type="password" placeholder="Token" value={testToken} onChange={(e) => setTestToken(e.target.value)} style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.8rem' }} /></div>
            <div style={{ marginBottom: '1rem' }}><label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '6px' }}>Tabela Alvo:</label><select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} style={{ width: '100%', padding: '10px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.8rem' }}>{TABLES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div style={{ marginBottom: '1.2rem', background: '#0f172a', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #818cf8' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', marginBottom: '6px' }}><FileText size={16} /><strong>Layout CSV (Delimitador: ;)</strong></div><code style={{ background: '#1e293b', padding: '8px', borderRadius: '4px', display: 'block', color: '#f8fafc', fontSize: '0.7rem', border: '1px solid #334155', overflowX: 'auto' }}>{TABLES.find(t => t.id === selectedTable)?.fields.join(';')}</code></div>
            
            {/* ÁREA DE CLIQUE REFORMULADA COM LABEL HTML REAL */}
            <label 
              style={{ 
                display: 'block', 
                textAlign: 'center', 
                padding: '2.5rem', 
                border: '2px dashed #334155', 
                borderRadius: '15px', 
                cursor: isTesting ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                background: isTesting ? 'rgba(0,0,0,0.2)' : 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#818cf8'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}
            >
              <UploadCloud size={40} color="#818cf8" style={{ marginBottom: '1rem', margin: '0 auto' }} />
              <input 
                type="file" 
                onChange={handleFileUpload} 
                accept=".csv" 
                style={{ display: 'none' }} 
              />
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' }}>
                {isTesting ? 'Processando...' : 'Clique aqui ou arraste o arquivo CSV'}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '8px' }}>
                Somente arquivos .csv com delimitador ";"
              </p>
            </label>

            {uploadStatus && (
              <div style={{ marginTop: '1rem', padding: '12px', borderRadius: '8px', background: uploadStatus.type === 'error' ? '#f8717122' : '#4ade8022', border: `1px solid ${uploadStatus.type === 'error' ? '#f87171' : '#4ade80'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {uploadStatus.type === 'error' ? <AlertCircle color="#f87171" size={18} /> : (uploadStatus.type === 'loading' ? <Clock color="#818cf8" size={18} className="animate-spin" /> : <CheckCircle color="#4ade80" size={18} />)}
                <span style={{ fontSize: '0.8rem', color: uploadStatus.type === 'error' ? '#f87171' : (uploadStatus.type === 'loading' ? '#818cf8' : '#4ade80') }}>{uploadStatus.message}</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {activeModal === 'bi' && (
        <Modal title="External SQL Access" icon={Database} onClose={() => setActiveModal(null)} maxWidth="500px" height="auto">
          <div style={{ display: 'grid', gap: '8px', padding: '10px' }}>{[{ label: 'Host', value: 'localhost' }, { label: 'Port', value: '5432' }, { label: 'DB', value: 'dw_saude' }, { label: 'User', value: 'postgres_bi' }].map(item => (<div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#1e293b', borderRadius: '8px', fontSize: '0.8rem' }}><span style={{ color: '#64748b' }}>{item.label}:</span><strong style={{ color: '#fbbf24' }}>{item.value}</strong></div>))}</div>
        </Modal>
      )}
    </div>
  );
}

export default Integracoes;
