// Edit freely. Each step: { label, text, image }
const machinesData = [
  {
    "id": "aed",
    "title": "AED (defibrillator)",
    "summary": "Shocks the heart back into rhythm during cardiac arrest",
    "severity": "machine",
    "image": "/images/machines/aed/device.jpg",
    "watch": [
      "Move the person off a wet surface first.",
      "Remove medication patches from the chest.",
      "Keep pads at least 2.5 cm away from a pacemaker bump."
    ],
    "steps": [
      {
        "label": "Turn on",
        "text": "Open the lid or press ON. Follow the voice instructions.",
        "image": "/images/machines/aed/steps/step-1.jpg"
      },
      {
        "label": "Bare the chest",
        "text": "Remove clothing from the chest. Dry it if wet. Shave a patch only if hair blocks the pad and a razor is in the kit.",
        "image": "/images/machines/aed/steps/step-2.jpg"
      },
      {
        "label": "Place pads",
        "text": "Stick one pad on the upper right chest below the collarbone and one on the left side below the armpit. Use child pads for children under 8.",
        "image": "/images/machines/aed/steps/step-3.webp"
      },
      {
        "label": "Plug in",
        "text": "Connect the pad cable to the AED if it is not already connected.",
        "image": "/images/machines/aed/steps/step-4.jpg"
      },
      {
        "label": "Stand clear",
        "text": "The AED checks the heart rhythm. Nobody should touch the person.",
        "image": "/images/machines/aed/steps/step-5.jpg"
      },
      {
        "label": "Shock",
        "text": "If it advises a shock, check everyone is clear, then press the shock button. Start CPR again right away when told.",
        "image": "/images/machines/aed/steps/step-6.jpg"
      }
    ]
  },
  {
    "id": "bp-monitor",
    "title": "Blood pressure monitor (arm)",
    "summary": "Digital cuff for checking blood pressure",
    "severity": "machine",
    "image": "/images/machines/bp-monitor/device.jpg",
    "watch": [
      "180/120 or higher with chest pain, severe headache, weakness or trouble speaking: call 108.",
      "Repeated high readings: see a doctor."
    ],
    "steps": [
      {
        "label": "Rest",
        "text": "Sit with your back supported and feet flat for 5 minutes. No talking.",
        "image": "/images/machines/bp-monitor/steps/step-1.jpg"
      },
      {
        "label": "Position",
        "text": "Rest your arm on a table so the cuff is at heart level.",
        "image": "/images/machines/bp-monitor/steps/step-2.jpg"
      },
      {
        "label": "Cuff",
        "text": "Wrap the cuff on the bare upper arm, about 2 cm above the elbow crease.",
        "image": "/images/machines/bp-monitor/steps/step-3.jpg"
      },
      {
        "label": "Start",
        "text": "Press START and stay still until it finishes.",
        "image": "/images/machines/bp-monitor/steps/step-4.jpg"
      },
      {
        "label": "Record",
        "text": "Note the top number (systolic) and bottom number (diastolic). Wait 1 to 2 minutes and repeat once.",
        "image": "/images/machines/bp-monitor/steps/step-5.jpg"
      }
    ]
  },
  {
    "id": "glucometer",
    "title": "Glucometer",
    "summary": "Checks blood sugar with a finger prick",
    "severity": "machine",
    "image": "/images/machines/glucometer/device.png",
    "watch": [
      "Below 70 mg/dL: take 15 g fast sugar (3 glucose tablets or half a cup of juice), recheck in 15 minutes.",
      "Confusion, fainting, or readings above 300 mg/dL with illness: get medical help."
    ],
    "steps": [
      {
        "label": "Wash hands",
        "text": "Wash and dry your hands well.",
        "image": "/images/machines/glucometer/steps/step-1.jpg"
      },
      {
        "label": "Insert strip",
        "text": "Check the strip expiry date. Insert it into the meter.",
        "image": "/images/machines/glucometer/steps/step-2.jpg"
      },
      {
        "label": "Prick",
        "text": "Prick the side of a fingertip with a new lancet.",
        "image": "/images/machines/glucometer/steps/step-3.jpg"
      },
      {
        "label": "Apply blood",
        "text": "Touch the edge of the strip to the blood drop until the meter beeps or counts down.",
        "image": "/images/machines/glucometer/steps/step-4.jpg"
      },
      {
        "label": "Read",
        "text": "Read the result and note it with the time and whether you had eaten.",
        "image": "/images/machines/glucometer/steps/step-5.jpg"
      }
    ]
  },
  {
    "id": "pulse-oximeter",
    "title": "Pulse oximeter",
    "summary": "Fingertip clip that reads oxygen level and pulse",
    "severity": "machine",
    "image": "/images/machines/pulse-oximeter/device.jpg",
    "watch": [
      "Normal is usually 95% to 100%.",
      "Below 94% with breathing symptoms: see a doctor soon.",
      "Below 90%: emergency. Call 108."
    ],
    "steps": [
      {
        "label": "Prepare",
        "text": "Warm cold hands. Remove nail polish. Sit still and rest.",
        "image": "/images/machines/pulse-oximeter/steps/step-1.jpg"
      },
      {
        "label": "Clip on",
        "text": "Put the clip on your index finger with the screen facing up.",
        "image": "/images/machines/pulse-oximeter/steps/step-2.png"
      },
      {
        "label": "Hold steady",
        "text": "Rest your hand at heart level and stay still.",
        "image": "/images/machines/pulse-oximeter/steps/step-3.jpg"
      },
      {
        "label": "Wait",
        "text": "Wait 10 to 30 seconds until the number stops changing.",
        "image": "/images/machines/pulse-oximeter/steps/step-4.png"
      },
      {
        "label": "Read",
        "text": "Note oxygen (SpO2) and pulse.",
        "image": "/images/machines/pulse-oximeter/steps/step-5.jpg"
      }
    ]
  },
  {
    "id": "nebulizer",
    "title": "Nebulizer",
    "summary": "Turns prescribed medicine into mist to breathe in",
    "severity": "machine",
    "image": "/images/machines/nebulizer/device.jpg",
    "watch": [
      "Use only medicine a doctor prescribed.",
      "Lips turning blue, no relief, or struggling to speak: call 108."
    ],
    "steps": [
      {
        "label": "Wash hands",
        "text": "Wash your hands and place the machine on a flat surface.",
        "image": "/images/machines/nebulizer/steps/step-1.jpg"
      },
      {
        "label": "Add medicine",
        "text": "Pour only the prescribed medicine into the cup. Close it.",
        "image": "/images/machines/nebulizer/steps/step-2.jpg"
      },
      {
        "label": "Connect",
        "text": "Attach the tube to the machine and the mask or mouthpiece.",
        "image": "/images/machines/nebulizer/steps/step-3.jpg"
      },
      {
        "label": "Breathe",
        "text": "Switch on. Sit upright and breathe slowly and deeply for about 10 minutes, until the mist stops.",
        "image": "/images/machines/nebulizer/steps/step-4.jpg"
      },
      {
        "label": "Clean",
        "text": "Wash the cup and mask in warm soapy water and air dry.",
        "image": "/images/machines/nebulizer/steps/step-5.jpg"
      }
    ]
  },
  {
    "id": "thermometer",
    "title": "Digital thermometer",
    "summary": "Measures body temperature",
    "severity": "machine",
    "image": "/images/machines/thermometer/device.jpg",
    "watch": [
      "38 °C or above is a fever.",
      "Above 40 °C, fever with stiff neck or confusion, or any fever in a baby under 3 months: get urgent care."
    ],
    "steps": [
      {
        "label": "Clean",
        "text": "Wipe the tip with a clean cloth or alcohol swab.",
        "image": "/images/machines/thermometer/steps/step-1.jpg"
      },
      {
        "label": "Switch on",
        "text": "Press the button and wait for the ready beep.",
        "image": "/images/machines/thermometer/steps/step-2.jpg"
      },
      {
        "label": "Place",
        "text": "Under the tongue with lips closed, or in a dry armpit with the arm held close.",
        "image": "/images/machines/thermometer/steps/step-3.jpg"
      },
      {
        "label": "Wait",
        "text": "Hold still until it beeps, usually 10 to 60 seconds.",
        "image": "/images/machines/thermometer/steps/step-4.jpg"
      },
      {
        "label": "Read",
        "text": "Note the number and the time.",
        "image": "/images/machines/thermometer/steps/step-5.gif"
      }
    ]
  }
];

export default machinesData;
