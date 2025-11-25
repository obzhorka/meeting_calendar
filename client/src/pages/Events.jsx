import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, Plus, Users, Clock } from 'lucide-react';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    group_id: '',
    location: '',
    duration_minutes: 60
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, groupsRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/groups')
      ]);
      
      setEvents(eventsRes.data.events);
      setGroups(groupsRes.data.groups);
    } catch (error) {
      toast.error('Błąd ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/events', {
        ...formData,
        group_id: formData.group_id ? parseInt(formData.group_id) : null
      });
      
      toast.success('Wydarzenie zostało utworzone');
      await loadData(); // Dodaj await aby upewnić się że dane są załadowane
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Błąd tworzenia wydarzenia');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      title: '',
      description: '',
      group_id: '',
      location: '',
      duration_minutes: 60
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Wydarzenia</h1>
            <p className="text-secondary">Zarządzaj swoimi wydarzeniami i spotkaniami</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={20} />
            Nowe wydarzenie
          </button>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>Brak wydarzeń</h3>
            <p>Utwórz nowe wydarzenie aby zacząć planować spotkanie</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary mt-2">
              <Plus size={20} />
              Utwórz wydarzenie
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {events.map(event => (
              <Link key={event.id} to={`/events/${event.id}`} className="event-card-full">
                <div className="event-card-header">
                  <h3>{event.title}</h3>
                  <span className={`badge badge-${getStatusBadgeClass(event.status)}`}>
                    {getStatusLabel(event.status)}
                  </span>
                </div>
                
                {event.description && (
                  <p className="event-card-description">{event.description}</p>
                )}
                
                <div className="event-card-meta">
                  <div className="meta-item">
                    <Users size={16} />
                    <span>{event.participant_count} uczestników</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>{event.duration_minutes} min</span>
                  </div>
                </div>

                {event.location && (
                  <div className="event-card-location">
                    📍 {event.location}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Utwórz wydarzenie</h2>
                <button onClick={closeModal} className="modal-close">&times;</button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="label">Tytuł wydarzenia</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Np. Spotkanie zespołu"
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
                    placeholder="Krótki opis wydarzenia"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Grupa (opcjonalnie)</label>
                  <select
                    className="input"
                    value={formData.group_id}
                    onChange={e => setFormData({...formData, group_id: e.target.value})}
                  >
                    <option value="">Bez grupy</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Lokalizacja (opcjonalnie)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="Np. Kawiarnia XYZ"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Przewidywany czas trwania (minuty)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.duration_minutes}
                    onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                    min="15"
                    step="15"
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeModal} className="btn btn-outline">
                    Anuluj
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Utwórz wydarzenie
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

const getStatusLabel = (status) => {
  const labels = {
    planning: 'Planowanie',
    scheduled: 'Zaplanowane',
    cancelled: 'Anulowane',
    completed: 'Zakończone'
  };
  return labels[status] || status;
};

const getStatusBadgeClass = (status) => {
  const classes = {
    planning: 'warning',
    scheduled: 'success',
    cancelled: 'error',
    completed: 'primary'
  };
  return classes[status] || 'primary';
};

export default Events;

