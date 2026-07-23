const Complaint = require('../models/Complaint');
const sendEmail = require('../utils/sendEmail');

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// @route POST /api/complaints  (student)
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description and category are required' });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: VALID_PRIORITIES.includes(priority) ? priority : 'medium',
      student: req.user._id
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/complaints  (student: own only, admin: all, supports ?status=/?category=/?priority= filters)
const getComplaints = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.priority) filter.priority = req.query.priority;

    if (req.user.role === 'student') {
      filter.student = req.user._id;
    }

    const complaints = await Complaint.find(filter)
      .populate('student', 'name email studentId department')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/complaints/:id
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      'student',
      'name email studentId department'
    );

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Students can only view their own complaint
    if (req.user.role === 'student' && complaint.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/complaints/:id/status  (admin only) - triggers email notification
const updateStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const validStatuses = ['pending', 'in-progress', 'resolved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const complaint = await Complaint.findById(req.params.id).populate('student', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    if (adminRemarks !== undefined) complaint.adminRemarks = adminRemarks;
    if (status === 'resolved') complaint.resolvedAt = new Date();

    await complaint.save();

    // Fire-and-forget email notification; don't block response if email fails
    sendEmail({
      to: complaint.student.email,
      subject: `Complaint status updated: ${complaint.title}`,
      text: `Hi ${complaint.student.name},\n\nYour complaint "${complaint.title}" status has been updated to "${status}".\n${adminRemarks ? `Admin remarks: ${adminRemarks}\n` : ''}\nRegards,\nComplaint Portal Team`,
      html: `<p>Hi ${complaint.student.name},</p>
             <p>Your complaint "<strong>${complaint.title}</strong>" status has been updated to <strong>${status}</strong>.</p>
             ${adminRemarks ? `<p>Admin remarks: ${adminRemarks}</p>` : ''}
             <p>Regards,<br/>Complaint Portal Team</p>`
    }).catch((err) => console.error('Email send failed:', err.message));

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/complaints/:id/priority (admin only)
const updatePriority = async (req, res) => {
  try {
    const { priority } = req.body;
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority value' });
    }

    const complaint = await Complaint.findById(req.params.id).populate(
      'student',
      'name email studentId department'
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.priority = priority;
    await complaint.save();

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/complaints/:id/comments (student: own complaint only, admin: any)
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const complaint = await Complaint.findById(req.params.id).populate('student', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (req.user.role === 'student' && complaint.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    complaint.comments.push({
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      text: text.trim(),
      createdAt: new Date()
    });

    await complaint.save();

    // Notify the student when an admin replies; fire-and-forget, mirrors the status-update email flow
    if (req.user.role === 'admin') {
      sendEmail({
        to: complaint.student.email,
        subject: `New reply on your complaint: ${complaint.title}`,
        text: `Hi ${complaint.student.name},\n\n${req.user.name} (admin) replied to your complaint "${complaint.title}":\n\n"${text.trim()}"\n\nRegards,\nComplaint Portal Team`,
        html: `<p>Hi ${complaint.student.name},</p>
               <p><strong>${req.user.name}</strong> (admin) replied to your complaint "<strong>${complaint.title}</strong>":</p>
               <blockquote>${text.trim()}</blockquote>
               <p>Regards,<br/>Complaint Portal Team</p>`
      }).catch((err) => console.error('Email send failed:', err.message));
    }

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/complaints/stats (student: own stats, admin: portal-wide stats)
const getStats = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    }

    const complaints = await Complaint.find(filter).select(
      'status category priority createdAt resolvedAt'
    );

    const total = complaints.length;
    const byStatus = { pending: 0, 'in-progress': 0, resolved: 0 };
    const byCategory = { hostel: 0, academics: 0, facilities: 0, other: 0 };
    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };

    let resolvedWithTime = 0;
    let totalResolutionMs = 0;

    const weeks = 8;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const startOfRange = new Date(now.getTime() - (weeks - 1) * weekMs);
    const weeklyTrend = Array.from({ length: weeks }, (_, i) => ({
      label: new Date(startOfRange.getTime() + i * weekMs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      count: 0
    }));

    complaints.forEach((c) => {
      if (byStatus[c.status] !== undefined) byStatus[c.status]++;
      if (byCategory[c.category] !== undefined) byCategory[c.category]++;
      if (byPriority[c.priority] !== undefined) byPriority[c.priority]++;

      if (c.status === 'resolved' && c.resolvedAt) {
        resolvedWithTime++;
        totalResolutionMs += new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
      }

      const created = new Date(c.createdAt);
      if (created >= startOfRange) {
        const idx = Math.min(weeks - 1, Math.floor((created.getTime() - startOfRange.getTime()) / weekMs));
        weeklyTrend[idx].count++;
      }
    });

    res.json({
      total,
      byStatus,
      byCategory,
      byPriority,
      resolutionRate: total > 0 ? +((byStatus.resolved / total) * 100).toFixed(1) : 0,
      avgResolutionDays:
        resolvedWithTime > 0 ? +(totalResolutionMs / resolvedWithTime / (1000 * 60 * 60 * 24)).toFixed(1) : null,
      weeklyTrend
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/complaints/:id (student can delete own pending complaint, admin can delete any)
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (req.user.role === 'student') {
      if (complaint.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      if (complaint.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending complaints can be deleted' });
      }
    }

    await complaint.deleteOne();
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  updatePriority,
  addComment,
  getStats,
  deleteComplaint
};
