import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import TalentDiscovery from './pages/TalentDiscovery';
import CandidateDetail from './pages/CandidateDetail';
import ChatWidget from './components/chat/ChatWidget';
import Interview from './pages/Interview';
import InterviewSession from './pages/InterviewSession';
import InterviewSummary from './pages/InterviewSummary';
import DecisionSimulator from './pages/DecisionSimulator';
import SimulationDetail from './pages/SimulationDetail';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

function ProtectedRoute({ children, reqRole }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'var(--color-text-muted)'}}>Authenticating session...</div>;
  if (!session) return <Login />;
  
  if (reqRole && profile?.role !== reqRole) {
    return (
      <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh'}}>
        <div className="card" style={{textAlign:'center'}}>
          <h2 style={{color:'var(--color-danger)', marginBottom: 8}}>Unauthorized</h2>
          <p style={{color:'var(--color-text-muted)', fontSize: 13}}>Access to this perimeter is restricted to '{reqRole}' roles.</p>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <ChatWidget />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/talent" element={<ProtectedRoute reqRole="admin"><TalentDiscovery /></ProtectedRoute>} />
            <Route path="/talent/:id" element={<ProtectedRoute><CandidateDetail /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
            <Route path="/interview/:id" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
            <Route path="/interview/:id/summary" element={<ProtectedRoute><InterviewSummary /></ProtectedRoute>} />
            <Route path="/simulator" element={<ProtectedRoute reqRole="admin"><DecisionSimulator /></ProtectedRoute>} />
            <Route path="/simulator/:id" element={<ProtectedRoute reqRole="admin"><SimulationDetail /></ProtectedRoute>} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
