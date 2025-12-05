const pool = require('../database/db');

// Pobieranie wiadomości z czatu grupowego
const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const userId = req.user.userId;

  try {
    // Sprawdź czy użytkownik jest członkiem grupy
    const memberCheck = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Nie jesteś członkiem tej grupy' });
    }

    // Pobierz wiadomości
    const result = await pool.query(
      `SELECT cm.*, u.username, u.full_name
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.group_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );

    res.json({ messages: result.rows.reverse() });
  } catch (error) {
    console.error('Błąd pobierania wiadomości:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Pobieranie wiadomości z czatu wydarzenia
const getEventMessages = async (req, res) => {
  const { eventId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const userId = req.user.userId;

  try {
    // Sprawdź czy użytkownik jest uczestnikiem wydarzenia
    const participantCheck = await pool.query(
      'SELECT * FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Nie jesteś uczestnikiem tego wydarzenia' });
    }

    // Pobierz wiadomości
    const result = await pool.query(
      `SELECT cm.*, u.username, u.full_name
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.event_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [eventId, limit, offset]
    );

    res.json({ messages: result.rows.reverse() });
  } catch (error) {
    console.error('Błąd pobierania wiadomości:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Wysłanie wiadomości (używane również przez Socket.io)
const sendMessage = async (userId, groupId, eventId, message) => {
  try {
    const result = await pool.query(
      'INSERT INTO chat_messages (user_id, group_id, event_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, groupId, eventId, message]
    );

    // Pobierz informacje o użytkowniku
    const userResult = await pool.query(
      'SELECT username, full_name FROM users WHERE id = $1',
      [userId]
    );

    return {
      ...result.rows[0],
      username: userResult.rows[0].username,
      full_name: userResult.rows[0].full_name
    };
  } catch (error) {
    console.error('Błąd wysyłania wiadomości:', error);
    throw error;
  }
};

module.exports = {
  getGroupMessages,
  getEventMessages,
  sendMessage
};

