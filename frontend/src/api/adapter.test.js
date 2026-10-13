/**
 * Unit tests for src/api/adapter.js (react-scripts / Jest).
 * Run with: npm test -- --watchAll=false
 */
import { adaptGuidanceResponse } from './adapter';

// A minimal, realistic backend body as returned by POST /api/guidance.
function backendBody(overrides = {}) {
  return {
    success: true,
    query: 'Someone is having a seizure',
    urgency: {
      level: 'HIGH',
      emergencyType: 'seizure',
      callAmbulance: true,
      matchedKeywords: ['seizure'],
    },
    steps: ['Clear the area', 'Protect the head', 'Recover position', 'Time the seizure', 'Stay with them', 'Call 112 if over 5 min'],
    doNotDo: ['Do not restrain the person', 'Do not put anything in their mouth'],
    estimatedResponseTime: '5–10 minutes',
    mistakes: ['Panicking'],
    watchFor: ['Breathing'],
    nearbyHospitals: [{ name: 'X', distanceKm: 1.2 }],
    hospitalDataSource: 'demo',
    responseTimeMs: 1234,
    sessionId: 'sess-1',
    queryLogId: null,
    feedbackAvailable: false,
    aiSource: 'gemini',
    aiModel: 'gemini-flash-latest',
    degraded: false,
    ...overrides,
  };
}

describe('adaptGuidanceResponse — urgency mapping', () => {
  test.each([
    ['CRITICAL', 'emergency'],
    ['HIGH', 'urgent'],
    ['MODERATE', 'non_emergency'],
    ['LOW', 'uncertain'],
  ])('%s maps to %s', (backendLevel, frontendUrgency) => {
    const body = backendBody({
      urgency: { level: backendLevel, emergencyType: 'general', callAmbulance: backendLevel === 'CRITICAL' },
    });
    const out = adaptGuidanceResponse(body);
    expect(out.urgency).toBe(frontendUrgency);
    expect(out.urgencyLevelRaw).toBe(backendLevel);
  });

  test('unknown or missing level degrades to uncertain', () => {
    expect(adaptGuidanceResponse(backendBody({ urgency: { level: 'MEGA' } })).urgency).toBe('uncertain');
    expect(adaptGuidanceResponse({}).urgency).toBe('uncertain');
  });

  test('callAmbulance is preserved and drives emergencyEscalationRequired', () => {
    const on = adaptGuidanceResponse(backendBody()); // HIGH + callAmbulance:true
    expect(on.callAmbulance).toBe(true);
    expect(on.emergencyEscalationRequired).toBe(true);

    const off = adaptGuidanceResponse(
      backendBody({ urgency: { level: 'LOW', emergencyType: 'sprain', callAmbulance: false } })
    );
    expect(off.callAmbulance).toBe(false);
    expect(off.emergencyEscalationRequired).toBe(false);
  });
});

describe('adaptGuidanceResponse — steps', () => {
  test('string[] becomes ordered step objects with instruction text', () => {
    const out = adaptGuidanceResponse(backendBody());
    expect(out.steps).toHaveLength(6);
    expect(out.steps[0]).toMatchObject({ order: 1, text: 'Clear the area', instruction: 'Clear the area' });
    expect(out.steps[5].order).toBe(6);
  });

  test('stepsDetailed passes imageUrl, caption, alt and metronomeBpm through', () => {
    const out = adaptGuidanceResponse(
      backendBody({
        steps: ['compress', 'breathe'],
        stepsDetailed: [
          { title: 'Chest compressions', imageUrl: '/assets/cpr.png', caption: 'Push hard and fast', alt: 'CPR diagram', metronomeBpm: 110 },
          { title: 'Rescue breaths', imageUrl: '/assets/breath.png', caption: 'Pinch the nose', alt: 'Breaths diagram' },
        ],
      })
    );
    expect(out.steps[0]).toMatchObject({
      title: 'Chest compressions',
      imageUrl: '/assets/cpr.png',
      caption: 'Push hard and fast',
      alt: 'CPR diagram',
      metronomeBpm: 110,
    });
    expect(out.steps[1].metronomeBpm).toBeUndefined();
  });

  test('empty steps array adapts to an empty array without throwing', () => {
    const out = adaptGuidanceResponse(backendBody({ steps: [] }));
    expect(out.steps).toEqual([]);
    // validateResponse() in claude.js rejects this → UI shows safe fallback
    expect(['emergency', 'urgent', 'non_emergency', 'uncertain']).toContain(out.urgency);
    expect(Array.isArray(out.immediateActions)).toBe(true);
  });
});

describe('adaptGuidanceResponse — fallback error body', () => {
  test('success:false with steps still adapts them to the screen', () => {
    const out = adaptGuidanceResponse(
      backendBody({ success: false, error: 'Gemini unavailable — using static fallback', guidanceSource: 'static-fallback' })
    );
    expect(out.steps.length).toBeGreaterThan(0);
    expect(out._error).toBe('Gemini unavailable — using static fallback');
    expect(out.guidanceSource).toBe('static-fallback');
  });

  test('success:false without steps is flagged as fallback', () => {
    const out = adaptGuidanceResponse({ success: false, error: 'boom', steps: [] });
    expect(out._isFallback).toBe(true);
    expect(out.steps).toEqual([]);
  });
});

describe('adaptGuidanceResponse — pass-through fields', () => {
  test('carries doNotDo, hospitals, spokenScript, guidanceSource and timings unchanged', () => {
    const body = backendBody({
      spokenScript: 'Step one, clear the area…',
      timings: { total: 4200, gemini: 3100 },
    });
    const out = adaptGuidanceResponse(body);
    expect(out.doNotDo).toEqual(body.doNotDo);
    expect(out.actionsToAvoid).toEqual(body.doNotDo);
    expect(out.nearbyHospitals).toEqual(body.nearbyHospitals);
    expect(out.hospitalDataSource).toBe('demo');
    expect(out.spokenScript).toBe('Step one, clear the area…');
    expect(out.timings).toEqual({ total: 4200, gemini: 3100 });
    expect(out.guidanceSource).toBe('gemini'); // falls back to aiSource
    expect(out.sessionId).toBe('sess-1');
  });

  test('responseTimeMs is used as timings when no explicit timings object', () => {
    expect(adaptGuidanceResponse(backendBody()).timings).toBe(1234);
  });

  test('category derives from emergencyType when backend has no category', () => {
    expect(adaptGuidanceResponse(backendBody()).category).toBe('Seizure');
  });
});
