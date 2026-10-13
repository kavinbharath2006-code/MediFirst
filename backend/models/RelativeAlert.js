/**
 * models/RelativeAlert.js — Emergency Relative Notification & Location Share Record
 *
 * Persisted whenever an emergency alert is shared with a relative via WhatsApp, SMS, or telephony.
 */

const mongoose = require('mongoose');

const RelativeAlertSchema = new mongoose.Schema(
  {
    patientName: {
      type:    String,
      default: 'Unknown Patient',
      trim:    true,
    },
    relativeName: {
      type:    String,
      default: 'Emergency Contact',
      trim:    true,
    },
    relativePhone: {
      type:     String,
      required: true,
      trim:     true,
    },
    emergencyType: {
      type:    String,
      default: 'general',
    },
    urgencyLevel: {
      type:    String,
      default: 'CRITICAL',
    },
    location: {
      lat:     { type: Number, default: null },
      lng:     { type: Number, default: null },
      label:   { type: String, default: null },
      mapsUrl: { type: String, default: null },
    },
    hospital: {
      name:    { type: String, default: null },
      phone:   { type: String, default: null },
      address: { type: String, default: null },
    },
    summaryText: {
      type:    String,
      default: '',
    },
    channel: {
      type:    String,
      enum:    ['whatsapp', 'sms', 'both', 'telephony', 'manual'],
      default: 'both',
    },
    status: {
      type:    String,
      enum:    ['notified', 'sent', 'acknowledged', 'failed'],
      default: 'notified',
    },
    timestamp: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// TTL index: auto-delete records older than 30 days to protect storage
RelativeAlertSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('RelativeAlert', RelativeAlertSchema);
