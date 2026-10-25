"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function HeroMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlat, setIsFlat] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const card = cardRef.current;
    const container = containerRef.current;
    if (!card || !container) return;

    // 1. Original Stitch scroll un-tilt listener + GSAP ScrollTrigger scrub
    const handleScroll = () => {
      const rect = card.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // When user scrolls, untilt smoothly with Stitch cubic-bezier
      if (rect.top < windowHeight * 0.75) {
        setIsFlat(true);
      } else {
        setIsFlat(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // GSAP ScrollTrigger: continuous scrub for ultra-smooth SaaS 3D tilt as user scrolls from top
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "450px top",
      scrub: 1,
      onUpdate: (self) => {
        if (!container.matches(":hover")) {
          const progress = self.progress;
          const rotX = (1 - progress) * 16;
          const scale = 0.96 + progress * 0.04;
          card.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(0deg) scale(${scale.toFixed(3)})`;
        }
      },
    });

    // 2. Desktop subtle mouse tilt interaction from Stitch design
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1)`;
    };

    const handleMouseLeave = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const progress = Math.min(1, Math.max(0, scrollY / 450));
      const rotX = (1 - progress) * 16;
      const scale = 0.96 + progress * 0.04;
      card.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(0deg) scale(${scale.toFixed(3)})`;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      st.kill();
      window.removeEventListener("scroll", handleScroll);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[1280px] perspective-container pb-8 mx-auto relative select-none"
      id="live-mockup"
      style={{ perspective: "1200px" }}
    >
      <div
        ref={cardRef}
        id="tiltedCard"
        className={`tilted-mockup w-full bg-white border-[2px] border-[#0F172A] shadow-[6px_6px_0px_0px_#0F172A] overflow-hidden rounded-[4px] text-left transition-all duration-300 hover:shadow-[10px_10px_0px_0px_#0F172A] relative ${
          isFlat ? "is-flat" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          transform: "rotateX(15deg) scale(0.97)",
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        }}
      >
        {/* Animated Scan Line (Sweeps smoothly down the dashboard image) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <div className="w-full h-24 bg-gradient-to-b from-transparent via-emerald-500/15 to-transparent absolute -top-24 left-0 animate-[scan_5s_ease-in-out_infinite]" />
        </div>

        {/* Crisp High-Resolution Dashboard Image (Uncompressed 2048x1182) */}
        <Image
          src="/landing/institutional-dashboard.png"
          alt="Institutional Dashboard - Real-time claim flow & SLA tracking"
          width={2048}
          height={1182}
          priority
          unoptimized
          className="w-full h-auto block object-cover pointer-events-none"
          style={{
            imageRendering: "-webkit-optimize-contrast",
            display: "block",
            width: "100%",
          }}
        />

        {/* Live Status Pulse Badges on Image (Matches design claim items) */}
        <div className="absolute top-[28%] left-[44%] hidden sm:flex items-center gap-1.5 pointer-events-none z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        <div className="absolute top-[28%] left-[78%] hidden sm:flex items-center gap-1.5 pointer-events-none z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
        </div>
      </div>
    </div>
  );
}
