const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  addAvailability,
  updateAvailability,
  deleteAvailability,
  getUserAvailability,
  getMultipleUsersAvailability
} = require('../controllers/availabilityController');

router.use(authMiddleware);

router.post('/', addAvailability);
router.put('/:availabilityId', updateAvailability);
router.delete('/:availabilityId', deleteAvailability);
router.get('/user/:userId?', getUserAvailability);
router.post('/multiple', getMultipleUsersAvailability);

module.exports = router;

