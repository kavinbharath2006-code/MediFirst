import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  HeartPulseIcon,
  Stethoscope,
  Info,
  PhoneCall
} from '../components/icons';
import { getCurrentPosition, buildNearbyHospitalsUrl, getMapEmbedUrl } from '../api/geolocation';
import { EMERGENCY_NUMBERS } from '../data/constants';

const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const LOCATION_STATES = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  SUCCESS: 'success',
  ERROR: 'error',
};


// ─── Live Map Tracker Component ───────────────────────────────────────────────
function LiveMapTracker({ lat, lng, accuracy }) {
  const dotRef = useRef(null);
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.008},${lng + 0.012},${lat + 0.008}&layer=mapnik&marker=${lat},${lng}`;

  // Pulse animation on mount
  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;
    dot.animate(
      [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }],
      { duration: 1500, iterations: Infinity, easing: 'ease-out' }
    );
  }, []);

  return (
    <div className="relative w-full mb-5 rounded-2xl overflow-hidden border border-sky-200 shadow-sm" style={{ height: '260px' }}>
      {/* OSM iframe */}
      <iframe
        src={osmUrl}
        title="Live location map"
        className="absolute inset-0 w-full h-full"
        style={{ border: 0, filter: 'hue-rotate(195deg) saturate(0.85) brightness(1.04)' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Sky-blue theme tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(14,116,144,0.08) 0%, rgba(2,132,199,0.05) 100%)', mixBlendMode: 'multiply' }}
      />

      {/* Pulsing location tracker pin */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center justify-center">
          {/* Accuracy ring */}
          <div
            className="absolute rounded-full border-2 border-sky-400/40 bg-sky-400/10"
            style={{ width: Math.min(80, Math.max(32, accuracy / 4)), height: Math.min(80, Math.max(32, accuracy / 4)) }}
          />
          {/* Pulse ripple */}
          <div
            ref={dotRef}
            className="absolute w-10 h-10 rounded-full bg-sky-500/30 border border-sky-400/50"
          />
          {/* Core dot */}
          <div className="relative w-5 h-5 rounded-full bg-sky-600 border-2 border-white shadow-lg flex items-center justify-center z-10">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          {/* Pin tail */}
          <div className="absolute top-[22px] w-0.5 h-3 bg-sky-700 z-10" style={{ left: 'calc(50% - 1px)' }} />
        </div>
      </div>

      {/* Coordinate badge — top left */}
      <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm pointer-events-none z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span>{lat.toFixed(5)}° N, {lng.toFixed(5)}° E</span>
      </div>

      {/* OSM attribution badge — bottom right */}
      <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-slate-500 text-[9px] px-2 py-0.5 rounded font-mono z-20 pointer-events-none">
        © OpenStreetMap
      </div>

      {/* Accuracy badge — bottom left */}
      <div className="absolute bottom-2 left-2 bg-sky-700/90 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded-md z-20 pointer-events-none">
        ±{Math.round(accuracy)}m
      </div>

      {/* Top gradient fade (hides OSM header UI) */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-50/40 to-transparent pointer-events-none z-10" />
    </div>
  );
}

export default function Services() {

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
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-16 antialiased">
      
      {/* Header Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-md border border-slate-200/90 shadow-2xs mb-3">
          <span className="w-2 h-2 rounded-full bg-sky-700" />
          <span className="uppercase font-mono tracking-wider">Geolocation Telemetry · Regional Fleet</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Nearby Emergency Facilities
        </h1>
        <p className="mt-2 text-base text-slate-600 font-light leading-relaxed">
          Locate verified 24-hour trauma bays, specialty ICU facilities, and acute emergency rooms mapped to your real-time GPS coordinates.
        </p>
      </div>

      {/* Emergency Call Card */}
      <div className="bg-rose-700 rounded-2xl p-5 text-white mb-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-800 flex items-center justify-center text-white shrink-0">
            <PhoneCall className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-rose-200 font-mono">
              Life-Threatening Emergency
            </p>
            <p className="font-bold text-lg leading-tight">Dial Direct EMS: {EMERGENCY_NUMBERS.primary}</p>
            <p className="text-xs text-rose-200 mt-0.5">
              Ambulance: {EMERGENCY_NUMBERS.ambulance} · National Emergency: {EMERGENCY_NUMBERS.police}
            </p>
          </div>
        </div>
        <a
          href={`tel:${EMERGENCY_NUMBERS.primary}`}
          className="w-full sm:w-auto bg-white text-rose-700 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors shrink-0 shadow-xs"
          aria-label={`Call ${EMERGENCY_NUMBERS.primary}`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call Ambulance Now</span>
        </a>
      </div>

      {/* Location Section Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs mb-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
              GPS Emergency Locator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Query hospital proximity via real-time satellite telemetry
            </p>
          </div>
          <MapPin className="w-5 h-5 text-sky-700" />
        </div>

        {locationState === LOCATION_STATES.IDLE && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-4 text-sky-700">
              <MapPin size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Find Nearest Emergency Bays
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mb-6 max-w-md mx-auto leading-relaxed">
              Enable device location permissions to locate immediate 24-hr trauma centers and calculate ambulance routes.
            </p>
            <button
              onClick={requestLocation}
              className="px-6 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Query My Current Location</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-3 font-mono">
              Coordinates are calculated in-browser and never persisted remotely.
            </p>
          </div>
        )}

        {locationState === LOCATION_STATES.REQUESTING && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 text-sky-700 animate-spin mx-auto mb-3" />
            <p className="text-slate-700 text-sm font-semibold">Resolving GPS Satellites…</p>
            <p className="text-slate-400 text-xs mt-1">Acquiring high-accuracy latitude & longitude coordinates</p>
          </div>
        )}

        {locationState === LOCATION_STATES.SUCCESS && location && (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>
                Coordinates Acquired: {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E (Accuracy: ±{Math.round(location.accuracy)}m)
              </span>
            </div>

            {/* Map preview */}
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                title="Nearby hospitals map"
                className="w-full h-64 rounded-xl border border-slate-200 mb-5"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <LiveMapTracker lat={location.lat} lng={location.lng} accuracy={location.accuracy} />
            )}

            <button
              onClick={handleOpenMaps}
              className="w-full py-3.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 mb-3"
            >
              <Navigation className="w-4 h-4" />
              <span>Launch Hospital Navigation in Google Maps</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={`https://www.google.com/maps/dir/${location.lat},${location.lng}/emergency+room`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <HeartPulseIcon size={16} className="text-rose-600" />
                <span>Route to Emergency Casualty Bay</span>
              </a>
              <a
                href={`https://www.google.com/maps/dir/${location.lat},${location.lng}/urgent+care`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Stethoscope size={16} className="text-sky-700" />
                <span>Route to Urgent Care Clinic</span>
              </a>
            </div>

            <button
              onClick={() => { setLocationState(LOCATION_STATES.IDLE); setLocation(null); }}
              className="mt-4 text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 mx-auto transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Coordinates</span>
            </button>
          </div>
        )}

        {locationState === LOCATION_STATES.ERROR && (
          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">Geolocation Fix Unavailable</p>
                <p className="text-xs text-amber-700 mt-0.5">{locationError}</p>
              </div>
            </div>
            <button
              onClick={requestLocation}
              className="w-full py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mb-5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Satellite Query</span>
            </button>

            {/* Manual fallback input */}
            <div className="border-t border-slate-100 pt-5">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Or search your regional landmark manually:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="e.g. Anna Nagar, Chennai"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenMaps()}
                />
                <button
                  onClick={handleOpenMaps}
                  disabled={!manualLocation.trim()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advisory notice */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
        <Info size={16} className="text-sky-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-700">Clinical Data Integrity:</strong> Hospital locations are cross-referenced with regional health registry mappings. Always place a call to the casualty desk prior to arrival for high-acuity polytrauma or active resuscitation cases.
        </div>
      </div>

    </main>
  );
}
