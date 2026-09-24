import { useEffect, useRef } from "react";

const MAX_YAW_DEG = 52;
const MAX_PITCH_DEG = 14;
const EASING = 0.07;
const SETTLE_EPSILON = 0.05;

/**
 * Eases a card toward the mouse position and writes the angles (--rx, --ry) and
 * cursor position (--mx, --my) as CSS variables each frame, without re-rendering React.
 * The low easing factor gives slow, weighty inertia instead of snapping to the cursor.
 */
export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const current = { yaw: 0, pitch: 0, mx: 50, my: 50 };
    const target = { yaw: 0, pitch: 0, mx: 50, my: 50 };
    let frame = 0;

    const tick = () => {
      let moving = false;
      for (const key of ["yaw", "pitch", "mx", "my"] as const) {
        const diff = target[key] - current[key];
        if (Math.abs(diff) > SETTLE_EPSILON) {
          current[key] += diff * EASING;
          moving = true;
        } else {
          current[key] = target[key];
        }
      }
      el.style.setProperty("--ry", `${current.yaw.toFixed(2)}deg`);
      el.style.setProperty("--rx", `${current.pitch.toFixed(2)}deg`);
      el.style.setProperty("--mx", `${current.mx.toFixed(1)}%`);
      el.style.setProperty("--my", `${current.my.toFixed(1)}%`);
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      target.yaw = (px - 0.5) * 2 * MAX_YAW_DEG;
      target.pitch = -(py - 0.5) * 2 * MAX_PITCH_DEG;
      target.mx = px * 100;
      target.my = py * 100;
      start();
    };
    const onLeave = () => {
      target.yaw = 0;
      target.pitch = 0;
      target.mx = 50;
      target.my = 50;
      start();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}
