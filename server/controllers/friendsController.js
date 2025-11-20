const pool = require('../database/db');

// Wysłanie zaproszenia do znajomych
const sendFriendRequest = async (req, res) => {
  const { friendIdentifier } = req.body; // może być email lub username
  const userId = req.user.userId;

  try {
    // Znajdź użytkownika
    const friendResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $1',
      [friendIdentifier]
    );

    if (friendResult.rows.length === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    const friendId = friendResult.rows[0].id;

    if (userId === friendId) {
      return res.status(400).json({ error: 'Nie możesz dodać siebie do znajomych' });
    }

    // Sprawdź czy już są znajomymi lub jest oczekujące zaproszenie
    const existingFriendship = await pool.query(
      'SELECT * FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [userId, friendId]
    );

    if (existingFriendship.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Zaproszenie już istnieje lub jesteście już znajomymi' 
      });
    }

    // Dodaj zaproszenie
    await pool.query(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)',
      [userId, friendId, 'pending']
    );

    // Utwórz powiadomienie
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [friendId, 'friend_request', 'Nowe zaproszenie do znajomych', 
       'Otrzymałeś nowe zaproszenie do znajomych', 'friendship', userId]
    );

    res.status(201).json({ message: 'Zaproszenie zostało wysłane' });
  } catch (error) {
    console.error('Błąd wysyłania zaproszenia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Akceptacja zaproszenia do znajomych
const acceptFriendRequest = async (req, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.userId;

  try {
    // Sprawdź czy zaproszenie istnieje i jest skierowane do tego użytkownika
    const friendship = await pool.query(
      'SELECT * FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3',
      [friendshipId, userId, 'pending']
    );

    if (friendship.rows.length === 0) {
      return res.status(404).json({ error: 'Zaproszenie nie znalezione' });
    }

    // Aktualizuj status
    await pool.query(
      'UPDATE friendships SET status = $1 WHERE id = $2',
      ['accepted', friendshipId]
    );

    // Powiadomienie dla wysyłającego zaproszenie
    const senderId = friendship.rows[0].user_id;
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [senderId, 'friend_accepted', 'Zaproszenie zaakceptowane', 
       'Twoje zaproszenie do znajomych zostało zaakceptowane', 'friendship', userId]
    );

    res.json({ message: 'Zaproszenie zostało zaakceptowane' });
  } catch (error) {
    console.error('Błąd akceptacji zaproszenia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Odrzucenie zaproszenia
const rejectFriendRequest = async (req, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.userId;

  try {
    const friendship = await pool.query(
      'SELECT * FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3',
      [friendshipId, userId, 'pending']
    );

    if (friendship.rows.length === 0) {
      return res.status(404).json({ error: 'Zaproszenie nie znalezione' });
    }

    await pool.query(
      'UPDATE friendships SET status = $1 WHERE id = $2',
      ['rejected', friendshipId]
    );

    res.json({ message: 'Zaproszenie zostało odrzucone' });
  } catch (error) {
    console.error('Błąd odrzucania zaproszenia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Pobranie listy znajomych
const getFriends = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, f.status, f.id as friendship_id
       FROM friendships f
       JOIN users u ON (f.friend_id = u.id AND f.user_id = $1) OR (f.user_id = u.id AND f.friend_id = $1)
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted' AND u.id != $1`,
      [userId]
    );

    res.json({ friends: result.rows });
  } catch (error) {
    console.error('Błąd pobierania znajomych:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Pobranie oczekujących zaproszeń
const getPendingRequests = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT f.id as friendship_id, u.id, u.username, u.email, u.full_name, f.created_at
       FROM friendships f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Błąd pobierania zaproszeń:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Usunięcie znajomego
const removeFriend = async (req, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM friendships WHERE id = $1 AND (user_id = $2 OR friend_id = $2) RETURNING *',
      [friendshipId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Znajomy nie znaleziony' });
    }

    res.json({ message: 'Znajomy został usunięty' });
  } catch (error) {
    console.error('Błąd usuwania znajomego:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Wyszukiwanie użytkowników
const searchUsers = async (req, res) => {
  const { query } = req.query;
  const userId = req.user.userId;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Zapytanie musi mieć minimum 2 znaki' });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email, full_name 
       FROM users 
       WHERE (username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1) 
       AND id != $2
       LIMIT 10`,
      [`%${query}%`, userId]
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Błąd wyszukiwania użytkowników:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend,
  searchUsers
};

