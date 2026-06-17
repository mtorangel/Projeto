import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Loader2, BookOpen, ClipboardList, Calendar, Building } from 'lucide-react';
import axios from 'axios';

const AITrigger = ({ 
  indicador, 
  valorAtual = 'Geral', 
  color = '#a78bfa',
  buttonStyle = {},
  iconSize = 14
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Confirmar a conformidade dos dados integrados via AGHUse', checked: false },
    { id: 2, text: 'Reunir com a coordenação médica do setor para validar desvios', checked: false },
    { id: 3, text: 'Desenhar ação preventiva e monitorar no próximo comitê', checked: false }
  ]);

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
    fetchAIExplanation();
  };

  const fetchAIExplanation = () => {
    setLoading(true);
    setError(null);

    // Obter filtros ativos do localStorage
    const saved = localStorage.getItem('active_filters');
    const filters = saved ? JSON.parse(saved) : {};
    const unidadeId = filters.unidade || '';
    
    const unitMapping = {
      '1': 'Hospital Central',
      '2': 'Hospital Norte',
      '3': 'PA Sul'
    };
    const resolvedUnit = unitMapping[unidadeId] || 'Todas as Unidades';

    const token = '618a1ecc975393339a8f8c1a35c779cc142e7654';

    const geminiKey = localStorage.getItem('user_gemini_key') || '';
    const openaiKey = localStorage.getItem('user_openai_key') || '';

    axios.post(`http://${window.location.hostname}:8000/api/ai/explicar-indicador/`, {
      indicador: indicador,
      valor_atual: valorAtual,
      unidade: resolvedUnit
    }, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        'X-Gemini-Key': geminiKey,
        'X-OpenAI-Key': openaiKey
      }
    })
    .then(res => {
      setAiResponse(res.data.resposta);
      setLoading(false);
    })
    .catch(err => {
      console.error("Erro ao chamar IA:", err);
      setError(err.response?.data?.erro || "Não foi possível obter a resposta da IA. Verifique sua conexão com o servidor.");
      setLoading(false);
    });
  };

  // Helper to parse AI response into Concept and Action sections
  const parseAIResponse = (text) => {
    if (!text) return { conceito: '', acao: '' };
    
    let conceito = '';
    let acao = '';
    
    // Normalize and locate sections using flexible regex markers
    const conceitoMarkerRegex = /###\s*\*?\*?\[?Conceito\]?\]?(\*?\*?)?:?\s*/i;
    const acaoMarkerRegex = /###\s*\*?\*?\[?(Análise\s+de\s+Ação|Analise\s+de\s+Acao|Ação|Acao)\]?\]?(\*?\*?)?:?\s*/i;
    
    const conceitoMatch = text.match(conceitoMarkerRegex);
    const acaoMatch = text.match(acaoMarkerRegex);
    
    if (conceitoMatch && acaoMatch) {
      const conceitoIndex = conceitoMatch.index;
      const acaoIndex = acaoMatch.index;
      
      const conceitoMarkerLen = conceitoMatch[0].length;
      const acaoMarkerLen = acaoMatch[0].length;
      
      if (conceitoIndex < acaoIndex) {
        conceito = text.substring(conceitoIndex + conceitoMarkerLen, acaoIndex).trim();
        acao = text.substring(acaoIndex + acaoMarkerLen).trim();
      } else {
        acao = text.substring(acaoIndex + acaoMarkerLen, conceitoIndex).trim();
        conceito = text.substring(conceitoIndex + conceitoMarkerLen).trim();
      }
    } else if (conceitoMatch) {
      const conceitoIndex = conceitoMatch.index;
      const conceitoMarkerLen = conceitoMatch[0].length;
      conceito = text.substring(conceitoIndex + conceitoMarkerLen).trim();
    } else if (acaoMatch) {
      const acaoIndex = acaoMatch.index;
      const acaoMarkerLen = acaoMatch[0].length;
      acao = text.substring(acaoIndex + acaoMarkerLen).trim();
    } else {
      // Fallback: split by double paragraph breaks
      const paragraphs = text.split(/\n\s*\n+/);
      if (paragraphs.length >= 2) {
        conceito = paragraphs[0].trim();
        acao = paragraphs.slice(1).join('\n\n').trim();
      } else {
        conceito = text.trim();
      }
    }
    
    // Clean up any remaining leading/trailing punctuation or markdown characters
    const cleanSection = (str) => {
      return str
        .replace(/^[:\-\s\*\#\.\,]+/, '') // Strip leading colons, hyphens, spaces, asterisks, hashes, dots
        .replace(/###\s*\*?\*?\[?(Conceito|Análise\s+de\s+Ação|Analise\s+de\s+Acao|Ação|Acao)\]?\]?(\*?\*?)?:?\s*$/i, '') // Strip trailing heading markers
        .trim();
    };
    
    return { 
      conceito: cleanSection(conceito), 
      acao: cleanSection(acao) 
    };
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} style={{ color: '#f8fafc', fontWeight: 'bold' }}>{part}</strong>;
      }
      return part;
    });
  };

  // Obter detalhes dos filtros ativos para o header do Drawer
  const getActiveFilterDetails = () => {
    const saved = localStorage.getItem('active_filters');
    if (!saved) return { unit: 'Todas as Unidades', period: 'Todos os Períodos' };
    
    const filters = JSON.parse(saved);
    const unitMapping = { '1': 'Hospital Central', '2': 'Hospital Norte', '3': 'PA Sul' };
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const unit = unitMapping[filters.unidade] || 'Todas as Unidades';
    const monthName = filters.mes ? months[parseInt(filters.mes) - 1] : '';
    const period = filters.ano ? (monthName ? `${monthName} / ${filters.ano}` : filters.ano) : 'Todos os Períodos';
    
    return { unit, period };
  };

  const filterDetails = getActiveFilterDetails();
  const { conceito, acao } = parseAIResponse(aiResponse);

  return (
    <>
      <button
        onClick={handleOpenDrawer}
        style={{
          background: 'none',
          border: 'none',
          color: color,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          padding: '2px',
          borderRadius: '4px',
          ...buttonStyle
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.15)';
          e.currentTarget.style.filter = 'drop-shadow(0 0 3px rgba(167, 139, 250, 0.5))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.filter = 'none';
        }}
        title="Explicar com IA"
      >
        <Sparkles size={iconSize} />
      </button>

      {/* Render drawer using portal */}
      {isDrawerOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Close drawer when clicking backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />

          {/* Drawer Panel */}
          <div style={{
            position: 'relative',
            width: '480px',
            maxWidth: '100%',
            height: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '-10px 0 35px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 100000,
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, rgba(129, 140, 248, 0.05), transparent)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="#a78bfa" style={{ filter: 'drop-shadow(0 0 4px rgba(167, 139, 250, 0.4))' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>Explicação Contextual por IA</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              
              {/* Context Summary Card */}
              <div className="glass-card" style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${color || '#818cf8'}`,
                background: 'rgba(255, 255, 255, 0.02)',
              }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Métrica Analisada</span>
                <h3 style={{ fontSize: '1.25rem', margin: '0.25rem 0 0.75rem 0', fontWeight: 600, color: '#f8fafc' }}>{indicador}</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <Building size={14} />
                      <span>{filterDetails.unit}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem' }}>
                      <Calendar size={14} />
                      <span>{filterDetails.period}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Valor Atual</span>
                    <strong style={{ fontSize: '1.8rem', color: color || '#f8fafc', fontWeight: 700 }}>{valorAtual}</strong>
                  </div>
                </div>
              </div>

              {/* Dynamic Body State */}
              {loading ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 0',
                  gap: '1rem'
                }}>
                  <Loader2 size={36} color="#a78bfa" className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                    Consultando diretrizes institucionais e gerando recomendações...
                  </p>
                </div>
              ) : error ? (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>
                  <button
                    onClick={fetchAIExplanation}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
                  {/* Concept Card */}
                  {conceito && (
                    <div style={{
                      backgroundColor: 'rgba(45, 212, 191, 0.03)',
                      border: '1px solid rgba(45, 212, 191, 0.15)',
                      borderLeft: '4px solid #2dd4bf',
                      borderRadius: '8px',
                      padding: '1.25rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', color: '#2dd4bf' }}>
                        <BookOpen size={16} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Conceito & Diretriz de Negócio
                        </span>
                      </div>
                      <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {renderFormattedText(conceito)}
                      </p>
                    </div>
                  )}

                  {/* Action Card */}
                  {acao && (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.03)',
                      border: '1px solid rgba(245, 158, 11, 0.15)',
                      borderLeft: '4px solid #f59e0b',
                      borderRadius: '8px',
                      padding: '1.25rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', color: '#f59e0b' }}>
                        <ClipboardList size={16} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Análise Clínica & Recomendação de Ação
                        </span>
                      </div>
                      <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                        {renderFormattedText(acao)}
                      </p>

                      {/* Interactive Checklist */}
                      <div style={{
                        marginTop: '1.25rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(245, 158, 11, 0.15)',
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                          Plano de Ação Imediato:
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {checklist.map(item => (
                            <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.825rem', color: '#cbd5e1' }}>
                              <input 
                                type="checkbox" 
                                checked={item.checked}
                                onChange={(e) => {
                                  setChecklist(prev => prev.map(t => t.id === item.id ? { ...t, checked: e.target.checked } : t));
                                }}
                                style={{ marginTop: '2px', cursor: 'pointer' }}
                              />
                              <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? '#64748b' : '#cbd5e1' }}>
                                {item.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Diretrizes de IA extraídas da Matriz de KPIs homologada pela Diretoria.
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AITrigger;
