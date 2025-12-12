const pool = require('../database/db');

// Pobieranie powiadomień użytkownika
const getUserNotifications = async (req, res) => {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, unread_only = false } = req.query;

    try {
        let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;

        if (unread_only === 'true') {
            query += ' AND is_read = false';
        }

        query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';

        const result = await pool.query(query, [userId, limit, offset]);

        // Policz nieprzeczytane
        const unreadCount = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({
            notifications: result.rows,
            unreadCount: parseInt(unreadCount.rows[0].count)
        });
    } catch (error) {
        console.error('Błąd pobierania powiadomień:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Oznaczanie powiadomienia jako przeczytane
const markAsRead = async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Powiadomienie nie znalezione' });
        }

        res.json({ message: 'Powiadomienie zostało oznaczone jako przeczytane' });
    } catch (error) {
        console.error('Błąd oznaczania powiadomienia:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Oznaczanie wszystkich powiadomień jako przeczytane
const markAllAsRead = async (req, res) => {
    const userId = req.user.userId;

    try {
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({ message: 'Wszystkie powiadomienia zostały oznaczone jako przeczytane' });
    } catch (error) {
        console.error('Błąd oznaczania powiadomień:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Usuwanie powiadomienia
const deleteNotification = async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Powiadomienie nie znalezione' });
        }

        res.json({ message: 'Powiadomienie zostało usunięte' });
    } catch (error) {
        console.error('Błąd usuwania powiadomienia:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

module.exports = {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};

