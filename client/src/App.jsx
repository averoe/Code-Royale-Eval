import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Teams from './components/Teams';
import Mentors from './components/Mentors';
import Scoring from './components/Scoring';
import Leaderboard from './components/Leaderboard';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  console.log('📱 App component mounted, user:', user, 'authLoading:', authLoading);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('cr_user');
    const savedToken = localStorage.getItem('cr_token');
    console.log('Checking localStorage... savedUser:', !!savedUser, 'savedToken:', !!savedToken);
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('cr_user');
        localStorage.removeItem('cr_token');
      }
    }
    setAuthLoading(false);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    localStorage.removeItem('cr_token');
    localStorage.removeItem('cr_user');
    setUser(null);
  }

  if (authLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', color: 'var(--text-muted)'
      }}>
        Loading...
      </div>
    );
  }

  // Not logged in → show Login
  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} showToast={showToast} />
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' ? '✓' : '✕'} {toast.message}
            </div>
          ))}
        </div>
      </>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <Router>
      <div className="app-layout">
        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onLogout={handleLogout}
        />

        <main className="main-content">
          <Routes>
            {isAdmin ? (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/teams" element={<Teams showToast={showToast} />} />
                <Route path="/mentors" element={<Mentors showToast={showToast} />} />
                <Route path="/leaderboard" element={<Leaderboard showToast={showToast} user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Scoring showToast={showToast} user={user} />} />
                <Route path="/leaderboard" element={<Leaderboard showToast={showToast} user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>

        {/* Toast notifications */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' ? '✓' : '✕'} {toast.message}
            </div>
          ))}
        </div>
      </div>
    </Router>
  );
}

export default App;
