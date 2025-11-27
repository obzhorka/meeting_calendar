import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { UserPlus, Users, Trash2, Check, X } from 'lucide-react';
import './Friends.css';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [friendIdentifier, setFriendIdentifier] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        axios.get('/api/friends'),
        axios.get('/api/friends/pending')
      ]);
      
      setFriends(friendsRes.data.friends);
      setPendingRequests(requestsRes.data.requests);
    } catch (error) {
      toast.error('Błąd ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/friends/request', { friendIdentifier });
      toast.success('Zaproszenie zostało wysłane');
      setFriendIdentifier('');
      setShowAddModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Błąd wysyłania zaproszenia');
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await axios.post(`/api/friends/accept/${friendshipId}`);
      toast.success('Zaproszenie zostało zaakceptowane');
      loadData();
    } catch (error) {
      toast.error('Błąd akceptacji zaproszenia');
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      await axios.post(`/api/friends/reject/${friendshipId}`);
      toast.success('Zaproszenie zostało odrzucone');
      loadData();
    } catch (error) {
      toast.error('Błąd odrzucania zaproszenia');
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego znajomego?')) return;
    
    try {
      await axios.delete(`/api/friends/${friendshipId}`);
      toast.success('Znajomy został usunięty');
      loadData();
    } catch (error) {
      toast.error('Błąd usuwania znajomego');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="friends-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Znajomi</h1>
            <p className="text-secondary">Zarządzaj swoimi znajomymi i zaproszeniami</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <UserPlus size={20} />
            Dodaj znajomego
          </button>
        </div>

        {pendingRequests.length > 0 && (
          <div className="pending-section">
            <h2>Oczekujące zaproszenia ({pendingRequests.length})</h2>
            <div className="pending-list">
              {pendingRequests.map(request => (
                <div key={request.friendship_id} className="request-item">
                  <div className="request-info">
                    <Users size={24} />
                    <div>
                      <h4>{request.full_name || request.username}</h4>
                      <p>{request.email}</p>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button 
                      onClick={() => handleAcceptRequest(request.friendship_id)}
                      className="btn btn-sm btn-success"
                    >
                      <Check size={16} />
                      Akceptuj
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(request.friendship_id)}
                      className="btn btn-sm btn-danger"
                    >
                      <X size={16} />
                      Odrzuć
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="friends-section">
          <h2>Moi znajomi ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>Brak znajomych</h3>
              <p>Dodaj znajomych aby móc planować wspólne spotkania</p>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary mt-2">
                <UserPlus size={20} />
                Dodaj pierwszego znajomego
              </button>
            </div>
          ) : (
            <div className="friends-grid">
              {friends.map(friend => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-info">
                    <div className="friend-avatar">
                      <Users size={32} />
                    </div>
                    <div>
                      <h3>{friend.full_name || friend.username}</h3>
                      <p>{friend.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFriend(friend.friendship_id)}
                    className="btn btn-sm btn-danger"
                  >
                    <Trash2 size={16} />
                    Usuń
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Dodaj znajomego</h2>
                <button onClick={() => setShowAddModal(false)} className="modal-close">&times;</button>
              </div>
              
              <form onSubmit={handleSendRequest}>
                <div className="form-group">
                  <label className="label">Email lub nazwa użytkownika</label>
                  <input
                    type="text"
                    className="input"
                    value={friendIdentifier}
                    onChange={e => setFriendIdentifier(e.target.value)}
                    placeholder="user@example.com lub username"
                    required
                  />
                  <small className="text-secondary">
                    Wyszukaj użytkownika po adresie email lub nazwie użytkownika
                  </small>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">
                    Anuluj
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Wyślij zaproszenie
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

export default Friends;

