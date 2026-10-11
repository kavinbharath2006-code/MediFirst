/**
 * models/Feedback.js — MongoDB schema for user feedback on MediFirst responses
 *
 * Links a 1–5 star rating and optional comment back to the originating
 * QueryLog document. On save, the QueryLog's feedbackRating field is
 * updated via a post-save hook.
 */

const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    queryLogId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'QueryLog',
      required: true,
      index:    true,
    },

    rating: {
      type:     Number,
      required: true,
      min:      1,
      max:      5,
    },

    comment: {
      type:    String,
      trim:    true,
      maxlength: 1000,
      default: null,
    },

    timestamp: {
      type:    Date,
      default: Date.now,
      index:   true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'feedback',
  }
);

// After a feedback document is saved, propagate rating to the linked QueryLog
FeedbackSchema.post('save', async function (doc) {
  try {
    const QueryLog = mongoose.model('QueryLog');
    await QueryLog.findByIdAndUpdate(doc.queryLogId, { feedbackRating: doc.rating });
    console.log(`[Feedback] Updated feedbackRating on QueryLog ${doc.queryLogId} → ${doc.rating}`);
  } catch (err) {
    console.error('[Feedback] Failed to propagate rating to QueryLog:', err.message);
  }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
