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
      </Routes>
    </Router>
  );
}

export default App;
