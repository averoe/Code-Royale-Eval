import { useState, useEffect } from 'react';
import { adminLogin, mentorLogin, getMentorsList } from '../api';
import {
  Shield, Users, LogIn, Eye, EyeOff, Swords, ChevronRight
} from 'lucide-react';

export default function Login({ onLogin, showToast }) {
  const [mode, setMode] = useState(null); // null = choose, 'admin', 'mentor'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [loading, setLoading] = useState(false);

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

  async function handleAdminLogin(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter username and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await adminLogin(username, password);
      localStorage.setItem('cr_token', result.token);
      localStorage.setItem('cr_user', JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
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
        <div className="login-container animate-in">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Swords size={32} />
            </div>
            <h1 className="login-title">Code Royale</h1>
            <p className="login-subtitle">Hackathon Evaluation System</p>
          </div>

          <div className="login-role-cards">
            <div className="login-role-card" onClick={() => setMode('admin')}>
              <div className="login-role-icon admin-icon">
                <Shield size={28} />
              </div>
              <div className="login-role-info">
                <h3>Admin</h3>
                <p>Manage teams, mentors & view results</p>
              </div>
              <ChevronRight size={20} className="login-role-arrow" />
            </div>

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

  // Admin login form
  if (mode === 'admin') {
    return (
      <div className="login-page">
        <div className="login-bg-gradient" />
        <div className="login-container animate-in">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Shield size={28} />
            </div>
            <h1 className="login-title">Admin Login</h1>
            <p className="login-subtitle">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleAdminLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                placeholder="Enter admin username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
              <LogIn size={16} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button className="login-back-btn" onClick={() => setMode(null)}>
            ← Back to role selection
          </button>
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
