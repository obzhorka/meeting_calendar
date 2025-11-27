const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Placeholder routes - implementacja chat będzie dodana później
router.get('/:roomId/messages', (req, res) => {
  res.json({ messages: [] });
});

router.post('/:roomId/messages', (req, res) => {
  res.json({ message: 'Chat functionality to be implemented' });
});

module.exports = router;

