import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  FileCheck2,
  FolderKanban,
  Layers3,
  ReceiptText,
  Users,
} from "lucide-react";
import { EngageCta } from "@/components/auth/engage-cta";

const services = [
  {
    n: "01",
    title: "Architecture practices",
    text: "Keep briefs, client conversations, project records, and key decisions connected from the first enquiry onward.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
    alt: "Quiet contemporary architecture with considered natural materials",
    note: "A clearer home for every project",
  },
  {
    n: "02",
    title: "Interior design studios",
    text: "Bring proposals, material choices, deliverables, and client approvals into a process your team can follow.",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85",
    alt: "Warm, carefully composed contemporary interior",
    note: "Keep details and decisions together",
  },
  {
    n: "03",
    title: "Project delivery",
    text: "Keep procurement, site updates, invoices, and payments in view as work moves from one stage to the next.",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85",
    alt: "Architectural living space with a clear view of materials and finishes",
    note: "Follow the work beyond the drawings",
  },
];

const workflow = [
  { n: "01", title: "Capture the enquiry", text: "Keep prospective clients and the first conversations that start a project in view.", Icon: Users },
  { n: "02", title: "Organise the project", text: "Give project details, documents, and next steps a clearer place to live.", Icon: FolderKanban },
  { n: "03", title: "Keep decisions moving", text: "Bring proposals, deliverables, and client approvals into a more considered process.", Icon: FileCheck2 },
  { n: "04", title: "Stay on top of the business", text: "Build toward a clearer view of procurement, site activity, invoices, and payments.", Icon: ReceiptText },
];

const audiences = [
  ["Independent practitioners", "Spend less energy keeping track of every conversation and project detail."],
  ["Small design studios", "Give your team a shared way to understand what's moving and what needs attention."],
  ["Growing practices", "Create repeatable processes as your client list and project workload expand."],
];

function WorkspacePreview() {
  const rows = [
    ["01", "Clients", "Relationships and conversations in one place", "12"],
    ["02", "Active projects", "Milestones, documents, and next steps", "08"],
    ["03", "Approvals", "Decisions waiting for a response", "03"],
    ["04", "Deliverables", "Items prepared for client review", "06"],
  ];
  return (
    <div aria-label="Illustrative Renove workspace preview" className="overflow-hidden border border-black/15 bg-[#fbfaf8] shadow-[0_28px_90px_rgba(0,0,0,0.09)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-[#191919] text-white"><Layers3 className="h-4 w-4" aria-hidden="true" /></div>
          <div><p className="text-sm font-medium">Renove <span className="font-normal text-black/40">/ My practice</span></p><p className="text-[11px] text-black/50">Practice overview</p></div>
        </div>
        <span className="border border-black/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-black/55">Concept preview</span>
      </div>
      <div className="grid md:grid-cols-[150px_minmax(0,1fr)]">
        <aside className="hidden border-r border-black/10 bg-white p-4 md:block">
          <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-black/40">Workspace</p>
          {["Overview", "Clients", "Projects", "Deliverables", "Finances"].map((item, i) => <p key={item} className={`mb-1 px-3 py-2 text-xs ${i === 0 ? "bg-[#efeee9] font-medium" : "text-black/55"}`}>{item}</p>)}
          <div className="mt-8 border-t border-black/10 pt-4"><p className="text-[10px] uppercase tracking-[0.12em] text-black/40">Practice health</p><div className="mt-3 h-1.5 bg-black/10"><div className="h-full w-[72%] bg-[#77766f]" /></div><p className="mt-2 text-[11px] text-black/55">Project activity</p></div>
        </aside>
        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-[10px] uppercase tracking-[0.14em] text-black/45">Monday, workspace overview</p><h3 className="mt-1 text-2xl font-normal tracking-[-0.045em] sm:text-3xl">A clearer view of the work.</h3></div>
            <span className="text-xs text-black/45">Illustrative data</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="border border-black/10 bg-white p-3 sm:p-4"><p className="text-xs text-black/50">Active projects</p><p className="mt-3 text-2xl tracking-tight">08</p><p className="mt-1 text-[10px] text-black/45">Across your practice</p></div>
            <div className="border border-black/10 bg-white p-3 sm:p-4"><p className="text-xs text-black/50">Awaiting approval</p><p className="mt-3 text-2xl tracking-tight">03</p><p className="mt-1 text-[10px] text-black/45">Client decisions</p></div>
            <div className="col-span-2 border border-black/10 bg-white p-3 sm:p-4 lg:col-span-1"><div className="flex items-center justify-between gap-2"><p className="text-xs text-black/50">Financial progress</p><ReceiptText className="h-4 w-4 text-black/45" aria-hidden="true" /></div><p className="mt-3 text-2xl tracking-tight">In view</p><p className="mt-1 text-[10px] text-black/45">Invoices and payments, together</p></div>
          </div>
          <div className="mt-5 border border-black/10 bg-white">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3"><p className="text-xs font-medium">Your practice at a glance</p><span className="text-[10px] text-black/45">Overview</span></div>
            {rows.map(([n, title, description, count]) => <div key={n} className="flex items-center gap-3 border-b border-black/10 px-3 py-3 last:border-0 sm:px-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center border border-black/10 text-[10px] text-black/50">{n}</span><div className="min-w-0 flex-1"><p className="text-xs font-medium">{title}</p><p className="mt-1 text-[10px] leading-relaxed text-black/50 sm:text-[11px]">{description}</p></div><span className="min-w-7 border border-black/10 px-2 py-1 text-center text-[10px] text-black/60">{count}</span><ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-black/35 sm:block" aria-hidden="true" /></div>)}
          </div>
        </div>
      </div>
      <p className="border-t border-black/10 bg-white px-4 py-2.5 text-[10px] leading-relaxed text-black/45 sm:px-6">Illustrative product concept, not a screenshot of the live application. Data is fictional and feature availability may vary while Renove is in development.</p>
    </div>
  );
}

export default function Page() {
  return (
    <main className="overflow-hidden bg-[#F8F7F4] text-[#191919]">
      <section data-nav-link="/" className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-14 lg:py-20 xl:px-20">
        <div className="home-enter home-enter-1 max-w-2xl">
          <p className="mb-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-black/55"><span className="h-px w-8 bg-black/50" />Practice management for design professionals</p>
          <h1 className="text-balance text-[clamp(3.2rem,7vw,6.6rem)] font-normal leading-[0.94] tracking-[-0.065em]">A better way to run your <span className="font-display italic">design practice.</span></h1>
          <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-black/65 sm:text-lg sm:leading-8">Renove brings clients, projects, approvals, deliverables, and financial progress into one considered workspace — so the business behind your design work feels easier to manage.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4"><EngageCta label="Explore Renove" next="/dashboard" /><Link href="#how-it-works" className="group inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium underline decoration-black/25 underline-offset-4 hover:decoration-black">See how it works<ArrowRight className="micro-arrow h-4 w-4" aria-hidden="true" /></Link></div>
          <p className="mt-4 text-xs leading-relaxed text-black/45">Renove is evolving. Explore the workspace to see what is available today.</p>
          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-black/10 pt-5 text-xs text-black/60 sm:gap-4 sm:text-sm"><span className="text-[10px] uppercase tracking-[0.16em] text-black/45">For</span><span>Architects</span><span className="h-1 w-1 bg-black/30" /><span>Interior designers</span><span className="h-1 w-1 bg-black/30" /><span>Design studios</span></div>
        </div>
        <div className="home-enter home-enter-2 relative lg:pl-2">
          <div className="relative aspect-[4/4.5] overflow-hidden bg-[#e7e4dc] sm:aspect-[5/4] lg:aspect-[4/4.5]">
            <Image src={services[0].image} alt={services[0].alt} fill priority sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover transition-transform duration-700 ease-out hover:scale-[1.025]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7"><div><p className="text-[10px] uppercase tracking-[0.18em] text-white/75">A more considered practice</p><p className="mt-2 max-w-sm text-xl leading-snug tracking-tight sm:text-2xl">Make space for the work. Keep the details in order.</p></div><ArrowDownRight className="mb-1 h-6 w-6 shrink-0" aria-hidden="true" /></div>
          </div>
          <div className="absolute -bottom-4 right-4 hidden border border-black/10 bg-[#F8F7F4] px-4 py-3 text-xs shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:block lg:-right-4"><span className="block text-black/45">One connected workspace</span><span className="mt-1 block font-medium">Clients · Projects · Practice</span></div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="scroll-reveal grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end md:gap-16">
            <div><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">A practice, connected</p><h2 className="mt-5 max-w-xl text-balance text-3xl font-normal leading-tight tracking-[-0.045em] sm:text-5xl">Everything around the design, in better order.</h2></div>
            <p className="max-w-2xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8">Great work depends on more than the final drawings. Renove helps bring the people, information, decisions, and follow-through around each project into a more coherent process.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-4">
            {services.map((service, i) => <article key={service.n} className="scroll-reveal-group group min-w-0" style={{ "--reveal-index": i } as React.CSSProperties}>
              <div className="relative aspect-[4/3] overflow-hidden bg-[#e7e4dc]"><Image src={service.image} alt={service.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="scroll-image-reveal object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]" /></div>
              <div className="flex items-start justify-between gap-4 pt-5"><span className="text-[10px] tracking-[0.14em] text-black/45">{service.n}</span><span className="text-right text-[10px] uppercase tracking-[0.12em] text-black/45">{service.note}</span></div>
              <h3 className="mt-3 text-xl font-medium tracking-tight sm:text-2xl">{service.title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-black/60 sm:text-base sm:leading-7">{service.text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="scroll-reveal mb-10 grid gap-6 md:grid-cols-[0.75fr_1.25fr] md:items-end md:gap-16"><div><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">Inside Renove</p><h2 className="mt-5 max-w-xl text-balance text-3xl font-normal leading-tight tracking-[-0.045em] sm:text-5xl">A clearer picture of your practice.</h2></div><p className="max-w-2xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8">An elegant overview of the moving parts: client relationships, active projects, approvals, deliverables, and financial progress — without losing sight of the work itself.</p></div>
          <div className="scroll-reveal"><WorkspacePreview /></div>
        </div>
      </section>

      <section id="how-it-works" data-nav-link="/templates" className="scroll-mt-24 border-y border-black/10 bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="scroll-reveal grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end md:gap-16"><div><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">A clearer way to work</p><h2 className="mt-5 max-w-xl text-balance text-3xl font-normal leading-tight tracking-[-0.045em] sm:text-5xl">From first conversation to final delivery.</h2></div><p className="max-w-2xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8">Renove's intended workflow connects the moving parts of a design practice. Availability varies as the product continues to take shape.</p></div>
          <div className="mt-12 border-t border-black/15">{workflow.map(({ n, title, text, Icon }, i) => <article key={n} className="scroll-reveal grid gap-4 border-b border-black/15 py-7 sm:grid-cols-[64px_minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-start sm:gap-8 sm:py-9" style={{ "--reveal-index": i } as React.CSSProperties}><span className="pt-1 text-xs tracking-[0.12em] text-black/45">{n}</span><div className="flex items-start gap-3"><Icon className="mt-1 h-5 w-5 shrink-0 text-black/55" aria-hidden="true" /><h3 className="text-xl font-medium tracking-tight sm:text-2xl">{title}</h3></div><p className="max-w-xl text-sm leading-6 text-black/60 sm:text-base sm:leading-7">{text}</p></article>)}</div>
        </div>
      </section>

      <section id="for-practices" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl"><p className="scroll-reveal text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">Who it's for</p><div className="mt-5 grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16"><h2 className="scroll-reveal max-w-lg text-balance text-3xl font-normal leading-tight tracking-[-0.045em] sm:text-5xl">Built for the practice you're building.</h2><div className="divide-y divide-black/10 border-y border-black/10">{audiences.map(([title, description], i) => <article key={title} className="scroll-reveal grid gap-3 py-6 sm:grid-cols-[44px_0.8fr_1.2fr] sm:gap-5" style={{ "--reveal-index": i } as React.CSSProperties}><span className="text-xs tracking-[0.12em] text-black/40">0{i + 1}</span><h3 className="text-base font-medium">{title}</h3><p className="text-sm leading-6 text-black/60">{description}</p></article>)}</div></div></div>
      </section>

      <section className="px-5 pb-16 pt-4 sm:px-8 sm:pb-24 lg:px-14"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 border-t border-black/15 pt-10 sm:pt-14 md:flex-row md:items-end"><div className="scroll-reveal max-w-3xl"><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">Your practice, more considered</p><h2 className="mt-5 text-balance text-4xl font-normal leading-[1.02] tracking-[-0.055em] sm:text-6xl">Make more room for the work you love.</h2><p className="mt-5 max-w-xl text-base leading-7 text-black/60">Take a look inside Renove and explore the parts of the workspace available today.</p></div><div className="home-enter shrink-0 pb-1"><EngageCta label="Explore Renove" next="/dashboard" /></div></div></section>
    </main>
  );
}
