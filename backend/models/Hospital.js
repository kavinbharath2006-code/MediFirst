/**
 * models/Hospital.js — MongoDB schema for hospital records in MediFirst
 *
 * Stores hospital data seeded from Google Maps API responses or manual
 * entries. Uses a GeoJSON Point on the `location` field so that MongoDB
 * $near / $geoWithin geospatial queries can be executed against the
 * 2dsphere index without round-tripping to the Maps API every time.
 */

const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },

    address: {
      type:  String,
      trim:  true,
      default: null,
    },

    phone: {
      type:    String,
      trim:    true,
      default: null,
    },

    // GeoJSON Point: coordinates MUST be [longitude, latitude]
    location: {
      type: {
        type:    String,
        enum:    ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type:     [Number],   // [lng, lat]
        required: true,
      },
    },

    emergencyAvailable: {
      type:    Boolean,
      default: true,
    },

    specialties: {
      type:    [String],
      default: [],
    },

    // Provenance column from the seed CSV (e.g. 'manual', 'district-health-office').
    // Not to be confused with the `source` field the API adds per-response to
    // flag places/mongo/demo origin of a lookup.
    source: {
      type:  String,
      trim:  true,
      default: null,
    },

    // Free-text remarks from the CSV (opening hours, ward notes, ...)
    notes: {
      type:  String,
      trim:  true,
      default: null,
    },

    city: {
      type:  String,
      trim:  true,
      index: true,
      default: null,
    },

    placeId: {
      type:    String,
      default: null,
      unique:  false,
    },

    rating: {
      type:    Number,
      min:     0,
      max:     5,
      default: null,
    },

    openNow: {
      type:    Boolean,
      default: null,
    },

    updatedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    collection: 'hospitals',
  }
);

// 2dsphere index for $near geospatial queries
HospitalSchema.index({ location: '2dsphere' });
HospitalSchema.index({ city: 1, emergencyAvailable: 1 });

module.exports = mongoose.model('Hospital', HospitalSchema);
