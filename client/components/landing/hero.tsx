import React from "react";
import Image from "next/image";
import HeroImage from "@/public/assets/hero-img.jpg";
import { ArrowRight } from "lucide-react";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/utils/utils";

/*
 * Positions a heading line within its reveal cascade. `motion-design` treats a
 * stagger as meaningful only when it expresses hierarchy, so this is the whole
 * mechanism: a hand-picked order, not a computed delay.
 */
const line = (index: number) =>
  ({ "--reveal-index": index }) as React.CSSProperties;

const Hero = () => {
  return (
    <section
      data-nav-link="/"
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-between overflow-hidden bg-[#191919] px-5 py-10 sm:min-h-[120dvh] sm:px-10 sm:py-16 md:min-h-[145dvh] lg:min-h-[170dvh] lg:py-20"
    >
      {/* Background Image locked strictly to the viewport, not the tall section */}
      <div className="absolute inset-x-0 top-0 h-[100svh] w-full overflow-hidden">
        <Image
          src={HeroImage}
          alt="Interior architectural design"
          fill
          priority
          sizes="100vw"
          quality={90}
          className="scroll-hero-drift object-cover object-center"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50 sm:bg-black/40" />
      </div>

      {/* Main Hero Content */}
      <div className="scroll-hero-exit relative z-10 mx-auto mt-8 flex w-full max-w-5xl flex-col items-center gap-4 text-center sm:mt-20 sm:gap-6 lg:mt-24">
        {/*
          Fluid ramp heading. The three lines were already hard-broken with
          <br />, so they are wrapped in scroll-reveal masks rather than split
          in JS — the visual line count is authored, not measured.
        */}
        <h1 className="font-medium leading-none tracking-tight text-white text-[clamp(2.2rem,11vw,6rem)]">
          <span className="scroll-line-mask">
            <span style={line(0)}>YOUR</span>
          </span>
          <span className="scroll-line-mask">
            <span className="font-display" style={line(1)}>
              DREAM
            </span>
          </span>
          <span className="scroll-line-mask">
            <span style={line(2)}>PLACE</span>
          </span>
        </h1>
        <p className="max-w-sm text-pretty font-normal text-[15px] text-white/90 sm:max-w-md sm:text-lg lg:text-xl">
          Designing timeless, luxurious spaces that redefine modern architecture
          and living.
        </p>
      </div>

      {/* Scroll Button */}
      <div className="relative z-10 my-6 sm:my-0 sm:mt-15">
        <a
          href="#services"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#191919] font-medium text-[10px] text-white shadow-xl transition-transform duration-200 hover:scale-105 hover:bg-[#191919]/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:mr-[120px] sm:h-20 sm:w-20 sm:text-[13px] md:mr-[260px] md:h-24 md:w-24 md:text-[14px] lg:mr-[500px]"
        >
          SCROLL
        </a>
      </div>

      {/* Bottom Section */}
      <div
        data-nav-link="/about"
        className="scroll-reveal relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start gap-6 pb-4 sm:gap-8 md:flex-row md:justify-between"
      >
        <div className="flex flex-col items-start gap-3 sm:gap-4">
          <h2 className="max-w-2xl text-left font-medium leading-tight text-white text-[clamp(1.75rem,6vw,4rem)]">
            We love &amp; live architecture
          </h2>
          <a
            href="/about"
            className="group flex items-center gap-3 font-medium text-[16px] text-white transition-opacity hover:opacity-80 sm:gap-4 sm:text-[22px]"
          >
            Our Story{" "}
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 transition-transform duration-300 group-hover:translate-x-2 group-hover:border-white sm:h-12 sm:w-12">
              <ArrowRight className="micro-arrow w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </span>
          </a>
        </div>

        <div className="flex w-full max-w-[550px] flex-col">
          <p className="text-left text-[14px] leading-relaxed font-normal text-white/95 sm:text-[17px] lg:text-[24px]">
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
              className="break-words text-[14px] font-normal text-white/90 decoration-white/50 transition-all duration-200 hover:opacity-80 hover:underline hover:underline-offset-4 sm:text-[16px] lg:text-[18px]"
            >
              {SUPPORT_EMAIL}
            </a>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="break-words text-[14px] font-normal text-white/90 decoration-white/50 transition-all duration-200 hover:opacity-80 hover:underline hover:underline-offset-4 sm:text-[16px] lg:text-[18px]"
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
