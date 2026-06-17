import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PacientesDashboard from './pages/PacientesDashboard';
import MedicamentosDashboard from './pages/MedicamentosDashboard';
import ProcedimentosDashboard from './pages/ProcedimentosDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import MedicosDashboard from './pages/MedicosDashboard';
import FinanceiroDashboard from './pages/FinanceiroDashboard';
import Integracoes from './pages/Integracoes';
import AuditoriaFaturamentoDashboard from './pages/AuditoriaFaturamentoDashboard';
import RegulacaoFilaDashboard from './pages/RegulacaoFilaDashboard';
import MatrizRiscoDashboard from './pages/MatrizRiscoDashboard';
import AdminDatabaseDashboard from './pages/AdminDatabaseDashboard';
import CopilotExecutivo from './pages/CopilotExecutivo';
import SobreSistema from './pages/SobreSistema';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pacientes" element={<PacientesDashboard />} />
        <Route path="/medicamentos" element={<MedicamentosDashboard />} />
        <Route path="/procedimentos" element={<ProcedimentosDashboard />} />
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/medicos" element={<MedicosDashboard />} />
        <Route path="/financeiro" element={<FinanceiroDashboard />} />
        <Route path="/integracoes" element={<Integracoes />} />
        <Route path="/auditoria-faturamento" element={<AuditoriaFaturamentoDashboard />} />
        <Route path="/regulacao-filas" element={<RegulacaoFilaDashboard />} />
        <Route path="/matriz-risco" element={<MatrizRiscoDashboard />} />
        <Route path="/admin-db" element={<AdminDatabaseDashboard />} />
        <Route path="/copilot" element={<CopilotExecutivo />} />
        <Route path="/sobre" element={<SobreSistema />} />
      </Routes>
    </Router>
  );
}

export default App;
