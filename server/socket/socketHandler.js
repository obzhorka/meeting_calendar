const jwt = require('jsonwebtoken');
const { sendMessage } = require('../controllers/chatController');

module.exports = (io) => {
  // Middleware autoryzacji dla Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Użytkownik połączony: ${socket.user.username} (${socket.user.userId})`);

    // Dołączanie do pokoi (grup lub wydarzeń)
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`👥 Użytkownik ${socket.user.username} dołączył do pokoju ${roomId}`);
    });

    // Opuszczanie pokoju
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`👋 Użytkownik ${socket.user.username} opuścił pokój ${roomId}`);
    });

    // Wysyłanie wiadomości do grupy
    socket.on('send_group_message', async (data) => {
      try {
        const { groupId, message } = data;
        
        // Zapisz wiadomość w bazie
        const savedMessage = await sendMessage(socket.user.userId, groupId, null, message);
        
        // Wyślij wiadomość do wszystkich w pokoju
        io.to(`group_${groupId}`).emit('group_message', savedMessage);
      } catch (error) {
        console.error('Błąd wysyłania wiadomości grupowej:', error);
        socket.emit('error', { message: 'Nie udało się wysłać wiadomości' });
      }
    });

    // Wysyłanie wiadomości do wydarzenia
    socket.on('send_event_message', async (data) => {
      try {
        const { eventId, message } = data;
        
        // Zapisz wiadomość w bazie
        const savedMessage = await sendMessage(socket.user.userId, null, eventId, message);
        
        // Wyślij wiadomość do wszystkich w pokoju
        io.to(`event_${eventId}`).emit('event_message', savedMessage);
      } catch (error) {
        console.error('Błąd wysyłania wiadomości do wydarzenia:', error);
        socket.emit('error', { message: 'Nie udało się wysłać wiadomości' });
      }
    });

    // Powiadomienie o pisaniu
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit('user_typing', {
        username: socket.user.username,
        isTyping
      });
    });

    // Rozłączenie
    socket.on('disconnect', () => {
      console.log(`❌ Użytkownik rozłączony: ${socket.user.username}`);
    });
  });
};

