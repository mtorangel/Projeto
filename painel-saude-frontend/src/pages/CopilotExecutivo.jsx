import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Brain, Send, UploadCloud, FileText, CheckCircle, 
  AlertTriangle, Sparkles, TrendingUp, DollarSign, Activity, HelpCircle, 
  Trash2, Layers, Settings, X
} from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

function CopilotExecutivo() {
  const navigate = useNavigate();
  const token = '618a1ecc975393339a8f8c1a35c779cc142e7654';
  const apiBase = `http://${window.location.hostname}:8000/api`;

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Olá! Sou seu **Consultor Executivo Sênior em Administração e Ocupação Hospitalar**.\n\nEstou pronto para ajudar a analisar o desempenho do hospital. Você pode me fazer perguntas em linguagem natural para gerar e executar queries SQL diretamente no banco de dados, ou carregar relatórios e manuais de processos para conversarmos com base neles.\n\n*Nota: Estou blindado para não fornecer aconselhamentos médicos ou diagnósticos clínicos.*',
      chartData: null
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Estados do Resumo Diário
  const [resumos, setResumos] = useState([]);
  const [selectedResumo, setSelectedResumo] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Estados de Upload de Manuais (RAG)
  const [documents, setDocuments] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Estados de Chaves de API de IA
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [openaiKeyInput, setOpenaiKeyInput] = useState('');
  // Forced re-render trigger when keys change
  const [apiKeyStatus, setApiKeyStatus] = useState(() => {
    return !!localStorage.getItem('user_gemini_key') || !!localStorage.getItem('user_openai_key');
  });

  // Controla se o card de resumo de anomalias está expandido ou recolhido
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(window.innerHeight > 768);

  const chatEndRef = useRef(null);

  // Carrega resumos e documentos
  useEffect(() => {
    fetchResumos();
    fetchDocuments();
    setGeminiKeyInput(localStorage.getItem('user_gemini_key') || '');
    setOpenaiKeyInput(localStorage.getItem('user_openai_key') || '');
  }, []);

  const fetchDocuments = () => {
    axios.get(`${apiBase}/ai/upload-documento/`, {
      headers: { 'Authorization': `Token ${token}` }
    })
    .then(res => {
      setDocuments(res.data);
    })
    .catch(err => {
      console.error("Erro ao buscar documentos indexados:", err);
    });
  };

  // Rola o chat para o fim sempre que chegam novas mensagens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const fetchResumos = () => {
    setSummaryLoading(true);
    axios.get(`${apiBase}/ai/historico-resumos/`, {
      headers: { 'Authorization': `Token ${token}` }
    })
    .then(res => {
      setResumos(res.data);
      if (res.data.length > 0) {
        setSelectedResumo(res.data[0]); // Seleciona o mais recente
      }
      setSummaryLoading(false);
    })
    .catch(err => {
      console.error("Erro ao buscar histórico de resumos:", err);
      setSummaryLoading(false);
    });
  };

  const handleSendChat = (textToSend = null) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Adiciona mensagem do usuário
    const userMsg = { sender: 'user', text: text, chartData: null };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setChatLoading(true);

    const geminiKey = localStorage.getItem('user_gemini_key') || '';
    const openaiKey = localStorage.getItem('user_openai_key') || '';

    // Build headers - only include API keys when they are actually set
    const reqHeaders = { 'Authorization': `Token ${token}` };
    if (geminiKey) reqHeaders['X-Gemini-Key'] = geminiKey;
    if (openaiKey)  reqHeaders['X-OpenAI-Key'] = openaiKey;

    axios.post(`${apiBase}/ai/chat-executivo/`, 
      { pergunta: text },
      { headers: reqHeaders }
    )
    .then(res => {
      const aiMsg = {
        sender: 'ai',
        text: res.data.resposta,
        chartData: res.data.chart_data
      };
      setMessages(prev => [...prev, aiMsg]);
      setChatLoading(false);
    })
    .catch(err => {
      console.error("Erro no chat executivo:", err);
      const errorMsg = {
        sender: 'ai',
        text: `### **[Erro Operacional]**\nOcorreu uma falha ao processar sua solicitação:\n> ${err.response?.data?.erro || "Sem conexão com o servidor de IA."}`,
        chartData: null
      };
      setMessages(prev => [...prev, errorMsg]);
      setChatLoading(false);
    });
  };

  const handleDiscussSummary = (summaryText) => {
    const prompt = `Gostaria de analisar detalhadamente o seguinte Resumo Executivo Diário:\n\n${summaryText}\n\nQuais são os principais pontos de gargalo operacional e financeiro de hoje?`;
    handleSendChat(prompt);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('arquivo', file);
    setUploadLoading(true);

    axios.post(`${apiBase}/ai/upload-documento/`, formData, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(res => {
      fetchDocuments();
      setUploadLoading(false);
      
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `### 📂 **Novo Manual Sincronizado**\nO documento **${file.name}** foi indexado com sucesso no meu repositório local de RAG!\n\nAgora posso responder perguntas conceituais baseando-me nas diretrizes deste arquivo.`,
        chartData: null
      }]);
    })
    .catch(err => {
      console.error("Erro ao fazer upload de documento:", err);
      alert(err.response?.data?.erro || "Falha ao enviar arquivo para o servidor de IA.");
      setUploadLoading(false);
    });
  };

  // Funções para renderizar Markdown e Tabelas
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements = [];
    
    let inCode = false;
    let codeLines = [];
    
    let inTable = false;
    let tableLines = [];

    const flushTable = (key) => {
      if (tableLines.length === 0) return null;
      
      const rows = tableLines.map(line => {
        const cleaned = line.trim().replace(/^\||\|$/g, '');
        return cleaned.split('|').map(cell => cell.trim());
      });
      
      tableLines = [];
      inTable = false;

      const validRows = rows.filter(row => {
        if (row.length === 0) return false;
        const isSeparator = row.every(cell => /^[-:\s]+$/.test(cell));
        return !isSeparator;
      });

      if (validRows.length === 0) return null;

      const headerRow = validRows[0];
      const bodyRows = validRows.slice(1);

      return (
        <div key={key} style={{ overflowX: 'auto', margin: '0.75rem 0', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.3)' }}>
            <thead>
              <tr style={{ background: 'rgba(129, 140, 248, 0.15)' }}>
                {headerRow.map((cell, idx) => (
                  <th key={idx} style={{ padding: '8px 12px', borderBottom: '2px solid rgba(129, 140, 248, 0.3)', color: '#2dd4bf', fontWeight: 'bold', textAlign: 'left' }}>
                    {parseBold(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '8px 12px', color: '#f1f5f9' }}>
                      {parseBold(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    let idx = 0;
    while (idx < lines.length) {
      const line = lines[idx];
      
      if (line.trim().startsWith('```')) {
        if (inTable) {
          elements.push(flushTable(idx));
        }
        if (inCode) {
          inCode = false;
          const code = codeLines.join('\n');
          codeLines = [];
          elements.push(
            <pre key={idx} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem 1rem', borderRadius: '8px', overflowX: 'auto', margin: '0.5rem 0', fontFamily: 'Courier New, monospace', fontSize: '0.8rem', color: '#38bdf8' }}>
              <code>{code}</code>
            </pre>
          );
        } else {
          inCode = true;
        }
        idx++;
        continue;
      }
      
      if (inCode) {
        codeLines.push(line);
        idx++;
        continue;
      }

      const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|') && line.includes('|');
      if (isTableLine) {
        inTable = true;
        tableLines.push(line);
        idx++;
        continue;
      } else {
        if (inTable) {
          elements.push(flushTable(idx));
        }
      }

      if (line.trim().startsWith('###')) {
        const title = line.replace('###', '').trim();
        elements.push(<h3 key={idx} style={{ color: '#2dd4bf', fontSize: '1rem', fontWeight: '700', margin: '0.75rem 0 0.4rem 0' }}>{parseBold(title)}</h3>);
      }
      else if (line.trim().startsWith('##')) {
        const title = line.replace('##', '').trim();
        elements.push(<h2 key={idx} style={{ color: '#818cf8', fontSize: '1.1rem', fontWeight: '700', margin: '1rem 0 0.5rem 0' }}>{parseBold(title)}</h2>);
      }
      else if (line.trim().startsWith('#')) {
        const title = line.replace('#', '').trim();
        elements.push(<h1 key={idx} style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: '800', margin: '1.25rem 0 0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem' }}>{parseBold(title)}</h1>);
      }
      else if (line.trim().startsWith('>')) {
        const quote = line.replace('>', '').trim();
        elements.push(<blockquote key={idx} style={{ borderLeft: '3px solid #818cf8', paddingLeft: '0.75rem', color: '#94a3b8', fontStyle: 'italic', margin: '0.5rem 0' }}>{parseBold(quote)}</blockquote>);
      }
      else if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        const cleanLine = line.trim().substring(1).trim();
        elements.push(<li key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.2rem', listStyleType: 'disc', color: '#f1f5f9', fontSize: '0.9rem' }}>{parseBold(cleanLine)}</li>);
      }
      else if (line.trim() === '') {
        elements.push(<div key={idx} style={{ height: '0.5rem' }} />);
      }
      else {
        elements.push(<p key={idx} style={{ marginBottom: '0.5rem', lineHeight: '1.5', color: '#f1f5f9', fontSize: '0.9rem' }}>{parseBold(line)}</p>);
      }

      idx++;
    }

    if (inTable) {
      elements.push(flushTable(idx));
    }

    return elements;
  };

  const parseBold = (line) => {
    const parts = line.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} style={{ color: '#2dd4bf', fontWeight: '600' }}>{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-dark)',
      color: 'var(--text-main)',
      overflow: 'hidden',
      zIndex: 9999
    }}>
      
      {/* Header Fixo no Topo */}
      <div style={{ flexShrink: 0, padding: '0.75rem 1.5rem 0.5rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Voltar para Home
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8' }}>
              <Brain size={18} />
              <span style={{ fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '0.05em' }}>COGNITIVE AGENT v1.0</span>
            </div>
            <button
              onClick={() => {
                setGeminiKeyInput(localStorage.getItem('user_gemini_key') || '');
                setOpenaiKeyInput(localStorage.getItem('user_openai_key') || '');
                setIsSettingsOpen(true);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: '#94a3b8',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <Settings size={14} /> Configurações
            </button>
            {/* Status badge da chave de API */}
            {(() => {
              const hasGemini = !!(localStorage.getItem('user_gemini_key'));
              const hasOpenAI = !!(localStorage.getItem('user_openai_key'));
              const hasKey = hasGemini || hasOpenAI;
              const label = hasGemini ? '✦ Gemini Ativo' : hasOpenAI ? '✦ OpenAI Ativo' : '⚠ Sem Chave API';
              // apiKeyStatus in deps ensures re-render when key is saved
              void apiKeyStatus;
              return (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '3px 8px',
                  borderRadius: '20px',
                  background: hasKey ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)',
                  border: `1px solid ${hasKey ? 'rgba(74,222,128,0.35)' : 'rgba(251,191,36,0.35)'}`,
                  color: hasKey ? '#4ade80' : '#fbbf24',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }} onClick={() => setIsSettingsOpen(true)}>
                  {label}
                </span>
              );
            })()}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', marginBottom: '0.2' }}>
              Copilot Executivo de Gestão Hospitalar <Sparkles className="pulse-dot" size={18} style={{ color: '#2dd4bf' }} />
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              Assistente cognitivo focado em Finanças, Ocupação, Escalas de RH e Auditoria Administrativa do Hospital Geral.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal Layout Ocupando o Restante da Tela */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', flex: 1, minHeight: 0, padding: '0.75rem 1.5rem 1rem 1.5rem', overflow: 'hidden' }}>
        
        {/* Lado Esquerdo - Resumo Diário + Chat Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', minHeight: 0, overflow: 'hidden' }}>
          
          {/* Card de Resumo Executivo Diário */}
          <div className="glass-panel" style={{ 
            padding: '0.75rem 1.25rem', 
            background: 'rgba(30, 41, 59, 0.4)', 
            borderColor: 'rgba(129, 140, 248, 0.2)', 
            flexShrink: 0,
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div 
                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
              >
                <TrendingUp size={18} style={{ color: '#818cf8' }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>Relatório Operacional e Anomalias</h3>
                  {!isSummaryExpanded && selectedResumo && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Competência: {selectedResumo.data_geracao}
                    </span>
                  )}
                </div>
                {!isSummaryExpanded && selectedResumo && (
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '1rem', alignItems: 'center' }}>
                    {Object.keys(selectedResumo.dados_anomalias).length > 0 ? (
                      <span style={{ fontSize: '0.65rem', background: '#ef444415', border: '1px solid #ef444430', color: '#f87171', padding: '1px 5px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        🚨 {Object.keys(selectedResumo.dados_anomalias).length} Anomalias
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', background: '#22c55e15', border: '1px solid #22c55e30', color: '#4ade80', padding: '1px 5px', borderRadius: '4px' }}>
                        ✅ Normal
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isSummaryExpanded && resumos.length > 0 && (
                  <select 
                    value={selectedResumo?.id_resumo || ''} 
                    onChange={(e) => {
                      const found = resumos.find(r => r.id_resumo === parseInt(e.target.value));
                      if (found) setSelectedResumo(found);
                    }}
                    style={{ background: '#0f172a', border: '1px solid var(--glass-border)', borderRadius: '6px', color: '#f8fafc', padding: '3px 6px', fontSize: '0.75rem', outline: 'none' }}
                  >
                    {resumos.map(r => (
                      <option key={r.id_resumo} value={r.id_resumo}>Competência: {r.data_geracao}</option>
                    ))}
                  </select>
                )}
                
                <button
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {isSummaryExpanded ? 'Recolher' : 'Expandir'}
                </button>

                {!isSummaryExpanded && selectedResumo && (
                  <button 
                    onClick={() => handleDiscussSummary(selectedResumo.conteudo_resumo)}
                    style={{ 
                      fontSize: '0.7rem', 
                      padding: '3px 8px', 
                      background: 'linear-gradient(to right, #818cf8, #2dd4bf)', 
                      border: 'none', 
                      cursor: 'pointer', 
                      borderRadius: '4px', 
                      color: '#0f172a', 
                      fontWeight: 'bold' 
                    }}
                  >
                    Discutir
                  </button>
                )}
              </div>
            </div>

            {isSummaryExpanded && (
              <div style={{ marginTop: '0.75rem' }}>
                {summaryLoading ? (
                  <div style={{ color: '#818cf8', fontSize: '0.85rem', padding: '0.5rem 0' }}>Analisando desvios padrão no banco de dados...</div>
                ) : selectedResumo ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '1.25rem' }}>
                    <div style={{ maxHeight: '90px', overflowY: 'auto', paddingRight: '6px', fontSize: '0.8rem', color: '#e2e8f0', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                      {renderMarkdown(selectedResumo.conteudo_resumo)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mapeador Analítico</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '35px', overflowY: 'auto' }}>
                        {Object.keys(selectedResumo.dados_anomalias).length > 0 ? (
                          Object.entries(selectedResumo.dados_anomalias).map(([key, val]) => (
                            <span key={key} style={{ fontSize: '0.65rem', background: '#ef444415', border: '1px solid #ef444430', color: '#f87171', padding: '1px 5px', borderRadius: '4px' }}>
                              🚨 {key.toUpperCase()}: {val.valor}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.65rem', background: '#22c55e15', border: '1px solid #22c55e30', color: '#4ade80', padding: '1px 5px', borderRadius: '4px' }}>
                            ✅ Sem Anomalias
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDiscussSummary(selectedResumo.conteudo_resumo)}
                        style={{ marginTop: '2px', fontSize: '0.75rem', padding: '5px 10px', background: 'linear-gradient(to right, #818cf8, #2dd4bf)', border: 'none', cursor: 'pointer', borderRadius: '6px', color: '#0f172a', fontWeight: 'bold', width: '100%' }}
                      >
                        Discutir no Chat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0.5rem', textAlign: 'center' }}>
                    Nenhum resumo diário encontrado.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Workspace com Altura Auto-Ajustável e Scroll Interno */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 1.25rem', background: 'rgba(15, 23, 42, 0.6)', minHeight: 0, overflow: 'hidden' }}>
            
            {/* Mensagens Timeline */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem', minHeight: 0 }}>
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: msg.sender === 'user' ? '75%' : '85%',
                    background: msg.sender === 'user' ? '#818cf8' : 'rgba(255, 255, 255, 0.02)',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    color: msg.sender === 'user' ? '#0f172a' : '#f8fafc',
                    padding: '0.85rem 1.1rem',
                    borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {msg.sender === 'ai' ? (
                    <div>{renderMarkdown(msg.text)}</div>
                  ) : (
                    <div style={{ fontWeight: '500', color: '#0f172a', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{msg.text}</div>
                  )}

                  {/* Inline Recharts Mini-Chart */}
                  {msg.chartData && msg.chartData.length > 0 && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      background: 'rgba(0,0,0,0.45)', 
                      padding: '0.75rem', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.08)',
                      width: '460px',
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>Gráfico de Apoio à Decisão</h4>
                        <span style={{ fontSize: '0.65rem', color: '#2dd4bf', background: 'rgba(45, 212, 191, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>Real-time Query</span>
                      </div>
                      <div style={{ width: '100%', height: 140 }}>
                        <ResponsiveContainer width="100%" height={140}>
                          <ComposedChart data={msg.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '8px' }} tickLine={false} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: '8px' }} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '10px', color: '#f8fafc' }}
                            />
                            <Bar dataKey="valor" fill="#2dd4bf" radius={[3, 3, 0, 0]} barSize={18} />
                            <Line type="monotone" dataKey="valor" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 2 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#94a3b8', padding: '0.75rem 1.25rem', borderRadius: '14px 14px 14px 2px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid transparent', borderTopColor: '#2dd4bf', borderRadius: '50%' }}></div>
                  <span>Aguardando resposta do agente cognitivo...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Box Fixo no final do card */}
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                placeholder="Pergunte sobre faturamento, leitos, absenteísmo médico ou sobre manuais indexados..."
                style={{ flex: 1, background: '#0f172a', border: '1px solid var(--glass-border)', borderRadius: '10px', color: '#f8fafc', padding: '0.75rem 1.25rem', fontSize: '0.9rem', outline: 'none' }}
              />
              <button 
                onClick={() => handleSendChat()}
                style={{ background: '#2dd4bf', color: '#0f172a', border: 'none', borderRadius: '10px', padding: '0 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Send size={16} />
              </button>
            </div>

          </div>

        </div>

        {/* Lado Direito - Painel de Conhecimento RAG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', minHeight: 0, overflow: 'hidden' }}>
          
          {/* Drag and Drop box */}
          <div 
            className="glass-panel" 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            style={{ 
              padding: '1.25rem 1rem', 
              textAlign: 'center', 
              border: dragActive ? '2px dashed #2dd4bf' : '1px dashed var(--glass-border)', 
              background: dragActive ? 'rgba(45, 212, 191, 0.03)' : 'rgba(255, 255, 255, 0.01)',
              borderRadius: '16px',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0
            }}
          >
            <input 
              type="file" 
              id="file-upload" 
              multiple={false} 
              accept=".pdf,.docx" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <UploadCloud size={32} style={{ color: '#2dd4bf', margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Carga de Conhecimento</div>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', lineHeight: '1.3' }}>
                Arraste ou clique para enviar arquivos **PDF** ou **DOCX**.
              </p>
            </label>
            {uploadLoading && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid transparent', borderTopColor: '#2dd4bf', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.75rem', color: '#2dd4bf' }}>Indexando chunks...</span>
              </div>
            )}
          </div>

          {/* Documentos Indexados list com Scroll Interno */}
          <div className="glass-panel" style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', background: 'rgba(30, 41, 59, 0.2)', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', flexShrink: 0 }}>
              <FileText size={14} style={{ color: '#818cf8' }} />
              <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Documentos Indexados</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px', minHeight: 0 }}>
              {documents.length > 0 ? (
                documents.map(doc => (
                  <div 
                    key={doc.id} 
                    style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '8px', fontSize: '0.7rem' }}
                  >
                    <div style={{ fontWeight: '600', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                      {doc.nome}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.65rem' }}>
                      <span>{doc.tamanho} • {doc.data}</span>
                      <span style={{ color: '#4ade80', fontWeight: 'bold' }}>● {doc.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem 0', fontSize: '0.7rem' }}>
                  Nenhum manual carregado ainda.
                </div>
              )}
            </div>

            <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem', fontSize: '0.65rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <HelpCircle size={10} style={{ color: '#2dd4bf' }} />
              <span>Busca ativa via TF-IDF local.</span>
            </div>
          </div>

        </div>

      </div>

      {isSettingsOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div className="glass-panel" style={{
            width: '400px',
            padding: '1.5rem',
            background: '#0f172a',
            borderColor: 'rgba(129, 140, 248, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2dd4bf' }}>
                <Settings size={18} />
                <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>Chaves de API do Assistente</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>
              Insira suas chaves de API pessoais do Gemini ou OpenAI. As chaves serão armazenadas localmente no seu navegador e enviadas apenas no cabeçalho das requisições.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#2dd4bf', fontSize: '0.75rem', fontWeight: 'bold' }}>Gemini API Key</label>
              <input
                type="password"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                style={{ background: '#070b13', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#f8fafc', padding: '8px 12px', fontSize: '0.8rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 'bold' }}>OpenAI API Key</label>
              <input
                type="password"
                value={openaiKeyInput}
                onChange={(e) => setOpenaiKeyInput(e.target.value)}
                placeholder="sk-proj-..."
                style={{ background: '#070b13', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#f8fafc', padding: '8px 12px', fontSize: '0.8rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
              <button
                onClick={() => {
                  const g = geminiKeyInput.trim();
                  const o = openaiKeyInput.trim();
                  if (g) localStorage.setItem('user_gemini_key', g);
                  else localStorage.removeItem('user_gemini_key');
                  if (o) localStorage.setItem('user_openai_key', o);
                  else localStorage.removeItem('user_openai_key');
                  setApiKeyStatus(!!(g || o)); // force re-render of badge
                  setIsSettingsOpen(false);
                  
                  // Add a system notice in chat
                  const activeLLM = g ? 'Gemini' : o ? 'OpenAI' : null;
                  setMessages(prev => [...prev, {
                    sender: 'ai',
                    text: activeLLM
                      ? `⚙️ **Configurações salvas!** Chave **${activeLLM}** registrada com sucesso. O assistente agora responderá com IA Generativa em todas as próximas mensagens.`
                      : `⚙️ **Configurações salvas!** Nenhuma chave de API configurada. O assistente operará em **Modo Offline** (busca semântica local).`,
                    chartData: null
                  }]);
                }}
                style={{ flex: 1, background: 'linear-gradient(to right, #818cf8, #2dd4bf)', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '10px 0', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Salvar Chaves
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 0', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CopilotExecutivo;
