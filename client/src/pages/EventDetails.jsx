import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Users, Clock, MapPin, Search, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import './EventDetails.css';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFindSlots, setShowFindSlots] = useState(false);
  const [commonSlots, setCommonSlots] = useState([]);
  const [searchParams, setSearchParams] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      const response = await axios.get(`/api/events/${eventId}`);
      setEvent(response.data.event);
    } catch (error) {
      toast.error('Błąd ładowania wydarzenia');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const findCommonSlots = async () => {
    try {
      const response = await axios.post(`/api/events/${eventId}/find-slots`, searchParams);
      setCommonSlots(response.data.commonSlots);
      toast.success(`Znaleziono ${response.data.commonSlots.length} wolnych terminów`);
    } catch (error) {
      toast.error('Błąd wyszukiwania terminów');
    }
  };

  const proposeTimeSlot = async (slot) => {
    try {
      await axios.post(`/api/events/${eventId}/propose-time`, {
        start_time: slot.start,
        end_time: slot.end
      });
      toast.success('Termin został zaproponowany');
      loadEventDetails();
      setShowFindSlots(false);
    } catch (error) {
      toast.error('Błąd proponowania terminu');
    }
  };

  const voteOnTimeSlot = async (timeSlotId, vote) => {
    try {
      await axios.post(`/api/events/${eventId}/time-slots/${timeSlotId}/vote`, { vote });
      toast.success('Głos został zapisany');
      loadEventDetails();
    } catch (error) {
      toast.error('Błąd głosowania');
    }
  };

  const updateParticipationStatus = async (status) => {
    try {
      await axios.put(`/api/events/${eventId}/participation`, { status });
      toast.success('Status został zaktualizowany');
      loadEventDetails();
    } catch (error) {
      toast.error('Błąd aktualizacji statusu');
    }
  };

  const confirmEventTime = async (timeSlotId, location) => {
    try {
      await axios.put(`/api/events/${eventId}/confirm-time`, { timeSlotId, location });
      toast.success('Termin wydarzenia został potwierdzony!');
      loadEventDetails();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Błąd potwierdzania terminu');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!event) return null;

  const isCreator = user && event.created_by === user.id;
  const isScheduled = event.status === 'scheduled';
  const hasConfirmedTime = event.confirmed_start_time && event.confirmed_end_time;

  return (
    <div className="event-details-page">
      <div className="container">
        <button onClick={() => navigate('/events')} className="back-button">
          <ArrowLeft size={20} />
          Powrót do wydarzeń
        </button>

        <div className="event-details-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1>{event.title}</h1>
              {isScheduled && (
                <span className="badge badge-success" style={{ fontSize: '14px' }}>
                  Zaplanowane
                </span>
              )}
            </div>
            {event.description && <p>{event.description}</p>}
            <div className="event-details-meta">
              <span>
                <Users size={18} />
                {event.participants?.length || 0} uczestników
              </span>
              <span>
                <Clock size={18} />
                {event.duration_minutes} minut
              </span>
              {event.location && (
                <span>
                  <MapPin size={18} />
                  {event.location}
                </span>
              )}
              {hasConfirmedTime && (
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                  <Clock size={18} />
                  {new Date(event.confirmed_start_time).toLocaleString('pl-PL')}
                </span>
              )}
            </div>
          </div>
          <div className="participation-actions">
            <button 
              onClick={() => updateParticipationStatus('accepted')}
              className="btn btn-success btn-sm"
            >
              Przyjmuję
            </button>
            <button 
              onClick={() => updateParticipationStatus('maybe')}
              className="btn btn-outline btn-sm"
            >
              Może
            </button>
            <button 
              onClick={() => updateParticipationStatus('declined')}
              className="btn btn-danger btn-sm"
            >
              Odmawiam
            </button>
          </div>
        </div>

        <div className="event-content-grid">
          <div className="event-main-section">
            <div className="event-section-card">
              <div className="section-header">
                <h2>Proponowane terminy</h2>
                <button 
                  onClick={() => setShowFindSlots(!showFindSlots)}
                  className="btn btn-sm btn-primary"
                >
                  <Search size={16} />
                  Znajdź terminy
                </button>
              </div>

              {showFindSlots && (
                <div className="find-slots-section">
                  <div className="form-group">
                    <label className="label">Data od</label>
                    <input
                      type="date"
                      className="input"
                      value={searchParams.start_date}
                      onChange={e => setSearchParams({...searchParams, start_date: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Data do</label>
                    <input
                      type="date"
                      className="input"
                      value={searchParams.end_date}
                      onChange={e => setSearchParams({...searchParams, end_date: e.target.value})}
                    />
                  </div>
                  <button onClick={findCommonSlots} className="btn btn-primary">
                    Szukaj wolnych terminów
                  </button>

                  {commonSlots.length > 0 && (
                    <div className="common-slots-list">
                      <h4>Znalezione terminy:</h4>
                      {commonSlots.map((slot, index) => (
                        <div key={index} className="common-slot-item">
                          <div>
                            <strong>{new Date(slot.start).toLocaleString('pl-PL')}</strong>
                            <br />
                            <span className="text-secondary">
                              {new Date(slot.end).toLocaleString('pl-PL')}
                            </span>
                          </div>
                          <button 
                            onClick={() => proposeTimeSlot(slot)}
                            className="btn btn-sm btn-outline"
                          >
                            Zaproponuj
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="proposed-slots-list">
                {event.proposed_time_slots?.length === 0 ? (
                  <p className="text-secondary">Brak proponowanych terminów</p>
                ) : (
                  event.proposed_time_slots?.map(slot => (
                    <div key={slot.id} className="proposed-slot-item">
                      <div className="slot-info">
                        <strong>{new Date(slot.start_time).toLocaleString('pl-PL')}</strong>
                        <span className="text-secondary">
                          → {new Date(slot.end_time).toLocaleString('pl-PL')}
                        </span>
                        <div className="slot-votes">
                          <span className="vote-count yes">{slot.yes_votes} 👍</span>
                          <span className="vote-count no">{slot.no_votes} 👎</span>
                          <span className="vote-count maybe">{slot.maybe_votes} 🤔</span>
                        </div>
                      </div>
                      <div className="slot-actions">
                        {!isScheduled && (
                          <>
                            <button 
                              onClick={() => voteOnTimeSlot(slot.id, 'yes')}
                              className="vote-btn yes"
                              title="Tak"
                            >
                              <ThumbsUp size={16} />
                            </button>
                            <button 
                              onClick={() => voteOnTimeSlot(slot.id, 'no')}
                              className="vote-btn no"
                              title="Nie"
                            >
                              <ThumbsDown size={16} />
                            </button>
                            {isCreator && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Czy na pewno chcesz potwierdzić ten termin?\n${new Date(slot.start_time).toLocaleString('pl-PL')} - ${new Date(slot.end_time).toLocaleString('pl-PL')}`)) {
                                    confirmEventTime(slot.id, event.location);
                                  }
                                }}
                                className="btn btn-success btn-sm"
                                title="Potwierdź ten termin"
                                style={{ marginLeft: '8px' }}
                              >
                                <CheckCircle size={16} />
                                Potwierdź
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="event-section-card">
              <h2>Uczestnicy</h2>
              <div className="participants-list">
                {event.participants?.map(participant => (
                  <div key={participant.id} className="participant-item">
                    <div className="participant-info">
                      <Users size={20} />
                      <span>{participant.full_name || participant.username}</span>
                    </div>
                    <span className={`badge badge-${getParticipationBadgeClass(participant.status)}`}>
                      {getParticipationLabel(participant.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="event-chat-section">
            <h2>Czat wydarzenia</h2>
            <ChatBox type="event" id={eventId} />
          </div>
        </div>
      </div>
    </div>
  );
};

const getParticipationLabel = (status) => {
  const labels = {
    invited: 'Zaproszony',
    accepted: 'Przyjął',
    declined: 'Odrzucił',
    maybe: 'Może'
  };
  return labels[status] || status;
};

const getParticipationBadgeClass = (status) => {
  const classes = {
    invited: 'warning',
    accepted: 'success',
    declined: 'error',
    maybe: 'primary'
  };
  return classes[status] || 'primary';
};

export default EventDetails;

