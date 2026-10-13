// Edit freely. Each step: { label, text, image }
const firstAidData = [
  {
    "id": "cpr",
    "title": "CPR for an adult",
    "summary": "Not responding and not breathing normally",
    "severity": "critical",
    "types": [
      "cardiac"
    ],
    "call": true,
    "dont": [
      "Do not stop to check the pulse again and again.",
      "Do not give water or food.",
      "Do not worry about hurting ribs. Pushing hard is correct."
    ],
    "steps": [
      {
        "label": "Check",
        "text": "Make sure the area is safe. Tap their shoulders firmly and shout \"Are you okay?\"",
        "image": "/images/first-aid/cpr-1.svg"
      },
      {
        "label": "Call",
        "text": "No response and not breathing normally? Call 108 or 112, or tell someone nearby to call. Ask for an AED (defibrillator).",
        "image": "/images/first-aid/cpr-2.svg"
      },
      {
        "label": "Hand position",
        "text": "Lay the person flat on a firm surface. Put the heel of one hand on the centre of the chest, the other hand on top, arms straight.",
        "image": "/images/first-aid/cpr-3.svg"
      },
      {
        "label": "Push",
        "text": "Push hard and fast: about 5 cm deep, 100 to 120 pushes a minute. Let the chest rise fully between pushes.",
        "image": "/images/first-aid/cpr-4.svg"
      },
      {
        "label": "Breaths",
        "text": "If you are trained, give 2 breaths after every 30 pushes. If not, keep pushing without stopping (hands-only CPR).",
        "image": "/images/first-aid/cpr-5.svg"
      },
      {
        "label": "Keep going",
        "text": "Continue until the ambulance or AED arrives, the person starts breathing, or you cannot continue. Swap with someone every 2 minutes if you can.",
        "image": "/images/first-aid/cpr-6.svg"
      }
    ]
  },
  {
    "id": "bleeding",
    "title": "Severe bleeding",
    "summary": "Blood is spurting or soaking through cloth",
    "severity": "critical",
    "types": [
      "trauma"
    ],
    "call": true,
    "dont": [
      "Do not remove objects stuck in the wound.",
      "Do not use a tourniquet unless you are trained and pressure is not working on an arm or leg."
    ],
    "steps": [
      {
        "label": "Call",
        "text": "Call 108 for heavy bleeding. Put on gloves or use a plastic bag over your hand if you have one.",
        "image": "/images/first-aid/bleeding-1.svg"
      },
      {
        "label": "Press",
        "text": "Press firmly on the wound with a clean cloth or gauze. Keep pressing without lifting.",
        "image": "/images/first-aid/bleeding-2.svg"
      },
      {
        "label": "Add layers",
        "text": "If blood soaks through, put more cloth on top. Do not remove the first layer.",
        "image": "/images/first-aid/bleeding-3.svg"
      },
      {
        "label": "Raise",
        "text": "Raise the injured arm or leg above heart level, unless you suspect a broken bone.",
        "image": "/images/first-aid/bleeding-4.svg"
      },
      {
        "label": "Bandage",
        "text": "Wrap a firm bandage over the pad. It should be snug, not so tight that fingers or toes turn blue.",
        "image": "/images/first-aid/bleeding-5.svg"
      },
      {
        "label": "Keep warm",
        "text": "Lay the person down and keep them warm and calm. Watch for pale skin, sweating or drowsiness.",
        "image": "/images/first-aid/bleeding-6.svg"
      }
    ]
  },
  {
    "id": "burns",
    "title": "Burns",
    "summary": "Heat, hot liquid, fire or chemical burns",
    "severity": "urgent",
    "types": [
      "burns"
    ],
    "call": false,
    "dont": [
      "Do not use ice, toothpaste, butter, oil or turmeric.",
      "Do not burst blisters.",
      "Do not peel off stuck clothing."
    ],
    "steps": [
      {
        "label": "Stop the burn",
        "text": "Move away from the heat source. Put out flames by stop, drop and roll. Switch off electricity before touching an electrical burn victim.",
        "image": "/images/first-aid/burns-1.svg"
      },
      {
        "label": "Cool",
        "text": "Hold the burn under cool running tap water for 20 minutes. For chemical burns, brush off dry powder first, then flush with water for at least 20 minutes.",
        "image": "/images/first-aid/burns-2.svg"
      },
      {
        "label": "Remove",
        "text": "Gently take off rings, watches and tight clothing near the burn before it swells. Leave anything stuck to the skin.",
        "image": "/images/first-aid/burns-3.svg"
      },
      {
        "label": "Cover",
        "text": "Cover loosely with clean cling film or a clean non-fluffy cloth.",
        "image": "/images/first-aid/burns-4.svg"
      },
      {
        "label": "Get help",
        "text": "Go to hospital or call 108 for burns that are larger than the person's palm, on the face, hands, feet or genitals, deep, chemical, or electrical.",
        "image": "/images/first-aid/burns-5.svg"
      }
    ]
  },
  {
    "id": "choking",
    "title": "Choking (adult)",
    "summary": "Cannot speak, cough or breathe",
    "severity": "critical",
    "types": [
      "ent"
    ],
    "call": true,
    "dont": [
      "Do not slap the back if they are coughing effectively.",
      "Do not put your fingers in the mouth blindly.",
      "Infants need a different method. Call 108 and get trained help."
    ],
    "steps": [
      {
        "label": "Ask",
        "text": "Ask \"Are you choking?\" If they can cough, encourage them to keep coughing.",
        "image": "/images/first-aid/choking-1.svg"
      },
      {
        "label": "Back blows",
        "text": "If they cannot cough, speak or breathe: lean them forward and give up to 5 firm blows between the shoulder blades.",
        "image": "/images/first-aid/choking-2.svg"
      },
      {
        "label": "Abdominal thrusts",
        "text": "Stand behind them, make a fist above the belly button, grip it with your other hand and pull sharply inwards and upwards. Do up to 5.",
        "image": "/images/first-aid/choking-3.svg"
      },
      {
        "label": "Alternate",
        "text": "Keep alternating 5 back blows and 5 abdominal thrusts. Call 108 if it does not clear.",
        "image": "/images/first-aid/choking-4.svg"
      },
      {
        "label": "If they collapse",
        "text": "If they become unresponsive, lay them down, call 108 and start CPR.",
        "image": "/images/first-aid/choking-5.svg"
      }
    ]
  },
  {
    "id": "fracture",
    "title": "Broken bone",
    "summary": "Pain, swelling, odd shape after a fall or hit",
    "severity": "urgent",
    "types": [
      "fracture",
      "trauma"
    ],
    "call": false,
    "dont": [
      "Do not try to straighten the bone.",
      "Do not let them eat or drink if surgery may be needed."
    ],
    "steps": [
      {
        "label": "Keep still",
        "text": "Help the person stay still. If the head, neck or back may be hurt, do not move them and call 108.",
        "image": "/images/first-aid/fracture-1.svg"
      },
      {
        "label": "Stop bleeding",
        "text": "If there is an open wound, cover it with a clean cloth and press gently around it.",
        "image": "/images/first-aid/fracture-2.svg"
      },
      {
        "label": "Splint",
        "text": "Support the limb in the position found. Pad it and tie a splint (rolled newspaper or a stick) so it covers the joints above and below the break.",
        "image": "/images/first-aid/fracture-3.svg"
      },
      {
        "label": "Cold pack",
        "text": "Hold a cloth-wrapped ice pack on the area for 15 to 20 minutes to ease swelling.",
        "image": "/images/first-aid/fracture-4.svg"
      },
      {
        "label": "Go to hospital",
        "text": "Get an X-ray at the nearest hospital with orthopaedics.",
        "image": "/images/first-aid/fracture-5.svg"
      }
    ]
  },
  {
    "id": "snakebite",
    "title": "Snakebite",
    "summary": "Bitten or suspected bite by a snake",
    "severity": "critical",
    "types": [
      "snakebite",
      "poisoning"
    ],
    "call": true,
    "dont": [
      "Do not cut the bite, suck it, or tie a tight band.",
      "Do not apply ice, herbs or turmeric.",
      "Do not try to catch or kill the snake."
    ],
    "steps": [
      {
        "label": "Stay calm",
        "text": "Move away from the snake. Keep the person calm and still. Panic and movement spread venom faster.",
        "image": "/images/first-aid/snakebite-1.svg"
      },
      {
        "label": "Call",
        "text": "Call 108 now. Antivenom is only available in hospitals.",
        "image": "/images/first-aid/snakebite-2.svg"
      },
      {
        "label": "Remove tight items",
        "text": "Take off rings, bangles and anklets near the bite before swelling starts.",
        "image": "/images/first-aid/snakebite-3.svg"
      },
      {
        "label": "Immobilise",
        "text": "Keep the bitten limb still, at about heart level. A splint helps. Note the time of the bite.",
        "image": "/images/first-aid/snakebite-4.svg"
      },
      {
        "label": "Go to hospital",
        "text": "Travel lying down or seated, without walking. Tell the doctor the time and any symptoms. A photo of the snake is helpful only if it is safe.",
        "image": "/images/first-aid/snakebite-5.svg"
      }
    ]
  },
  {
    "id": "poisoning",
    "title": "Poisoning",
    "summary": "Swallowed or breathed in something harmful",
    "severity": "critical",
    "types": [
      "poisoning"
    ],
    "call": true,
    "dont": [
      "Do not make the person vomit.",
      "Do not give milk, salt water or home remedies."
    ],
    "steps": [
      {
        "label": "Get safe",
        "text": "Move the person to fresh air if fumes are the cause. Do not put yourself at risk.",
        "image": "/images/first-aid/poisoning-1.svg"
      },
      {
        "label": "Call",
        "text": "Call 108. You can also reach the national poison helpline 1800-116-117 (verify before relying on it).",
        "image": "/images/first-aid/poisoning-2.svg"
      },
      {
        "label": "Keep the evidence",
        "text": "Keep the container, tablets or plant. Note what, how much, and when.",
        "image": "/images/first-aid/poisoning-3.svg"
      },
      {
        "label": "If awake",
        "text": "Rinse the mouth with water. Stay with them and watch their breathing.",
        "image": "/images/first-aid/poisoning-4.svg"
      },
      {
        "label": "If drowsy",
        "text": "If they are drowsy but breathing, lay them on their side. If not breathing, start CPR.",
        "image": "/images/first-aid/poisoning-5.svg"
      }
    ]
  },
  {
    "id": "seizure",
    "title": "Seizure",
    "summary": "Uncontrolled shaking or sudden blackout",
    "severity": "urgent",
    "types": [
      "seizure"
    ],
    "call": false,
    "dont": [
      "Do not hold them down.",
      "Do not put anything in their mouth.",
      "Do not give water until fully awake."
    ],
    "steps": [
      {
        "label": "Clear space",
        "text": "Move hard or sharp objects away. Cushion the head with a folded cloth.",
        "image": "/images/first-aid/seizure-1.svg"
      },
      {
        "label": "Time it",
        "text": "Note when it started. Most seizures stop within 2 to 3 minutes.",
        "image": "/images/first-aid/seizure-2.svg"
      },
      {
        "label": "Loosen",
        "text": "Loosen tight clothing around the neck.",
        "image": "/images/first-aid/seizure-3.svg"
      },
      {
        "label": "Recovery position",
        "text": "When the shaking stops, turn them gently onto their side. Stay with them until fully awake.",
        "image": "/images/first-aid/seizure-4.svg"
      },
      {
        "label": "When to call",
        "text": "Call 108 if it lasts more than 5 minutes, happens again, it is their first seizure, they are injured or pregnant, or they have trouble breathing afterwards.",
        "image": "/images/first-aid/seizure-5.svg"
      }
    ]
  },
  {
    "id": "heart-attack",
    "title": "Heart attack",
    "summary": "Chest pressure, sweating, pain in arm or jaw",
    "severity": "critical",
    "types": [
      "cardiac"
    ],
    "call": true,
    "dont": [
      "Do not let them walk around or drive themselves.",
      "Do not give food or drink."
    ],
    "steps": [
      {
        "label": "Call",
        "text": "Call 108 immediately. Do not wait to see if it passes.",
        "image": "/images/first-aid/heart-attack-1.svg"
      },
      {
        "label": "Sit and rest",
        "text": "Help the person sit down, leaning back, with knees bent. Loosen tight clothing.",
        "image": "/images/first-aid/heart-attack-2.svg"
      },
      {
        "label": "Aspirin",
        "text": "If they are not allergic and have no bleeding problems, give one 300 mg aspirin to chew slowly.",
        "image": "/images/first-aid/heart-attack-3.svg"
      },
      {
        "label": "Stay with them",
        "text": "Keep them calm. Unlock the door and send someone to meet the ambulance.",
        "image": "/images/first-aid/heart-attack-4.svg"
      },
      {
        "label": "If they collapse",
        "text": "If they stop responding and are not breathing normally, start CPR and use an AED if available.",
        "image": "/images/first-aid/heart-attack-5.svg"
      }
    ]
  },
  {
    "id": "stroke",
    "title": "Stroke (FAST)",
    "summary": "Face droop, arm weakness, slurred speech",
    "severity": "critical",
    "types": [
      "stroke",
      "seizure"
    ],
    "call": true,
    "dont": [
      "Do not give food, drink or medicine.",
      "Do not wait for symptoms to pass."
    ],
    "steps": [
      {
        "label": "Face",
        "text": "Ask them to smile. Is one side of the face drooping?",
        "image": "/images/first-aid/stroke-1.svg"
      },
      {
        "label": "Arms",
        "text": "Ask them to raise both arms. Does one arm drift down or feel weak?",
        "image": "/images/first-aid/stroke-2.svg"
      },
      {
        "label": "Speech",
        "text": "Ask them to repeat a simple sentence. Is it slurred or strange?",
        "image": "/images/first-aid/stroke-3.svg"
      },
      {
        "label": "Time: call",
        "text": "Any one sign means call 108 now. Treatment works best within the first few hours.",
        "image": "/images/first-aid/stroke-4.svg"
      },
      {
        "label": "Note the time",
        "text": "Note when symptoms first started and tell the hospital. Go to a hospital with a neurology and CT facility.",
        "image": "/images/first-aid/stroke-5.svg"
      }
    ]
  }
];

export default firstAidData;
