import React from "react";

interface Service {
  id: number;
  sectionHeader: string;
  sectionInfo: string;
  sectionTags: string[];
}

const SERVICES: Service[] = [
  {
    id: 1,
    sectionHeader: "Architecture Design",
    sectionInfo:
      "We create innovative, modern architectural designs that blend luxury, functionality, and timeless aesthetics. Every structure is meticulously planned to harmonize with its surroundings while delivering exceptional quality and sophistication.",
    sectionTags: ["Concept Development", "Space Planning", "3D Visualization"],
  },
  {
    id: 2,
    sectionHeader: "Interior Design",
    sectionInfo:
      "Our interior designs elevate spaces with refined materials, thoughtful layouts, and a seamless blend of elegance and comfort, ensuring every detail enhances both aesthetics and functionality.",
    sectionTags: [
      "Luxury Furnishings & Materials",
      "Custom Lighting Design",
      "Spatial Optimization",
    ],
  },
  {
    id: 3,
    sectionHeader: "Exterior Design",
    sectionInfo:
      "We craft striking exteriors that integrate seamlessly with nature and urban environments, combining form, texture, and innovative materials for a bold yet timeless presence.",
    sectionTags: [
      "Façade Design",
      "Landscape Integration",
      "Outdoor Living Spaces",
    ],
  },
];

const OurServices = () => {
  return (
    <section
      data-nav-link="/"
      className="scroll-reveal relative z-10 -my-10 mx-auto w-full max-w-7xl rounded-3xl bg-white px-6 py-24 sm:px-10"
    >
      <h2 className="text-center text-[13px] font-medium uppercase tracking-[0.2em] text-[#191919]">
        Our Services
      </h2>

      <ul className="mt-20 divide-y divide-black/10">
        {SERVICES.map((service) => (
          <li key={service.id}>
            <article className="grid grid-cols-1 gap-6 py-16 md:grid-cols-12 md:gap-8">
              <span className="text-[20px] font-display font-light text-[#191919] md:col-span-2">
                {String(service.id).padStart(2, "0")}
              </span>

              <h3 className="text-[22px] font-medium text-[#191919] md:col-span-4">
                {service.sectionHeader}
              </h3>

              <div className="flex flex-col gap-8 md:col-span-6">
                <p className="text-[15px] leading-relaxed text-[#191919]/80">
                  {service.sectionInfo}
                </p>

                <ul className="flex flex-col gap-3">
                  {service.sectionTags.map((tag) => (
                    <li
                      key={tag}
                      className="text-[12px] uppercase tracking-[0.08em] text-[#191919]/70"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default OurServices;
