const pool = require('../database/db');

// Dodanie dostępności użytkownika
const addAvailability = async (req, res) => {
  const { start_time, end_time, status, title, description, recurring, recurrence_pattern } = req.body;
  const userId = req.user.userId;

  try {
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ error: 'Czas zakończenia musi być późniejszy niż czas rozpoczęcia' });
    }

    const result = await pool.query(
      `INSERT INTO user_availability (user_id, start_time, end_time, status, title, description, recurring, recurrence_pattern)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, start_time, end_time, status || 'busy', title, description, recurring || false, recurrence_pattern]
    );

    res.status(201).json({ 
      message: 'Dostępność została dodana',
      availability: result.rows[0]
    });
  } catch (error) {
    console.error('Błąd dodawania dostępności:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Aktualizacja dostępności
const updateAvailability = async (req, res) => {
  const { availabilityId } = req.params;
  const { start_time, end_time, status, title, description, recurring, recurrence_pattern } = req.body;
  const userId = req.user.userId;

  try {
    if (start_time && end_time && new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ error: 'Czas zakończenia musi być późniejszy niż czas rozpoczęcia' });
    }

    const result = await pool.query(
      `UPDATE user_availability 
       SET start_time = COALESCE($1, start_time),
           end_time = COALESCE($2, end_time),
           status = COALESCE($3, status),
           title = COALESCE($4, title),
           description = COALESCE($5, description),
           recurring = COALESCE($6, recurring),
           recurrence_pattern = COALESCE($7, recurrence_pattern),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [start_time, end_time, status, title, description, recurring, recurrence_pattern, availabilityId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dostępność nie znaleziona' });
    }

    res.json({ 
      message: 'Dostępność została zaktualizowana',
      availability: result.rows[0]
    });
  } catch (error) {
    console.error('Błąd aktualizacji dostępności:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Usunięcie dostępności
const deleteAvailability = async (req, res) => {
  const { availabilityId } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM user_availability WHERE id = $1 AND user_id = $2 RETURNING *',
      [availabilityId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dostępność nie znaleziona' });
    }

    res.json({ message: 'Dostępność została usunięta' });
  } catch (error) {
    console.error('Błąd usuwania dostępności:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Pobranie dostępności użytkownika
const getUserAvailability = async (req, res) => {
  const userId = req.params.userId || req.user.userId;
  const { start_date, end_date } = req.query;

  try {
    let query = 'SELECT * FROM user_availability WHERE user_id = $1';
    const params = [userId];

    if (start_date && end_date) {
      query += ' AND start_time >= $2 AND end_time <= $3';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY start_time ASC';

    const result = await pool.query(query, params);

    res.json({ availability: result.rows });
  } catch (error) {
    console.error('Błąd pobierania dostępności:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Pobranie dostępności wielu użytkowników (dla grup)
const getMultipleUsersAvailability = async (req, res) => {
  const { userIds, start_date, end_date } = req.body;

  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Wymagana jest lista ID użytkowników' });
    }

    let query = `
      SELECT ua.*, u.username, u.full_name
      FROM user_availability ua
      JOIN users u ON ua.user_id = u.id
      WHERE ua.user_id = ANY($1)
    `;
    const params = [userIds];

    if (start_date && end_date) {
      query += ' AND ua.start_time >= $2 AND ua.end_time <= $3';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY ua.start_time ASC';

    const result = await pool.query(query, params);

    res.json({ availability: result.rows });
  } catch (error) {
    console.error('Błąd pobierania dostępności wielu użytkowników:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = {
  addAvailability,
  updateAvailability,
  deleteAvailability,
  getUserAvailability,
  getMultipleUsersAvailability
};

