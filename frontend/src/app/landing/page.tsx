"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  RefreshCw,
  TrendingUp,
  Receipt,
  ShoppingBag,
  PieChart,
  ShieldCheck,
  Shield,
  Layers,
  Lock,
  Building2,
  FileSpreadsheet,
  Zap,
  Database,
  Users,
  CheckCheck,
  BarChart3,
  Boxes,
  Truck,
  TreePine,
  Factory,
  Armchair,
  FileCheck,
  ArrowUpRight
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "@/features/auth/auth-context";
import { SiteHeader } from "@/components/site-header";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroBadgeRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroTrustRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);

  const [matchVerified, setMatchVerified] = useState(true);
  const [liveReconcileCount, setLiveReconcileCount] = useState(7080);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect the OS preference and leave every section in its normal visible state.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Hero entrance. Avoid blur on large/complex surfaces: animating it
      // forces expensive re-rasterization and makes the first frames look stuck.
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTl
        .fromTo(
          heroBadgeRef.current,
          { opacity: 0, y: -18, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.55, delay: 0.05 }
        )
        .fromTo(
          heroTitleRef.current,
          { opacity: 0, y: 28, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" },
          "-=0.5"
        )
        .fromTo(
          heroSubtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.6"
        )
        .fromTo(
          heroCtaRef.current,
          { opacity: 0, y: 16, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5 },
          "-=0.5"
        )
        .fromTo(
          heroTrustRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45 },
          "-=0.4"
        )
        .fromTo(
          heroCardRef.current,
          { opacity: 0, y: 48, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: "power2.out" },
          "-=0.5"
        )
        // Stagger the dashboard detail after its shell is established.
        .fromTo(
          ".kpi-mock-card",
          { opacity: 0, y: 18, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            stagger: 0.06,
            ease: "power2.out"
          },
          "-=0.35"
        )
        // Stagger table rows inside the mockup.
        .fromTo(
          ".table-mock-row",
          { opacity: 0, x: -14 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" },
          "-=0.28"
        )
        // Stagger journal integrity items.
        .fromTo(
          ".audit-mock-item",
          { opacity: 0, x: 14 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" },
          "-=0.25"
        )
        // Floating chips reveal
        .fromTo(
          [".floating-chip-left", ".floating-chip-right"],
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.35, stagger: 0.08, ease: "power2.out" },
          "-=0.2"
        );

      // Continuous Floating effect for tolerance and GL chips
      gsap.to(".floating-chip-left", {
        y: -7,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(".floating-chip-right", {
        y: 7,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.5
      });

      // 2. Partner Logos Strip Scroll Animation
      // Set initial state immediately, then animate
      gsap.set(".partner-logo", { opacity: 1, y: 0, scale: 1 });
      gsap.from(
        ".partner-logo",
        {
          opacity: 0,
          y: 20,
          scale: 0.9,
          duration: 0.4,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#partners-section",
            start: "top 88%",
            toggleActions: "play none none none"
          }
        }
      );

      // 3. Workflows Section Header & Cards Scroll Animation
      // Set initial state immediately to prevent invisible cards
      gsap.set([".workflow-header", ".workflow-card", ".workflow-step"], { opacity: 1, y: 0, x: 0, scale: 1 });

      gsap.from(
        ".workflow-header",
        {
          opacity: 0,
          y: 30,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#workflows-section",
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );

      gsap.from(
        ".workflow-card",
        {
          opacity: 0,
          y: 50,
          scale: 0.95,
          duration: 0.55,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#workflows-cards",
            start: "top 82%",
            toggleActions: "play none none none"
          }
        }
      );

      gsap.from(
        ".workflow-step",
        {
          opacity: 0,
          x: -25,
          duration: 0.4,
          stagger: 0.07,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#workflows-cards",
            start: "top 75%",
            toggleActions: "play none none none"
          }
        }
      );

      // 4. Bento Feature Cards Staggered Pop-In Animation
      // Set initial state immediately to prevent invisible cards
      gsap.set([".bento-header", ".bento-card"], { opacity: 1, y: 0, scale: 1 });

      gsap.from(
        ".bento-header",
        {
          opacity: 0,
          y: 30,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#bento-section",
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );

      gsap.from(
        ".bento-card",
        {
          opacity: 0,
          y: 32,
          scale: 0.96,
          duration: 0.45,
          stagger: 0.055,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#bento-grid",
            start: "top 82%",
            toggleActions: "play none none none"
          }
        }
      );

      // 5. Analytical Cost Center Widget & Progress Bar Animation
      // Set initial state immediately to prevent invisible elements
      gsap.set(["#telemetry-widget", ".telemetry-stat-box"], { opacity: 1, y: 0, scale: 1 });

      gsap.from(
        "#telemetry-widget",
        {
          opacity: 0,
          y: 32,
          scale: 0.98,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#telemetry-section",
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );

      // Stagger stat boxes inside telemetry widget
      gsap.from(
        ".telemetry-stat-box",
        {
          opacity: 0,
          y: 20,
          scale: 0.95,
          duration: 0.4,
          stagger: 0.07,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#telemetry-widget",
            start: "top 75%",
            toggleActions: "play none none none"
          }
        }
      );

      // Animate progress bar fill on scroll
      gsap.fromTo(
        ".progress-fill-primary",
        { width: "0%" },
        {
          width: "84%",
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#telemetry-widget",
            start: "top 70%"
          }
        }
      );

      gsap.fromTo(
        ".progress-fill-warning",
        { width: "0%" },
        {
          width: "10%",
          duration: 1.5,
          delay: 0.35,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#telemetry-widget",
            start: "top 70%"
          }
        }
      );

      // 6. Security Section Entrance
      // Set initial state immediately to prevent invisible elements
      gsap.set([".security-header-content", ".security-badge"], { opacity: 1, y: 0, scale: 1 });

      gsap.from(
        ".security-header-content",
        {
          opacity: 0,
          y: 30,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#security-section",
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );

      gsap.from(
        ".security-badge",
        {
          opacity: 0,
          y: 25,
          scale: 0.92,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#security-section",
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );

      // 7. CTA Banner Entrance
      // Set initial state immediately to prevent invisible element
      gsap.set("#cta-banner", { opacity: 1, y: 0, scale: 1 });

      gsap.from(
        "#cta-banner",
        {
          opacity: 0,
          y: 40,
          scale: 0.94,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#cta-banner",
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );
    }, containerRef);

    // Immediate refresh to calculate trigger positions
    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, []);

  const handleAuthorizeRelease = () => {
    setMatchVerified(false);
    setTimeout(() => {
      setMatchVerified(true);
    }, 400);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary-container selection:text-on-primary-container relative"
    >
      {/* Existing App SiteHeader Navbar */}
      <SiteHeader />

      <main className="w-full">
        {/* Hero Section */}
        <section className="relative pt-10 pb-16 overflow-hidden">
          {/* Radial Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[560px] pointer-events-none -z-10 opacity-70">
            <div className="absolute top-12 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl mix-blend-multiply dark:bg-blue-950/40"></div>
            <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary-100 rounded-full blur-3xl mix-blend-multiply dark:bg-primary-950/40"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            {/* Google Material Badge / Pill Tag */}
            <div
              ref={heroBadgeRef}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-xs text-xs font-medium text-foreground mb-6"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-semibold text-primary">Documented accounting workflow</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Local development release</span>
            </div>

            {/* Headline */}
            <h1
              ref={heroTitleRef}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.12]"
            >
              Accounting built for <br className="hidden sm:inline" />
              <span className="text-primary bg-clip-text">furniture businesses</span>
            </h1>

            {/* Subheadline */}
            <p
              ref={heroSubtitleRef}
              className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl font-normal leading-relaxed"
            >
              Set up contacts and products, run purchase and sales transactions, record payments, and inspect balanced double-entry journals with Balance Sheet, P&amp;L, and budget reporting in one workspace.
            </p>

            {/* CTA Cluster */}
            <div
              ref={heroCtaRef}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
            >
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold bg-primary hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all active:scale-98"
                >
                  <span>Open dashboard</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold bg-primary hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all active:scale-98"
                >
                  <span>Create account</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </Link>
              )}
              <a
                href="#telemetry-section"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold bg-card hover:bg-surface-container text-foreground border border-border shadow-xs transition-all"
              >
                <PlayCircle className="w-5 h-5 text-primary fill-primary/10" />
                <span>Explore Live Interactive Demo</span>
              </a>
            </div>

            {/* Micro-Trust Bar */}
            <div
              ref={heroTrustRef}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground font-medium"
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Public signup creates an Accountant account
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Debits must equal credits
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Reports calculated from journal entries
              </span>
            </div>

            {/* High-Fidelity ERP Mockup Container */}
            <div ref={heroCardRef} className="relative w-full max-w-6xl mt-10">
              {/* Floating Material Chips */}
              <div className="floating-chip-left hidden lg:flex absolute -top-4 left-6 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-foreground">
                  Balanced journal entries
                </span>
              </div>
              <div className="floating-chip-right hidden lg:flex absolute -top-4 right-6 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-md">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs font-semibold text-primary">Accounting workflow preview</span>
              </div>

              {/* Chrome Frame */}
              <div className="w-full bg-card rounded-2xl border border-border shadow-xl overflow-hidden text-left transition-all duration-300 hover:shadow-2xl">
                {/* Window Sub-Header Bar */}
                <div className="bg-surface-container-high/60 px-5 py-3 border-b border-border/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#ec6a5e] inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-[#f4be4f] inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-[#61c554] inline-block"></span>
                    </div>
                    <div className="h-4 w-px bg-border mx-1"></div>
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      Urban Furniture Accounting • <span className="text-muted-foreground">Documented demo flow</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Illustrative data
                    </span>
                    <button
                      onClick={() => setLiveReconcileCount(7080)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-surface-container transition-colors cursor-pointer"
                      title="Reset preview values"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ERP Mockup Main Content */}
                <div className="p-6 bg-surface-container-low/50 space-y-6">
                  {/* 4 Elevated Metric KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1 */}
                    <div className="kpi-mock-card bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-md hover:-translate-y-1">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-xs font-medium">Sales invoice total</span>
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-1">₹7,080</div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>5 chairs + 18% tax</span>
                      </div>
                    </div>

                    {/* KPI 2 */}
                    <div className="kpi-mock-card bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-amber-400/40 transition-all hover:shadow-md hover:-translate-y-1">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-xs font-medium">Vendor bill</span>
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-1">₹5,000</div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>Azure Furniture</span>
                      </div>
                    </div>

                    {/* KPI 3 */}
                    <div className="kpi-mock-card bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-blue-400/40 transition-all hover:shadow-md hover:-translate-y-1">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-xs font-medium">Purchase order</span>
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-1">PO-0001</div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="font-semibold text-foreground">₹5,000.00</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                          Confirmed
                        </span>
                      </div>
                    </div>

                    {/* KPI 4 */}
                    <div className="kpi-mock-card bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-emerald-400/40 transition-all hover:shadow-md hover:-translate-y-1">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-xs font-medium">Report check</span>
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                          <PieChart className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-1">Balanced</div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Assets = Liabilities + Capital</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Split Preview: Tables & Match Inspection */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left: Transaction preview table */}
                    <div className="lg:col-span-7 bg-card rounded-xl p-5 border border-border shadow-xs hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold text-foreground">Transaction preview</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-muted-foreground text-[11px] font-semibold">
                            Illustrative data
                          </span>
                        </div>
                        <span className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer">
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Journal preview
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-surface-container text-muted-foreground uppercase tracking-wider font-semibold">
                              <th className="py-2.5 px-3 rounded-l-lg">Order Ref</th>
                              <th className="py-2.5 px-3">Client / SKU Group</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3">Journal status</th>
                              <th className="py-2.5 px-3 text-right rounded-r-lg">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            <tr className="table-mock-row hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-3 font-semibold text-foreground">SO-0892</td>
                              <td className="py-3 px-3">
                                <div className="font-medium text-foreground">Nimesh Pathak</div>
                                <div className="text-[11px] text-muted-foreground">5 Office Chairs</div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-foreground">
                                ₹{liveReconcileCount.toLocaleString()}.00
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-emerald-600 inline-flex items-center gap-1 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Journal balanced
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                                  Invoiced
                                </span>
                              </td>
                            </tr>
                            <tr className="table-mock-row hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-3 font-semibold text-foreground">PO-0001</td>
                              <td className="py-3 px-3">
                                <div className="font-medium text-foreground">Azure Furniture</div>
                                <div className="text-[11px] text-muted-foreground">10 Wooden Chairs</div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-foreground">₹5,000.00</td>
                              <td className="py-3 px-3">
                                <span className="text-blue-600 inline-flex items-center gap-1 font-medium">
                                  <Receipt className="w-3.5 h-3.5" /> Vendor bill
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                                  Paid
                                </span>
                              </td>
                            </tr>
                            <tr className="table-mock-row hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-3 font-semibold text-foreground">JE-0001</td>
                              <td className="py-3 px-3">
                                <div className="font-medium text-foreground">Purchase journal</div>
                                <div className="text-[11px] text-muted-foreground">Expense → Accounts Payable</div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-foreground">₹5,000.00</td>
                              <td className="py-3 px-3">
                                <span className="text-emerald-600 inline-flex items-center gap-1 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="px-2.5 py-1 rounded-full bg-surface-container text-muted-foreground text-[11px] font-semibold">
                                  Posted
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right: Double-entry integrity card */}
                    <div className="lg:col-span-5 bg-card rounded-xl p-5 border border-border shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base font-bold text-foreground">Double-entry integrity</span>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Debits = credits
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                          Each documented transaction creates a journal entry whose total debits equal total credits.
                        </p>
                        <div className="space-y-2.5">
                          {/* PO item */}
                          <div className="audit-mock-item flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-border/60 transition-all hover:bg-card">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <div>
                                <div className="text-xs font-semibold text-foreground">Purchase Order PO-0001</div>
                                <div className="text-[11px] text-muted-foreground">Azure Furniture • 10 Wooden Chairs</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-foreground">₹5,000.00</span>
                          </div>
                          {/* Vendor bill item */}
                          <div className="audit-mock-item flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-border/60 transition-all hover:bg-card">
                            <div className="flex items-center gap-2.5">
                              <Receipt className="w-4 h-4 text-emerald-600" />
                              <div>
                                <div className="text-xs font-semibold text-foreground">Vendor Bill</div>
                                <div className="text-[11px] text-muted-foreground">Purchase Expense → Accounts Payable</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                              Posted
                            </span>
                          </div>
                          {/* Invoice item */}
                          <div className="audit-mock-item flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-border/60 transition-all hover:bg-card">
                            <div className="flex items-center gap-2.5">
                              <Receipt className="w-4 h-4 text-emerald-600" />
                              <div>
                                <div className="text-xs font-semibold text-foreground">Bank Payment</div>
                                <div className="text-[11px] text-muted-foreground">Accounts Payable → Bank</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-foreground">₹5,000.00</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Release Action Bar */}
                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-primary text-xs font-medium">
                          <Zap className="w-4 h-4" />
                          <span>Verify journal balance</span>
                        </div>
                        <button
                          onClick={handleAuthorizeRelease}
                          className="px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          {matchVerified ? "Verify balance" : "Checking..."}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Partner Logos Strip */}
        <section id="partners-section" className="w-full bg-card border-y border-border py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-widest text-muted-foreground text-center font-semibold mb-6">
              Built around the documented Urban Furniture accounting workflow
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-85">
              <div className="partner-logo flex items-center gap-2.5 text-sm font-semibold text-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                <TreePine className="w-5 h-5 text-primary" />
                <span>Contacts &amp; Products</span>
              </div>
              <div className="partner-logo flex items-center gap-2.5 text-sm font-semibold text-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                <Factory className="w-5 h-5 text-primary" />
                <span>Purchase flow</span>
              </div>
              <div className="partner-logo flex items-center gap-2.5 text-sm font-semibold text-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                <Armchair className="w-5 h-5 text-primary" />
                <span>Sales flow</span>
              </div>
              <div className="partner-logo flex items-center gap-2.5 text-sm font-semibold text-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                <Truck className="w-5 h-5 text-primary" />
                <span>Reports &amp; budgets</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workflows Section: Order to Ledger */}
        <section id="workflows-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="workflow-header flex flex-col items-center text-center mb-12">
            <span className="px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              Linked accounting flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground max-w-2xl tracking-tight">
              From order to ledger — a linked accounting flow
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-xl">
              Follow the two documented transaction paths: purchases become vendor bills and payments; sales become customer invoices and payments. Each posting stays balanced.
            </p>
          </div>

          {/* Stepper / Pipeline Cards */}
          <div id="workflows-cards" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Workflow 1: Sales & Revenue */}
            <div className="workflow-card bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Sales &amp; Revenue Pipeline</h3>
                      <span className="text-xs text-muted-foreground">Sales order to customer payment</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    Documented flow
                  </span>
                </div>

                {/* Vertical Stepper */}
                <div className="space-y-6 relative pl-4 border-l-2 border-primary/20 ml-3">
                  {/* Step 1 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      1
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border/60 hover:bg-card transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Sales Order SO-0892</span>
                        <span className="text-[11px] font-semibold text-muted-foreground bg-card px-2 py-0.5 rounded-md border border-border">
                          Confirmed
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Create a sales order for a customer and add products, quantities, prices, and percentage tax.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      2
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border/60 hover:bg-card transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Customer Invoice</span>
                        <span className="text-[11px] font-semibold text-primary bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                          Auto-created
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Generate an invoice from the confirmed sales order. The system calculates tax and creates the sales journal entry.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      ✓
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 hover:bg-card transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Record Payment</span>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-card px-2 py-0.5 rounded-md border border-emerald-200">
                          Paid
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Record the customer payment through Cash or Bank; the payment journal debits the selected account and credits Accounts Receivable.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-primary" />
                  Journal: DR AR ₹7,080 | CR Sales ₹6,000 + Tax ₹1,080
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Workflow 2: Procurement & AP */}
            <div className="workflow-card bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Procurement &amp; Accounts Payable</h3>
                      <span className="text-xs text-muted-foreground">Purchase order to vendor payment</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    Documented flow
                  </span>
                </div>

                {/* Vertical Stepper */}
                <div className="space-y-6 relative pl-4 border-l-2 border-primary/20 ml-3">
                  {/* Step 1 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      1
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border/60 hover:bg-card transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Purchase Order PO-0001</span>
                        <span className="text-[11px] font-semibold text-muted-foreground bg-card px-2 py-0.5 rounded-md border border-border">
                          Draft • ₹5,000
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Create and confirm a purchase order for a vendor and add the products being purchased.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      2
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border/60 hover:bg-card transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Vendor Bill</span>
                        <span className="text-[11px] font-semibold text-primary bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                          Auto-created
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Create a vendor bill from the purchase order. The system posts Purchase Expense against Accounts Payable.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      ✓
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 hover:bg-card transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Record Payment</span>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-card px-2 py-0.5 rounded-md border border-emerald-200">
                          Paid
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Record the vendor payment through Bank or Cash; the payment journal debits Accounts Payable and credits the selected account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-primary" />
                  Journal: DR Purchase Expense ₹5,000 | CR AP ₹5,000
                </span>
                <CheckCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </section>

        {/* Core feature grid */}
        <section id="bento-section" className="w-full bg-surface-container py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bento-header flex flex-col items-center text-center mb-14">
              <span className="px-3.5 py-1 rounded-full bg-card border border-border text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                Core capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground max-w-2xl tracking-tight">
                The accounting flows documented for Urban Furniture
              </h2>
              <p className="mt-3 text-base text-muted-foreground max-w-2xl">
                Keep the product promise focused: manage master data, process purchases and sales, post balanced journals, and review the resulting reports.
              </p>
            </div>

            <div id="bento-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Bento Card 1 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5 hover:border-primary/50">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Dashboard overview</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Review Cash, Bank, Receivables, Payables, Net Profit, and transaction-derived budget metrics from one dashboard.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>KPI summary</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bento Card 2 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5 hover:border-emerald-500/50">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Sales &amp; customer invoices</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Confirm sales orders, calculate percentage-based tax, generate customer invoices, and record incoming payments.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>SO → invoice → payment</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bento Card 3 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5 hover:border-blue-500/50">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Purchases &amp; vendor bills</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Create and confirm purchase orders, create linked vendor bills, and record outgoing payments with journal entries.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>PO → bill → payment</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bento Card 4 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5 hover:border-indigo-500/50">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Balanced double-entry ledger</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Transaction posting creates debit and credit lines, and journal entry validation prevents an unbalanced entry from being saved.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Debit = credit</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bento Card 5 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5 hover:border-amber-500/50">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Budgets &amp; analytic accounts</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Define planned amounts, link analytic accounts, and compare committed and achieved amounts in the budget report.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Planned vs actual</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bento Card 6 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5 hover:border-blue-500/50">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Financial reports</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Generate Balance Sheet, Profit &amp; Loss, and Budget reports from posted journal entries, with report totals and equation checks.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Reports on demand</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bento Card 7 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5 hover:border-primary/50">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Master data</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Maintain Contacts, Products, Chart of Accounts, Journals, analytic accounts, and budgets used by the transaction flows.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>List and form views</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bento Card 8 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5 hover:border-slate-500/50">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-surface-container-highest text-foreground flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Role-based access</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use Admin, Accountant (Invoicing User), and Contact roles. Contact users get a restricted portal view for their own invoices.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Server-side role checks</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Budget & double-entry preview */}
        <section id="telemetry-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div id="telemetry-widget" className="bg-card rounded-2xl border border-border shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {/* Header Banner */}
            <div className="px-6 py-5 bg-surface-container-high/40 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Budget and journal preview
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  Illustrative budget example
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Budget reports compare planned, committed, and achieved amounts for an analytic account.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Example report status
                </span>
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-full bg-card hover:bg-surface-container text-foreground text-xs font-semibold border border-border shadow-xs transition-colors"
                >
                    Sign in to view reports
                </Link>
              </div>
            </div>

            {/* Split Grid: Budget Health & Ledger Journal */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Budget Health & Visualization */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="telemetry-stat-box p-4 rounded-xl bg-surface-container-low border border-border/60 hover:bg-card transition-all">
                    <span className="text-xs text-muted-foreground font-medium">Planned amount</span>
                    <div className="text-xl font-bold text-foreground mt-1">Configured</div>
                    <span className="text-[11px] text-muted-foreground">Budget definition</span>
                  </div>
                  <div className="telemetry-stat-box p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 hover:bg-card transition-all">
                    <span className="text-xs text-muted-foreground font-medium">Committed</span>
                    <div className="text-xl font-bold text-primary mt-1">Derived</div>
                    <span className="text-[11px] text-primary font-semibold">From transactions</span>
                  </div>
                  <div className="telemetry-stat-box p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 hover:bg-card transition-all">
                    <span className="text-xs text-muted-foreground font-medium">Amount to achieve</span>
                    <div className="text-xl font-bold text-emerald-600 mt-1">Calculated</div>
                    <span className="text-[11px] text-emerald-600 font-semibold">Report metric</span>
                  </div>
                </div>

                {/* Segmented Progress Bar */}
                <div className="p-5 rounded-xl bg-surface-container-low border border-border/60">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2.5 font-medium">
                    <span>Example utilization breakdown</span>
                    <span className="font-bold text-foreground">Illustrative values</span>
                  </div>
                  <div className="w-full h-3.5 bg-surface-container-highest rounded-full overflow-hidden flex">
                    <div
                      className="progress-fill-primary bg-primary h-full transition-all"
                      style={{ width: "84%" }}
                      title="Prior Encumbrances: ₹42,000 (84%)"
                    ></div>
                    <div
                      className="progress-fill-warning bg-amber-500 h-full transition-all"
                      style={{ width: "10%" }}
                      title="Current PO-0001: ₹5,000 (10%)"
                    ></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                      <span className="text-foreground">
                        Committed: <strong>84% example</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      <span className="text-foreground">
                        Achieved: <strong>10% example</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest inline-block border border-border"></span>
                      <span className="text-muted-foreground">
                        Remaining: <strong>6% example</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Protection Policy Notice */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container border border-border text-foreground">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-foreground">
                    <strong className="font-semibold">Budget visibility:</strong> The budget report exposes committed, achieved, achieved percentage, amount to achieve, and revision links for configured budgets.
                  </p>
                </div>
              </div>

              {/* Double-Entry Journal Entry Preview */}
              <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-5 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-foreground">Purchase journal entry preview</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                      Balanced
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Example posting created from the documented purchase flow: Purchase Expense to Accounts Payable.
                  </p>
                  <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-surface-container font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                          <th className="py-2.5 px-3">GL Account</th>
                          <th className="py-2.5 px-3 text-right">Debit</th>
                          <th className="py-2.5 px-3 text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        <tr>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground">5010 Purchase Expense</div>
                            <div className="text-[11px] text-muted-foreground">10 Wooden Chairs</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-foreground">₹5,000.00</td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">—</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground">2010 Accounts Payable</div>
                            <div className="text-[11px] text-muted-foreground">Azure Furniture</div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">—</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-foreground">₹5,000.00</td>
                        </tr>
                        <tr className="bg-surface-container/50 font-bold text-foreground">
                          <td className="py-2.5 px-3">Total Reconciled</td>
                          <td className="py-2.5 px-3 text-right text-emerald-600">₹5,000.00</td>
                          <td className="py-2.5 px-3 text-right text-emerald-600">₹5,000.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" /> Balanced by journal validation
                  </span>
                  <span>Review in Journal Entries</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Access & accounting controls */}
        <section id="security-section" className="w-full bg-card border-y border-border py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-surface-container-low rounded-2xl p-6 sm:p-10 border border-border">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="security-header-content max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-primary text-xs font-semibold mb-3">
                    <ShieldCheck className="w-4 h-4" /> Access and accounting controls
                  </div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                    Clear controls for everyday accounting work
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Authenticated access, server-side role checks, and balanced journal validation support the documented purchase, sales, payment, and reporting flows. Deployment-specific security controls remain the responsibility of the operating organization.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="security-badge bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Authenticated access</span>
                  </div>
                  <div className="security-badge bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <Database className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Server-side role checks</span>
                  </div>
                  <div className="security-badge bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Balanced journals</span>
                  </div>
                  <div className="security-badge bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Linked source documents</span>
                  </div>
                  <div className="security-badge bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Input validation</span>
                  </div>
                  <div className="security-badge bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Restricted portal view</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* High-Impact CTA Banner */}
        <section id="cta-banner" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-primary rounded-2xl text-white p-8 sm:p-14 text-center flex flex-col items-center relative overflow-hidden shadow-2xl">
            {/* Radial Accent Rings */}
            <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-primary-800/60 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-24 -top-24 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

            <span className="px-3.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-sm">
              Start with the documented workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl mb-3 tracking-tight">
              Ready to modernize your furniture business financials?
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mb-8 leading-relaxed font-normal">
              Create an Accountant account, then move from master data to purchase or sales transactions, payments, journals, and reports.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3.5 z-10 w-full sm:w-auto">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold bg-white text-primary hover:bg-surface-container-high transition-all shadow-md active:scale-98"
              >
                <span>Create an Accountant account</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all active:scale-98"
              >
                <span>Sign in to the workspace</span>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/80 text-xs font-medium">
              <span>Public signup assigns the Accountant role</span>
              <span>•</span>
              <span>Admin creates other user roles</span>
              <span>•</span>
              <span>Contact users see their own invoices</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-card border-t border-border pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-border">
            {/* Company Identity */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white">
                  <Armchair className="w-4.5 h-4.5" />
                </div>
                <span className="text-lg font-bold text-foreground">Urban Furniture</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                A focused accounting workspace for Urban Furniture: master data, purchase and sales flows, payments, balanced journals, budgets, and financial reports.
              </p>
              <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Role-aware access
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-primary text-[11px] font-semibold">
                  Double-entry validation
                </span>
              </div>
            </div>

            {/* Col 1: ERP Modules */}
            <div className="flex flex-col gap-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">Core areas</span>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#bento-section">
                Contacts &amp; Products
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#bento-section">
                Purchase Orders
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#bento-section">
                Vendor Bills &amp; Payments
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#bento-section">
                Sales Orders &amp; Invoices
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#bento-section">
                Journals &amp; Reports
              </a>
            </div>

            {/* Col 2: Security & Governance */}
            <div className="flex flex-col gap-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Security &amp; Governance
              </span>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#security-section">
                Journal traceability
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#security-section">
                Role-Based Access (RBAC)
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#security-section">
                Input validation
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#security-section">
                Authenticated sessions
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#security-section">
                Deployment controls
              </a>
            </div>

            {/* Col 3: Legal & Trust */}
            <div className="flex flex-col gap-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">Legal &amp; Trust</span>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="/privacy-policy">
                Privacy Policy
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="/terms">
                Terms of Service
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="/security-policy">
                Security Policy
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="/security-policy">
                Privacy Policy
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="/security-policy">
                Terms of Service
              </a>
            </div>
          </div>

          {/* Footer Sub-bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>Urban Furniture Accounting System · Local development release</p>
            <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Demo workflow ready
              </span>
              <span>See Security Policy for deployment responsibilities</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
