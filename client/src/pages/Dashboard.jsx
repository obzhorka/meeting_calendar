import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, CalendarDays, UserPlus, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    groups: 0,
    events: 0,
    friends: 0,
    upcomingEvents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [groupsRes, eventsRes, friendsRes] = await Promise.all([
        axios.get('/api/groups'),
        axios.get('/api/events'),
        axios.get('/api/friends')
      ]);

      const upcomingEvents = eventsRes.data.events
        .filter(event => event.status !== 'completed' && event.status !== 'cancelled')
        .slice(0, 5);

      setStats({
        groups: groupsRes.data.groups.length,
        events: eventsRes.data.events.length,
        friends: friendsRes.data.friends.length,
        upcomingEvents
      });
    } catch (error) {
      toast.error('Błąd ładowania danych');
      console.error(error);
    } finally {
      setLoading(false);
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
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Witaj, {user?.full_name || user?.username}! 👋</h1>
            <p className="text-secondary">
              Oto przegląd Twoich nadchodzących wydarzeń i aktywności
            </p>
          </div>
        </div>

        <div className="dashboard-stats">
          <Link to="/groups" className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
              <Users size={32} color="var(--primary-color)" />
            </div>
            <div className="stat-info">
              <h3>{stats.groups}</h3>
              <p>Grupy</p>
            </div>
          </Link>

          <Link to="/events" className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
              <Calendar size={32} color="var(--secondary-color)" />
            </div>
            <div className="stat-info">
              <h3>{stats.events}</h3>
              <p>Wydarzenia</p>
            </div>
          </Link>

          <Link to="/friends" className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <UserPlus size={32} color="var(--success)" />
            </div>
            <div className="stat-info">
              <h3>{stats.friends}</h3>
              <p>Znajomi</p>
            </div>
          </Link>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>
                <CalendarDays size={24} />
                Nadchodzące wydarzenia
              </h2>
              <Link to="/events" className="btn btn-sm btn-outline">
                Zobacz wszystkie
              </Link>
            </div>

            {stats.upcomingEvents.length === 0 ? (
              <div className="empty-state">
                <Clock size={48} />
                <h3>Brak nadchodzących wydarzeń</h3>
                <p>Utwórz nowe wydarzenie lub dołącz do grupy</p>
                <Link to="/events" className="btn btn-primary mt-2">
                  Utwórz wydarzenie
                </Link>
              </div>
            ) : (
              <div className="events-list">
                {stats.upcomingEvents.map(event => (
                  <Link 
                    key={event.id} 
                    to={`/events/${event.id}`}
                    className="event-card"
                  >
                    <div className="event-header">
                      <h3>{event.title}</h3>
                      <span className={`badge badge-${getStatusBadgeClass(event.status)}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="event-description">{event.description}</p>
                    )}
                    <div className="event-meta">
                      <span>
                        <Users size={16} />
                        {event.participant_count} uczestników
                      </span>
                      <span>
                        <Clock size={16} />
                        {event.duration_minutes} min
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-quick-actions">
            <h2>Szybkie akcje</h2>
            <div className="quick-actions-grid">
              <Link to="/calendar" className="quick-action-card">
                <CalendarDays size={28} />
                <h3>Mój kalendarz</h3>
                <p>Zarządzaj dostępnością</p>
              </Link>
              <Link to="/groups" className="quick-action-card">
                <Users size={28} />
                <h3>Nowa grupa</h3>
                <p>Utwórz grupę znajomych</p>
              </Link>
              <Link to="/friends" className="quick-action-card">
                <UserPlus size={28} />
                <h3>Dodaj znajomych</h3>
                <p>Zaproś nowych znajomych</p>
              </Link>
            </div>
          </div>
        </div>
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

export default Dashboard;

