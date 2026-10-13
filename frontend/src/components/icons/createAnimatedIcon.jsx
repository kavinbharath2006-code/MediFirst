"use client";

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import {
  LazyMotion,
  domMin,
  m,
  useAnimation,
  useReducedMotion,
} from "motion/react";
import { cn } from "../../lib/utils";

/**
 * Higher-order factory to generate animated icons following the FirstAidIcon pattern.
 * Supports imperative animation control via ref, automatic hover triggers,
 * accessibility reduced motion checks, and customizable physics.
 */
export function createAnimatedIcon({
  name,
  displayName,
  defaultDuration = 0.9,
  variants,
  renderPaths,
  viewBox = "0 0 24 24",
}) {
  const IconComponent = forwardRef(
    (
      {
        onMouseEnter,
        onMouseLeave,
        className,
        size = 24,
        duration = defaultDuration,
        isAnimated = true,
        color,
        strokeWidth = 2,
        fill = "none",
        style,
        ...props
      },
      ref
    ) => {
      const controls = useAnimation();
      const reduced = useReducedMotion();
      const isControlled = useRef(false);

      useImperativeHandle(ref, () => {
        isControlled.current = true;
        return {
          startAnimation: () =>
            reduced ? controls.start("normal") : controls.start("animate"),
          stopAnimation: () => controls.start("normal"),
        };
      });

      const handleEnter = useCallback(
        (e) => {
          if (!isAnimated || reduced) return;
          if (!isControlled.current) controls.start("animate");
          else onMouseEnter?.(e);
        },
        [controls, reduced, isAnimated, onMouseEnter]
      );

      const handleLeave = useCallback(
        (e) => {
          if (!isControlled.current) {
            controls.start("normal");
          } else {
            onMouseLeave?.(e);
          }
        },
        [controls, onMouseLeave]
      );

      const activeVariants =
        typeof variants === "function" ? variants(duration) : variants;

      return (
        <LazyMotion features={domMin} strict>
          <m.div
            className={cn("inline-flex items-center justify-center shrink-0 select-none", className)}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            {...props}
            style={{ color, ...style }}
          >
            <m.svg
              xmlns="http://www.w3.org/2000/svg"
              width={size}
              height={size}
              viewBox={viewBox}
              fill={fill}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={controls}
              initial="normal"
              variants={activeVariants}
              style={{ transformOrigin: "center center" }}
            >
              {renderPaths()}
            </m.svg>
          </m.div>
        </LazyMotion>
      );
    }
  );

  IconComponent.displayName = displayName || name;
  return IconComponent;
}
