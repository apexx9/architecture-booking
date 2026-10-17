"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, PaintBucket, SlidersHorizontal, Copy } from "lucide-react";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/utils/utils";

// Replace these paths with your actual images.
const mainImages = [
  "/assets/interior-1.jpg",
  "/assets/interior-2.jpg",
  "/assets/interior-3.jpg",
];

const insetImages = [
  "/assets/login-image.jpg",
  "/assets/signup-image.jpg",
  "/assets/reset-image.jpg",
];

/* -------------------------------------------------------------------------- */
/*  Frame geometry                                                            */
/*                                                                            */
/*  The big image has two "bites" taken out of it:                            */
/*    1. a smooth scooped notch in the top centre (holds the toolbar pill)    */
/*    2. a rounded cutout in the bottom-left corner (holds the inset image)   */
/*                                                                            */
/*  Both are cut with ONE SVG path used as a CSS mask, so the cutouts are     */
/*  truly transparent (no white boxes painted on top). The path is built in   */
/*  real pixels from the frame's measured size, so curves never get stretched */
/*  and everything scales smoothly from phone to desktop.                     */
/*  Numbers below are tuned at a 774px-wide frame (the reference design).     */
/* -------------------------------------------------------------------------- */

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const n = (v: number) => +v.toFixed(2);

function getMetrics(w: number) {
  const s = clamp(w / 774, 0.5, 1.25); // overall scale (outer corners)
  const f = Math.max(s, 0.75); // feature scale (notch, inset) never gets tiny

  const R = 60 * s; // outer corner radius

  // Top notch
  const F = 32 * f; // fillet where the notch meets the top edge
  const B = 30 * f; // radius of the notch's bottom corners
  const ND = F + B; // notch depth
  const NW = Math.min(176, w - 2 * R - 2 * F - 24); // notch inner width

  // Bottom-left cutout + inset image
  const insetW = 82 * f;
  const insetH = 122 * f;
  const insetR = 28 * f;
  const CW = insetW + 15 * f; // cutout width
  const CH = insetH + 10 * f; // cutout height
  const T = 28 * f; // cutout top-right corner
  const G = 36 * f; // fillet where cutout meets the bottom edge
  const L = 34 * f; // fillet where cutout meets the left edge

  return { R, F, B, ND, NW, insetW, insetH, insetR, CW, CH, T, G, L };
}

function buildPath(w: number, h: number) {
  const { R, F, B, ND, NW, CW, CH, T, G, L } = getMetrics(w);
  const x0 = w / 2 - NW / 2; // notch left wall
  const x1 = w / 2 + NW / 2; // notch right wall

  return [
    `M ${n(R)} 0`,
    // --- top notch ---
    `H ${n(x0 - F)}`,
    `A ${n(F)} ${n(F)} 0 0 1 ${n(x0)} ${n(F)}`,
    `V ${n(ND - B)}`,
    `A ${n(B)} ${n(B)} 0 0 0 ${n(x0 + B)} ${n(ND)}`,
    `H ${n(x1 - B)}`,
    `A ${n(B)} ${n(B)} 0 0 0 ${n(x1)} ${n(ND - B)}`,
    `V ${n(F)}`,
    `A ${n(F)} ${n(F)} 0 0 1 ${n(x1 + F)} 0`,
    `H ${n(w - R)}`,
    // --- top-right + bottom-right corners ---
    `A ${n(R)} ${n(R)} 0 0 1 ${n(w)} ${n(R)}`,
    `V ${n(h - R)}`,
    `A ${n(R)} ${n(R)} 0 0 1 ${n(w - R)} ${n(h)}`,
    // --- bottom-left cutout ---
    `H ${n(CW + G)}`,
    `A ${n(G)} ${n(G)} 0 0 1 ${n(CW)} ${n(h - G)}`,
    `V ${n(h - CH + T)}`,
    `A ${n(T)} ${n(T)} 0 0 0 ${n(CW - T)} ${n(h - CH)}`,
    `H ${n(L)}`,
    `A ${n(L)} ${n(L)} 0 0 1 0 ${n(h - CH - L)}`,
    // --- top-left corner ---
    `V ${n(R)}`,
    `A ${n(R)} ${n(R)} 0 0 1 ${n(R)} 0`,
    "Z",
  ].join(" ");
}

function buildMaskUrl(w: number, h: number) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" ` +
    `viewBox="0 0 ${n(w)} ${n(h)}"><path d="${buildPath(w, h)}" fill="black"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const Hero = () => {
  const [mainIndex, setMainIndex] = useState(0);
  const [insetIndex, setInsetIndex] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Slider: change the main image, then the inset a moment later.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setMainIndex((prev) => (prev + 1) % mainImages.length);
      timeout = setTimeout(() => {
        setInsetIndex((prev) => (prev + 1) % insetImages.length);
      }, 300);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Measure the frame so the mask path is always pixel-accurate.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize((prev) =>
        prev &&
        Math.abs(prev.w - width) < 0.5 &&
        Math.abs(prev.h - height) < 0.5
          ? prev
          : { w: width, h: height },
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const m = getMetrics(size?.w ?? 774);

  const maskStyle: React.CSSProperties = size
    ? (() => {
        const url = buildMaskUrl(size.w, size.h);
        return {
          WebkitMaskImage: url,
          maskImage: url,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        };
      })()
    : { borderRadius: 40 }; // graceful fallback until the first measurement

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-white px-4 py-20 sm:px-10">
      {/* Text Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center sm:gap-6">
        <h1 className="font-normal leading-[1.1] tracking-tight text-[#1A1A1A] text-[clamp(2.2rem,6vw,4.5rem)]">
          YOUR <br />
          <span className="font-display">DREAM</span> <br />
          PLACE
        </h1>
        <p className="max-w-xl text-pretty font-normal text-[14px] text-gray-500 sm:text-[16px]">
          Designing timeless, luxurious spaces that redefine modern architecture
          and living.
        </p>
      </div>

      {/* Image frame */}
      <div
        ref={frameRef}
        className="relative mt-12 aspect-[4/3] w-full max-w-7xl sm:mt-14 sm:aspect-[16/9] lg:aspect-auto lg:h-[576px]"
      >
        {/* Masked main image (notch + bottom-left cutout are cut out of this) */}
        <div
          className="absolute inset-0 overflow-hidden bg-gray-100"
          style={maskStyle}
        >
          {mainImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Architecture main ${index + 1}`}
              fill
              priority={index === 0}
              sizes="(max-width: 1280px) 100vw, 1280px"
              quality={90}
              className={`object-cover object-center grayscale transition-opacity duration-1000 ${
                index === mainIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        {/* Floating toolbar — sits inside the top notch */}
        <div className="absolute left-1/2 top-0 z-20 flex h-9 -translate-x-1/2 items-center gap-4 rounded-full bg-[#F1F1F1] px-5">
          <button
            type="button"
            aria-label="Style"
            className="text-gray-500 transition-colors hover:text-gray-900"
          >
            <PaintBucket className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Adjust"
            className="text-gray-500 transition-colors hover:text-gray-900"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Duplicate"
            className="text-gray-500 transition-colors hover:text-gray-900"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Inset image — sits inside the bottom-left cutout */}
        <div
          className="absolute bottom-0 left-0 z-20 overflow-hidden bg-gray-200"
          style={{
            width: m.insetW,
            height: m.insetH,
            borderRadius: m.insetR,
          }}
        >
          {insetImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Architecture detail ${index + 1}`}
              fill
              sizes="150px"
              className={`object-cover object-center transition-opacity duration-1000 ${
                index === insetIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Section (Original Content) */}
      <div className="relative z-10 mx-auto mt-20 flex w-full max-w-7xl flex-col items-start gap-6 pb-4 sm:gap-8 md:flex-row md:justify-between">
        <div className="flex flex-col items-start gap-3 sm:gap-4">
          <h2 className="max-w-2xl text-left font-medium leading-tight text-[#1A1A1A] text-[clamp(1.75rem,6vw,4rem)]">
            We love &amp; live architecture
          </h2>
          <a
            href="/about"
            className="group flex items-center gap-3 font-medium text-[16px] text-[#1A1A1A] transition-opacity hover:opacity-80 sm:gap-4 sm:text-[22px]"
          >
            Our Story{" "}
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 transition-transform duration-300 group-hover:translate-x-2 group-hover:border-black sm:h-12 sm:w-12">
              <ArrowRight className="micro-arrow h-4 w-4 text-[#1A1A1A] sm:h-5 sm:w-5" />
            </span>
          </a>
        </div>

        <div className="flex w-full max-w-[550px] flex-col">
          <p className="text-left text-[14px] font-normal leading-relaxed text-gray-600 sm:text-[17px] lg:text-[24px]">
            {APP_NAME} creates luxurious, modern spaces where innovation meets
            timeless elegance. Our designs push boundaries, blending precision,
            creativity, and functionality.{" "}
            <span className="hidden sm:inline">
              <br />
            </span>
            With a commitment to excellence, we craft architectural masterpieces
            that inspire and endure. Every project reflects our passion for bold
            ideas, meticulous craftsmanship, and the future of contemporary
            living.
          </p>

          <div className="mt-4 flex flex-col gap-1.5 sm:mt-7">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="break-words text-[14px] font-normal text-gray-600 decoration-gray-400 transition-all duration-200 hover:text-black hover:underline hover:underline-offset-4 sm:text-[16px] lg:text-[18px]"
            >
              {SUPPORT_EMAIL}
            </a>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="break-words text-[14px] font-normal text-gray-600 decoration-gray-400 transition-all duration-200 hover:text-black hover:underline hover:underline-offset-4 sm:text-[16px] lg:text-[18px]"
            >
              {SUPPORT_PHONE}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
