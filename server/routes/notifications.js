const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../database/db');

router.use(authMiddleware);

// Pobieranie powiadomień użytkownika
router.get('/', async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Błąd pobierania powiadomień:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Oznaczanie powiadomienia jako przeczytane
router.put('/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.userId;

  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    res.json({ message: 'Powiadomienie oznaczone jako przeczytane' });
  } catch (error) {
    console.error('Błąd aktualizacji powiadomienia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuwanie powiadomienia
router.delete('/:notificationId', async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.userId;

  try {
    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    res.json({ message: 'Powiadomienie usunięte' });
  } catch (error) {
    console.error('Błąd usuwania powiadomienia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;

