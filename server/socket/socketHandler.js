// Socket.io handler
module.exports = (io) => {
  io.use((socket, next) => {
    // Podstawowa autoryzacja - można rozszerzyć o JWT
    const token = socket.handshake.auth.token;
    if (token) {
      // TODO: Weryfikacja JWT token
      socket.userId = socket.handshake.auth.userId || null;
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`✅ Użytkownik połączony: ${socket.id}`);

    // Dołączanie do pokojów
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`👥 Socket ${socket.id} dołączył do pokoju: ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`👋 Socket ${socket.id} opuścił pokój: ${roomId}`);
    });

    // Wiadomości grupowe
    socket.on('send_group_message', ({ groupId, message }) => {
      io.to(`group_${groupId}`).emit('group_message', {
        groupId,
        message,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Wiadomości wydarzeń
    socket.on('send_event_message', ({ eventId, message }) => {
      io.to(`event_${eventId}`).emit('event_message', {
        eventId,
        message,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Użytkownik rozłączony: ${socket.id}`);
    });
  });
};

