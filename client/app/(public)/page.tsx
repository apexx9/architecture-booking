import Link from "next/link";
import { ArrowRight, Check, FileCheck2, FolderKanban, Layers3, ReceiptText, Users } from "lucide-react";
import { EngageCta } from "@/components/auth/engage-cta";

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
    ["01", "Client relationships", "Keep people and project conversations together"],
    ["02", "Project information", "Give each project a clearer home"],
    ["03", "Documents & decisions", "Make important details easier to follow"],
  ];
  return (
    <div aria-label="Illustrative preview of a practice management workspace" className="w-full border border-black/15 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-[#191919] text-white"><Layers3 className="h-4 w-4" aria-hidden="true" /></div>
          <div><p className="text-sm font-medium">My practice</p><p className="text-[11px] text-black/50">Workspace overview</p></div>
        </div>
        <span className="border border-black/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-black/55">Preview concept</span>
      </div>
      <div className="grid sm:grid-cols-[145px_minmax(0,1fr)]">
        <aside className="hidden border-r border-black/10 p-4 sm:block">
          <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-black/40">Workspace</p>
          {["Overview", "Clients", "Projects", "Documents", "Finances"].map((item, i) => <p key={item} className={`mb-1 px-3 py-2 text-xs ${i === 0 ? "bg-[#F0EFEA] font-medium" : "text-black/55"}`}>{item}</p>)}
        </aside>
        <div className="min-w-0 p-4 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.14em] text-black/45">Practice overview</p>
          <h3 className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">Keep the work in view.</h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="border border-black/10 p-3"><Users className="h-4 w-4 text-black/60" aria-hidden="true" /><p className="mt-3 text-xs font-medium">Client relationships</p></div>
            <div className="border border-black/10 p-3"><FolderKanban className="h-4 w-4 text-black/60" aria-hidden="true" /><p className="mt-3 text-xs font-medium">Project workspace</p></div>
          </div>
          <div className="mt-4 border border-black/10">
            {rows.map(([n, title, description]) => <div key={n} className="flex items-center gap-3 border-b border-black/10 px-3 py-3 last:border-0 sm:px-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center border border-black/10 text-[10px] text-black/50">{n}</span><div className="min-w-0"><p className="text-xs font-medium">{title}</p><p className="mt-1 text-[10px] leading-relaxed text-black/50 sm:text-[11px]">{description}</p></div><ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-black/35" aria-hidden="true" /></div>)}
          </div>
        </div>
      </div>
      <p className="border-t border-black/10 px-4 py-2.5 text-[10px] leading-relaxed text-black/45 sm:px-6">Illustrative layout, not a screenshot of the live application. Feature availability may vary while Renove is in development.</p>
    </div>
  );
}

export default function Page() {
  return <div className="bg-[#F8F7F4] text-[#191919]">
    <section data-nav-link="/" className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1440px] items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:px-14 xl:px-20">
      <div className="max-w-2xl">
        <p className="mb-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-black/55"><span className="h-px w-8 bg-black/50" />Practice management for design professionals</p>
        <h1 className="text-balance text-[clamp(3.2rem,7vw,6.6rem)] font-normal leading-[0.94] tracking-[-0.065em]">Good design deserves a <span className="font-display italic">better-run</span> practice.</h1>
        <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-black/65 sm:text-lg sm:leading-8">Renove helps architecture and interior-design practices organise clients, projects, and the work behind every successful delivery — in one connected workspace.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4"><EngageCta label="Start free" next="/dashboard" /><Link href="#workflow" className="group inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium underline decoration-black/25 underline-offset-4 hover:decoration-black">Explore the workflow<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link></div>
        <p className="mt-4 text-xs leading-relaxed text-black/45">Some workflows are still in development. Sign up to explore the available workspace.</p>
        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-black/10 pt-5 text-xs text-black/60 sm:gap-4 sm:text-sm"><span className="text-[10px] uppercase tracking-[0.16em] text-black/45">Made for</span><span>Architects</span><span className="h-1 w-1 bg-black/30" /><span>Interior designers</span><span className="h-1 w-1 bg-black/30" /><span>Small studios</span></div>
      </div>
      <div className="py-2 lg:pl-4"><WorkspacePreview /></div>
    </section>
    <section className="border-y border-black/10 bg-white px-5 py-14 sm:px-8 sm:py-20 lg:px-14">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">The reality of practice</p><h2 className="mt-5 max-w-md text-balance text-3xl font-normal leading-tight tracking-[-0.045em] sm:text-5xl">The design is only one part of the work.</h2></div>
        <div><p className="max-w-2xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8">Client conversations, project information, documents, decisions, and follow-ups can quickly become scattered across tools and inboxes. Renove is being built to give the business behind your design work a clearer structure.</p><div className="mt-8 grid gap-4 border-t border-black/10 pt-5 sm:grid-cols-3">{["Keep client details close to the work", "Give project information a clear home", "Make next steps easier to follow"].map(item => <div key={item} className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-black/55" aria-hidden="true" /><p className="text-sm leading-6 text-black/70">{item}</p></div>)}</div></div>
      </div>
    </section>
    <section id="workflow" data-nav-link="/templates" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end md:gap-16"><div><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">A clearer way to work</p><h2 className="mt-5 max-w-xl text-balance text-3xl font-normal leading-tight tracking-[-0.045em] sm:text-5xl">From first conversation to final delivery.</h2></div><p className="max-w-2xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8">Renove's intended workflow connects the moving parts of a design practice. Availability varies as the product continues to take shape.</p></div>
        <div className="mt-12 border-t border-black/15">{workflow.map(({ n, title, text, Icon }) => <article key={n} className="grid gap-4 border-b border-black/15 py-7 sm:grid-cols-[64px_minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-start sm:gap-8 sm:py-9"><span className="pt-1 text-xs tracking-[0.12em] text-black/45">{n}</span><div className="flex items-start gap-3"><Icon className="mt-1 h-5 w-5 shrink-0 text-black/55" aria-hidden="true" /><h3 className="text-xl font-medium tracking-tight sm:text-2xl">{title}</h3></div><p className="max-w-xl text-sm leading-6 text-black/60 sm:text-base sm:leading-7">{text}</p></article>)}</div>
      </div>
    </section>
    <section id="for-practices" className="scroll-mt-24 border-y border-black/10 bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
      <div className="mx-auto max-w-7xl"><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">Who it's for</p><div className="mt-5 grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16"><h2 className="max-w-lg text-balance text-3xl font-normal leading-tight tracking-[-0.045em] sm:text-5xl">Built for the practice you're building.</h2><div className="divide-y divide-black/10 border-y border-black/10">{audiences.map(([title, description], i) => <article key={title} className="grid gap-3 py-6 sm:grid-cols-[44px_0.8fr_1.2fr] sm:gap-5"><span className="text-xs tracking-[0.12em] text-black/40">0{i + 1}</span><h3 className="text-base font-medium">{title}</h3><p className="text-sm leading-6 text-black/60">{description}</p></article>)}</div></div></div>
    </section>
    <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 border-t border-black/15 pt-10 sm:pt-14 md:flex-row md:items-end"><div className="max-w-3xl"><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">Your practice, more considered</p><h2 className="mt-5 text-balance text-4xl font-normal leading-[1.02] tracking-[-0.055em] sm:text-6xl">Make more room for the work you love.</h2><p className="mt-5 max-w-xl text-base leading-7 text-black/60">Take a look inside Renove and explore the parts of the workspace that are available today.</p></div><div className="shrink-0 pb-1"><EngageCta label="Start free" next="/dashboard" /></div></div></section>
  </div>;
}
