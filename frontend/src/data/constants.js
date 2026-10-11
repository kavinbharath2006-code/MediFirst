/**
 * Demo scenarios for hackathon/offline mode.
 * These are clearly labeled as sample data, not live medical guidance.
 */
export const DEMO_SCENARIOS = [
  {
    id: 'burn',
    label: 'Severe Burn',
    icon: '🔥',
    query: 'My child accidentally touched a hot stove and has a large burn on their hand. The skin looks red and blistered.',
    response: {
      category: 'Burns',
      urgency: 'urgent',
      confidence: 0.92,
      emergencyEscalationRequired: false,
      summary: 'Second-degree burn on hand — blistering indicates dermis involvement. Requires prompt cooling and medical assessment to prevent infection.',
      immediateActions: [
        'Cool the burn immediately under cool (not cold or iced) running water for at least 10 minutes.',
        'Remove rings, bracelets, or anything near the burn before swelling begins.',
        'Do NOT burst any blisters.'
      ],
      steps: [
        {
          title: 'Cool the burn (10+ minutes)',
          instruction: 'Hold the burned area under cool running water. Do not use ice, butter, toothpaste, or any other home remedy — these worsen the injury.',
          warning: 'Avoid ice-cold water; it can cause further tissue damage and hypothermia in children.'
        },
        {
          title: 'Cover loosely',
          instruction: 'After cooling, cover the burn with a clean non-fluffy material — a cling film or a clean plastic bag works well. Do not wrap tightly.',
          warning: null
        },
        {
          title: 'Manage pain',
          instruction: 'Give age-appropriate pain relief (e.g., paracetamol/ibuprofen at the correct dose for the child\'s weight) if available and if the child is conscious.',
          warning: null
        },
        {
          title: 'Seek medical care',
          instruction: 'Burns larger than the palm of the child\'s hand, burns on the face/hands/feet/genitals, or any blistered burn in a child should be assessed by a doctor or emergency department.',
          warning: null
        }
      ],
      actionsToAvoid: [
        'Do NOT apply ice, iced water, or very cold water.',
        'Do NOT burst blisters — this increases infection risk.',
        'Do NOT apply butter, oil, toothpaste, or any other home remedy.',
        'Do NOT remove clothing stuck to the burn.'
      ],
      professionalHelp: 'Take the child to an emergency department or urgent care for any blistered burn. If the burn covers a large area or the child is in severe pain or distress, call emergency services (112 / 108).',
      sourceReferences: [
        { title: 'NHS — Treating Burns and Scalds', url: 'https://www.nhs.uk/conditions/burns-and-scalds/treatment/' },
        { title: 'Red Cross First Aid — Burns', url: 'https://www.redcross.org.uk/first-aid/learn-first-aid/burns' }
      ]
    }
  },
  {
    id: 'seizure',
    label: 'Seizure',
    icon: '⚡',
    query: 'Someone in my office is having a seizure. They collapsed, their body is shaking uncontrollably and they are not responding.',
    response: {
      category: 'Seizures',
      urgency: 'emergency',
      confidence: 0.95,
      emergencyEscalationRequired: true,
      summary: 'Active tonic-clonic seizure in an adult. Call emergency services immediately if this is their first seizure, the seizure lasts more than 5 minutes, or they do not recover consciousness.',
      immediateActions: [
        'Call emergency services (112 / 108) NOW if the seizure lasts more than 5 minutes or this is their first known seizure.',
        'Time the seizure from the moment it began.',
        'Clear the immediate area of hard or sharp objects.'
      ],
      steps: [
        {
          title: 'Protect from injury',
          instruction: 'Move chairs, desks, and sharp objects away from the person. If possible, place something soft (a folded jacket) under their head.',
          warning: 'Do NOT restrain the person. Do NOT hold them down or stop the movements.'
        },
        {
          title: 'Time the seizure',
          instruction: 'Note the exact time the seizure started. If it continues beyond 5 minutes without stopping, call 112 / 108 immediately (or confirm they are already on the way).',
          warning: null
        },
        {
          title: 'After the shaking stops',
          instruction: 'Turn the person on their side in the recovery position to keep the airway clear. Stay with them and speak calmly as they regain consciousness.',
          warning: 'Do NOT put anything in their mouth. They cannot swallow their tongue.'
        },
        {
          title: 'Monitor recovery',
          instruction: 'The person may be confused, sleepy, or distressed after the seizure (postictal state). This is normal. Stay with them until they are fully alert.',
          warning: null
        }
      ],
      actionsToAvoid: [
        'Do NOT restrain the person during the seizure.',
        'Do NOT put anything in their mouth — including fingers or objects.',
        'Do NOT give water or food until fully conscious and alert.',
        'Do NOT leave the person alone until they have fully recovered.'
      ],
      professionalHelp: 'Call 112 / 108 immediately if: the seizure lasts more than 5 minutes, there is no recovery of consciousness, this is their first known seizure, the person is pregnant, has diabetes, or is injured.',
      sourceReferences: [
        { title: 'Epilepsy Action — First Aid for Seizures', url: 'https://www.epilepsy.org.uk/info/firstaid' },
        { title: 'NHS — What to do if someone has a seizure', url: 'https://www.nhs.uk/conditions/epilepsy/what-to-do-during-a-seizure/' }
      ]
    }
  },
  {
    id: 'fracture',
    label: 'Suspected Fracture',
    icon: '🦴',
    query: 'My friend fell off a bicycle and is in severe pain. Their leg looks deformed and they cannot put any weight on it.',
    response: {
      category: 'Suspected fractures or serious injuries',
      urgency: 'urgent',
      confidence: 0.88,
      emergencyEscalationRequired: false,
      summary: 'Suspected lower-leg fracture with deformity. Keep the limb immobilized, do not attempt to realign the bone, and seek emergency medical care.',
      immediateActions: [
        'Call emergency services (112 / 108) — a deformed limb requires professional medical treatment.',
        'Keep the person still and calm. Do not move them unless they are in immediate danger.',
        'Do NOT attempt to straighten the limb or push bone back under skin.'
      ],
      steps: [
        {
          title: 'Immobilize the limb',
          instruction: 'Support the injured leg in the position you find it. Use rolled clothing, bags, or other padding on either side to stop it moving. Do not try to splint or wrap tightly.',
          warning: 'Never attempt to straighten or realign a suspected fracture.'
        },
        {
          title: 'Control bleeding if present',
          instruction: 'If there is an open wound near the fracture, apply gentle pressure around (not on) the wound with a clean cloth. Do not press on protruding bone.',
          warning: null
        },
        {
          title: 'Treat for shock',
          instruction: 'Help the person lie down comfortably. Keep them warm with a blanket or jacket. Reassure them. Do not give food or water in case surgery is needed.',
          warning: null
        },
        {
          title: 'Monitor until help arrives',
          instruction: 'Check the person\'s breathing, pulse, and level of consciousness regularly. Note any changes and report them to paramedics.',
          warning: null
        }
      ],
      actionsToAvoid: [
        'Do NOT attempt to realign or straighten the bone.',
        'Do NOT give food or drink (surgery may be required).',
        'Do NOT move the person unless they are in immediate danger.',
        'Do NOT remove clothing from the injured limb if it is stuck.'
      ],
      professionalHelp: 'Emergency services are required for suspected fractures with visible deformity. The person needs imaging (X-ray) and professional medical treatment.',
      sourceReferences: [
        { title: 'NHS — Broken bones and fractures', url: 'https://www.nhs.uk/conditions/broken-arm-or-wrist/' },
        { title: 'Red Cross — Broken Bones First Aid', url: 'https://www.redcross.org.uk/first-aid/learn-first-aid/broken-bones' }
      ]
    }
  },
  {
    id: 'anaphylaxis',
    label: 'Severe Allergic Reaction',
    icon: '⚠️',
    query: 'Someone ate peanuts at a party and is now having trouble breathing, their face and throat are swelling, and they look pale and anxious.',
    response: {
      category: 'Allergic reactions and possible anaphylaxis',
      urgency: 'emergency',
      confidence: 0.97,
      emergencyEscalationRequired: true,
      summary: 'Suspected anaphylaxis — a life-threatening allergic reaction. This is a medical emergency. Call 112 / 108 NOW. If an adrenaline auto-injector (EpiPen) is available, use it immediately.',
      immediateActions: [
        '🚨 CALL 112 / 108 NOW. Do not wait to see if symptoms improve.',
        'If an adrenaline auto-injector (EpiPen / Jext) is available, use it in the outer thigh immediately.',
        'Help the person sit up or lie down in the most comfortable position for their breathing.'
      ],
      steps: [
        {
          title: 'Call emergency services immediately',
          instruction: 'Call 112 or 108 right now. Tell them you suspect anaphylaxis. Stay on the line and follow their instructions.',
          warning: null
        },
        {
          title: 'Administer adrenaline auto-injector if available',
          instruction: 'If the person carries an EpiPen or similar auto-injector, use it. Remove the blue safety cap, press the orange tip firmly against the outer mid-thigh (through clothing is fine), hold for 10 seconds, then remove and massage the area.',
          warning: 'Adrenaline auto-injectors are the first-line treatment for anaphylaxis. Do not delay using it waiting for other help.'
        },
        {
          title: 'Position for breathing',
          instruction: 'If the person is having difficulty breathing, help them sit upright. If they feel faint or are unconscious, lay them flat with legs raised (unless breathing is difficult). Do not stand them up.',
          warning: null
        },
        {
          title: 'Give a second dose if needed',
          instruction: 'If symptoms do not improve and a second auto-injector is available, use it after 5 minutes. Continue to wait for emergency services.',
          warning: null
        }
      ],
      actionsToAvoid: [
        'Do NOT give oral antihistamines as a substitute for adrenaline — they are too slow for anaphylaxis.',
        'Do NOT stand the person up if they feel faint.',
        'Do NOT leave the person alone.',
        'Do NOT delay calling 112 / 108 to search for medication first.'
      ],
      professionalHelp: 'Anaphylaxis is always a medical emergency requiring emergency services and hospital observation even if symptoms improve after adrenaline, because symptoms can return (biphasic reaction).',
      sourceReferences: [
        { title: 'Allergy UK — Anaphylaxis Management', url: 'https://www.allergyuk.org/resources/anaphylaxis/' },
        { title: 'NHS — Anaphylaxis Treatment', url: 'https://www.nhs.uk/conditions/anaphylaxis/treatment/' }
      ]
    }
  }
];

export const EMERGENCY_CATEGORIES = [
  { id: 'cardiac', label: 'Cardiac / Chest Pain', icon: '❤️', color: 'red' },
  { id: 'bleeding', label: 'Severe Bleeding', icon: '🩸', color: 'red' },
  { id: 'breathing', label: 'Breathing Difficulty', icon: '🫁', color: 'orange' },
  { id: 'burns', label: 'Burns', icon: '🔥', color: 'orange' },
  { id: 'fracture', label: 'Fracture / Injury', icon: '🦴', color: 'amber' },
  { id: 'seizure', label: 'Seizure', icon: '⚡', color: 'amber' },
  { id: 'allergic', label: 'Allergic Reaction', icon: '⚠️', color: 'amber' },
  { id: 'choking', label: 'Choking', icon: '😮', color: 'red' },
  { id: 'poisoning', label: 'Poisoning', icon: '☠️', color: 'purple' },
  { id: 'fainting', label: 'Fainting / Unconscious', icon: '💤', color: 'blue' },
];

export const URGENCY_CONFIG = {
  emergency: {
    label: 'Emergency',
    subLabel: 'Call emergency services immediately',
    color: 'red',
    icon: '🚨',
    bgClass: 'bg-red-50 border-red-300',
    textClass: 'text-red-800',
    badgeClass: 'bg-red-600 text-white',
    dotClass: 'bg-red-500',
  },
  urgent: {
    label: 'Urgent',
    subLabel: 'Seek prompt professional care',
    color: 'amber',
    icon: '⚠️',
    bgClass: 'bg-amber-50 border-amber-300',
    textClass: 'text-amber-800',
    badgeClass: 'bg-amber-500 text-white',
    dotClass: 'bg-amber-500',
  },
  non_emergency: {
    label: 'Non-Emergency',
    subLabel: 'Professional assessment recommended',
    color: 'green',
    icon: 'ℹ️',
    bgClass: 'bg-green-50 border-green-300',
    textClass: 'text-green-800',
    badgeClass: 'bg-green-600 text-white',
    dotClass: 'bg-green-500',
  },
  uncertain: {
    label: 'Uncertain',
    subLabel: 'Exercise caution — consult a professional',
    color: 'slate',
    icon: '❓',
    bgClass: 'bg-slate-50 border-slate-300',
    textClass: 'text-slate-700',
    badgeClass: 'bg-slate-500 text-white',
    dotClass: 'bg-slate-400',
  },
};

export const EMERGENCY_NUMBERS = {
  primary: '112',
  ambulance: '108',
  police: '100',
  fire: '101',
};
