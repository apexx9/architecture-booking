import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { EngageCta } from "@/components/auth/engage-cta";

const features = [
  {
    number: "01",
    label: "CLIENT RELATIONSHIPS",
    title: "Every conversation has a place.",
    text: "Keep enquiries, client details, proposals, and important decisions connected to the work they belong to.",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Calm contemporary living space with carefully considered materials",
  },
  {
    number: "02",
    label: "PROJECT DELIVERY",
    title: "Move the work forward.",
    text: "Bring project information, deliverables, and client approvals into a clearer sequence from one stage to the next.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Modern architectural interior with natural light",
  },
  {
    number: "03",
    label: "PRACTICE OPERATIONS",
    title: "See the practice behind the plans.",
    text: "Build toward a more connected view of procurement, site activity, invoices, and payments as Renove develops.",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Architectural space with warm materials and clean lines",
  },
];

const workflow = [
  ["01", "Enquiry", "Keep the first conversation and client details in view."],
  ["02", "Proposal", "Bring the scope, proposal, and next decision together."],
  ["03", "Project", "Give project information and deliverables a clear home."],
  ["04", "Delivery", "Follow approvals and business tasks as the work progresses."],
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.2em] text-current/65">
      <span aria-hidden="true" className="h-px w-7 bg-current/55" />
      {children}
    </p>
  );
}

export default function Page() {
  return (
    <div className="overflow-hidden bg-white text-[#191919]">
      <section
        data-nav-link="/"
        aria-label="Renove introduction"
        className="relative isolate flex min-h-[min(780px,calc(100svh-4rem))] items-end bg-[#292a28] text-white"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2400&q=90')",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/40" />
        <div className="mx-auto grid w-full max-w-[1600px] gap-12 px-5 pb-10 pt-24 sm:px-8 sm:pb-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.7fr)] lg:items-end lg:px-14 xl:px-20">
          <div className="max-w-4xl">
            <Eyebrow>Practice management, thoughtfully connected</Eyebrow>
            <h1 className="mt-7 max-w-4xl text-balance text-[clamp(3.3rem,8vw,8rem)] font-normal leading-[0.88] tracking-[-0.075em]">
              Make room for
              <br />
              <span className="font-display italic">better work.</span>
            </h1>
            <p className="mt-7 max-w-xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
              Renove brings the business of architecture and interior design into one more considered workspace — from the first client enquiry to project delivery.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <EngageCta label="Explore Renove" next="/dashboard" />
              <Link
                href="#product"
                className="group inline-flex min-h-11 items-center gap-2 text-sm text-white/90 transition-colors hover:text-white"
              >
                Discover the workspace
                <ArrowDown aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-y-1" />
              </Link>
            </div>
          </div>
          <div className="flex items-end justify-between gap-6 border-t border-white/35 pt-4 lg:justify-self-end lg:border-t-0 lg:border-l lg:pl-6">
            <p className="max-w-[230px] text-xs leading-5 text-white/75">
              For architects, interior designers, and the small practices shaping the spaces around us.
            </p>
            <p className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/75">RENOVE / 001</p>
          </div>
        </div>
        <div aria-hidden="true" className="absolute right-5 top-7 hidden items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-white/75 sm:flex lg:right-14">
          <span>Design practice</span><span className="h-px w-8 bg-white/60" /><span>Management</span>
        </div>
      </section>

      <section id="product" data-nav-link="/#product" className="px-5 py-20 sm:px-8 sm:py-28 lg:px-14 xl:px-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          <div>
            <Eyebrow>A more considered practice</Eyebrow>
            <h2 className="mt-6 max-w-2xl text-balance text-4xl font-normal leading-[1.02] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Great work needs a structure behind it.
            </h2>
          </div>
          <div className="flex flex-col justify-end">
            <p className="max-w-2xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8">
              The design is only one part of running a practice. Client conversations, project documents, approvals, procurement, and payments all need attention too. Renove is being built to give those moving parts a clearer place to live.
            </p>
            <div className="mt-8 grid grid-cols-3 border-t border-black/15 pt-5">
              <div className="pr-3"><p className="text-[10px] uppercase tracking-[0.15em] text-black/45">01</p><p className="mt-2 text-sm sm:text-base">Clients</p></div>
              <div className="border-l border-black/15 px-3 sm:px-5"><p className="text-[10px] uppercase tracking-[0.15em] text-black/45">02</p><p className="mt-2 text-sm sm:text-base">Projects</p></div>
              <div className="border-l border-black/15 pl-3 sm:pl-5"><p className="text-[10px] uppercase tracking-[0.15em] text-black/45">03</p><p className="mt-2 text-sm sm:text-base">Operations</p></div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Renove product areas" className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-14 xl:px-20">
        <div className="mx-auto grid max-w-[1440px] gap-5 md:grid-cols-3 md:gap-6">
          {features.map((feature) => (
            <article key={feature.number} className="group min-w-0">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#e8e6e1]">
                <div
                  role="img"
                  aria-label={feature.imageAlt}
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                  style={{ backgroundImage: `url('${feature.image}')` }}
                />
                <div aria-hidden="true" className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                <span className="absolute left-4 top-4 border border-white/70 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white sm:left-5 sm:top-5">{feature.number} / RENOVE</span>
                <ArrowUpRight aria-hidden="true" className="absolute bottom-5 right-5 h-5 w-5 text-white" />
              </div>
              <div className="pt-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.17em] text-black/50">{feature.label}</p>
                <h3 className="mt-3 text-2xl font-normal leading-tight tracking-[-0.04em] sm:text-3xl">{feature.title}</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-black/60">{feature.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" data-nav-link="/#workflow" className="bg-[#f4f3f0] px-5 py-20 sm:px-8 sm:py-28 lg:px-14 xl:px-20">
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <Eyebrow>From first enquiry to delivery</Eyebrow>
            <h2 className="mt-6 max-w-xl text-balance text-4xl font-normal leading-[1.02] tracking-[-0.06em] sm:text-6xl">
              One practice. A clearer process.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-6 text-black/60 sm:text-base sm:leading-7">
              Renove is designed around the stages that connect a client relationship to a finished project. Some workflows remain in development; available functionality may vary.
            </p>
            <Link href="#contact" className="group mt-8 inline-flex items-center gap-2 text-sm font-medium">
              See if Renove fits your practice
              <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="border-t border-black/20">
            {workflow.map(([number, title, description]) => (
              <article key={number} className="grid gap-3 border-b border-black/20 py-6 sm:grid-cols-[64px_0.75fr_1.25fr] sm:items-start sm:gap-5 sm:py-7">
                <span className="pt-1 text-[10px] tracking-[0.16em] text-black/45">{number}</span>
                <h3 className="text-xl font-normal tracking-[-0.03em] sm:text-2xl">{title}</h3>
                <p className="max-w-lg text-sm leading-6 text-black/60">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" data-nav-link="/#contact" className="bg-[#191a19] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-14 xl:px-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-20">
          <div>
            <Eyebrow>Bring the practice into focus</Eyebrow>
            <h2 className="mt-6 max-w-4xl text-balance text-5xl font-normal leading-[0.94] tracking-[-0.07em] sm:text-7xl lg:text-8xl">
              Make space for <span className="font-display italic">better work.</span>
            </h2>
          </div>
          <div className="md:pb-2">
            <p className="max-w-md text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
              Explore the Renove workspace and follow the product as more of the practice workflow comes together.
            </p>
            <div className="mt-7"><EngageCta label="Get started with Renove" next="/dashboard" /></div>
            <p className="mt-4 text-xs leading-5 text-white/45">Sign up to explore the functionality currently available.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
