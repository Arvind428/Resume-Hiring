import { NavLink } from 'react-router-dom';
import { Brain, Users, MessageSquare, Scale, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { session, profile, signOut } = useAuth();
  
  if (!session) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo">
          <Brain size={22} color="#6366F1" />
          <span>TalentOS</span>
        </NavLink>
        <div className="navbar-links">
          {profile?.role === 'admin' && (
            <>
              <NavLink to="/talent" className={({isActive}) => `nav-link module-1 ${isActive ? 'active' : ''}`}>
                <Users size={16}/> Talent Discovery
              </NavLink>
              <NavLink to="/simulator" className={({isActive}) => `nav-link module-3 ${isActive ? 'active' : ''}`}>
                <Scale size={16}/> Decision Simulator
              </NavLink>
            </>
          )}
          <NavLink to="/interview" className={({isActive}) => `nav-link module-2 ${isActive ? 'active' : ''}`}>
            <MessageSquare size={16}/> Interview Engine
          </NavLink>

          <div style={{width: 1, background: 'var(--color-border)', margin: '0 8px'}} />
          
          <button onClick={signOut} className="nav-link" style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)'}}>
            <LogOut size={16} /> <span style={{fontSize: 12, fontWeight: 700}}>{profile?.role?.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
