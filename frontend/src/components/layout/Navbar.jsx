import { NavLink } from 'react-router-dom';
import { Brain, Users, MessageSquare, Scale } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo">
          <Brain size={22} color="#6366F1" />
          <span>TalentOS</span>
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/talent" className={({isActive}) => `nav-link module-1 ${isActive ? 'active' : ''}`}>
            <Users size={16}/> Talent Discovery
          </NavLink>
          <NavLink to="/interview" className={({isActive}) => `nav-link module-2 ${isActive ? 'active' : ''}`}>
            <MessageSquare size={16}/> Interview Engine
          </NavLink>
          <NavLink to="/simulator" className={({isActive}) => `nav-link module-3 ${isActive ? 'active' : ''}`}>
            <Scale size={16}/> Decision Simulator
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
