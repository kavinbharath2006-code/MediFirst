const { rankHospitals } = require('./utils/rankHospitals');
const H = [
  { name: 'Rela', specialties: ['trauma', 'burns', 'icu'], emergencyAvailable: true, lat: 12.955, lng: 80.139 },
  { name: 'Hindu Mission', specialties: ['trauma', 'icu'], emergencyAvailable: false, lat: 12.924, lng: 80.114 },
  { name: 'Untagged', specialties: [], emergencyAvailable: true, lat: 12.945, lng: 80.134 },
];
const origin = { lat: 12.9249, lng: 80.1 };
const r = rankHospitals(H, { requiredTags: ['burns', 'icu'], origin });
console.assert(r[0].name === 'Rela', 'burns should put Rela first');
console.assert(!r.find((h) => h.name === 'Untagged'), 'untagged hospital must not match');
const t = rankHospitals(H, { requiredTags: ['trauma'], origin });
console.assert(t.length === 2 && t[0].emergencyAvailable, '24h casualty ranks above unconfirmed');
console.log(JSON.stringify(r, null, 1));
