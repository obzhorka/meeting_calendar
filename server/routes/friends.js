const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend,
  searchUsers
} = require('../controllers/friendsController');

// Wszystkie endpointy wymagają autoryzacji
router.use(authMiddleware);

router.post('/request', sendFriendRequest);
router.post('/accept/:friendshipId', acceptFriendRequest);
router.post('/reject/:friendshipId', rejectFriendRequest);
router.get('/', getFriends);
router.get('/pending', getPendingRequests);
router.get('/search', searchUsers);
router.delete('/:friendshipId', removeFriend);

module.exports = router;

