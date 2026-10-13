"use client";

// Two celebration pieces from the 21st.dev registry (Magic UI by Dillion
// Verma), adapted for this app's inline styles and its "Reduce animations"
// setting:
//   - NumberTicker: a number that counts up to its value when it scrolls into view.
//   - fireStars: the "Stars" confetti burst, in the map's gold.

import { useEffect, useRef, useState } from "react";
import { isReducedMotion } from "@/lib/motion";

function reduced(): boolean {
  if (typeof window === "undefined") return true;
  return isReducedMotion() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function NumberTicker({ value, duration = 1100, delay = 150, suffix = "" }: { value: number; duration?: number; delay?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (reduced()) {
      setShown(value);
      return;
    }
    setShown(0);
    let raf = 0;
    let timer = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        // ease-out-expo, the feel of Magic UI's spring settling
        const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setShown(Math.round(value * e));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          timer = window.setTimeout(run, delay);
        }
      },
      { threshold: 0.3 },
    );
    if (el) io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {shown}
      {suffix}
    </span>
  );
}

// Gold stars bursting from the middle of the screen, three quick volleys.
export async function fireStars(): Promise<void> {
  if (reduced()) return;
  const confetti = (await import("canvas-confetti")).default;
  const defaults = { spread: 360, ticks: 60, gravity: 0.4, decay: 0.94, startVelocity: 26, origin: { y: 0.35 }, colors: ["#FFC93C", "#FFE08A", "#E85D0C", "#7C5CFF", "#FFFFFF"], zIndex: 200, disableForReducedMotion: true };
  const shoot = () => {
    void confetti({ ...defaults, particleCount: 36, scalar: 1.25, shapes: ["star"] });
    void confetti({ ...defaults, particleCount: 12, scalar: 0.8, shapes: ["circle"] });
  };
  shoot();
  window.setTimeout(shoot, 120);
  window.setTimeout(shoot, 240);
}
