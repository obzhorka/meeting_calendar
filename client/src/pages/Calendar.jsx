import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import './Calendar.css';

const Calendar = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    status: 'busy',
    title: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const response = await axios.get('/api/availability/user/');
      setAvailability(response.data.availability);
    } catch (error) {
      toast.error('Błąd ładowania dostępności');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await axios.put(`/api/availability/${editingId}`, formData);
        toast.success('Zaktualizowano dostępność');
      } else {
        await axios.post('/api/availability', formData);
        toast.success('Dodano dostępność');
      }
      
      loadAvailability();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Błąd zapisu');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten wpis?')) return;
    
    try {
      await axios.delete(`/api/availability/${id}`);
      toast.success('Usunięto wpis');
      loadAvailability();
    } catch (error) {
      toast.error('Błąd usuwania');
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setFormData({
        start_time: new Date(item.start_time).toISOString().slice(0, 16),
        end_time: new Date(item.end_time).toISOString().slice(0, 16),
        status: item.status,
        title: item.title || '',
        description: item.description || ''
      });
      setEditingId(item.id);
    } else {
      setFormData({
        start_time: '',
        end_time: '',
        status: 'busy',
        title: '',
        description: ''
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      start_time: '',
      end_time: '',
      status: 'busy',
      title: '',
      description: ''
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
    <div className="calendar-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Mój Kalendarz</h1>
            <p className="text-secondary">Zarządzaj swoją dostępnością i zajętymi terminami</p>
          </div>
          <button onClick={() => openModal()} className="btn btn-primary">
            <Plus size={20} />
            Dodaj dostępność
          </button>
        </div>

        <div className="calendar-content">
          {availability.length === 0 ? (
            <div className="empty-state">
              <Clock size={48} />
              <h3>Brak wpisów</h3>
              <p>Dodaj swoje zajęte terminy aby system mógł znajdować wspólne wolne czasy</p>
              <button onClick={() => openModal()} className="btn btn-primary mt-2">
                <Plus size={20} />
                Dodaj pierwszy wpis
              </button>
            </div>
          ) : (
            <div className="availability-list">
              {availability.map(item => (
                <div key={item.id} className={`availability-item ${item.status}`}>
                  <div className="availability-header">
                    <div>
                      <h3>{item.title || (item.status === 'busy' ? 'Zajęty' : 'Dostępny')}</h3>
                      <span className={`badge badge-${item.status === 'busy' ? 'error' : 'success'}`}>
                        {item.status === 'busy' ? 'Zajęty' : 'Dostępny'}
                      </span>
                    </div>
                    <div className="availability-actions">
                      <button 
                        onClick={() => openModal(item)} 
                        className="btn btn-sm btn-outline"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="btn btn-sm btn-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {item.description && (
                    <p className="availability-description">{item.description}</p>
                  )}
                  <div className="availability-time">
                    <Clock size={16} />
                    <span>
                      {new Date(item.start_time).toLocaleString('pl-PL')} 
                      {' → '}
                      {new Date(item.end_time).toLocaleString('pl-PL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edytuj dostępność' : 'Dodaj dostępność'}</h2>
                <button onClick={closeModal} className="modal-close">&times;</button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="busy">Zajęty</option>
                    <option value="available">Dostępny</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Tytuł (opcjonalny)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Np. Praca, Spotkanie"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Opis (opcjonalny)</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Dodatkowe informacje"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Data i czas rozpoczęcia</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Data i czas zakończenia</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formData.end_time}
                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeModal} className="btn btn-outline">
                    Anuluj
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Zapisz zmiany' : 'Dodaj'}
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

export default Calendar;

