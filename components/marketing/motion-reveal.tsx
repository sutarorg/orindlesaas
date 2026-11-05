"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function MotionReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      data-motion-reveal
      initial={false}
      whileInView={reduceMotion ? undefined : { y: [14, 0] }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.48, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
