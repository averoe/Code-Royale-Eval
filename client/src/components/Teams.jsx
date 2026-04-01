import { useState, useEffect } from 'react';
import { getTeams, createTeam, deleteTeam, getMentors, assignMentor } from '../api';
import {
  Plus, Trash2, UserPlus, X, AlertTriangle, Users, Building2, MapPin
} from 'lucide-react';

export default function Teams({ showToast }) {
  const [teams, setTeams] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    domain: '',
    labNumber: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [teamsData, mentorsData] = await Promise.all([getTeams(), getMentors()]);
      setTeams(teamsData);
      setMentors(mentorsData);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.domain.trim() || !form.labNumber.trim()) {
      showToast('All fields are required', 'error');
      return;
    }
    try {
      await createTeam(form);
      showToast('Team registered successfully!', 'success');
      setShowModal(false);
      setForm({ name: '', domain: '', labNumber: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await deleteTeam(id);
      showToast('Team deleted', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleAssignMentor(mentorId) {
    try {
      await assignMentor(selectedTeam._id, mentorId);
      showToast(`Mentor assigned to ${selectedTeam.name}!`, 'success');
      setShowAssignModal(false);
      setSelectedTeam(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header page-header-actions">
        <div>
          <h2>Teams</h2>
          <p>Manage hackathon participating teams</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Register Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="card" style={{ cursor: 'default' }}>
          <div className="empty-state">
            <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <div className="empty-state-title">No teams yet</div>
            <div className="empty-state-desc">Register your first team to get started</div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Register Team
            </button>
          </div>
        </div>
      ) : (
        <div className="card-grid">
          {teams.map(team => (
            <div key={team._id} className="card">
              <div className="card-header">
                <div className="card-title">{team.name}</div>
              </div>

              {/* Domain & Lab */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <span className="card-badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={11} /> {team.domain}
                </span>
                <span className="card-badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} /> Lab {team.labNumber}
                </span>
              </div>

              {team.mentor ? (
                <div className="mentor-info">
                  <div className="mentor-avatar">
                    {team.mentor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="mentor-details">
                    <span className="mentor-name">{team.mentor.name}</span>
                    <span className="mentor-email">Assigned Mentor</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  marginTop: 'var(--space-md)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--accent-amber-glow)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: 'var(--accent-amber)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertTriangle size={14} /> No mentor assigned
                </div>
              )}

              <div className="card-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSelectedTeam(team); setShowAssignModal(true); }}
                >
                  <UserPlus size={14} />
                  {team.mentor ? 'Change Mentor' : 'Assign Mentor'}
                </button>
                <div className="card-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(team._id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Team Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Team</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Team Alpha"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  autoFocus
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Domain</label>
                  <input
                    className="form-input"
                    placeholder="e.g. AI/ML, IoT, Web3, FinTech"
                    value={form.domain}
                    onChange={e => setForm({ ...form, domain: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lab Number</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Lab 101, Lab A2"
                    value={form.labNumber}
                    onChange={e => setForm({ ...form, labNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Mentor Modal */}
      {showAssignModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Mentor to {selectedTeam.name}</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}><X size={18} /></button>
            </div>
            {mentors.length === 0 ? (
              <div className="empty-state">
                <Users size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <div className="empty-state-title">No mentors available</div>
                <div className="empty-state-desc">Please add mentors first</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {mentors.map(mentor => (
                  <div key={mentor._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      padding: 'var(--space-md)',
                      background: selectedTeam.mentor?._id === mentor._id ? 'var(--accent-violet-glow)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedTeam.mentor?._id === mentor._id ? 'var(--border-active)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                    onClick={() => handleAssignMentor(mentor._id)}
                  >
                    <div className="mentor-avatar">{mentor.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{mentor.name}</div>
                    </div>
                    <span className="card-badge badge-cyan">{mentor.assignedTeams?.length || 0} teams</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
