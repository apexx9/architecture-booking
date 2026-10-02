import React from "react";
import Image from "next/image";
import Link from "next/link";

interface SampleProjectTypes {
  id: number;
  header: string;
  description: string;
  tags: string[];
  exploreRoute: string;
  image: string;
}

const SampleProject: SampleProjectTypes[] = [
  {
    id: 1,
    header: "Ocean Wave",
    description:
      "A flowing, organic design inspired by the movement and rhythm of the sea.",
    tags: ["Public Space", "Sydney"],
    exploreRoute: "/projects/#",
    image: "/assets/ocean-wave.png",
  },
  {
    id: 2,
    header: "Puzzle Tower",
    description:
      "A bold, modular design redefining vertical living with dynamic, interlocking structures.",
    tags: ["Residential", "Tokyo"],
    exploreRoute: "/projects/#",
    image: "/assets/puzzle-tower.png",
  },
  {
    id: 3,
    header: "Honey Comb",
    description:
      "A nature-inspired structure featuring a hexagonal design for beauty and efficiency.",
    tags: ["Pavilion", "Zurich"],
    exploreRoute: "/projects/#",
    image: "/assets/honey-comb.png",
  },
  {
    id: 4,
    header: "Yellow Suits",
    description:
      "A vibrant architectural statement blending bold color with modern, sophisticated design.",
    tags: ["Commercial", "Helsinki"],
    exploreRoute: "/projects/#",
    image: "/assets/yellow-suits.png",
  },
];

const SampleProjects = () => {
  return (
    <section data-nav-link="/templates" className="w-full bg-transparent py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col gap-12">
        {SampleProject.map((project, index) => {
          const words = project.header.split(" ");

          return (
            <article
              key={project.id}
              className="sticky group/article relative h-[420px] w-full overflow-hidden rounded-[28px] md:h-[520px] md:rounded-[32px] transition-transform duration-500"
              style={{
                top: `calc(7rem + ${index * 24}px)`,
                /*
                  Inherited by the image reveal below, so each card's photograph is
                  uncovered in sequence rather than all at once.
                */
                "--reveal-index": index,
              } as React.CSSProperties}
            >
              {/* Full-bleed image as the card background with smooth zoom */}
              <div className="scroll-image-reveal absolute inset-0">
                <Image
                  src={project.image}
                  alt={project.header}
                  fill
                  sizes="100vw"
                  priority={project.id === 1}
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover/article:scale-105"
                />
              </div>

              {/* Clean, light gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-12 lg:p-16">
                <div className="max-w-md">
                  <h3 className="text-5xl uppercase leading-[0.92] tracking-[-0.01em] text-white md:text-6xl lg:text-[72px]">
                    {words.map((word, i) => (
                      <span
                        key={`${project.id}-${word}`}
                        className={
                          i === 0
                            ? "block font-display font-normal"
                            : "block font-normal text-white/90"
                        }
                      >
                        {word}
                      </span>
                    ))}
                  </h3>

                  <p className="mt-6 max-w-xs text-[14px] leading-[1.7] text-white/85 md:text-[15px]">
                    {project.description}
                  </p>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <ul className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-white/40 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={project.exploreRoute}
                    aria-label={`Explore ${project.header}`}
                    className="shrink-0 rounded-full bg-white px-5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#191919] transition-transform duration-300 ease-out hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  >
                    Explore
                  </Link>
                </div>
              </div>

              {/*
                  Revealed by the diagonal wipe on hover.

                  This was a `div[role=button]` with no handler and no tab stop —
                  unreachable by keyboard, inert on click, and invisible on touch
                  where there is no hover to reveal it. It is a real link to the
                  same project as the Explore button, so it is focusable and
                  operable, and `.micro-reveal-hover` keeps it visible on pointers
                  that cannot hover.
                */}
                <Link
                  href={project.exploreRoute}
                  aria-label={`View ${project.header}`}
                  className="micro-reveal-hover absolute right-[18%] top-[22%] z-20 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#191919] opacity-0 shadow-xl transition-opacity duration-300 ease-out group-hover/article:opacity-100 focus-visible:opacity-100 group-focus-within/article:opacity-100 group-hover/article:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:h-20 md:w-20"
                >
                  {/* Diagonal sliding background layer with smoother, slower timing */}
                  <span className="absolute -inset-[100%] translate-x-[-100%] translate-y-[100%] rotate-[-45deg] bg-white transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover/article:translate-x-0 group-hover/article:translate-y-0" />

                  {/* Text with dynamic contrast switching via mix-blend-mode */}
                  <span className="relative z-10 text-[11px] font-medium uppercase tracking-[0.1em] text-white mix-blend-difference">
                    View
                  </span>
                </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default SampleProjects;
