import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Phone, AlertTriangle, Loader2, ArrowLeft, RefreshCw, Map } from 'lucide-react';
import { getCurrentPosition, buildNearbyHospitalsUrl, getMapEmbedUrl } from '../api/geolocation';
import { EMERGENCY_NUMBERS } from '../data/constants';

const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const LOCATION_STATES = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function Services() {
  const navigate = useNavigate();
  const [locationState, setLocationState] = useState(LOCATION_STATES.IDLE);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [manualLocation, setManualLocation] = useState('');

  const requestLocation = async () => {
    setLocationState(LOCATION_STATES.REQUESTING);
    setLocationError(null);
    try {
      const pos = await getCurrentPosition();
      setLocation(pos);
      setLocationState(LOCATION_STATES.SUCCESS);
    } catch (err) {
      setLocationError(err.message);
      setLocationState(LOCATION_STATES.ERROR);
    }
  };

  const handleOpenMaps = () => {
    if (location) {
      window.open(buildNearbyHospitalsUrl(location.lat, location.lng), '_blank', 'noopener,noreferrer');
    } else if (manualLocation.trim()) {
      const query = encodeURIComponent(`hospital near ${manualLocation}`);
      window.open(`https://www.google.com/maps/search/${query}`, '_blank', 'noopener,noreferrer');
    }
  };

  const mapEmbedUrl = location && GOOGLE_MAPS_KEY && GOOGLE_MAPS_KEY !== 'your_google_maps_api_key_here'
    ? getMapEmbedUrl(location.lat, location.lng, GOOGLE_MAPS_KEY)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Nearby Emergency Services</h1>
      </div>

      {/* Emergency call — always first */}
      <div className="bg-red-600 rounded-2xl p-4 text-white mb-6 flex items-center gap-4">
        <Phone className="w-8 h-8 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs opacity-80 font-medium uppercase tracking-widest">Immediate emergency</p>
          <p className="font-bold text-lg">Call {EMERGENCY_NUMBERS.primary}</p>
          <p className="text-xs opacity-75">Ambulance: {EMERGENCY_NUMBERS.ambulance} · Police: {EMERGENCY_NUMBERS.police}</p>
        </div>
        <a
          href={`tel:${EMERGENCY_NUMBERS.primary}`}
          className="bg-white text-red-600 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1 hover:bg-red-50 transition-colors"
          aria-label={`Call ${EMERGENCY_NUMBERS.primary}`}
        >
          <Phone className="w-4 h-4" /> Call now
        </a>
      </div>

      {/* Location section */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-slate-800">Find hospitals near you</h2>
        </div>

        {locationState === LOCATION_STATES.IDLE && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Allow location access to find nearby hospitals and emergency facilities on Google Maps.
            </p>
            <button
              onClick={requestLocation}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Share my location
            </button>
            <p className="text-xs text-slate-400 mt-2">
              Your location is used only to find nearby services and is never stored.
            </p>
          </div>
        )}

        {locationState === LOCATION_STATES.REQUESTING && (
          <div className="text-center py-6">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Getting your location…</p>
          </div>
        )}

        {locationState === LOCATION_STATES.SUCCESS && location && (
          <div className="fade-in">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
              <span>✅</span>
              <span>Location found (accuracy: ±{Math.round(location.accuracy)}m)</span>
            </div>

            {/* Map embed or placeholder */}
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                title="Nearby hospitals map"
                className="w-full h-56 rounded-xl border border-slate-200 mb-4"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="bg-slate-100 rounded-xl h-40 flex flex-col items-center justify-center text-slate-400 mb-4 border border-slate-200">
                <Map className="w-8 h-8 mb-2" />
                <p className="text-sm">Interactive map preview</p>
                <p className="text-xs mt-1">Add REACT_APP_GOOGLE_MAPS_API_KEY for embedded map</p>
              </div>
            )}

            <button
              onClick={handleOpenMaps}
              className="w-full btn-primary flex items-center justify-center gap-2 mb-3"
            >
              <Navigation className="w-4 h-4" />
              Open hospitals in Google Maps
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://www.google.com/maps/dir/${location.lat},${location.lng}/emergency+room`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm flex items-center justify-center gap-1"
              >
                🏥 Emergency room
              </a>
              <a
                href={`https://www.google.com/maps/dir/${location.lat},${location.lng}/urgent+care`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm flex items-center justify-center gap-1"
              >
                🩺 Urgent care
              </a>
            </div>

            <button
              onClick={() => { setLocationState(LOCATION_STATES.IDLE); setLocation(null); }}
              className="mt-3 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3 h-3" /> Reset location
            </button>
          </div>
        )}

        {locationState === LOCATION_STATES.ERROR && (
          <div className="fade-in">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Location unavailable</p>
                <p className="text-xs text-amber-700 mt-0.5">{locationError}</p>
              </div>
            </div>
            <button
              onClick={requestLocation}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>

            {/* Manual fallback */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Or enter your location manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualLocation}
                  onChange={e => setManualLocation(e.target.value)}
                  placeholder="E.g. Anna Nagar, Chennai"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  onKeyDown={e => e.key === 'Enter' && handleOpenMaps()}
                />
                <button
                  onClick={handleOpenMaps}
                  disabled={!manualLocation.trim()}
                  className="btn-primary text-sm px-4 disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Note about data accuracy */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
        <strong>ℹ️ About this feature:</strong> Nearby hospital data is sourced from Google Maps in real time.
        MediFirst does not fabricate hospital names, phone numbers, or availability information.
        Always call the facility to confirm availability before travelling.
        Estimated travel times shown in Google Maps are not guaranteed.
      </div>
    </div>
  );
}
