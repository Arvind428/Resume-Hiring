import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import TalentDiscovery from './pages/TalentDiscovery';
import CandidateDetail from './pages/CandidateDetail';
import Interview from './pages/Interview';
import InterviewSession from './pages/InterviewSession';
import InterviewSummary from './pages/InterviewSummary';
import DecisionSimulator from './pages/DecisionSimulator';
import SimulationDetail from './pages/SimulationDetail';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/talent" element={<TalentDiscovery />} />
          <Route path="/talent/:id" element={<CandidateDetail />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/interview/:id" element={<InterviewSession />} />
          <Route path="/interview/:id/summary" element={<InterviewSummary />} />
          <Route path="/simulator" element={<DecisionSimulator />} />
          <Route path="/simulator/:id" element={<SimulationDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
