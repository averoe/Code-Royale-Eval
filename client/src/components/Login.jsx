import { useState, useEffect } from 'react';
import { adminLogin, mentorLogin, getMentorsList } from '../api';
import {
  Users, LogIn, Swords, ChevronRight, Settings
} from 'lucide-react';

export default function Login({ onLogin, showToast }) {
  const [mode, setMode] = useState(null); // null = choose, 'mentor', 'admin'
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [showAdminButton, setShowAdminButton] = useState(false);

  useEffect(() => {
    if (mode === 'mentor') {
      loadMentors();
    }
  }, [mode]);

  async function loadMentors() {
    try {
      const data = await getMentorsList();
      setMentors(data);
    } catch (err) {
      // mentors might not exist yet
      setMentors([]);
    }
  }

  function handleAdminAccess() {
    // Call API for admin access
    setLoading(true);
    adminLogin()
      .then(result => {
        localStorage.setItem('cr_token', result.token);
        localStorage.setItem('cr_user', JSON.stringify(result.user));
        onLogin(result.user);
      })
      .catch(err => {
        showToast(err.message || 'Failed to access admin panel', 'error');
        setLoading(false);
      });
  }

  function handleSettingsClick() {
    setAdminClicks(prev => prev + 1);
    setTimeout(() => setAdminClicks(0), 2000); // Reset after 2 seconds
    
    if (adminClicks >= 2) { // 3 total clicks
      setShowAdminButton(true);
      setAdminClicks(0);
    }
  }

  async function handleMentorLogin() {
    if (!selectedMentor) {
      showToast('Please select your name', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await mentorLogin(selectedMentor);
      localStorage.setItem('cr_token', result.token);
      localStorage.setItem('cr_user', JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Role selection screen
  if (!mode) {
    return (
      <div className="login-page">
        <div className="login-bg-gradient" />
        {/* Hidden settings button - top right */}
        <button
          className="admin-secret-btn"
          onClick={handleSettingsClick}
          title={showAdminButton ? 'Admin access unlocked' : 'Click multiple times...'}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: showAdminButton ? 'rgba(168, 85, 247, 0.8)' : 'rgba(255, 255, 255, 0.1)',
            color: showAdminButton ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
        >
          <Settings size={20} />
        </button>

        <div className="login-container animate-in">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Swords size={32} />
            </div>
            <h1 className="login-title">Code Royale</h1>
            <p className="login-subtitle">Hackathon Evaluation System</p>
          </div>

          <div className="login-role-cards">
            {showAdminButton && (
              <div 
                className="login-role-card admin-secret-card"
                onClick={handleAdminAccess}
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  cursor: 'pointer'
                }}
              >
                <div className="login-role-icon" style={{ color: '#ffffff' }}>
                  <Settings size={28} />
                </div>
                <div className="login-role-info">
                  <h3 style={{ color: '#ffffff' }}>Admin</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)' }}>System administration</p>
                </div>
                <ChevronRight size={20} className="login-role-arrow" style={{ color: '#ffffff' }} />
              </div>
            )}

            <div className="login-role-card" onClick={() => setMode('mentor')}>
              <div className="login-role-icon mentor-icon">
                <Users size={28} />
              </div>
              <div className="login-role-info">
                <h3>Mentor</h3>
                <p>Evaluate and score assigned teams</p>
              </div>
              <ChevronRight size={20} className="login-role-arrow" />
            </div>
          </div>

          <p className="login-footer-text">Select your role to continue</p>
        </div>
      </div>
    );
  }

  // Mentor login (open)
  return (
    <div className="login-page">
      <div className="login-bg-gradient" />
      <div className="login-container animate-in">
        <div className="login-logo">
          <div className="login-logo-icon mentor-glow">
            <Users size={28} />
          </div>
          <h1 className="login-title">Mentor Login</h1>
          <p className="login-subtitle">Select your name to start evaluating</p>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label className="form-label">Select Your Name</label>
            <select
              className="form-select"
              value={selectedMentor}
              onChange={e => setSelectedMentor(e.target.value)}
            >
              <option value="">-- Choose your name --</option>
              {mentors.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          {mentors.length === 0 && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--accent-amber-glow)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: 'var(--accent-amber)',
              textAlign: 'center',
              marginBottom: 'var(--space-md)'
            }}>
              No mentors registered yet. Ask admin to add mentors first.
            </div>
          )}

          <button
            className="btn btn-primary login-btn"
            onClick={handleMentorLogin}
            disabled={loading || !selectedMentor}
          >
            <LogIn size={16} />
            {loading ? 'Signing in...' : 'Continue as Mentor'}
          </button>
        </div>

        <button className="login-back-btn" onClick={() => setMode(null)}>
          ← Back to role selection
        </button>
      </div>
    </div>
  );
}


