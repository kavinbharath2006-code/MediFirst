"use client";

import React from "react";
import { createAnimatedIcon } from "./createAnimatedIcon";

// ── Shared Animation Variant Generators ──────────────────────────────
const pulseVariants = (duration = 0.9) => ({
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.15, 1.05, 1.25, 1],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const ringVariants = (duration = 0.8) => ({
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.1, 1.05, 1.1, 1],
    rotate: [0, -15, 15, -10, 10, -5, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const flashVariants = (duration = 0.7) => ({
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.2, 0.95, 1.15, 1],
    rotate: [0, -6, 6, -3, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const bounceVariants = (duration = 0.8) => ({
  normal: { y: 0 },
  animate: {
    y: [0, -6, 0, -2, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const shakeVariants = (duration = 0.75) => ({
  normal: { x: 0, rotate: 0 },
  animate: {
    x: [0, -4, 4, -3, 3, -1, 0],
    rotate: [0, -4, 4, -2, 2, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const popVariants = (duration = 0.6) => ({
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.25, 0.95, 1.1, 1],
    transition: { duration, repeat: Infinity, ease: "easeOut" },
  },
});

const spinVariants = (duration = 1) => ({
  normal: { rotate: 0 },
  animate: {
    rotate: [0, 360],
    transition: { duration, repeat: Infinity, ease: "linear" },
  },
});

const reverseSpinVariants = (duration = 1) => ({
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -360],
    transition: { duration, repeat: Infinity, ease: "linear" },
  },
});

const slideRightVariants = (duration = 0.7) => ({
  normal: { x: 0 },
  animate: {
    x: [0, 5, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const slideLeftVariants = (duration = 0.7) => ({
  normal: { x: 0 },
  animate: {
    x: [0, -5, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const slideDownVariants = (duration = 0.7) => ({
  normal: { y: 0 },
  animate: {
    y: [0, 4, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const shieldVariants = (duration = 0.8) => ({
  normal: { scale: 1, y: 0 },
  animate: {
    scale: [1, 1.1, 1],
    y: [0, -2, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const soundWaveVariants = (duration = 0.8) => ({
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.18, 0.95, 1.1, 1],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const flickerVariants = (duration = 0.7) => ({
  normal: { scale: 1, y: 0 },
  animate: {
    scale: [1, 1.15, 0.95, 1.18, 1],
    y: [0, -2, 1, -1, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

const breezeVariants = (duration = 0.9) => ({
  normal: { x: 0 },
  animate: {
    x: [0, 4, -2, 3, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

// ── Icons ─────────────────────────────────────────────────────────────

// HeartPulseIcon (First Aid Pulse Icon conforming to user snippet)
export const HeartPulseIcon = createAnimatedIcon({
  name: "HeartPulseIcon",
  defaultDuration: 0.9,
  variants: pulseVariants,
  renderPaths: () => (
    <>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l1.5-3 2 6.5 1.5-3.5h6.28" />
    </>
  ),
});

export const HeartPulse = HeartPulseIcon;

export const Heart = createAnimatedIcon({
  name: "Heart",
  defaultDuration: 0.9,
  variants: pulseVariants,
  renderPaths: () => (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  ),
});

export const Activity = createAnimatedIcon({
  name: "Activity",
  defaultDuration: 0.9,
  variants: pulseVariants,
  renderPaths: () => (
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  ),
});

export const Stethoscope = createAnimatedIcon({
  name: "Stethoscope",
  defaultDuration: 0.9,
  variants: pulseVariants,
  renderPaths: () => (
    <>
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </>
  ),
});

export const Flame = createAnimatedIcon({
  name: "Flame",
  defaultDuration: 0.7,
  variants: flickerVariants,
  renderPaths: () => (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
});

export const Wind = createAnimatedIcon({
  name: "Wind",
  defaultDuration: 0.9,
  variants: breezeVariants,
  renderPaths: () => (
    <>
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </>
  ),
});

export const Phone = createAnimatedIcon({
  name: "Phone",
  defaultDuration: 0.8,
  variants: ringVariants,
  renderPaths: () => (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
});

export const PhoneCall = createAnimatedIcon({
  name: "PhoneCall",
  defaultDuration: 0.8,
  variants: ringVariants,
  renderPaths: () => (
    <>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      <path d="M14.05 2a9 9 0 0 1 8 7.94" />
      <path d="M14.05 6A5 5 0 0 1 18 10" />
    </>
  ),
});

export const Zap = createAnimatedIcon({
  name: "Zap",
  defaultDuration: 0.7,
  variants: flashVariants,
  renderPaths: () => (
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  ),
});

export const MapPin = createAnimatedIcon({
  name: "MapPin",
  defaultDuration: 0.8,
  variants: bounceVariants,
  renderPaths: () => (
    <>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
});

export const Navigation = createAnimatedIcon({
  name: "Navigation",
  defaultDuration: 0.75,
  variants: bounceVariants,
  renderPaths: () => <polygon points="3 11 22 2 13 21 11 13 3 11" />,
});

export const Map = createAnimatedIcon({
  name: "Map",
  defaultDuration: 0.8,
  variants: bounceVariants,
  renderPaths: () => (
    <>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </>
  ),
});

export const Shield = createAnimatedIcon({
  name: "Shield",
  defaultDuration: 0.8,
  variants: shieldVariants,
  renderPaths: () => (
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  ),
});

export const ShieldAlert = createAnimatedIcon({
  name: "ShieldAlert",
  defaultDuration: 0.75,
  variants: shakeVariants,
  renderPaths: () => (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </>
  ),
});

export const ShieldCheck = createAnimatedIcon({
  name: "ShieldCheck",
  defaultDuration: 0.8,
  variants: popVariants,
  renderPaths: () => (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
});

export const AlertTriangle = createAnimatedIcon({
  name: "AlertTriangle",
  defaultDuration: 0.75,
  variants: shakeVariants,
  renderPaths: () => (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </>
  ),
});

export const AlertCircle = createAnimatedIcon({
  name: "AlertCircle",
  defaultDuration: 0.75,
  variants: shakeVariants,
  renderPaths: () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </>
  ),
});

export const AlertOctagon = createAnimatedIcon({
  name: "AlertOctagon",
  defaultDuration: 0.75,
  variants: shakeVariants,
  renderPaths: () => (
    <>
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </>
  ),
});

export const Info = createAnimatedIcon({
  name: "Info",
  defaultDuration: 0.7,
  variants: popVariants,
  renderPaths: () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
});

export const Check = createAnimatedIcon({
  name: "Check",
  defaultDuration: 0.6,
  variants: popVariants,
  renderPaths: () => <polyline points="20 6 9 17 4 12" />,
});

export const CheckCircle2 = createAnimatedIcon({
  name: "CheckCircle2",
  defaultDuration: 0.6,
  variants: popVariants,
  renderPaths: () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
});

export const ChevronRight = createAnimatedIcon({
  name: "ChevronRight",
  defaultDuration: 0.65,
  variants: slideRightVariants,
  renderPaths: () => <path d="m9 18 6-6-6-6" />,
});

export const ChevronLeft = createAnimatedIcon({
  name: "ChevronLeft",
  defaultDuration: 0.65,
  variants: slideLeftVariants,
  renderPaths: () => <path d="m15 18-6-6 6-6" />,
});

export const ChevronDown = createAnimatedIcon({
  name: "ChevronDown",
  defaultDuration: 0.65,
  variants: slideDownVariants,
  renderPaths: () => <path d="m6 9 6 6 6-6" />,
});

export const ArrowLeft = createAnimatedIcon({
  name: "ArrowLeft",
  defaultDuration: 0.65,
  variants: slideLeftVariants,
  renderPaths: () => (
    <>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </>
  ),
});

export const ArrowRight = createAnimatedIcon({
  name: "ArrowRight",
  defaultDuration: 0.65,
  variants: slideRightVariants,
  renderPaths: () => (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
});

export const Play = createAnimatedIcon({
  name: "Play",
  defaultDuration: 0.6,
  variants: popVariants,
  renderPaths: () => <polygon points="6 3 20 12 6 21 6 3" />,
});

export const Mic = createAnimatedIcon({
  name: "Mic",
  defaultDuration: 0.8,
  variants: soundWaveVariants,
  renderPaths: () => (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </>
  ),
});

export const MicOff = createAnimatedIcon({
  name: "MicOff",
  defaultDuration: 0.7,
  variants: shakeVariants,
  renderPaths: () => (
    <>
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </>
  ),
});

export const Send = createAnimatedIcon({
  name: "Send",
  defaultDuration: 0.7,
  variants: slideRightVariants,
  renderPaths: () => (
    <>
      <line x1="22" x2="11" y1="2" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
});

export const Volume2 = createAnimatedIcon({
  name: "Volume2",
  defaultDuration: 0.75,
  variants: soundWaveVariants,
  renderPaths: () => (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </>
  ),
});

export const VolumeX = createAnimatedIcon({
  name: "VolumeX",
  defaultDuration: 0.7,
  variants: shakeVariants,
  renderPaths: () => (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" x2="16" y1="9" y2="15" />
      <line x1="16" x2="22" y1="9" y2="15" />
    </>
  ),
});

export const RefreshCw = createAnimatedIcon({
  name: "RefreshCw",
  defaultDuration: 1.2,
  variants: spinVariants,
  renderPaths: () => (
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>
  ),
});

export const RotateCcw = createAnimatedIcon({
  name: "RotateCcw",
  defaultDuration: 1.2,
  variants: reverseSpinVariants,
  renderPaths: () => (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
});

export const Loader2 = createAnimatedIcon({
  name: "Loader2",
  defaultDuration: 1,
  variants: spinVariants,
  renderPaths: () => <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
});

export const Clock = createAnimatedIcon({
  name: "Clock",
  defaultDuration: 0.9,
  variants: pulseVariants,
  renderPaths: () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
});

export const FileText = createAnimatedIcon({
  name: "FileText",
  defaultDuration: 0.75,
  variants: popVariants,
  renderPaths: () => (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </>
  ),
});

export const Share2 = createAnimatedIcon({
  name: "Share2",
  defaultDuration: 0.75,
  variants: popVariants,
  renderPaths: () => (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </>
  ),
});

export const Copy = createAnimatedIcon({
  name: "Copy",
  defaultDuration: 0.6,
  variants: popVariants,
  renderPaths: () => (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
});

export const Sparkles = createAnimatedIcon({
  name: "Sparkles",
  defaultDuration: 0.75,
  variants: flashVariants,
  renderPaths: () => (
    <>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </>
  ),
});

export const Lock = createAnimatedIcon({
  name: "Lock",
  defaultDuration: 0.7,
  variants: popVariants,
  renderPaths: () => (
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
});

export const Globe = createAnimatedIcon({
  name: "Globe",
  defaultDuration: 1.2,
  variants: spinVariants,
  renderPaths: () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
});

export const BookOpen = createAnimatedIcon({
  name: "BookOpen",
  defaultDuration: 0.75,
  variants: popVariants,
  renderPaths: () => (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
});

export const ExternalLink = createAnimatedIcon({
  name: "ExternalLink",
  defaultDuration: 0.65,
  variants: popVariants,
  renderPaths: () => (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
});

export const XCircle = createAnimatedIcon({
  name: "XCircle",
  defaultDuration: 0.7,
  variants: shakeVariants,
  renderPaths: () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </>
  ),
});

export const X = createAnimatedIcon({
  name: "X",
  defaultDuration: 0.6,
  variants: shakeVariants,
  renderPaths: () => (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
});

export const Star = createAnimatedIcon({
  name: "Star",
  defaultDuration: 0.8,
  variants: flashVariants,
  renderPaths: () => (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
});

export const HelpCircle = createAnimatedIcon({
  name: "HelpCircle",
  defaultDuration: 0.8,
  variants: popVariants,
  renderPaths: () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </>
  ),
});

export const SlidersHorizontal = createAnimatedIcon({
  name: "SlidersHorizontal",
  defaultDuration: 0.8,
  variants: slideRightVariants,
  renderPaths: () => (
    <>
      <line x1="21" x2="14" y1="4" y2="4" />
      <line x1="10" x2="3" y1="4" y2="4" />
      <line x1="21" x2="12" y1="12" y2="12" />
      <line x1="8" x2="3" y1="12" y2="12" />
      <line x1="21" x2="16" y1="20" y2="20" />
      <line x1="12" x2="3" y1="20" y2="20" />
      <line x1="14" x2="14" y1="2" y2="6" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="16" x2="16" y1="18" y2="22" />
    </>
  ),
});

export const Plus = createAnimatedIcon({
  name: "Plus",
  defaultDuration: 0.6,
  variants: popVariants,
  renderPaths: () => (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
});

export const Minus = createAnimatedIcon({
  name: "Minus",
  defaultDuration: 0.6,
  variants: popVariants,
  renderPaths: () => (
    <>
      <path d="M5 12h14" />
    </>
  ),
});

export const Search = createAnimatedIcon({
  name: "Search",
  defaultDuration: 0.6,
  variants: popVariants,
  renderPaths: () => (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
});

export const Trash2 = createAnimatedIcon({
  name: "Trash2",
  defaultDuration: 0.6,
  variants: shakeVariants,
  renderPaths: () => (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </>
  ),
});


