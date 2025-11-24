import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Users, UserPlus, Trash2, MessageCircle, ArrowLeft } from 'lucide-react';
import ChatBox from '../components/ChatBox';
import './GroupDetails.css';

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  useEffect(() => {
    if (showAddMember) {
      loadFriends();
    }
  }, [showAddMember]);

  const loadGroupDetails = async () => {
    try {
      const response = await axios.get(`/api/groups/${groupId}`);
      setGroup(response.data.group);
    } catch (error) {
      toast.error('Błąd ładowania grupy');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const response = await axios.get('/api/friends');
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Błąd ładowania znajomych:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleAddMemberBySearch = async (e) => {
    e.preventDefault();
    
    if (!newMemberEmail.trim()) {
      toast.error('Wpisz email lub nazwę użytkownika');
      return;
    }
    
    try {
      // Najpierw znajdź użytkownika po email lub username
      const searchResponse = await axios.get(`/api/friends/search?query=${encodeURIComponent(newMemberEmail)}`);
      
      if (!searchResponse.data.users || searchResponse.data.users.length === 0) {
        toast.error('Nie znaleziono użytkownika o podanym emailu lub nazwie');
        return;
      }
      
      const userToAdd = searchResponse.data.users[0];
      
      // Dodaj użytkownika do grupy
      await axios.post(`/api/groups/${groupId}/members`, {
        userId: userToAdd.id
      });
      
      toast.success(`Dodano ${userToAdd.username} do grupy`);
      setNewMemberEmail('');
      setShowAddMember(false);
      loadGroupDetails();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Nie udało się dodać członka');
    }
  };

  const handleAddFriendToGroup = async (friendId, friendName) => {
    try {
      await axios.post(`/api/groups/${groupId}/members`, {
        userId: friendId
      });
      
      toast.success(`Dodano ${friendName} do grupy`);
      setShowAddMember(false);
      loadGroupDetails();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Nie udało się dodać członka');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego członka?')) return;
    
    try {
      await axios.delete(`/api/groups/${groupId}/members/${memberId}`);
      toast.success('Członek został usunięty');
      loadGroupDetails();
    } catch (error) {
      toast.error('Błąd usuwania członka');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę grupę? Ta akcja jest nieodwracalna.')) return;
    
    try {
      await axios.delete(`/api/groups/${groupId}`);
      toast.success('Grupa została usunięta');
      navigate('/groups');
    } catch (error) {
      toast.error('Błąd usuwania grupy');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!group) return null;

  const isAdmin = group.members.some(m => m.role === 'admin');

  return (
    <div className="group-details-page">
      <div className="container">
        <button onClick={() => navigate('/groups')} className="back-button">
          <ArrowLeft size={20} />
          Powrót do grup
        </button>

        <div className="group-details-header">
          <div className="group-details-info">
            <div className="group-details-icon">
              <Users size={40} />
            </div>
            <div>
              <h1>{group.name}</h1>
              {group.description && <p>{group.description}</p>}
              <div className="group-details-meta">
                <span>Utworzona przez: {group.created_by_username}</span>
                <span>{group.members.length} członków</span>
              </div>
            </div>
          </div>
          <div className="group-details-actions">
            <button onClick={() => setShowChat(!showChat)} className="btn btn-secondary">
              <MessageCircle size={20} />
              {showChat ? 'Ukryj czat' : 'Czat grupowy'}
            </button>
            {isAdmin && (
              <button onClick={handleDeleteGroup} className="btn btn-danger">
                <Trash2 size={20} />
                Usuń grupę
              </button>
            )}
          </div>
        </div>

        <div className="group-details-content">
          <div className="group-members-section">
            <div className="section-header">
              <h2>Członkowie ({group.members.length})</h2>
              {isAdmin && (
                <button 
                  onClick={() => setShowAddMember(true)} 
                  className="btn btn-sm btn-primary"
                >
                  <UserPlus size={16} />
                  Dodaj członka
                </button>
              )}
            </div>

            <div className="members-list">
              {group.members.map(member => (
                <div key={member.id} className="member-item">
                  <div className="member-info">
                    <Users size={24} />
                    <div>
                      <h4>{member.full_name || member.username}</h4>
                      <p>{member.email}</p>
                    </div>
                  </div>
                  <div className="member-actions">
                    <span className={`badge badge-${member.role === 'admin' ? 'primary' : 'secondary'}`}>
                      {member.role === 'admin' ? 'Administrator' : 'Członek'}
                    </span>
                    {isAdmin && member.role !== 'admin' && (
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        className="btn btn-sm btn-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showChat && (
            <div className="group-chat-section">
              <ChatBox type="group" id={groupId} />
            </div>
          )}
        </div>

        {showAddMember && (
          <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
            <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Dodaj członka do grupy</h2>
                <button onClick={() => setShowAddMember(false)} className="modal-close">&times;</button>
              </div>
              
              {loadingFriends ? (
                <div className="loading-container" style={{ padding: '2rem' }}>
                  <div className="spinner"></div>
                  <p>Ładowanie znajomych...</p>
                </div>
              ) : (
                <>
                  {/* Lista znajomych */}
                  {friends.length > 0 && (
                    <div className="form-group">
                      <label className="label">Wybierz znajomego</label>
                      <div className="friends-list-modal">
                        {friends
                          .filter(friend => !group.members.some(member => member.id === friend.id))
                          .map(friend => (
                            <div 
                              key={friend.id} 
                              className="friend-item-modal"
                              onClick={() => handleAddFriendToGroup(friend.id, friend.username)}
                            >
                              <div className="friend-info">
                                <Users size={24} />
                                <div>
                                  <h4>{friend.full_name || friend.username}</h4>
                                  <p className="text-secondary">{friend.email}</p>
                                </div>
                              </div>
                              <button 
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddFriendToGroup(friend.id, friend.username);
                                }}
                              >
                                <UserPlus size={16} />
                                Dodaj
                              </button>
                            </div>
                          ))}
                        {friends.filter(friend => !group.members.some(member => member.id === friend.id)).length === 0 && (
                          <div className="empty-state-small">
                            <p>Wszyscy Twoi znajomi są już członkami tej grupy</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Separator */}
                  <div className="modal-separator">
                    <span>lub</span>
                  </div>

                  {/* Ręczne wyszukiwanie */}
                  <form onSubmit={handleAddMemberBySearch}>
                    <div className="form-group">
                      <label className="label">Dodaj przez email lub nazwę</label>
                      <input
                        type="text"
                        className="input"
                        value={newMemberEmail}
                        onChange={e => setNewMemberEmail(e.target.value)}
                        placeholder="Wpisz email lub nazwę użytkownika"
                      />
                      <small className="text-secondary">
                        Użyj tej opcji jeśli użytkownik nie jest w Twoich znajomych
                      </small>
                    </div>

                    <div className="modal-actions">
                      <button type="button" onClick={() => setShowAddMember(false)} className="btn btn-outline">
                        Anuluj
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Wyszukaj i dodaj
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetails;

