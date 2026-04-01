import { useState, useEffect } from 'react';
import { getLeaderboard, getCombinedLeaderboard, shortlistTeam, getTeams } from '../api';
import { Trophy, CheckCircle2, Circle } from 'lucide-react';

export default function Leaderboard({ showToast, user }) {
  const [view, setView] = useState('combined');
  const [data, setData] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shortlistingMode, setShortlistingMode] = useState(false);
  const [shortlistedTeams, setShortlistedTeams] = useState(new Set());

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadLeaderboard();
  }, [view]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      let result;
      if (view === 'combined') {
        result = await getCombinedLeaderboard();
      } else if (view === 'round2') {
        result = await getLeaderboard('2');
      } else if (view === 'final') {
        result = await getLeaderboard('final');
      } else if (view === 'shortlist-manager') {
        // Load all teams for shortlist manager
        result = await getTeams();
        if (result.data) {
          setData(result.data);
          const shortlisted = new Set(
            result.data
              .filter(t => t.IsShortlisted === 'Yes')
              .map(t => t.Name)
          );
          setShortlistedTeams(shortlisted);
        }
        setLoading(false);
        return;
      }
      
      const leaderboardData = result.data || result;
      setData(Array.isArray(leaderboardData) ? leaderboardData : []);
      
      // Initialize shortlisted teams
      if (Array.isArray(leaderboardData)) {
        const shortlisted = new Set(
          leaderboardData
            .filter(t => t.isShortlisted)
            .map(t => t.teamName || t.name)
        );
        setShortlistedTeams(shortlisted);
      }
    } catch (err) {
      showToast('Failed to load data', 'error');
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleShortlist(teamName) {
    try {
      const isCurrentlyShortlisted = shortlistedTeams.has(teamName);
      await shortlistTeam(teamName, !isCurrentlyShortlisted);
      
      setShortlistedTeams(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyShortlisted) {
          newSet.delete(teamName);
        } else {
          newSet.add(teamName);
        }
        return newSet;
      });
      
      showToast(
        `Team ${isCurrentlyShortlisted ? 'removed from' : 'added to'} Final Round`,
        'success'
      );
    } catch (err) {
      showToast('Failed to update shortlist', 'error');
    }
  }

  const maxScore = view === 'combined' ? 200 : 100;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Leaderboard</h2>
        <p>Rankings and scores across evaluation rounds</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
        <div className="round-tabs">
          <button
            className={`round-tab ${view === 'combined' ? 'active' : ''}`}
            onClick={() => setView('combined')}
          >
            Combined
          </button>
          <button
            className={`round-tab ${view === 'round2' ? 'active' : ''}`}
            onClick={() => setView('round2')}
          >
            Round 2
          </button>
          {isAdmin && (
            <>
              <button
                className={`round-tab ${view === 'final' ? 'active' : ''}`}
                onClick={() => setView('final')}
              >
                Final Round
              </button>
              <button
                className={`round-tab ${view === 'shortlist-manager' ? 'active' : ''}`}
                onClick={() => setView('shortlist-manager')}
              >
                📋 Shortlist Manager
              </button>
            </>
          )}
        </div>
        
        {isAdmin && view === 'round2' && (
          <button
            className="btn btn-primary"
            onClick={() => setShortlistingMode(!shortlistingMode)}
            style={{ fontSize: '13px' }}
          >
            {shortlistingMode ? '✓ Done Shortlisting' : '📋 Shortlist Teams'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="card" style={{ cursor: 'default' }}>
          <div className="empty-state">
            <Trophy size={48} style={{ color: 'var(--accent-amber)', marginBottom: '12px' }} />
            <div className="empty-state-title">{view === 'shortlist-manager' ? 'No teams yet' : 'No scores yet'}</div>
            <div className="empty-state-desc">
              {view === 'shortlist-manager' ? 'Add teams first in the Teams section' : 'Scores will appear here once mentors start evaluating teams'}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="leaderboard-table">
            <thead>
              <tr>
                {view !== 'shortlist-manager' && <th style={{ width: '60px' }}>Rank</th>}
                <th>Team</th>
                <th>Domain</th>
                {view === 'combined' && <th>Round 2</th>}
                {view === 'combined' && <th>Final</th>}
                {view !== 'shortlist-manager' && <th>Score</th>}
                {view === 'shortlist-manager' && <th>Mentor</th>}
                {(view === 'shortlist-manager' || view === 'round2') && shortlistingMode !== (view === 'shortlist-manager') && <th style={{ width: '100px' }}>Shortlist</th>}
                {view === 'shortlist-manager' && <th style={{ width: '100px' }}>Shortlist</th>}
                {view !== 'shortlist-manager' && <th style={{ minWidth: '120px' }}>Progress</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((entry, idx) => {
                const teamName = view === 'shortlist-manager' ? entry.Name : (entry.teamName || entry.name || 'Unknown');
                const domain = view === 'shortlist-manager' ? entry.Domain : (entry.domain || '');
                const mentor = view === 'shortlist-manager' ? entry.Mentor : null;
                const score = view === 'shortlist-manager' ? null : (entry.totalScore || 0);
                const isShortlisted = shortlistedTeams.has(teamName);

                return (
                  <tr key={teamName}>
                    {view !== 'shortlist-manager' && (
                      <td>
                        <span className={`rank-badge rank-${idx < 3 ? idx + 1 : 'other'}`}>
                          {idx + 1}
                        </span>
                      </td>
                    )}
                    <td style={{ fontWeight: 600 }}>{teamName}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{domain}</td>
                    {view === 'combined' && (
                      <>
                        <td>
                          <span className={`card-badge ${entry.hasRound2 ? 'badge-emerald' : 'badge-rose'}`}>
                            {entry.hasRound2 ? entry.round2Score : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`card-badge ${entry.hasFinalRound ? 'badge-emerald' : 'badge-rose'}`}>
                            {entry.hasFinalRound ? entry.finalRoundScore : 'N/A'}
                          </span>
                        </td>
                      </>
                    )}
                    {view !== 'shortlist-manager' && (
                      <td>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '16px',
                          background: 'var(--gradient-primary)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                          {score}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> / {maxScore}</span>
                      </td>
                    )}
                    {view === 'shortlist-manager' && (
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{mentor || '-'}</td>
                    )}
                    {view === 'shortlist-manager' && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => toggleShortlist(teamName)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '20px'
                          }}
                          title={isShortlisted ? 'Remove from Final Round' : 'Add to Final Round'}
                        >
                          {isShortlisted ? (
                            <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
                          ) : (
                            <Circle size={20} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </button>
                      </td>
                    )}
                    {view === 'round2' && shortlistingMode && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => toggleShortlist(teamName)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '20px'
                          }}
                          title={isShortlisted ? 'Remove from Final Round' : 'Add to Final Round'}
                        >
                          {isShortlisted ? (
                            <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
                          ) : (
                            <Circle size={20} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </button>
                      </td>
                    )}
                    {view !== 'shortlist-manager' && (
                      <td>
                        <div className="score-bar-bg">
                          <div
                            className="score-bar-fill"
                            style={{ width: `${score > 0 ? (score / maxScore) * 100 : 0}%` }}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
