import { useState, useEffect } from 'react';
import { getTeams, getMentors, submitScore, getScores, getRounds } from '../api';
import { Send, ClipboardCheck, Info } from 'lucide-react';

const CRITERIA = [
  {
    key: 'innovationOriginality',
    name: 'Innovation & Originality',
    max: 20,
    descriptors: {
      excellent: 'Highly innovative, unique idea with strong creativity and differentiation',
      good: 'Moderately innovative with some originality and improvement over existing ideas',
      average: 'Basic idea with limited innovation or uniqueness',
      poor: 'Common, repetitive, or copied idea with no originality'
    }
  },
  {
    key: 'problemDefinition',
    name: 'Problem Definition & Domain Relevance',
    max: 15,
    descriptors: {
      excellent: 'Clearly defined problem with strong real-world relevance and impact',
      good: 'Problem is clear but lacks depth or strong justification',
      average: 'Basic understanding of the problem with limited relevance',
      poor: 'Unclear, poorly defined, or irrelevant problem'
    }
  },
  {
    key: 'technicalImplementation',
    name: 'Technical Implementation',
    max: 20,
    descriptors: {
      excellent: 'Strong technical execution, clean architecture, efficient and scalable solution',
      good: 'Good implementation with minor technical gaps',
      average: 'Basic implementation with limited complexity',
      poor: 'Weak, buggy, or incomplete technical implementation'
    }
  },
  {
    key: 'prototypeWorkingModel',
    name: 'Prototype / Working Model',
    max: 20,
    descriptors: {
      excellent: 'Fully functional, stable prototype with all key features demonstrated',
      good: 'Mostly functional prototype with minor issues',
      average: 'Partially working prototype with missing features',
      poor: 'Incomplete or non-functional prototype'
    }
  },
  {
    key: 'feasibilityScalability',
    name: 'Feasibility & Scalability',
    max: 10,
    descriptors: {
      excellent: 'Highly feasible with strong scalability and real-world deployment potential',
      good: 'Feasible with moderate scalability',
      average: 'Limited feasibility or scalability',
      poor: 'Not practical or not scalable'
    }
  },
  {
    key: 'businessPotentialImpact',
    name: 'Business Potential & Impact',
    max: 10,
    descriptors: {
      excellent: 'Strong market potential, clear value proposition, and significant impact',
      good: 'Moderate business potential with some clarity',
      average: 'Limited impact or unclear value proposition',
      poor: 'No clear business relevance or impact'
    }
  },
  {
    key: 'teamCollaboration',
    name: 'Team Collaboration & Execution',
    max: 5,
    descriptors: {
      excellent: 'Excellent teamwork, clear roles, and strong coordination',
      good: 'Good collaboration with minor gaps',
      average: 'Basic teamwork with limited coordination',
      poor: 'Poor coordination or unequal contribution'
    }
  }
];

function getScoreLevel(value, max) {
  const pct = value / max;
  if (pct >= 0.9) return 'excellent';
  if (pct >= 0.7) return 'good';
  if (pct >= 0.5) return 'average';
  return 'poor';
}

function getLevelColor(level) {
  switch(level) {
    case 'excellent': return 'var(--accent-emerald)';
    case 'good': return 'var(--accent-cyan)';
    case 'average': return 'var(--accent-amber)';
    case 'poor': return 'var(--accent-rose)';
    default: return 'var(--text-muted)';
  }
}

export default function Scoring({ showToast, user }) {
  const [teams, setTeams] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [existingScores, setExistingScores] = useState([]);
  const [round, setRound] = useState(null); // Will be set after rounds load
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shortlistedTeams, setShortlistedTeams] = useState([]);

  const isMentor = user?.role === 'mentor';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Set default round after rounds are loaded
    if (rounds.length > 0 && round === null) {
      setRound(rounds[0].roundNumber);
    }
  }, [rounds, round]);

  useEffect(() => {
    // Auto-set mentor if logged in as mentor
    if (isMentor && user?.id) {
      setSelectedMentor(user.id);
    }
  }, [isMentor, user]);

  useEffect(() => {
    if (selectedTeam && selectedMentor) {
      const existing = existingScores.find(
        s => s.team?._id === selectedTeam && s.mentor?._id === selectedMentor && s.round === round
      );
      if (existing) {
        setScores(existing.criteria);
        setComments(existing.comments || '');
      } else {
        resetScores();
      }
    } else {
      resetScores();
    }
  }, [selectedTeam, selectedMentor, round, existingScores]);

  function resetScores() {
    const initial = {};
    CRITERIA.forEach(c => { initial[c.key] = 0; });
    setScores(initial);
    setComments('');
  }

  async function loadData() {
    try {
      const [teamsData, mentorsData, scoresData, roundsData] = await Promise.all([
        getTeams(),
        getMentors(),
        getScores(),
        getRounds()
      ]);
      
      // If mentor: filter to only shortlisted teams for Final Round (round 3)
      let displayTeams = teamsData;
      if (isMentor && round === 3) {
        displayTeams = teamsData.filter(t => t.IsShortlisted === 'Yes');
        setShortlistedTeams(displayTeams.map(t => t.Name));
      }
      
      setTeams(teamsData);
      setMentors(mentorsData);
      setExistingScores(scoresData);
      setRounds(roundsData);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleScoreChange(key, value) {
    setScores(prev => ({ ...prev, [key]: Number(value) }));
  }

  const totalScore = Object.values(scores).reduce((sum, val) => sum + (val || 0), 0);

  async function handleSubmit() {
    if (!selectedTeam || !selectedMentor) {
      showToast('Please select a team', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await submitScore({
        team: selectedTeam,
        mentor: selectedMentor,
        round,
        criteria: scores,
        comments
      });
      showToast(`Round ${round} score submitted successfully! (${totalScore}/100)`, 'success');
      const scoresData = await getScores();
      setExistingScores(scoresData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading scoring panel...</div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Scoring</h2>
        <p>Evaluate teams based on the Code Royale criteria</p>
      </div>

      {/* Round Tabs - Dynamic based on configured rounds */}
      <div className="round-tabs">
        {rounds.length > 0 ? (
          rounds.map(r => (
            <button
              key={r.roundNumber}
              className={`round-tab ${round === r.roundNumber ? 'active' : ''}`}
              onClick={() => setRound(r.roundNumber)}
            >
              {r.roundName} (#{r.roundNumber})
            </button>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No rounds configured. Ask admin to set up rounds.</p>
        )}
      </div>

      {/* Select Team & Mentor */}
      <div style={{ display: 'grid', gridTemplateColumns: isMentor ? '1fr' : '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Team</label>
          <select
            className="form-select"
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
          >
            <option value="">-- Choose a team --</option>
            {teams.map(t => (
              <option key={t._id} value={t._id}>{t.name} — {t.domain}</option>
            ))}
          </select>
        </div>
        {!isMentor && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Evaluating Mentor</label>
            <select
              className="form-select"
              value={selectedMentor}
              onChange={e => setSelectedMentor(e.target.value)}
            >
              <option value="">-- Choose a mentor --</option>
              {mentors.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}
        {isMentor && (
          <input type="hidden" value={selectedMentor} />
        )}
      </div>

      {/* Scoring Form */}
      {selectedTeam && selectedMentor ? (
        <>
          <div className="scoring-criteria">
            {CRITERIA.map(criterion => {
              const value = scores[criterion.key] || 0;
              const level = getScoreLevel(value, criterion.max);
              return (
                <div key={criterion.key} className="criteria-item">
                  <div className="criteria-header">
                    <span className="criteria-name">{criterion.name}</span>
                    <span className="criteria-max">Max: {criterion.max}</span>
                  </div>
                  <div className="criteria-input-row">
                    <input
                      type="range"
                      className="criteria-slider"
                      min="0"
                      max={criterion.max}
                      value={value}
                      onChange={e => handleScoreChange(criterion.key, e.target.value)}
                    />
                    <div className="criteria-score-display">{value}</div>
                  </div>
                  <div className="criteria-desc" style={{ color: getLevelColor(level), display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <Info size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>
                      <strong style={{ textTransform: 'capitalize' }}>{level}:</strong>{' '}
                      {criterion.descriptors[level]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="score-total-bar">
            <span className="score-total-label">Total Score (Round {round})</span>
            <span className="score-total-value">{totalScore} / 100</span>
          </div>

          {/* Comments */}
          <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
            <label className="form-label">Additional Comments</label>
            <textarea
              className="form-textarea"
              placeholder="Any additional feedback for this team..."
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ minWidth: '180px' }}
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : `Submit Round ${round} Score`}
            </button>
          </div>
        </>
      ) : (
        <div className="card" style={{ cursor: 'default' }}>
          <div className="empty-state">
            <ClipboardCheck size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <div className="empty-state-title">Select a team{!isMentor ? ' and mentor' : ''}</div>
            <div className="empty-state-desc">
              Choose a team{!isMentor ? ' and an evaluating mentor' : ''} above to start scoring for Round {round}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
