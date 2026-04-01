import { useState, useEffect } from 'react';
import { getTeams, addRound, getRounds, updateRound } from '../api';
import { Settings as SettingsIcon, Plus, Trash2, Edit2 } from 'lucide-react';

export default function Settings() {
  const [rounds, setRounds] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRound, setEditingRound] = useState(null);

  // Form state
  const [roundName, setRoundName] = useState('');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [roundNumber, setRoundNumber] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const [teamsData, roundsData] = await Promise.all([
        getTeams(),
        getRounds(),
      ]);
      setAllTeams(teamsData);
      setRounds(roundsData);
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRound(e) {
    e.preventDefault();
    if (!roundName || !roundNumber) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await addRound({
        roundName,
        roundNumber: parseInt(roundNumber),
        teams: selectedTeams,
      });
      setRoundName('');
      setRoundNumber('');
      setSelectedTeams([]);
      loadSettings();
    } catch (err) {
      console.error('Error adding round:', err);
      alert('Failed to add round');
    }
  }

  function toggleTeamSelection(teamName) {
    setSelectedTeams(prev =>
      prev.includes(teamName)
        ? prev.filter(t => t !== teamName)
        : [...prev, teamName]
    );
  }

  function selectAllTeams() {
    if (selectedTeams.length === allTeams.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(allTeams.map(t => t.Name || t.name));
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <SettingsIcon size={28} />
        <h1>Round Configuration</h1>
      </div>

      {/* Add Round Form */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <h2>Create New Round</h2>
        <form onSubmit={handleAddRound}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div>
              <label className="form-label">Round Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Preliminary Round, Final Round"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Round Number</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 1, 2, 3"
                value={roundNumber}
                onChange={(e) => setRoundNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Team Selection */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <label className="form-label">Select Teams to Shortlist for this Round</label>
              <button
                type="button"
                onClick={selectAllTeams}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e8eaf6',
                  border: '1px solid #3f51b5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {selectedTeams.length === allTeams.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 'var(--space-md)',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: 'var(--space-md)',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#fafafa',
            }}>
              {allTeams.map((team) => {
                const teamName = team.Name || team.name;
                const isSelected = selectedTeams.includes(teamName);
                return (
                  <label key={teamName} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTeamSelection(teamName)}
                    />
                    <span>{teamName}</span>
                  </label>
                );
              })}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              Only selected teams can be evaluated in this round
            </p>
          </div>

          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3f51b5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Plus size={20} />
            Create Round
          </button>
        </form>
      </div>

      {/* Existing Rounds */}
      <div>
        <h2>Configured Rounds</h2>
        {rounds.length === 0 ? (
          <p style={{ color: '#666' }}>No rounds configured yet</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 'var(--space-lg)',
          }}>
            {rounds.map((round) => (
              <div key={round.roundNumber} style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: 'var(--space-lg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-md)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0' }}>{round.roundName}</h3>
                    <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>
                      Round #{round.roundNumber}
                    </p>
                  </div>
                  {round.teams && round.teams.length > 0 && (
                    <span style={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}>
                      {round.teams.length} teams
                    </span>
                  )}
                </div>

                <div style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  padding: 'var(--space-md)',
                  marginTop: 'var(--space-md)',
                }}>
                  <strong style={{ fontSize: '0.9rem', color: '#333' }}>Shortlisted Teams:</strong>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '0.5rem' }}>
                    {round.teams && round.teams.length > 0 ? (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}>
                        {round.teams.map(team => (
                          <div key={team} style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            color: '#333',
                            border: '1px solid #e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}>
                            <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓</span>
                            {team}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: '#999', margin: 0 }}>No teams shortlisted for this round</p>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#999', marginTop: 'var(--space-md)', marginBottom: 0 }}>
                  Only shortlisted teams can be scored in this round
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
