const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  updatePriority,
  addComment,
  getStats,
  deleteComplaint
} = require('../controllers/complaintController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect); // all complaint routes require login

router.route('/')
  .post(authorize('student'), createComplaint)
  .get(getComplaints); // both roles, filtered inside controller

// NOTE: must be declared before '/:id' or Express will treat "stats" as an :id param
router.get('/stats', getStats);

router.route('/:id')
  .get(getComplaintById)
  .delete(deleteComplaint);

router.put('/:id/status', authorize('admin'), updateStatus);
router.put('/:id/priority', authorize('admin'), updatePriority);
router.post('/:id/comments', addComment);

module.exports = router;
