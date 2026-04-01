import { useState, useEffect } from 'react';
import { getMentors, createMentor, deleteMentor } from '../api';
import { Plus, Trash2, X, GraduationCap, ClipboardList } from 'lucide-react';

export default function Mentors({ showToast }) {
  const [mentors, setMentors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => {
    loadMentors();
  }, []);

  async function loadMentors() {
    try {
      const data = await getMentors();
      setMentors(data);
    } catch (err) {
      showToast('Failed to load mentors', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    try {
      await createMentor({ name });
      showToast('Mentor added successfully!', 'success');
      setShowModal(false);
      setName('');
      loadMentors();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this mentor?')) return;
    try {
      await deleteMentor(id);
      showToast('Mentor deleted', 'success');
      loadMentors();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading mentors...</div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header page-header-actions">
        <div>
          <h2>Mentors</h2>
          <p>Manage hackathon evaluators and mentors</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Mentor
        </button>
      </div>

      {mentors.length === 0 ? (
        <div className="card" style={{ cursor: 'default' }}>
          <div className="empty-state">
            <GraduationCap size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <div className="empty-state-title">No mentors yet</div>
            <div className="empty-state-desc">Add mentors who will evaluate the teams</div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Mentor
            </button>
          </div>
        </div>
      ) : (
        <div className="card-grid">
          {mentors.map((mentor, index) => {
            // Handle both GAS format (Name) and MongoDB format (name)
            const mentorName = mentor.name || mentor.Name || 'Unknown';
            const mentorKey = mentor._id || mentorName || index;
            
            return (
            <div key={mentorKey} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div className="mentor-avatar" style={{ width: '48px', height: '48px', fontSize: '20px' }}>
                    {mentorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="card-title">{mentorName}</div>
                </div>
              </div>

              <div className="mentor-teams-count" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardList size={13} />
                Assigned to {mentor.assignedTeams?.length || 0} team{mentor.assignedTeams?.length !== 1 ? 's' : ''}
              </div>

              {mentor.assignedTeams && mentor.assignedTeams.length > 0 && (
                <div className="card-members" style={{ marginTop: 'var(--space-sm)' }}>
                  {mentor.assignedTeams.map((team, teamIndex) => {
                    const teamName = team.name || team.Name || 'Unknown';
                    const teamKey = team._id || teamName || teamIndex;
                    return (
                      <span key={teamKey} className="member-chip">
                        {teamName}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="card-footer">
                <div></div>
                <div className="card-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(mentorName)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Add Mentor Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Mentor</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Dr. Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Mentor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
