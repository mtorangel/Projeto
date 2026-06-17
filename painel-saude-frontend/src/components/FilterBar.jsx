import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, X, Calendar, Building2, CreditCard } from 'lucide-react';

const FilterBar = ({ filters, setFilters, onClear, filteredCount }) => {
  const years = ['2025', '2026'];
  const months = [
    { v: '1', n: 'Janeiro' }, { v: '2', n: 'Fevereiro' }, { v: '3', n: 'Março' }, 
    { v: '4', n: 'Abril' }, { v: '5', n: 'Maio' }, { v: '6', n: 'Junho' },
    { v: '7', n: 'Julho' }, { v: '8', n: 'Agosto' }, { v: '9', n: 'Setembro' },
    { v: '10', n: 'Outubro' }, { v: '11', n: 'Novembro' }, { v: '12', n: 'Dezembro' }
  ];

  const [unidades, setUnidades] = useState([]);
  const [convenios, setConvenios] = useState([]);

  useEffect(() => {
    // Buscar unidades e convênios dinamicamente da API
    axios.get(`http://${window.location.hostname}:8000/api/unidades/`)
      .then(res => {
        setUnidades(res.data);
      })
      .catch(err => console.error("Erro ao carregar unidades:", err));

    axios.get(`http://${window.location.hostname}:8000/api/convenios/`)
      .then(res => {
        setConvenios(res.data);
      })
      .catch(err => console.error("Erro ao carregar convênios:", err));
  }, []);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Persistir para manter entre abas
    localStorage.setItem('active_filters', JSON.stringify(newFilters));
  };

  return (
    <div className="glass-card" style={{ 
      padding: '1rem 2rem', 
      marginBottom: '2rem', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '2rem',
      flexWrap: 'wrap',
      position: 'sticky',
      top: '20px',
      zIndex: 100,
      border: '1px solid #2dd4bf33'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2dd4bf' }}>
        <Filter size={20} />
        <strong style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>Filtros</strong>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
        {/* Filtro Ano */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={16} color="#94a3b8" />
          <select 
            value={filters.ano || ''} 
            onChange={(e) => handleChange('ano', e.target.value)}
            style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '5px 10px', fontSize: '0.85rem' }}
          >
            <option value="">Todos os Anos</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Filtro Mês */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select 
            value={filters.mes || ''} 
            onChange={(e) => handleChange('mes', e.target.value)}
            style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '5px 10px', fontSize: '0.85rem' }}
          >
            <option value="">Todos os Meses</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
          </select>
        </div>

        {/* Filtro Unidade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={16} color="#94a3b8" />
          <select 
            value={filters.unidade || ''} 
            onChange={(e) => handleChange('unidade', e.target.value)}
            style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '5px 10px', fontSize: '0.85rem' }}
          >
            <option value="">Todas as Unidades</option>
            {unidades.map(u => (
              <option key={u.id_unidade} value={u.id_unidade}>{u.nome_unidade}</option>
            ))}
          </select>
        </div>

        {/* Filtro Convênio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CreditCard size={16} color="#94a3b8" />
          <select 
            value={filters.convenio || ''} 
            onChange={(e) => handleChange('convenio', e.target.value)}
            style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '5px 10px', fontSize: '0.85rem' }}
          >
            <option value="">Todos os Convênios</option>
            {convenios.map(c => (
              <option key={c.id_convenio} value={c.id_convenio}>{c.nome_operadora}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredCount !== undefined && (
        <div style={{
          background: 'rgba(45, 212, 191, 0.1)',
          border: '1px solid rgba(45, 212, 191, 0.2)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          color: '#2dd4bf',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(45, 212, 191, 0.05)',
          whiteSpace: 'nowrap'
        }}>
          <span 
            className="pulse-dot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#2dd4bf',
              display: 'inline-block'
            }}
          ></span>
          Fatos Afetados: <strong>{filteredCount.toLocaleString('pt-BR')}</strong>
        </div>
      )}

      <button 
        onClick={onClear}
        style={{ 
          background: 'none', 
          border: '1px solid #334155', 
          color: '#94a3b8', 
          padding: '5px 12px', 
          borderRadius: '6px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem'
        }}
      >
        <X size={14} /> Limpar
      </button>
    </div>
  );
};

export default FilterBar;
