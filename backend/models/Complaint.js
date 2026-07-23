const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['hostel', 'academics', 'facilities', 'other'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminRemarks: { type: String, default: '' },
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        authorName: { type: String, required: true },
        authorRole: { type: String, enum: ['student', 'admin'], required: true },
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
