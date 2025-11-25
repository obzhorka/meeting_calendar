import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, Loader } from 'lucide-react';
import './ChatBox.css';

const ChatBox = ({ type, id }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { socket, joinRoom, leaveRoom, sendGroupMessage, sendEventMessage } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const roomId = `${type}_${id}`;

  useEffect(() => {
    loadMessages();
    joinRoom(roomId);

    // Nasłuchuj nowych wiadomości
    if (socket) {
      const eventName = type === 'group' ? 'group_message' : 'event_message';
      
      socket.on(eventName, (message) => {
        setMessages(prev => [...prev, message]);
      });
    }

    return () => {
      leaveRoom(roomId);
    };
  }, [id, type, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const endpoint = type === 'group' 
        ? `/api/chat/group/${id}` 
        : `/api/chat/event/${id}`;
      
      const response = await axios.get(endpoint);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Błąd ładowania wiadomości:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    if (type === 'group') {
      sendGroupMessage(id, newMessage);
    } else {
      sendEventMessage(id, newMessage);
    }

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <Loader size={24} className="spinner" />
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Brak wiadomości. Rozpocznij konwersację!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.user_id === user?.id;
              
              return (
                <div 
                  key={message.id || index} 
                  className={`chat-message ${isOwn ? 'own' : ''}`}
                >
                  {!isOwn && (
                    <div className="message-author">
                      {message.full_name || message.username}
                    </div>
                  )}
                  <div className="message-content">
                    {message.message}
                  </div>
                  <div className="message-time">
                    {new Date(message.created_at).toLocaleTimeString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          className="chat-input"
          placeholder="Napisz wiadomość..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;

