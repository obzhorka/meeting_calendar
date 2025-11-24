import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Users, Plus, UserCircle } from 'lucide-react';
import './Groups.css';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      setGroups(response.data.groups);
    } catch (error) {
      toast.error('Błąd ładowania grup');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/groups', formData);
      toast.success('Grupa została utworzona');
      loadGroups();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Błąd tworzenia grupy');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: '', description: '' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="groups-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Moje Grupy</h1>
            <p className="text-secondary">Zarządzaj grupami i planuj wspólne spotkania</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={20} />
            Nowa grupa
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Brak grup</h3>
            <p>Utwórz swoją pierwszą grupę aby zacząć planować spotkania</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary mt-2">
              <Plus size={20} />
              Utwórz grupę
            </button>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map(group => (
              <Link key={group.id} to={`/groups/${group.id}`} className="group-card">
                <div className="group-icon">
                  <Users size={32} />
                </div>
                <div className="group-info">
                  <h3>{group.name}</h3>
                  {group.description && (
                    <p className="group-description">{group.description}</p>
                  )}
                  <div className="group-meta">
                    <span>
                      <UserCircle size={16} />
                      {group.member_count} członków
                    </span>
                    <span className={`badge badge-${group.role === 'admin' ? 'primary' : 'secondary'}`}>
                      {group.role === 'admin' ? 'Administrator' : 'Członek'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Utwórz nową grupę</h2>
                <button onClick={closeModal} className="modal-close">&times;</button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="label">Nazwa grupy</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Np. Znajomi ze studiów"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Opis (opcjonalny)</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Krótki opis grupy"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeModal} className="btn btn-outline">
                    Anuluj
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Utwórz grupę
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;

