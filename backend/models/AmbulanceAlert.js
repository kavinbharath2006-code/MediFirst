/**
 * models/AmbulanceAlert.js — Ambulance Protocol Alert Record
 *
 * Persisted whenever triggerAmbulanceProtocol() fires.
 * Used by AutoJob5 (every 5 min) to detect ambulance-call surges.
 *
 * Lifecycle statuses:
 *   triggered  → alert logged, notifying emergency services
 *   dispatched → (future) confirmation received from telephony API
 *   resolved   → (future) patient confirmed safe / scene cleared
 */

const mongoose = require('mongoose');

const AmbulanceAlertSchema = new mongoose.Schema(
  {
    sessionId: {
      type:    String,
      default: null,
    },
    query: {
      type:     String,
      required: true,
      trim:     true,
    },
    urgencyLevel: {
      type: String,
      enum: ['CRITICAL', 'HIGH'],
      required: true,
    },
    emergencyType: {
      type:    String,
      default: 'UNKNOWN',
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    triggeredAt: {
      type:    Date,
      default: Date.now,
    },
    status: {
      type:    String,
      enum:    ['triggered', 'dispatched', 'resolved'],
      default: 'triggered',
    },
  },
  {
    // Disable the default `__v` field; use triggeredAt for ordering
    versionKey: false,
  }
);

// TTL index: auto-delete records older than 30 days to control collection size
AmbulanceAlertSchema.index({ triggeredAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('AmbulanceAlert', AmbulanceAlertSchema);
