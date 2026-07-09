"use client";

import { motion } from "framer-motion";

type WordsRevealProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  step?: number;
  delay?: number;
  duration?: number;
};

export function WordsReveal({
  text,
  as = "span",
  className,
  step = 0.05,
  delay = 0,
  duration = 0.6,
}: WordsRevealProps) {
  const words = text.split(" ");
  const MotionTag = motion[as] as typeof motion.span;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ staggerChildren: step, delayChildren: delay }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          style={{ display: "inline-block" }}
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration, ease: "easeOut" }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </MotionTag>
  );
}

type FadeInViewProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  y?: number;
};

export function FadeInView({
  children,
  delay = 0,
  duration = 0.6,
  className,
  y = 24,
}: FadeInViewProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
