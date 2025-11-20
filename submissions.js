const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String },
  team: { type: String },
  reportText: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
