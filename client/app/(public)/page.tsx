"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FolderKanban,
  Layers3,
  ReceiptText,
  Users,
  X,
} from "lucide-react";
import { EngageCta } from "@/components/auth/engage-cta";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=90",
    alt: "Contemporary architecture framed by natural light",
    subtitle: "A clearer way to run a design practice",
    lines: ["Make room", "for the", "work."],
  },
  {
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2200&q=90",
    alt: "A thoughtfully composed contemporary interior",
    subtitle: "Clients, projects, and decisions — connected",
    lines: ["From first", "conversation", "to delivery."],
  },
  {
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=90",
    alt: "Warm architectural interior with carefully selected materials",
    subtitle: "The work behind great design deserves better tools",
    lines: ["A practice", "in better", "order."],
  },
];

const services = [
  {
    title: "Architecture",
    Icon: Building2,
    text: "Keep client briefs, project records, proposals, and important decisions connected from the first enquiry to delivery.",
  },
  {
    title: "Interior Design",
    Icon: Layers3,
    text: "Bring materials, deliverables, feedback, and approvals into a process your team and clients can follow.",
  },
  {
    title: "Project Delivery",
    Icon: ClipboardCheck,
    text: "Keep procurement, site updates, invoices, and payments in view as work moves from one stage to the next.",
  },
];

const features = [
  {
    title: "A practice at a glance",
    category: "Workspace",
    meta: "Clients · Projects · Overview",
    description: "See the important moving parts of your practice in one place, instead of rebuilding the picture across separate tools.",
    images: [
      ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85", "Architecture and project context"],
      ["https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85", "Interior design project"],
      ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85", "Materials and finished space"],
    ],
  },
  {
    title: "Client relationships",
    category: "Clients",
    meta: "Enquiries · Records · Follow-ups",
    description: "Keep the people, first conversations, project history, and next steps together as a lead becomes a client.",
    images: [
      ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85", "Residential architecture"],
      ["https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85", "Contemporary interior"],
    ],
  },
  {
    title: "Approvals & deliverables",
    category: "Project workflow",
    meta: "Proposals · Decisions · Files",
    description: "Give proposals, documents, feedback, and client sign-offs a clearer place so decisions are easier to follow.",
    images: [
      ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85", "Design detail and finishes"],
      ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85", "Architectural space"],
    ],
  },
  {
    title: "Financial progress",
    category: "Practice operations",
    meta: "Procurement · Invoices · Payments",
    description: "Build toward a more joined-up view of the financial and delivery details that keep a project moving.",
    images: [
      ["https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85", "Interior design project"],
      ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85", "A completed architectural interior"],
    ],
  },
];

function WorkspaceConcept() {
  const rows = [
    { label: "Clients", detail: "Relationships and conversations", count: "12", Icon: Users },
    { label: "Active projects", detail: "Milestones and next steps", count: "08", Icon: FolderKanban },
    { label: "Approvals", detail: "Waiting for a decision", count: "03", Icon: FileCheck2 },
    { label: "Deliverables", detail: "Prepared for client review", count: "06", Icon: Check },
  ];

  return (
    <div className="archion-workspace" aria-label="Illustrative Renove workspace preview">
      <div className="archion-workspace-top">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center bg-black text-white"><Layers3 size={17} /></span>
          <div><p className="m-0 text-sm font-medium">Renove <span className="font-normal text-black/45">/ My practice</span></p><p className="m-0 text-[11px] text-black/45">Workspace overview</p></div>
        </div>
        <span className="archion-preview-label">Concept preview</span>
      </div>
      <div className="archion-workspace-body">
        <div className="archion-workspace-heading">
          <div><p className="m-0 text-[10px] uppercase tracking-[.16em] text-black/45">Practice overview</p><h3 className="mt-2 text-2xl font-normal tracking-tight sm:text-3xl">Keep the work in view.</h3></div>
          <span className="text-xs text-black/45">Illustrative data</span>
        </div>
        <div className="archion-workspace-stats">
          <div><span>Active projects</span><strong>08</strong><small>Across your practice</small></div>
          <div><span>Awaiting approval</span><strong>03</strong><small>Client decisions</small></div>
          <div><span>Financial progress</span><strong>In view</strong><small>Invoices and payments</small></div>
        </div>
        <div className="archion-workspace-rows">
          {rows.map(({ label, detail, count, Icon }) => (
            <div key={label} className="archion-workspace-row">
              <Icon size={16} strokeWidth={1.4} aria-hidden="true" />
              <div><strong>{label}</strong><small>{detail}</small></div>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="archion-workspace-note">Illustrative product concept, not a screenshot of the live application. All figures are fictional and feature availability may vary while Renove is in development.</p>
    </div>
  );
}

export default function Page() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFeature, setOpenFeature] = useState<number | null>(0);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <main className="archion-home">
      {/* Archion-inspired desktop header: transparent and layered over the hero. */}
      <header className="archion-desktop-header">
        <Link href="/" className="archion-wordmark" aria-label="Renove home">renove<span>.</span></Link>
        <div className="archion-header-right">
          <div className="archion-header-note">A more considered way to run<br />a design practice <ArrowRight size={13} /></div>
          <nav aria-label="Main menu" className="archion-nav">
            <a href="#home" aria-current="page">HOME</a>
            <a href="#services">WORKFLOW</a>
            <a href="#workspace">WORKSPACE</a>
            <a href="#contact">CONTACT</a>
          </nav>
        </div>
      </header>

      {/* Mobile version of the same header composition. */}
      <header className="archion-mobile-header">
        <Link href="/" className="archion-wordmark" aria-label="Renove home">renove<span>.</span></Link>
        <button type="button" onClick={() => setIsMobileMenuOpen((open) => !open)} className="archion-mobile-menu" aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMobileMenuOpen} aria-controls="mobile-menu"><span /><span /><span /></button>
      </header>
      {isMobileMenuOpen && <nav id="mobile-menu" className="archion-mobile-nav" aria-label="Mobile menu">
        <a href="#home" onClick={() => setIsMobileMenuOpen(false)}>Home</a><a href="#services" onClick={() => setIsMobileMenuOpen(false)}>Workflow</a><a href="#workspace" onClick={() => setIsMobileMenuOpen(false)}>Workspace</a><a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
      </nav>}

      {/* Full-viewport hero slider, preserving the original Archion composition. */}
      <section id="home" data-nav-link="/" className="archion-hero" aria-label="Renove introduction">
        {slides.map((slide, index) => (
          <div key={slide.image} className={`archion-slide ${activeSlide === index ? "is-active" : ""}`} aria-hidden={activeSlide !== index}>
            <Image src={slide.image} alt={slide.alt} fill priority={index === 0} sizes="100vw" className="archion-slide-image" />
            <div className="archion-slide-shade" />
            <div className="archion-slide-copy">
              <p className="archion-slide-subtitle">* {slide.subtitle}</p>
              <h1 className="archion-slide-title">{slide.lines.map((line, lineIndex) => <span key={line} style={{ "--line-index": lineIndex } as React.CSSProperties}>{line}</span>)}</h1>
            </div>
          </div>
        ))}
        <div className="archion-hero-bullets" role="group" aria-label="Choose hero slide">
          {slides.map((slide, index) => <button key={slide.image} type="button" className={`archion-hero-bullet ${activeSlide === index ? "is-active" : ""}`} onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}`} aria-pressed={activeSlide === index} />)}
        </div>
        <div className="archion-hero-index"><span>0{activeSlide + 1}</span><i />03</div>
        <a href="#intro" className="archion-scroll-cue">SCROLL TO EXPLORE <ArrowDownRight size={14} /></a>
      </section>

      {/* Oversized introduction statement. */}
      <section id="intro" className="archion-intro archion-reveal">
        <p className="archion-kicker">THE PRACTICE BEHIND THE DESIGN</p>
        <h2>A well-designed project deserves a well-run practice. Renove brings the people, plans, decisions, and follow-through together.</h2>
      </section>

      {/* Three-column services, matching the original reference layout. */}
      <section id="services" data-nav-link="/templates" className="archion-services">
        {services.map(({ title, Icon, text }, index) => (
          <article key={title} className="archion-service archion-reveal" style={{ "--reveal-index": index } as React.CSSProperties}>
            <Icon className="archion-service-icon" size={72} strokeWidth={0.8} aria-hidden="true" />
            <p className="archion-service-number">0{index + 1} / RENOVE WORKFLOW</p>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      {/* The product is the second visual moment, not a dashboard stuffed into the hero. */}
      <section id="workspace" className="archion-product-section">
        <div className="archion-product-heading archion-reveal">
          <div><p className="archion-kicker">INSIDE RENOVE</p><h2>The details, all in better order.</h2></div>
          <p>Explore a considered view of clients, active projects, approvals, deliverables, and financial progress — the work behind the work.</p>
        </div>
        <div className="archion-product-grid">
          <div className="archion-product-image archion-reveal">
            <Image src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1500&q=85" alt="Contemporary architecture with considered natural materials" fill sizes="(max-width: 900px) 100vw, 45vw" />
            <span>One connected workspace <ArrowUpRightFallback /></span>
          </div>
          <div className="archion-product-detail archion-reveal"><WorkspaceConcept /></div>
        </div>
      </section>

      {/* Expandable feature gallery keeps the original Archion portfolio accordion behaviour. */}
      <section className="archion-portfolio" aria-label="Explore Renove features">
        <div className="archion-portfolio-heading archion-reveal">
          <p className="archion-kicker">DESIGNED AROUND YOUR PRACTICE</p>
          <h2>Everything that keeps a project moving.</h2>
        </div>
        {features.map((feature, index) => (
          <article key={feature.title} className={`archion-feature ${openFeature === index ? "is-open" : ""}`}>
            <button type="button" className="archion-feature-header" onClick={() => setOpenFeature(openFeature === index ? null : index)} aria-expanded={openFeature === index}>
              <span className="archion-feature-number">0{index + 1}</span>
              <span className="archion-feature-title">{feature.title}</span>
              <span className="archion-feature-meta">{feature.meta}</span>
              <span className="archion-feature-arrow"><ChevronDown size={17} strokeWidth={1.4} /></span>
            </button>
            <div className="archion-feature-panel" aria-hidden={openFeature !== index}>
              <div className="archion-feature-panel-inner">
                <div className="archion-feature-copy"><p className="archion-kicker">{feature.category}</p><p>{feature.description}</p><a href="#contact">Explore Renove <ArrowRight size={14} /></a></div>
                <div className="archion-feature-gallery">
                  {feature.images.map(([src, alt], imageIndex) => <button type="button" key={src + imageIndex} onClick={() => setLightbox({ src: src.replace("w=1000", "w=1800"), alt })} aria-label={`View larger image: ${alt}`}><Image src={src} alt={alt} width={520} height={360} sizes="(max-width: 680px) 90vw, 30vw" /><span>{String(imageIndex + 1).padStart(2, "0")}</span></button>)}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Full-width image banner, inspired by the original reference. */}
      <section className="archion-big-banner">
        <Image src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2200&q=85" alt="A serene, light-filled interior" fill sizes="100vw" />
        <div className="archion-banner-shade" />
        <div className="archion-banner-copy"><p>MORE CLARITY. LESS CHASING.</p><span>Make space</span><span>for better work.</span></div>
      </section>

      <footer id="contact" className="archion-footer">
        <div className="archion-footer-grid">
          <div className="archion-footer-col archion-footer-intro"><p className="archion-kicker">A BETTER-RUN PRACTICE STARTS HERE</p><h2>Make room for the work you love.</h2><EngageCta label="Explore Renove" next="/dashboard" /><p className="archion-footer-subtitle">A connected workspace for architecture and interior-design practices.</p></div>
          <div className="archion-footer-col"><h3>GET STARTED</h3><p>Explore the workspace and discover which parts of Renove are available for your practice today.</p><a href="/dashboard">Open workspace <ArrowRight size={14} /></a><a href="#workspace">See the preview <ArrowRight size={14} /></a></div>
          <div className="archion-footer-col"><h3>RENOVE</h3><a href="#home">Home</a><a href="#services">Workflow</a><a href="#workspace">Workspace</a><a href="#contact">Contact</a><p className="archion-copyright">© {new Date().getFullYear()} Renove</p></div>
        </div>
      </footer>

      {lightbox && <div className="archion-lightbox" role="dialog" aria-modal="true" aria-label={lightbox.alt} onClick={() => setLightbox(null)}><button type="button" className="archion-lightbox-close" aria-label="Close image"><X size={24} /></button><Image src={lightbox.src} alt={lightbox.alt} width={1800} height={1200} sizes="95vw" onClick={(event) => event.stopPropagation()} /><span>{lightbox.alt}</span></div>}
    </main>
  );
}

function ArrowUpRightFallback() {
  return <ArrowDownRight size={16} aria-hidden="true" />;
}
