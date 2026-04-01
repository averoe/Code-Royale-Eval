import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, Trophy,
  Swords, LogOut, Settings
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, user, onLogout }) {
  const isAdmin = user?.role === 'admin';

  const adminItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/teams', label: 'Teams', icon: <Users size={18} /> },
    { path: '/mentors', label: 'Mentors', icon: <GraduationCap size={18} /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
    { path: '/settings', label: 'Rounds', icon: <Settings size={18} /> },
  ];

  const mentorItems = [
    { path: '/', label: 'Scoring', icon: <ClipboardCheck size={18} /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
  ];

  const navItems = isAdmin ? adminItems : mentorItems;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Swords size={20} />
          </div>
          <div className="sidebar-logo-text">
            <h1>Code Royale</h1>
            <span>Hackathon Evaluator</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            end={item.path === '/'}
          >
            <span className="nav-link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info & logout */}
      <div style={{ padding: '0 var(--space-sm)', marginTop: 'auto' }}>
        <div style={{
          padding: 'var(--space-md)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(139, 92, 246, 0.06)',
          border: '1px solid rgba(139, 92, 246, 0.12)',
          marginBottom: 'var(--space-sm)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            marginBottom: 'var(--space-sm)'
          }}>
            <div className="mentor-avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
              {(user?.username || user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.username || user?.name || 'User'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user?.role || 'unknown'}
              </div>
            </div>
          </div>
        </div>

        <button
          className="nav-link"
          onClick={onLogout}
          style={{ width: '100%', color: 'var(--accent-rose)', marginBottom: 'var(--space-md)' }}
        >
          <span className="nav-link-icon"><LogOut size={18} /></span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
