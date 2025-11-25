import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { User, Mail, Calendar, Bell } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      toast.error('Błąd ładowania powiadomień');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      toast.error('Błąd oznaczania powiadomienia');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      toast.success('Wszystkie powiadomienia oznaczone jako przeczytane');
      loadNotifications();
    } catch (error) {
      toast.error('Błąd oznaczania powiadomień');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      loadNotifications();
    } catch (error) {
      toast.error('Błąd usuwania powiadomienia');
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
    <div className="profile-page">
      <div className="container">
        <h1>Profil użytkownika</h1>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <div className="profile-info">
              <h2>{user?.full_name || user?.username}</h2>
              <div className="profile-details">
                <div className="detail-item">
                  <User size={18} />
                  <span>{user?.username}</span>
                </div>
                <div className="detail-item">
                  <Mail size={18} />
                  <span>{user?.email}</span>
                </div>
                <div className="detail-item">
                  <Calendar size={18} />
                  <span>Dołączył: {new Date(user?.created_at).toLocaleDateString('pl-PL')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="notifications-section">
            <div className="notifications-header">
              <h2>
                <Bell size={24} />
                Powiadomienia
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </h2>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="btn btn-sm btn-outline">
                  Oznacz wszystkie jako przeczytane
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={48} />
                <h3>Brak powiadomień</h3>
                <p>Gdy pojawią się nowe powiadomienia, zobaczysz je tutaj</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  >
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.created_at).toLocaleString('pl-PL')}
                      </span>
                    </div>
                    <div className="notification-actions">
                      {!notification.is_read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="btn btn-sm btn-outline"
                        >
                          Oznacz jako przeczytane
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notification.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

