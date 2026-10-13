export const TYPES = [
  { id: 'trauma', label: 'Accident or injury', emoji: '🚑' },
  { id: 'fracture', label: 'Broken bone', emoji: '🦴' },
  { id: 'burns', label: 'Burns', emoji: '🔥' },
  { id: 'cardiac', label: 'Chest pain or heart', emoji: '❤️' },
  { id: 'stroke', label: 'Stroke signs', emoji: '🧠' },
  { id: 'seizure', label: 'Seizure', emoji: '⚡' },
  { id: 'poisoning', label: 'Poisoning', emoji: '🧪' },
  { id: 'snakebite', label: 'Snakebite', emoji: '🐍' },
  { id: 'breathing', label: 'Trouble breathing', emoji: '🌬️' },
  { id: 'pregnancy', label: 'Pregnancy emergency', emoji: '🤰' },
  { id: 'eye', label: 'Eye injury', emoji: '👁️' },
];

// Any ticked flag means: call the ambulance first, then use the app.
export const CRITICAL_FLAGS = [
  { id: 'unresponsive', label: 'Does not respond when spoken to or shaken', guide: 'cpr' },
  { id: 'notBreathing', label: 'Not breathing, or only gasping', guide: 'cpr' },
  { id: 'severeBleeding', label: 'Bleeding that will not stop', guide: 'bleeding' },
  { id: 'chestPain', label: 'Crushing chest pain or pressure', guide: 'heart-attack' },
  { id: 'faceDroop', label: 'Face drooping, arm weakness or slurred speech', guide: 'stroke' },
  { id: 'seizureNow', label: 'Seizure now, or lasting over 5 minutes', guide: 'seizure' },
];

export const isCritical = (flags) => flags.length > 0;

export function buildSummary(form, location, topHospital) {
  const typeLabel = TYPES.find((t) => t.id === form.type)?.label || 'Medical Emergency';
  const hasCoords = location?.lat && location?.lng;
  const mapsLink = hasCoords ? `https://maps.google.com/?q=${location.lat},${location.lng}` : (location?.label || null);

  const lines = [
    `🚨 MEDIFIRST EMERGENCY FIRST-AID ALERT: ${typeLabel.toUpperCase()}`,
    `👤 Patient: ${form.name || 'Emergency Patient'}${form.age ? ` (${form.age} yrs)` : ''}`,
    form.flags?.length ? `⚠️ Signs: ${CRITICAL_FLAGS.filter((f) => form.flags.includes(f.id)).map((f) => f.label).join('; ')}` : null,
    form.bloodGroup ? `🩸 Blood Group: ${form.bloodGroup}` : null,
    form.allergies ? `⚠️ Allergies: ${form.allergies}` : null,
    form.conditions ? `🩺 Chronic Conditions: ${form.conditions}` : null,
    form.medicines ? `💊 Current Meds: ${form.medicines}` : null,
    mapsLink ? `📍 Live Incident Location: ${mapsLink}` : null,
    topHospital ? `🏥 Destination Hospital: ${topHospital.name}${topHospital.phone ? ` (${topHospital.phone})` : ''}` : null,
    form.relativePhone ? `📞 Relative Notified: ${form.relativeName ? form.relativeName + ' - ' : ''}${form.relativePhone}` : null,
    `⏱️ STATUS: First-aid is actively being administered. Paramedics / EMS alerted.`,
  ];
  return lines.filter(Boolean).join('\n');
}
