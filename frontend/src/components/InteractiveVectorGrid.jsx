import React, { useEffect, useRef, useCallback } from 'react';

/**
 * InteractiveVectorGrid — HTML5 Canvas Vector Physics Grid
 *
 * Implements a high-density, 60 FPS interactive vector field.
 * Grid elements dynamically rotate and track the user's cursor with smooth
 * lerping (0.08 spring factor), returning gracefully to neutral when cursor departs.
 *
 * Fully DPI-aware (retina displays), touch-enabled, and respects prefers-reduced-motion.
 */
export default function InteractiveVectorGrid({
  className = '',
  gridPitch = 42,
  interactionRadius = 160,
  lerpSpeed = 0.08,
  neutralAngle = 0, // Radians (0 = pointing right)
  shape = 'chevron', // 'chevron' | 'cross' | 'vector'
  accentColor = '#38bdf8', // Medical sky cyan
  baseColor = 'rgba(255, 255, 255, 0.22)',
}) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, isActive: false });
  const gridNodesRef = useRef([]);

  // Initialize or recalculate grid nodes based on canvas dimensions
  const buildGrid = useCallback((width, height) => {
    const nodes = [];
    const cols = Math.ceil(width / gridPitch) + 1;
    const rows = Math.ceil(height / gridPitch) + 1;

    const startX = (width - (cols - 1) * gridPitch) / 2;
    const startY = (height - (rows - 1) * gridPitch) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        nodes.push({
          x: startX + c * gridPitch,
          y: startY + r * gridPitch,
          currentAngle: neutralAngle,
          targetAngle: neutralAngle,
          currentScale: 1,
          targetScale: 1,
          intensity: 0,
        });
      }
    }
    gridNodesRef.current = nodes;
  }, [gridPitch, neutralAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Handle High-DPI Canvas Resizing
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      buildGrid(rect.width, rect.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Track mouse & touch coordinates relative to canvas
    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      mouseRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
        isActive: true,
      };
    };

    const handlePointerLeave = () => {
      mouseRef.current.isActive = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('touchend', handlePointerLeave);

    // ── 60 FPS Render Loop ──
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const mouse = mouseRef.current;
      const nodes = gridNodesRef.current;
      const radiusSq = interactionRadius * interactionRadius;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (!prefersReducedMotion && mouse.isActive) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const factor = Math.max(0, 1 - dist / interactionRadius);

            node.targetAngle = Math.atan2(dy, dx);
            node.targetScale = 1 + factor * 0.85;
            node.intensity = factor;
          } else {
            node.targetAngle = neutralAngle;
            node.targetScale = 1;
            node.intensity = 0;
          }
        } else {
          node.targetAngle = neutralAngle;
          node.targetScale = 1;
          node.intensity = 0;
        }

        // Angle Lerping with wrap-around smoothing
        let angleDiff = node.targetAngle - node.currentAngle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        node.currentAngle += angleDiff * lerpSpeed;
        node.currentScale += (node.targetScale - node.currentScale) * lerpSpeed;

        // Draw Element
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(node.currentAngle);
        ctx.scale(node.currentScale, node.currentScale);

        // Dynamic coloration based on cursor proximity
        if (node.intensity > 0.05) {
          ctx.strokeStyle = accentColor;
          ctx.fillStyle = accentColor;
          ctx.globalAlpha = 0.4 + node.intensity * 0.6;
          ctx.lineWidth = 1.5 + node.intensity * 0.5;
        } else {
          ctx.strokeStyle = baseColor;
          ctx.fillStyle = baseColor;
          ctx.globalAlpha = 0.28;
          ctx.lineWidth = 1.2;
        }

        // Render Geometry
        if (shape === 'chevron') {
          // Sharp directional medical chevron vector: >
          ctx.beginPath();
          ctx.moveTo(-5, -4);
          ctx.lineTo(3, 0);
          ctx.lineTo(-5, 4);
          ctx.stroke();

          // Center micro-pip
          ctx.beginPath();
          ctx.arc(0, 0, 1, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === 'cross') {
          // Clinical precision crosshair +
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(4, 0);
          ctx.moveTo(0, -4);
          ctx.lineTo(0, 4);
          ctx.stroke();
        } else {
          // Tactical vector ray: ──>
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(5, 0);
          ctx.lineTo(1, -3);
          ctx.moveTo(5, 0);
          ctx.lineTo(1, 3);
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [buildGrid, interactionRadius, lerpSpeed, neutralAngle, shape, accentColor, baseColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
