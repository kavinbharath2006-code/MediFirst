/**
 * models/QueryLog.js — MongoDB schema for MediFirst query audit log
 *
 * Each document represents one user emergency query along with the
 * computed urgency level, Gemini response, RAG chunks referenced,
 * geolocation info, and optional feedback rating.
 */

const mongoose = require('mongoose');

const QueryLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type:    String,
      index:   true,
      default: null,
    },

    query: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 500,
    },

    emergencyType: {
      type: String,
      enum: [
        'cardiac_arrest',
        'seizure',
        'burn',
        'fracture',
        'choking',
        'poisoning',
        'drowning',
        'bleeding',
        'allergic_reaction',
        'stroke',
        'general',
      ],
      default: 'general',
    },

    urgencyLevel: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'],
      required: true,
    },

    responseSteps: {
      type:    [String],
      default: [],
    },

    doNotDo: {
      type:    [String],
      default: [],
    },

    mistakes: {
      type:    [String],
      default: [],
    },

    watchFor: {
      type:    [String],
      default: [],
    },

    ragChunksUsed: {
      type:    [String],
      default: [],
    },

    geminiTokensUsed: {
      type:    Number,
      default: 0,
    },

    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    userAgent: {
      type:    String,
      default: null,
    },

    responseTimeMs: {
      type:    Number,
      default: 0,
    },

    feedbackRating: {
      type:    Number,
      min:     1,
      max:     5,
      default: null,
    },

    callAmbulance: {
      type:    Boolean,
      default: false,
    },

    timestamp: {
      type:    Date,
      default: Date.now,
      index:   true,
    },
  },
  {
    timestamps:  false,
    versionKey:  false,
    collection:  'query_logs',
  }
);

// Compound index for dashboard aggregations
QueryLogSchema.index({ urgencyLevel: 1, timestamp: -1 });
QueryLogSchema.index({ emergencyType: 1, timestamp: -1 });
QueryLogSchema.index({ feedbackRating: 1, timestamp: -1 });

module.exports = mongoose.model('QueryLog', QueryLogSchema);
