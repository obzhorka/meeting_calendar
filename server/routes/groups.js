const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../Downloads/meeting-scheduler/server/middleware/auth');
const {
  createGroup,
  getUserGroups,
  getGroupDetails,
  addGroupMember,
  removeGroupMember,
  deleteGroup
} = require('../controllers/groupsController');

router.use(authMiddleware);

router.post('/', createGroup);
router.get('/', getUserGroups);
router.get('/:groupId', getGroupDetails);
router.post('/:groupId/members', addGroupMember);
router.delete('/:groupId/members/:memberId', removeGroupMember);
router.delete('/:groupId', deleteGroup);

module.exports = router;

