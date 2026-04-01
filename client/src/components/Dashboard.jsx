import { useState, useEffect } from 'react';
import { getTeams, getMentors, getScores, getCombinedLeaderboard } from '../api';
import { Users, GraduationCap, CheckCircle2, Trophy, ClipboardList } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    teams: 0,
    mentors: 0,
    round1Scored: 0,
    round2Scored: 0,
  });
  const [topTeams, setTopTeams] = useState([]);
  const [recentScores, setRecentScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [teams, mentors, scores, combined] = await Promise.all([
        getTeams(),
        getMentors(),
        getScores(),
        getCombinedLeaderboard(),
      ]);

      const round1 = scores.filter(s => s.round === 1).length;
      const round2 = scores.filter(s => s.round === 2).length;

      setStats({
        teams: teams.length,
        mentors: mentors.length,
        round1Scored: round1,
        round2Scored: round2,
      });

      setTopTeams(combined.slice(0, 5));
      setRecentScores(scores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--accent-violet)' }}>
            <Trophy size={48} />
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of Code Royale hackathon evaluation progress</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <Users size={16} style={{ color: 'var(--accent-violet)' }} />
            <span className="stat-label" style={{ margin: 0 }}>Total Teams</span>
          </div>
          <div className="stat-value violet">{stats.teams}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <GraduationCap size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span className="stat-label" style={{ margin: 0 }}>Total Mentors</span>
          </div>
          <div className="stat-value cyan">{stats.mentors}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
            <span className="stat-label" style={{ margin: 0 }}>Round 1 Evaluated</span>
          </div>
          <div className="stat-value emerald">{stats.round1Scored}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--accent-amber)' }} />
            <span className="stat-label" style={{ margin: 0 }}>Round 2 Evaluated</span>
          </div>
          <div className="stat-value amber">{stats.round2Scored}</div>
        </div>
      </div>

      {/* Top Teams & Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Top Teams */}
        <div className="card" style={{ cursor: 'default' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Trophy size={18} style={{ color: 'var(--accent-amber)' }} />
              <div>
                <div className="card-title">Top Teams</div>
                <div className="card-subtitle">Combined scores from both rounds</div>
              </div>
            </div>
          </div>
          {topTeams.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
              <ClipboardList size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <div className="empty-state-desc">No scores recorded yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {topTeams.map((entry, idx) => (
                <div key={entry.team._id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <span className={`rank-badge rank-${idx < 3 ? idx + 1 : 'other'}`}>{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{entry.team.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{entry.team.domain}</div>
                  </div>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '16px',
                    background: 'var(--gradient-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>{entry.totalScore}/200</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Scores */}
        <div className="card" style={{ cursor: 'default' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <ClipboardList size={18} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <div className="card-title">Recent Evaluations</div>
                <div className="card-subtitle">Latest scoring activity</div>
              </div>
            </div>
          </div>
          {recentScores.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
              <ClipboardList size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <div className="empty-state-desc">No evaluations yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {recentScores.map(score => (
                <div key={score._id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <span className={`card-badge ${score.round === 1 ? 'badge-violet' : 'badge-cyan'}`}>
                    R{score.round}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{score.team?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      by {score.mentor?.name || 'Unknown'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-emerald)' }}>
                    {score.totalScore}/100
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
