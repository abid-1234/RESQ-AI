import { useEffect, useRef, useState } from "react";
import ParticleTrail from "./ParticleTrail.tsx";

/**
 * MotionCursor — ultra polish: magnetic attraction, morphing ring,
 * trailing particles, dual ripple, haptics. Fine pointer only.
 */
export function MotionCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const target = useRef({ x: -100, y: -100 });
  const magnet = useRef({ x: 0, y: 0 });
  const [variant, setVariant] = useState<"default" | "hover" | "active" | "text">("default");
  const [visible, setVisible] = useState(false);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isFine = window.matchMedia("(pointer: fine)").matches;
    if (!isFine || reducedMotion) return;

    let dotX = -100, dotY = -100;
    let ringX = -100, ringY = -100;
    let magnetTarget = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!visible) setVisible(true);
      // magnetic offset toward hovered element center
      const el = (e.target as HTMLElement)?.closest("a, button, [role='button'], [data-cursor='hover']") as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        magnetTarget.x = (cx - e.clientX) * 0.22;
        magnetTarget.y = (cy - e.clientY) * 0.22;
      } else {
        magnetTarget.x = 0; magnetTarget.y = 0;
      }
    };
    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);
    const onDown = () => setVariant("active");
    const onUp = () => setVariant((p) => (p === "active" ? "default" : p));
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable='true']")) { setVariant((p) => p === "active" ? p : "text"); return; }
      const isInteractive = !!t.closest("a, button, [role='button'], [data-cursor='hover']");
      setVariant((prev) => (prev === "active" ? prev : isInteractive ? "hover" : "default"));
    };
    const onClick = (e: MouseEvent) => {
      // dual ripple
      for (let i = 0; i < 2; i++) {
        const el = document.createElement("span");
        el.className = i === 0 ? "click-ripple" : "click-ripple-2";
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
        if (i === 1) el.style.animationDelay = "120ms";
        document.body.appendChild(el);
        el.addEventListener("animationend", () => el.remove(), { once: true });
      }
      try { (navigator as any).vibrate?.(14); } catch {}
    };

    const tick = () => {
      dotX += (target.current.x - dotX) * 0.32;
      dotY += (target.current.y - dotY) * 0.32;
      ringX += (target.current.x - ringX) * 0.14;
      ringY += (target.current.y - ringY) * 0.14;
      magnet.current.x += (magnetTarget.x - magnet.current.x) * 0.12;
      magnet.current.y += (magnetTarget.y - magnet.current.y) * 0.12;
      const mx = magnet.current.x, my = magnet.current.y;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${dotX + mx * 0.6}px,${dotY + my * 0.6}px,0) translate(-50%,-50%)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ringX + mx}px,${ringY + my}px,0) translate(-50%,-50%)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("click", onClick);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("click", onClick);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [visible, reducedMotion]);

  if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) return null;
  if (reducedMotion) return null;

  const isText = variant === "text";
  const isHover = variant === "hover";
  const isActive = variant === "active";
  const ringW = isText ? 3 : isHover ? 38 : isActive ? 18 : 28;
  const ringH = isText ? 18 : isHover ? 28 : isActive ? 18 : 28;
  const ringRotate = isActive ? "45deg" : "0deg";

  return (
    <>
      <ParticleTrail enabled={!reducedMotion && visible} />
      <div aria-hidden style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 9998, opacity: visible ? 1 : 0, transition: "opacity 220ms ease" }}>
        <div
          ref={ringRef}
          style={{
            position: "fixed", left: 0, top: 0,
            width: ringW, height: ringH, borderRadius: isText ? 2 : 999,
            border: `1.5px solid ${isHover ? "rgba(26,35,50,.28)" : "rgba(18,21,26,.22)"}`,
            background: isHover ? "rgba(26,35,50,.07)" : isActive ? "rgba(26,35,50,.12)" : "transparent",
            transform: `rotate(${ringRotate})`,
            transition: "width 200ms cubic-bezier(.16,1,.3,1), height 200ms cubic-bezier(.16,1,.3,1), background 180ms ease, border-color 180ms ease, transform 200ms ease",
            willChange: "transform",
          }}
        />
        <div
          ref={dotRef}
          style={{
            position: "fixed", left: 0, top: 0,
            width: isActive ? 5 : isText ? 2 : 6, height: isActive ? 5 : isText ? 14 : 6,
            borderRadius: isText ? 1 : 999, background: "#12151A",
            boxShadow: "0 1px 6px rgba(0,0,0,.18)",
            transition: "width 140ms ease, height 140ms ease, border-radius 140ms ease",
            willChange: "transform",
          }}
        />
      </div>
    </>
  );
}
