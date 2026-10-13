/**
 * EmergencyHeroLandingPage.jsx
 * KavAsh Care / MediFirst — Complete Editorial Redesign
 * Design language: Japanese editorial · Crimson/Carbon/Porcelain
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// Custom animated icons from the project's icon system
import {
  Activity,
  PhoneCall,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  ChevronRight,
} from '../components/icons';
// Lucide icons not yet in the custom icon index
import {
  ChevronDown,
  Heart,
  Wind,
  Flame,
  Clock,
  Radio,
  Hospital,
  Truck,
} from 'lucide-react';
import { EMERGENCY_NUMBERS } from '../data/constants';

/* ─────────────────────────────────────────────────────────────
   DATA CONSTANTS
───────────────────────────────────────────────────────────── */

const HERO_STEP_CARDS = [
  {
    num: '01',
    title: 'Immediate Life-Threat Assessment',
    body: 'Evaluate airway patency, respiratory effort, and circulatory status using a structured primary survey within the first 60 seconds of patient contact.',
    tag: 'Primary Survey',
  },
  {
    num: '02',
    title: 'Turn-by-Turn Voice Guidance',
    body: 'Real-time AI-narrated triage instructions adapt dynamically to reported vitals — CPR cadence, tourniquet application, and EMS relay simultaneously.',
    tag: 'AI-Assisted',
  },
];

const PROTOCOL_CARDS = [
  {
    id: 'cpr',
    icon: Heart,
    category: 'Cardiac',
    tag: 'Under 3 min action',
    urgency: 'Trauma Level 1',
    title: 'CPR & AED Deployment',
    body: 'Continuous chest compressions at 100–120 bpm. Power on AED immediately upon arrival and follow audio instructions.',
    color: 'bg-red-50 border-red-100',
    iconBg: 'bg-crimson-600',
  },
  {
    id: 'hemorrhage',
    icon: Activity,
    category: 'Vascular',
    tag: 'Direct pressure first',
    urgency: 'Trauma Level 1',
    title: 'Severe Hemorrhage Control',
    body: 'Apply unyielding bilateral pressure. Layer dressings without removal. Tourniquet 2–3 in. proximal to limb wound if refractory.',
    color: 'bg-orange-50 border-orange-100',
    iconBg: 'bg-orange-600',
  },
  {
    id: 'choking',
    icon: Wind,
    category: 'Airway',
    tag: 'Silent = critical',
    urgency: 'Trauma Level 2',
    title: 'Choking / Heimlich Maneuver',
    body: 'Establish inability to vocalize. Deliver swift inward-upward abdominal thrusts. Transition to compressions if consciousness lost.',
    color: 'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-600',
  },
  {
    id: 'burns',
    icon: Flame,
    category: 'Thermal',
    tag: 'Cool 20 min running water',
    urgency: 'Trauma Level 2',
    title: 'Burn Management',
    body: 'Cool affected area under tepid running water for 20 minutes. Do not apply ice, butter, or occlusive wraps. Cover loosely.',
    color: 'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-600',
  },
];

const DISPATCH_MILESTONES = [
  {
    id: 'triage',
    icon: ShieldCheck,
    label: 'Triage Verified',
    sub: 'AI protocol matched · Risk level confirmed',
    status: 'complete',
    time: '00:00',
  },
  {
    id: 'telemetry',
    icon: Radio,
    label: 'Telemetry Relayed',
    sub: 'Patient vitals & GPS packet transmitted',
    status: 'complete',
    time: '00:18',
  },
  {
    id: 'hospital',
    icon: Hospital,
    label: 'Nearest Hospital Alerted',
    sub: 'Casualty unit pre-notified · Trauma bay standby',
    status: 'active',
    time: '00:34',
  },
  {
    id: 'ambulance',
    icon: Truck,
    label: 'Ambulance Dispatched',
    sub: 'ALS crew en route · ETA 5.8 min',
    status: 'pending',
    time: '00:52',
  },
];

const FAQ_ITEMS = [
  {
    id: 'q1',
    question: 'When should I perform compressions before calling 108/911?',
    answer:
      'If the patient is unresponsive and not breathing normally, begin CPR immediately. Call for help simultaneously if a bystander is present. For lone rescuers, perform 2 minutes of CPR first if the patient is a child or the cause is suspected drowning, then call. For witnessed adult cardiac arrest, call first or activate speaker phone.',
  },
  {
    id: 'q2',
    question: 'How does hospital telemetry work through MediFirst?',
    answer:
      'When you submit an emergency dispatch, MediFirst packages a structured clinical data object (patient condition, GPS coordinates, consciousness level, incident time) and transmits it to the nearest verified trauma centre via an encrypted REST endpoint. The receiving ER can pre-activate trauma teams before the ambulance arrives.',
  },
  {
    id: 'q3',
    question: 'Is the AI triage guidance validated against clinical protocols?',
    answer:
      'Yes. All guidance is cross-referenced with WHO Emergency Care guidelines, European Resuscitation Council (ERC) protocols, and TCCC civilian first aid standards. The system uses deterministic rule trees — not probabilistic generation — for life-critical instructions.',
  },
  {
    id: 'q4',
    question: 'What happens if GPS location cannot be determined?',
    answer:
      'You will be prompted to enter a manual street address or landmark. MediFirst cross-references the address against our verified hospital database and falls back to the nearest known dispatch node. Cellular tower triangulation is used as a last resort with ±200 m accuracy.',
  },
  {
    id: 'q5',
    question: 'Can I use MediFirst for pediatric emergencies?',
    answer:
      'Yes. The intake form accepts patient age and adjusts triage parameters accordingly — CPR compression depth, medication dosage references, and Broselow weight estimates are adapted for pediatric patients (0–17 years). Always specify age at intake.',
  },
];

/* ─────────────────────────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────────── */
export default function EmergencyHeroLandingPage() {
  const formRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    condition: 'cardiac',
    age: '48',
    contact: '',
    symptoms: 'Sudden collapse during morning walk. Labored agonal respirations.',
    location: 'Anna Nagar, Chennai (13.0827° N, 80.2707° E)',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  // Accordion state
  const [openFaq, setOpenFaq] = useState(null);

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleDispatch = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setDispatched(true);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-alabaster text-carbon font-sans selection:bg-red-100 selection:text-crimson-800">
      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/60">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Crimson subtle corner glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.05),transparent_65%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* ── Left: Editorial Copy ──────────────────────── */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
              {/* Micro-label */}
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-crimson-600 mb-5 block">
                  <span className="text-slate-300">✦</span>
                  MediFirst Emergency Intelligence
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-[2.6rem] sm:text-5xl lg:text-[3.5rem] font-black tracking-[-0.035em] leading-[1.05] text-carbon mb-5"
              >
                Built for Urgency.
                <br />
                <span className="text-crimson-600">Guided by</span>
                <br />
                Intelligence.
              </motion.h1>

              {/* Body */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-lg mb-8 font-normal"
              >
                Your clinical-grade first-response system for CPR, trauma,
                anaphylaxis, and stroke — delivering step-by-step guidance
                during the critical minutes before professional help arrives.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <button onClick={scrollToForm} className="btn-primary pulse-ring">
                  <span>Start Instant Triage</span>
                  <ArrowRight size={16} />
                </button>
                <a
                  href={`tel:${EMERGENCY_NUMBERS.primary}`}
                  className="btn-ghost"
                >
                  <PhoneCall size={14} className="text-crimson-600" />
                  <span>Dial 108 Ambulance</span>
                </a>
              </motion.div>

              {/* Trust strip */}
              <motion.div variants={fadeUp} custom={4} className="mt-8 flex items-center gap-3.5">
                <div className="flex -space-x-1.5">
                  {['#DC2626', '#0F172A', '#475569'].map((c, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold shadow-2xs"
                      style={{ background: c }}
                    >
                      {['WHO', 'ERC', 'TCCC'][i][0]}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Protocols validated by <strong className="text-slate-600">WHO · ERC · TCCC</strong>
                </p>
              </motion.div>
            </motion.div>

            {/* ── Right: Step Cards Stack ───────────────────── */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className="flex flex-col gap-4"
            >
              {HERO_STEP_CARDS.map((card, i) => (
                <motion.div
                  key={card.num}
                  variants={fadeUp}
                  custom={i}
                  className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-card hover:shadow-elevated transition-shadow duration-200 group"
                >
                  {/* Number + Tag */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="font-mono font-black text-3xl leading-none text-slate-200 select-none">
                      {card.num}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-50 text-crimson-600 border border-red-200/60">
                      {card.tag}
                    </span>
                  </div>

                  {/* Crimson rule */}
                  <div className="w-8 h-[2.5px] bg-crimson-600 rounded-full mb-3.5" />

                  {/* Title */}
                  <h3 className="font-bold text-base sm:text-lg text-carbon tracking-tight mb-2 leading-snug group-hover:text-crimson-700 transition-colors">
                    {card.title}
                  </h3>

                  {/* Body */}
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{card.body}</p>
                </motion.div>
              ))}

              {/* Metric strip below cards */}
              <motion.div
                variants={fadeUp}
                custom={2}
                className="grid grid-cols-3 gap-2.5 mt-1"
              >
                {[
                  { val: '< 18 ms', lbl: 'Protocol latency' },
                  { val: '5.8 min', lbl: 'Avg. EMS arrival' },
                  { val: '54+', lbl: 'Verified hospitals' },
                ].map((m) => (
                  <div key={m.val} className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-center">
                    <div className="font-black text-base sm:text-lg text-carbon tracking-tight">{m.val}</div>
                    <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">{m.lbl}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — FIRST-AID PROTOCOLS GRID
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 sm:px-8 lg:px-12 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 max-w-xl">
            <span className="section-label-crimson mb-2.5 block">✦ Emergency Protocols</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-carbon leading-tight mb-3">
              Critical Scenario Reference
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Immediate action frameworks for the four most time-sensitive
              pre-hospital emergencies, verified against international care standards.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {PROTOCOL_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.06, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-200 flex flex-col group"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-4 shadow-2xs`}>
                    <Icon size={18} className="text-white" />
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-crimson-700 border border-red-200/50">
                      {card.urgency}
                    </span>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                      {card.tag}
                    </span>
                  </div>

                  {/* Category */}
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">{card.category}</span>

                  {/* Title */}
                  <h3 className="font-bold text-base text-carbon mb-2 leading-snug tracking-tight group-hover:text-crimson-600 transition-colors">
                    {card.title}
                  </h3>

                  {/* Body */}
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed flex-1">{card.body}</p>

                  {/* Footer link */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-crimson-600 group-hover:text-crimson-700 transition-colors">
                    <span>Full Protocol</span>
                    <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — DISPATCH TIMELINE
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 sm:px-8 lg:px-12 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: editorial copy */}
            <div>
              <span className="section-label-crimson mb-2.5 block">✦ Emergency Dispatch Pipeline</span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-carbon leading-tight mb-4">
                From Triage to
                <br />
                Ambulance in Seconds
              </h2>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
                The moment you submit an emergency, our dispatch pipeline activates
                a four-stage relay that pre-positions hospital resources before
                the ambulance even departs.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { val: '< 1 s', lbl: 'Dispatch transmission' },
                  { val: '24 / 7', lbl: 'Active relay nodes' },
                  { val: '1.4 km', lbl: 'Avg. nearest trauma hub' },
                  { val: '99.8%', lbl: 'Uptime SLA' },
                ].map((s) => (
                  <div key={s.val} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <div className="font-black text-xl text-carbon tracking-tight">{s.val}</div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Vertical Timeline */}
            <DispatchTimeline milestones={DISPATCH_MILESTONES} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — FAQ ACCORDION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 sm:px-8 lg:px-12 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Left: Section header */}
            <div className="lg:col-span-2">
              <span className="section-label-crimson mb-2.5 block">✦ Medical Safety & Protocol</span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-carbon leading-tight mb-4">
                Frequently Asked
                <br />
                Clinical Questions
              </h2>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-6">
                Plain-language answers to the most critical pre-hospital
                decision points — verified against WHO and ERC guidelines.
              </p>
              <div className="p-4 bg-white border border-slate-200/80 rounded-xl flex items-start gap-3 shadow-2xs">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  All answers validated against WHO Emergency Care standards,
                  ERC First Aid guidelines, and TCCC civilian protocols.
                </p>
              </div>
            </div>

            {/* Right: Accordion list */}
            <div className="lg:col-span-3 space-y-2.5">
              {FAQ_ITEMS.map((item, i) => (
                <FaqAccordion
                  key={item.id}
                  item={item}
                  index={i}
                  isOpen={openFaq === item.id}
                  onToggle={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — EMERGENCY INTAKE & SOS PANEL
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={formRef}
        className="py-20 px-5 sm:px-8 lg:px-12 bg-white border-t border-slate-200/60"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <span className="section-label-crimson mb-2.5 block">✦ Emergency Intake & SOS Dispatch</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-carbon leading-tight">
              Request Emergency Response
            </h2>
          </div>

          {/* Dual-card layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: intake form — Porcelain white */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100">
                <div>
                  <span className="section-label block mb-1">Telemetry Dispatch Form</span>
                  <h3 className="text-lg sm:text-xl font-black text-carbon tracking-tight">Emergency Unit Request</h3>
                </div>
                <div className="w-9 h-9 bg-red-50 border border-red-200/60 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={17} className="text-crimson-600" />
                </div>
              </div>

              {/* Smooth sliding window transition between Form and Success */}
              <AnimatePresence mode="wait">
                {dispatched ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <DispatchSuccess onReset={() => setDispatched(false)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <IntakeForm
                      formData={formData}
                      setFormData={setFormData}
                      isSubmitting={isSubmitting}
                      onSubmit={handleDispatch}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: SOS stat card — Deep Crimson */}
            <div className="lg:col-span-5 bg-crimson-600 rounded-2xl p-6 sm:p-8 text-white flex flex-col gap-5 relative overflow-hidden shadow-elevated">
              {/* Decorative overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.18),transparent_70%)] pointer-events-none" />
              <div className="absolute top-0 right-0 w-44 h-44 bg-crimson-800/40 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="relative">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-red-200 block mb-1">
                  Response Status
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">24 / 7 Response<br />Active</h3>
              </div>

              {/* Live stats */}
              <div className="relative space-y-3">
                {[
                  { icon: Clock, val: '5.8 min', lbl: 'Avg. Paramedic En Route' },
                  { icon: Hospital, val: '1.4 km', lbl: 'Nearest Trauma Hub' },
                  { icon: Radio, val: '99.8%', lbl: 'Relay Uptime' },
                ].map(({ icon: Icon, val, lbl }) => (
                  <div key={lbl} className="flex items-center gap-3.5 bg-crimson-700/40 border border-crimson-500/30 rounded-xl p-3.5">
                    <div className="w-8 h-8 bg-crimson-800/50 rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-red-100" />
                    </div>
                    <div>
                      <div className="font-black text-base sm:text-lg leading-none">{val}</div>
                      <div className="text-[10px] text-red-200 font-mono uppercase tracking-wider mt-0.5">{lbl}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct trauma hotline */}
              <a
                href={`tel:${EMERGENCY_NUMBERS.primary}`}
                className="relative flex items-center justify-center gap-2 bg-white text-crimson-700 font-black text-xs sm:text-sm py-3.5 rounded-xl hover:bg-red-50 transition-colors mt-auto shadow-sm"
              >
                <PhoneCall size={16} />
                <span>Direct Trauma Hotline · {EMERGENCY_NUMBERS.primary}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="bg-carbon border-t border-white/5 text-slate-500 py-10 px-5 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-crimson-600 flex items-center justify-center">
              <Activity size={13} className="text-white" />
            </div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              MediFirst Emergency Architecture · Build 2.5.0
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ISO 27001
            </span>
            <span>·</span>
            <span>HIPAA Clinical Compliant</span>
            <span>·</span>
            <span>Encrypted Dispatch Node</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENT: Dispatch Vertical Timeline
───────────────────────────────────────────────────────────── */
function DispatchTimeline({ milestones }) {
  return (
    <div className="relative pl-6">
      {/* Crimson vertical rule */}
      <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-crimson-600 via-crimson-300 to-slate-200 rounded-full" />

      <div className="space-y-6">
        {milestones.map((m, i) => {
          const Icon = m.icon;
          const isComplete = m.status === 'complete';
          const isActive = m.status === 'active';

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.08, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-start gap-4 pl-8"
            >
              {/* Milestone circle */}
              <div
                className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-2xs z-10 ${
                  isComplete
                    ? 'bg-crimson-600 border-crimson-600 text-white'
                    : isActive
                    ? 'bg-white border-crimson-600 text-crimson-600 ring-4 ring-crimson-100'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <Icon size={14} />
              </div>

              {/* Content */}
              <div className={`flex-1 pb-2 pt-0.5 transition-all ${isActive ? 'opacity-100' : isComplete ? 'opacity-100' : 'opacity-40'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-sm tracking-tight ${isComplete ? 'text-carbon' : isActive ? 'text-carbon' : 'text-slate-400'}`}>
                    {m.label}
                  </span>
                  {isComplete && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Done
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-crimson-600 border border-red-200/60 flex items-center gap-1">
                      <span className="w-1 h-1 bg-crimson-600 rounded-full animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{m.sub}</p>
                <span className="text-[10px] font-mono text-slate-300 mt-0.5 block">T+{m.time}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENT: FAQ Accordion Item
───────────────────────────────────────────────────────────── */
function FaqAccordion({ item, index, isOpen, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: index * 0.05, duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border transition-colors duration-200 overflow-hidden ${
        isOpen
          ? 'border-crimson-200 bg-red-50/30 shadow-2xs'
          : 'border-slate-200/80 bg-white hover:border-slate-300'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500 focus-visible:ring-inset"
        aria-expanded={isOpen}
      >
        <span className={`text-xs sm:text-sm font-semibold leading-snug pr-3 ${isOpen ? 'text-carbon' : 'text-slate-700'}`}>
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
            isOpen ? 'bg-crimson-600 border-crimson-600 text-white' : 'border-slate-200 text-slate-400'
          }`}
        >
          <ChevronDown size={13} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="w-full h-px bg-red-100 mb-3" />
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENT: Intake Form
───────────────────────────────────────────────────────────── */
function IntakeForm({ formData, setFormData, isSubmitting, onSubmit }) {
  const inputCls = 'w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon font-medium focus:outline-none focus:ring-2 focus:ring-crimson-500 focus:border-crimson-300 transition-all placeholder:text-slate-400';
  const labelCls = 'block text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Row 1: Condition + Age */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelCls}>Patient Condition</label>
          <select
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            className={inputCls}
          >
            <option value="cardiac">Cardiac Arrest / Chest Pain</option>
            <option value="hemorrhage">Severe Hemorrhage / Bleeding</option>
            <option value="stroke">Suspected Stroke / Hemiparesis</option>
            <option value="respiratory">Respiratory Failure / Choking</option>
            <option value="burns">Major Thermal / Chemical Burn</option>
            <option value="trauma">High-Velocity Trauma / Fracture</option>
            <option value="anaphylaxis">Anaphylaxis / Allergic Shock</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Estimated Age</label>
          <input
            type="number"
            min="0"
            max="120"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className={inputCls}
            placeholder="e.g. 45"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className={labelCls}>Scene Location / GPS</label>
        <div className="relative">
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className={`${inputCls} pl-9`}
            placeholder="Street address or GPS coordinates"
            required
          />
          <Navigation size={15} className="absolute left-3 top-3 text-slate-400" />
        </div>
      </div>

      {/* Caller Contact */}
      <div>
        <label className={labelCls}>Caller Contact Number</label>
        <input
          type="tel"
          value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          className={inputCls}
          placeholder="+91 98XXX XXXXX"
        />
      </div>

      {/* Immediate Symptoms */}
      <div>
        <label className={labelCls}>Immediate Symptoms / Scene Notes</label>
        <textarea
          rows={3}
          value={formData.symptoms}
          onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
          className={inputCls}
          placeholder="Describe symptoms, hazards, ongoing CPR, consciousness level…"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 bg-crimson-600 text-white hover:bg-crimson-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-crimson-600/20"
      >
        {isSubmitting ? (
          <>
            <Activity size={16} className="animate-spin" />
            <span>Transmitting Emergency Packet…</span>
          </>
        ) : (
          <>
            <span>Dispatch Emergency Response</span>
            <ChevronRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENT: Dispatch Success State
───────────────────────────────────────────────────────────── */
function DispatchSuccess({ onReset }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 sm:p-8 text-center">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3.5">
        <CheckCircle2 size={26} className="text-emerald-600" />
      </div>
      <h3 className="text-lg font-bold text-emerald-950 mb-1.5">Emergency Dispatch Transmitted</h3>
      <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed mb-5">
        Paramedic crew alerted with GPS packet. Nearest hospital casualty unit
        pre-notified. Keep your phone accessible for the responding crew.
      </p>
      <button
        onClick={onReset}
        className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs tracking-wider uppercase hover:bg-emerald-700 transition-colors shadow-2xs"
      >
        Reset Dispatch Form
      </button>
    </div>
  );
}
