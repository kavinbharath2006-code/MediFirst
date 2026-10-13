import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, PhoneCall } from './icons';
import {
  Menu, X,
  Stethoscope, Heart, Cpu, Globe, Eye, Shield,
  Rocket, BookOpen, FileText, Newspaper,
  AlertTriangle, Settings,
} from 'lucide-react';
import { EMERGENCY_NUMBERS } from '../data/constants';
import { DropdownNavigation } from './ui/dropdown-navigation';

/* ── Desktop nav data ─────────────────────────────────────────── */
const DESKTOP_NAV_ITEMS = [
  {
    id: 1,
    label: 'Clinical',
    subMenus: [
      {
        title: 'Assessment',
        items: [
          {
            label: 'Triage',
            description: 'AI-powered urgency scoring',
            icon: Stethoscope,
            href: '/emergency',
          },
          {
            label: 'First Aid',
            description: 'Step-by-step emergency guides',
            icon: Heart,
            href: '/first-aid',
          },
        ],
      },
      {
        title: 'Equipment',
        items: [
          {
            label: 'Devices',
            description: 'AED, ventilator & more',
            icon: Cpu,
            href: '/machines',
          },
          {
            label: 'Dispatch',
            description: 'Emergency hero dispatch',
            icon: AlertTriangle,
            href: '/dispatch',
          },
        ],
      },
    ],
  },
  {
    id: 2,
    label: 'Services',
    subMenus: [
      {
        title: 'Nearby',
        items: [
          {
            label: 'Facilities',
            description: 'Hospitals & clinics near you',
            icon: Globe,
            href: '/services',
          },
          {
            label: 'Safety',
            description: 'Community safety resources',
            icon: Shield,
            href: '/safety',
          },
        ],
      },
    ],
  },
  {
    id: 3,
    label: 'Resources',
    subMenus: [
      {
        title: 'Learn',
        items: [
          {
            label: 'Guides',
            description: 'Best practice protocols',
            icon: BookOpen,
          },
          {
            label: 'Case Studies',
            description: 'Real-world outcomes',
            icon: FileText,
          },
          {
            label: 'News',
            description: 'Latest in emergency medicine',
            icon: Newspaper,
          },
        ],
      },
      {
        title: 'Platform',
        items: [
          {
            label: 'API Docs',
            description: 'Integrate MediFirst data',
            icon: Cpu,
          },
          {
            label: 'Status',
            description: 'System uptime & incidents',
            icon: Eye,
          },
        ],
      },
    ],
  },
  {
    id: 4,
    label: 'Settings',
    link: '/settings',
  },
];

/* ── Mobile flat nav (mirrors sidebar links) ──────────────────── */
const MOBILE_NAV = [
  { path: '/',          label: 'Home',      icon: Rocket },
  { path: '/emergency', label: 'Triage',    icon: Stethoscope },
  { path: '/first-aid', label: 'First Aid', icon: Heart },
  { path: '/machines',  label: 'Devices',   icon: Cpu },
  { path: '/services',  label: 'Facilities',icon: Globe },
  { path: '/safety',    label: 'Safety',    icon: Shield },
  { path: '/settings',  label: 'Settings',  icon: Settings },
];

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isCurrent = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* ── Sticky header ─────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs'
            : 'bg-white border-b border-slate-200/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 flex items-center h-[64px] gap-4">

          {/* ── Brand (left) ──────────────────────────────────── */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-600 rounded-xl p-1 transition-all"
            aria-label="MediFirst Home"
          >
            <div className="relative w-9 h-9 rounded-[10px] bg-crimson-600 flex items-center justify-center shadow-sm group-hover:bg-crimson-700 transition-colors">
              <Activity className="w-[18px] h-[18px] text-white stroke-[2.5]" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
            <div className="flex flex-col items-start leading-none gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-carbon text-[15px] tracking-[-0.02em]">
                  Medi<span className="text-crimson-600">First</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-crimson-700 border border-red-200/60 uppercase tracking-wider">
                  Clinical
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block tracking-wide">
                Emergency Response System
              </p>
            </div>
          </button>

          {/* ── Centred dropdown nav (desktop only) ───────────── */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <DropdownNavigation navItems={DESKTOP_NAV_ITEMS} />
          </div>

          {/* ── Right actions ─────────────────────────────────── */}
          <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">

            {/* Systems Live chip — visible sm+ */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[11px] font-mono font-semibold text-emerald-700 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Systems Live</span>
            </div>

            {/* Get Started CTA — visible md+ */}
            <button
              onClick={() => navigate('/emergency')}
              className="hidden md:inline-flex items-center gap-1.5 bg-carbon hover:bg-black text-white text-[12px] font-bold px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started
            </button>

            {/* EMS call button */}
            <a
              href={`tel:${EMERGENCY_NUMBERS.primary}`}
              className="inline-flex items-center gap-1.5 bg-crimson-600 hover:bg-crimson-700 active:bg-crimson-800 text-white text-[11px] font-bold px-3.5 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-crimson-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500 focus-visible:ring-offset-2"
              aria-label={`Call emergency services: ${EMERGENCY_NUMBERS.primary}`}
            >
              <PhoneCall className="w-3.5 h-3.5 stroke-[2.4]" />
              <span className="hidden sm:inline">EMS · {EMERGENCY_NUMBERS.primary}</span>
              <span className="sm:hidden">{EMERGENCY_NUMBERS.primary}</span>
            </a>

            {/* Hamburger — mobile/tablet only */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen drawer ──────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="lg:hidden fixed inset-0 z-40 bg-white/98 backdrop-blur-xl pt-[64px] flex flex-col overflow-y-auto"
          >
            <nav className="flex flex-col px-5 py-6 gap-1" aria-label="Mobile navigation">
              {MOBILE_NAV.map((item) => {
                const Icon = item.icon;
                const active = isCurrent(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all text-left ${
                      active
                        ? 'bg-red-50 text-crimson-700 border border-red-200/60'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={active ? 'text-crimson-600' : 'text-slate-400'}
                    />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* CTA section at bottom */}
            <div className="px-5 pb-8 mt-auto flex flex-col gap-3">
              <button
                onClick={() => navigate('/emergency')}
                className="w-full flex items-center justify-center py-3.5 rounded-2xl bg-carbon text-white font-bold text-sm hover:bg-black transition-all"
              >
                Get Started — Free
              </button>
              <a
                href={`tel:${EMERGENCY_NUMBERS.primary}`}
                className="w-full flex items-center justify-center gap-2.5 bg-crimson-600 text-white font-bold py-4 rounded-2xl text-sm hover:bg-crimson-700 transition-all"
              >
                <PhoneCall size={16} />
                Dial Emergency · {EMERGENCY_NUMBERS.primary}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

