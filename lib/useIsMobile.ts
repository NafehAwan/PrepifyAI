"use client";

import { useEffect, useState } from "react";

// True on narrow (phone) viewports. Defaults to false on the server / first
// paint, then corrects on mount, so SSR markup stays stable.
export function useIsMobile(breakpoint = 820): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return mobile;
}
