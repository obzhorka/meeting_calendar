const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createEvent,
  getUserEvents,
  getEventDetails,
  findCommonTimeSlotsForEvent,
  proposeTimeSlot,
  voteOnTimeSlot,
  proposeLocation,
  voteOnLocation,
  updateParticipationStatus,
  confirmEventTime
} = require('../controllers/eventsController');

router.use(authMiddleware);

router.post('/', createEvent);
router.get('/', getUserEvents);
router.get('/:eventId', getEventDetails);
router.post('/:eventId/find-slots', findCommonTimeSlotsForEvent);
router.post('/:eventId/propose-time', proposeTimeSlot);
router.post('/:eventId/time-slots/:timeSlotId/vote', voteOnTimeSlot);
router.post('/:eventId/propose-location', proposeLocation);
router.post('/:eventId/locations/:locationId/vote', voteOnLocation);
router.put('/:eventId/participation', updateParticipationStatus);
router.put('/:eventId/confirm-time', confirmEventTime);

module.exports = router;

