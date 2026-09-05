"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  Search,
  RefreshCw,
  TrendingUp,
  Receipt,
  ShoppingBag,
  PieChart,
  ShieldCheck,
  Shield,
  Layers,
  Sparkles,
  Lock,
  Building2,
  FileSpreadsheet,
  Zap,
  Database,
  Users,
  CheckCheck,
  Cpu,
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

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroBadgeRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroTrustRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<string>("features");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchVerified, setMatchVerified] = useState(true);
  const [liveReconcileCount, setLiveReconcileCount] = useState(48200);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Hero Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        heroBadgeRef.current,
        { opacity: 0, y: -20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 0.1 }
      )
        .fromTo(
          heroTitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 },
          "-=0.4"
        )
        .fromTo(
          heroSubtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5"
        )
        .fromTo(
          heroCtaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          heroTrustRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6 },
          "-=0.3"
        )
        .fromTo(
          heroCardRef.current,
          { opacity: 0, y: 40, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out" },
          "-=0.4"
        );

      // Floating chips gentle float animation
      gsap.to(".floating-chip-left", {
        y: -6,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(".floating-chip-right", {
        y: 6,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.4
      });

      // 2. Partner Logos Strip Scroll Animation
      gsap.fromTo(
        ".partner-logo",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: "#partners-section",
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // 3. Workflows Section Entrance
      gsap.fromTo(
        ".workflow-header",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: "#workflows-section",
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo(
        ".workflow-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.25,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#workflows-cards",
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo(
        ".workflow-step",
        { opacity: 0, x: -15 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.15,
          scrollTrigger: {
            trigger: "#workflows-cards",
            start: "top 70%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // 4. Bento Feature Cards Staggered Reveal
      gsap.fromTo(
        ".bento-header",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: "#bento-section",
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo(
        ".bento-card",
        { opacity: 0, y: 35, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: "#bento-grid",
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // 5. Analytical Cost Center Widget & Progress Bar Animation
      gsap.fromTo(
        "#telemetry-widget",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          scrollTrigger: {
            trigger: "#telemetry-section",
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Animate progress bar fill on scroll
      gsap.fromTo(
        ".progress-fill-primary",
        { width: "0%" },
        {
          width: "84%",
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#telemetry-widget",
            start: "top 65%"
          }
        }
      );

      gsap.fromTo(
        ".progress-fill-warning",
        { width: "0%" },
        {
          width: "10%",
          duration: 1.4,
          delay: 0.4,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#telemetry-widget",
            start: "top 65%"
          }
        }
      );

      // 6. Security Section Entrance
      gsap.fromTo(
        "#security-section",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: "#security-section",
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // 7. CTA Banner Pulsing Glow
      gsap.fromTo(
        "#cta-banner",
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#cta-banner",
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }, containerRef);

    // Keyboard shortcut for Cmd+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      ctx.revert();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleAuthorizeRelease = () => {
    setMatchVerified(false);
    setTimeout(() => {
      setMatchVerified(true);
      setLiveReconcileCount((prev) => prev + 5000);
    }, 400);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-surface-container-low font-sans text-foreground antialiased selection:bg-primary-container selection:text-on-primary-container relative"
    >
      {/* ⌘K Command Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search ledger accounts, bills, purchase orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded bg-surface-container"
              >
                ESC
              </button>
            </div>
            <div className="p-3 text-xs text-muted-foreground space-y-1">
              <div className="px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">
                Quick Navigation
              </div>
              <Link
                href="/login"
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container hover:text-primary transition-colors text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" /> Chart of Accounts &amp; General Ledger
                </span>
                <span className="text-muted-foreground">#1010 - #5100</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container hover:text-primary transition-colors text-foreground"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-info" /> Purchase Orders &amp; 3-Way Match
                </span>
                <span className="text-muted-foreground">PO-0001</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container hover:text-primary transition-colors text-foreground"
              >
                <span className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-success" /> Project Cost Center (PRJ-FURN-26)
                </span>
                <span className="text-muted-foreground">Budget</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Material 3 Top Navigation Bar */}
      <header className="sticky top-0 left-0 right-0 w-full z-40 bg-card/95 backdrop-blur-md border-b border-border transition-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo + Identity */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-primary rounded-full pr-2"
            >
              <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-white shadow-sm">
                <Armchair className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[17px] tracking-tight text-foreground leading-tight">
                  Urban Furniture
                </span>
                <span className="text-[11px] font-medium text-muted-foreground tracking-wide flex items-center gap-1">
                  Cloud ERP <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </span>
              </div>
            </Link>

            {/* Material 3 Pill Tabs */}
            <nav className="hidden lg:flex items-center gap-1 bg-surface-container-high/60 p-1 rounded-full border border-border/60">
              <a
                href="#features"
                onClick={() => setActiveTab("features")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === "features"
                    ? "bg-card text-primary shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
              >
                Features
              </a>
              <a
                href="#workflows-section"
                onClick={() => setActiveTab("workflows")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === "workflows"
                    ? "bg-card text-primary shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
              >
                Workflows
              </a>
              <a
                href="#telemetry-section"
                onClick={() => setActiveTab("reports")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === "reports"
                    ? "bg-card text-primary shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
              >
                Financial Reports
              </a>
              <a
                href="#security-section"
                onClick={() => setActiveTab("security")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === "security"
                    ? "bg-card text-primary shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
              >
                Security
              </a>
              <a
                href="#pricing"
                onClick={() => setActiveTab("pricing")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === "pricing"
                    ? "bg-card text-primary shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
              >
                Pricing
              </a>
            </nav>
          </div>

          {/* Search shortcut & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden md:flex items-center gap-2 bg-surface-container px-3.5 py-1.5 rounded-full border border-border text-muted-foreground text-xs hover:border-muted-foreground transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <span>Search docs, ledger codes...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-card text-[10px] font-semibold text-muted-foreground border border-border shadow-xs">
                ⌘K
              </kbd>
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-surface-container-high transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-primary hover:bg-primary-700 text-white shadow-sm hover:shadow-md transition-all active:scale-98"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="w-8 h-8 rounded-full ring-2 ring-primary/20 overflow-hidden ml-1 hidden sm:flex items-center justify-center bg-primary-100 text-primary font-bold text-xs">
              UF
            </div>
          </div>
        </div>
      </header>

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
              <span className="font-semibold text-primary">Enterprise Accounting &amp; Multi-Entity ERP</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">v4.8 Release</span>
            </div>

            {/* Headline */}
            <h1
              ref={heroTitleRef}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.12]"
            >
              Accounting &amp; ERP built for <br className="hidden sm:inline" />
              <span className="text-primary bg-clip-text">furniture businesses</span>
            </h1>

            {/* Subheadline */}
            <p
              ref={heroSubtitleRef}
              className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl font-normal leading-relaxed"
            >
              Manage sales orders, vendor procurement, automated 3-way matching, and double-entry bookkeeping in one unified, real-time telemetry dashboard. Built specifically for furniture mills, makers, and commercial distributors.
            </p>

            {/* CTA Cluster */}
            <div
              ref={heroCtaRef}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
            >
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold bg-primary hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all active:scale-98"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
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
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No credit card required
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> GAAP double-entry standards
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-time GL auto-posting
              </span>
            </div>

            {/* High-Fidelity ERP Mockup Container */}
            <div ref={heroCardRef} className="relative w-full max-w-6xl mt-10">
              {/* Floating Material Chips */}
              <div className="floating-chip-left hidden lg:flex absolute -top-4 left-6 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-foreground">
                  Automated Tolerance Match ≤ 0.5%
                </span>
              </div>
              <div className="floating-chip-right hidden lg:flex absolute -top-4 right-6 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-md">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs font-semibold text-primary">Real-time GL Posting Active</span>
              </div>

              {/* Chrome Frame */}
              <div className="w-full bg-card rounded-2xl border border-border shadow-xl overflow-hidden text-left">
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
                      Urban ERP Workspace • <span className="text-muted-foreground">[FY 2025-26 Multi-Entity]</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Production Multi-Tenant
                    </span>
                    <button
                      onClick={() => setLiveReconcileCount((c) => c + 100)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-surface-container transition-colors"
                      title="Refresh Telemetry"
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
                    <div className="bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-sm">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-xs font-medium">Total Ledger Revenue</span>
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-1">₹14.2M</div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>+18.4% vs last quarter</span>
                      </div>
                    </div>

                    {/* KPI 2 */}
                    <div className="bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-amber-400/40 transition-all hover:shadow-sm">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-xs font-medium">Accounts Payable</span>
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-1">₹34,500.00</div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>2 bills pending 3-way match</span>
                      </div>
                    </div>

                    {/* KPI 3 */}
                    <div className="bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-blue-400/40 transition-all hover:shadow-sm">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-xs font-medium">Active Purchase Orders</span>
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
                    <div className="bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-emerald-400/40 transition-all hover:shadow-sm">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-xs font-medium">Budget Headroom</span>
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                          <PieChart className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-1">₹8,600.00</div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>PRJ-FURN-26 cap intact</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Split Preview: Tables & Match Inspection */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left: Order Ledger Telemetry Table */}
                    <div className="lg:col-span-7 bg-card rounded-xl p-5 border border-border shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold text-foreground">Order Ledger Telemetry</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-muted-foreground text-[11px] font-semibold">
                            Live sync
                          </span>
                        </div>
                        <span className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer">
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-surface-container text-muted-foreground uppercase tracking-wider font-semibold">
                              <th className="py-2.5 px-3 rounded-l-lg">Order Ref</th>
                              <th className="py-2.5 px-3">Client / SKU Group</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3">GL Posting</th>
                              <th className="py-2.5 px-3 text-right rounded-r-lg">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            <tr className="hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-3 font-semibold text-foreground">SO-0892</td>
                              <td className="py-3 px-3">
                                <div className="font-medium text-foreground">Nordic Living Studio</div>
                                <div className="text-[11px] text-muted-foreground">60x Ergonomic Oak Desks</div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-foreground">
                                ₹{liveReconcileCount.toLocaleString()}.00
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-emerald-600 inline-flex items-center gap-1 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> GL-Posted
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                                  Invoiced
                                </span>
                              </td>
                            </tr>
                            <tr className="hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-3 font-semibold text-foreground">SO-0891</td>
                              <td className="py-3 px-3">
                                <div className="font-medium text-foreground">Apex Hospitality Suites</div>
                                <div className="text-[11px] text-muted-foreground">120x Velvet Lounge Chairs</div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-foreground">₹112,000.00</td>
                              <td className="py-3 px-3">
                                <span className="text-blue-600 inline-flex items-center gap-1 font-medium">
                                  <Sparkles className="w-3.5 h-3.5" /> Pending Rec
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                                  Dispatched
                                </span>
                              </td>
                            </tr>
                            <tr className="hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-3 font-semibold text-foreground">SO-0890</td>
                              <td className="py-3 px-3">
                                <div className="font-medium text-foreground">Linear Architecture Ltd</div>
                                <div className="text-[11px] text-muted-foreground">Bespoke Millwork Package</div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-foreground">₹64,500.00</td>
                              <td className="py-3 px-3">
                                <span className="text-emerald-600 inline-flex items-center gap-1 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> GL-Posted
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="px-2.5 py-1 rounded-full bg-surface-container text-muted-foreground text-[11px] font-semibold">
                                  Completed
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right: Automated 3-Way Audit Card */}
                    <div className="lg:col-span-5 bg-card rounded-xl p-5 border border-border shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base font-bold text-foreground">Automated 3-Way Audit</span>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Matched 100%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                          Cross-verifying PO vs Goods Receipt vs Supplier Invoicing before check run.
                        </p>
                        <div className="space-y-2.5">
                          {/* PO item */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-border/60">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <div>
                                <div className="text-xs font-semibold text-foreground">Purchase Order PO-0001</div>
                                <div className="text-[11px] text-muted-foreground">Teak Slabs • Qty: 200 cu.ft</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-foreground">₹5,000.00</span>
                          </div>
                          {/* GRN item */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-border/60">
                            <div className="flex items-center gap-2.5">
                              <Boxes className="w-4 h-4 text-emerald-600" />
                              <div>
                                <div className="text-xs font-semibold text-foreground">Goods Receipt GRN-0142</div>
                                <div className="text-[11px] text-muted-foreground">Yard Inspection Passed • Qty: 200</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                              0 Variance
                            </span>
                          </div>
                          {/* Invoice item */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-border/60">
                            <div className="flex items-center gap-2.5">
                              <Receipt className="w-4 h-4 text-emerald-600" />
                              <div>
                                <div className="text-xs font-semibold text-foreground">Vendor Invoice INV-8821</div>
                                <div className="text-[11px] text-muted-foreground">Azure Timber Mills • Tax Audited</div>
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
                          <span>Ready for AP Settlement</span>
                        </div>
                        <button
                          onClick={handleAuthorizeRelease}
                          className="px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
                        >
                          {matchVerified ? "Authorize Release" : "Processing..."}
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
              Trusted by 450+ furniture manufacturers, timber mills, and retail chains nationwide
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center opacity-85">
              <div className="partner-logo flex items-center gap-2.5 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                <TreePine className="w-5 h-5 text-primary" />
                <span>Modern Timber</span>
              </div>
              <div className="partner-logo flex items-center gap-2.5 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                <Factory className="w-5 h-5 text-primary" />
                <span>Azure Woodworks</span>
              </div>
              <div className="partner-logo flex items-center gap-2.5 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                <Armchair className="w-5 h-5 text-primary" />
                <span>Nordic Furnishings</span>
              </div>
              <div className="partner-logo flex items-center gap-2.5 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                <Truck className="w-5 h-5 text-primary" />
                <span>FleetLogistics</span>
              </div>
              <div className="partner-logo flex items-center gap-2.5 text-sm font-semibold text-foreground col-span-2 md:col-span-1 hover:text-primary transition-colors">
                <Cpu className="w-5 h-5 text-primary" />
                <span>Apex Millworks</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workflows Section: Order to Ledger */}
        <section id="workflows-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="workflow-header flex flex-col items-center text-center mb-12">
            <span className="px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              Continuous Accounting Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground max-w-2xl tracking-tight">
              From Order to Ledger — Zero Manual Reconciliation
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-xl">
              Every movement of lumber, finished cabinet, showroom invoice, or raw component immediately writes an auditable transaction to your chart of accounts.
            </p>
          </div>

          {/* Stepper / Pipeline Cards */}
          <div id="workflows-cards" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Workflow 1: Sales & Revenue */}
            <div className="workflow-card bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Sales &amp; Revenue Pipeline</h3>
                      <span className="text-xs text-muted-foreground">Direct dispatch to receivable recognition</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    Automated
                  </span>
                </div>

                {/* Vertical Stepper */}
                <div className="space-y-6 relative pl-4 border-l-2 border-primary/20 ml-3">
                  {/* Step 1 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      1
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Sales Order SO-0892</span>
                        <span className="text-[11px] font-semibold text-muted-foreground bg-card px-2 py-0.5 rounded-md border border-border">
                          Quote Confirmed
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Client commitment booked; reservations locked in factory floor inventory allocation.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      2
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Warehouse Dispatch &amp; Invoice INV-2026</span>
                        <span className="text-[11px] font-semibold text-primary bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                          Auto-Generated
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Barcodes scanned on loading dock; e-Way bill issued and GST invoice transmitted electronically.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      ✓
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Bank Settlement &amp; Auto-Credit</span>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-card px-2 py-0.5 rounded-md border border-emerald-200">
                          Reconciled
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Direct bank feed matches payment payload, clearing Accounts Receivable and writing to GL Account #1010.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-primary" />
                  Journal: DR AR ₹48,200 | CR Sales ₹48,200
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Workflow 2: Procurement & AP */}
            <div className="workflow-card bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Procurement &amp; Accounts Payable</h3>
                      <span className="text-xs text-muted-foreground">PO intake, 3-way matching, and disbursements</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    Fraud-Proof
                  </span>
                </div>

                {/* Vertical Stepper */}
                <div className="space-y-6 relative pl-4 border-l-2 border-primary/20 ml-3">
                  {/* Step 1 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      1
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Purchase Order PO-0001</span>
                        <span className="text-[11px] font-semibold text-muted-foreground bg-card px-2 py-0.5 rounded-md border border-border">
                          Encumbrance ₹5,000
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Committed raw materials hold budget allocation inside PRJ-FURN-26 without double-booking.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      2
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Intake Goods Receipt GRN-0142</span>
                        <span className="text-[11px] font-semibold text-primary bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                          Physical Intake
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Timber receiving dock logs actual cubic feet and moisture reading before stock sign-off.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="workflow-step relative pl-6">
                    <div className="absolute -left-[25px] top-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center ring-4 ring-card">
                      ✓
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">3-Way Match &amp; Settlement</span>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-card px-2 py-0.5 rounded-md border border-emerald-200">
                          Zero Discrepancy
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Vendor Bill compared against PO and GRN automatically; approved for scheduled ACH release.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-primary" />
                  Journal: DR Expense #5100 | CR AP #2100
                </span>
                <CheckCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </section>

        {/* Bento-Style Feature Grid (8 Core Enterprise Modules) */}
        <section id="bento-section" className="w-full bg-surface-container py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bento-header flex flex-col items-center text-center mb-14">
              <span className="px-3.5 py-1 rounded-full bg-card border border-border text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                Bespoke Suite
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground max-w-2xl tracking-tight">
                Engineered for Furniture Enterprise Complexity
              </h2>
              <p className="mt-3 text-base text-muted-foreground max-w-2xl">
                From multi-warehouse lumber valuation to contract design billing milestones, Urban Furniture unifies every operational vector.
              </p>
            </div>

            <div id="bento-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Bento Card 1 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Unified Executive Command</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Live telemetry tracking blended revenue, real-time operating cash runway, pending purchase encumbrances, and branch performance.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Executive cockpit</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Bento Card 2 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Sales Order &amp; Invoicing</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Convert confirmed showroom estimates to full GST-compliant invoices in 1-click. Automatic overdue payment triggers and portal links.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Automated dunning</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Bento Card 3 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Automated 3-Way Match</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Eliminate invoice errors and overbilling. Cross-audit PO contracts, warehouse physical receipt manifests, and vendor invoices systematically.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Fraud elimination</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Bento Card 4 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Native Double-Entry GL</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enterprise-grade ledger architecture. Automatically creates balanced debit and credit entries with full cryptographic provenance.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>GAAP compliant</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Bento Card 5 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Budgets &amp; Cost Centers</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enforce strict project ceilings on bespoke client jobs and factory lines. Visual headroom alerts prevent PO commitments that breach caps.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Variance detection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Bento Card 6 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Real-Time Statements</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Generate audited Balance Sheets, P&amp;L by showroom branch, Trial Balances, and multi-currency foreign exchange revaluations on demand.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>Instant closing</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Bento Card 7 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Master Data Governance</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Catalog vendor reliability index scores, raw lumber species grading, upholstery textile stocks, finished furniture SKUs, and credit terms.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>BOM synchronization</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Bento Card 8 */}
              <div className="bento-card bg-card p-6 rounded-2xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-surface-container-highest text-foreground flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Role-Based Governance</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Isolate responsibilities between showroom floor clerks, yard dispatchers, certified CPAs, and external auditors with immutable event logs.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs font-semibold text-primary flex items-center gap-1">
                  <span>SOC2 Type II</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Budget & Double-Entry Ledger Audit Widget */}
        <section id="telemetry-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div id="telemetry-widget" className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
            {/* Header Banner */}
            <div className="px-6 py-5 bg-surface-container-high/40 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Analytical Cost Center Telemetry
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  Furniture Project (PRJ-FURN-26)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Auditable analytical accounting linked directly to general ledger commitments.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Within Approved Budget Cap
                </span>
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-full bg-card hover:bg-surface-container text-foreground text-xs font-semibold border border-border shadow-xs transition-colors"
                >
                  Audit Trail
                </Link>
              </div>
            </div>

            {/* Split Grid: Budget Health & Ledger Journal */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Budget Health & Visualization */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-border/60">
                    <span className="text-xs text-muted-foreground font-medium">Total Budget</span>
                    <div className="text-xl font-bold text-foreground mt-1">₹50,000.00</div>
                    <span className="text-[11px] text-muted-foreground">100% Base Cap</span>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                    <span className="text-xs text-muted-foreground font-medium">Total Committed</span>
                    <div className="text-xl font-bold text-primary mt-1">₹47,000.00</div>
                    <span className="text-[11px] text-primary font-semibold">94% Allocated</span>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-xs text-muted-foreground font-medium">Free Headroom</span>
                    <div className="text-xl font-bold text-emerald-600 mt-1">₹3,000.00</div>
                    <span className="text-[11px] text-emerald-600 font-semibold">Safe Margin</span>
                  </div>
                </div>

                {/* Segmented Progress Bar */}
                <div className="p-5 rounded-xl bg-surface-container-low border border-border/60">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2.5 font-medium">
                    <span>Encumbrance Distribution Breakdown</span>
                    <span className="font-bold text-foreground">₹47,000 / ₹50,000 Utilized</span>
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
                        Historical Commitments: <strong>₹42,000 (84%)</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      <span className="text-foreground">
                        PO-0001 (Oak Timber): <strong>₹5,000 (10%)</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest inline-block border border-border"></span>
                      <span className="text-muted-foreground">
                        Unallocated: <strong>₹3,000 (6%)</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Protection Policy Notice */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container border border-border text-foreground">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-foreground">
                    <strong className="font-semibold">Enforced Hard Cap Protection:</strong> System will automatically reject any additional Purchase Requisition exceeding ₹3,000.00 without secondary approval from Financial Controller (CFO Office).
                  </p>
                </div>
              </div>

              {/* Double-Entry Journal Entry Preview */}
              <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-5 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-foreground">Journal Entry #JE-9042</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                      Balanced 100%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Automatic GAAP ledger posting triggered by PO-0001 Intake completion.
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
                            <div className="font-semibold text-foreground">#5100 Direct Materials</div>
                            <div className="text-[11px] text-muted-foreground">PRJ-FURN-26 Timber Slabs</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-foreground">₹5,000.00</td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">—</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground">#2100 Accounts Payable</div>
                            <div className="text-[11px] text-muted-foreground">Azure Timber Mills (Net 30)</div>
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
                    <Lock className="w-3.5 h-3.5 text-emerald-600" /> Hash: #88c2f1
                  </span>
                  <span>Audited in Real-Time</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Enterprise Governance Section */}
        <section id="security-section" className="w-full bg-card border-y border-border py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-surface-container-low rounded-2xl p-6 sm:p-10 border border-border">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-primary text-xs font-semibold mb-3">
                    <ShieldCheck className="w-4 h-4" /> Bank-Grade Double-Entry Ledger Environment
                  </div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                    Complete Audit Resilience for High-Volume Furniture Operations
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Built for commercial furniture groups managing multiple legal entities, retail showrooms, contract divisions, and mill factories. Maintain spotless compliance through regulatory cycles.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">SOC2 Type II</span>
                  </div>
                  <div className="bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs">
                    <Database className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Continuous Backups</span>
                  </div>
                  <div className="bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Multi-Entity Ledger</span>
                  </div>
                  <div className="bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Immutable Audit Log</span>
                  </div>
                  <div className="bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">99.99% SLA Uptime</span>
                  </div>
                  <div className="bg-card p-3.5 rounded-xl border border-border flex items-center gap-2.5 shadow-xs">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">SAML / Okta SSO</span>
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
              Zero Risk Deployment
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl mb-3 tracking-tight">
              Ready to modernize your furniture business financials?
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mb-8 leading-relaxed font-normal">
              Eliminate inventory reconciliation gaps, automate 3-way invoice matching, and post error-free double-entry journals in under 14 days.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3.5 z-10 w-full sm:w-auto">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold bg-white text-primary hover:bg-surface-container-high transition-all shadow-md active:scale-98"
              >
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all active:scale-98"
              >
                <span>Book a Solution Architect</span>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/80 text-xs font-medium">
              <span>No credit card required</span>
              <span>•</span>
              <span>Custom ERP data migration available</span>
              <span>•</span>
              <span>Live support within 15 min</span>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Material Enterprise Footer */}
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
                Unified financial telemetry and inventory ERP designed exclusively for modern furniture manufacturers, retailers, and contract designers. Auditable, compliant, and precision-engineered.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> SOC2 Type II Certified
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-primary text-[11px] font-semibold">
                  GAAP Compliant
                </span>
              </div>
            </div>

            {/* Col 1: ERP Modules */}
            <div className="flex flex-col gap-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">ERP Modules</span>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                BOM Costing Engine
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Showroom PoS Sync
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Ledger Reconciliation
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Supply Chain Telemetry
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Multi-Warehouse Valuation
              </a>
            </div>

            {/* Col 2: Security & Governance */}
            <div className="flex flex-col gap-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Security &amp; Governance
              </span>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Audit Logs &amp; Traceability
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Role-Based Access (RBAC)
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Continuous Backups
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Encryption Standards
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Enterprise SLA
              </a>
            </div>

            {/* Col 3: Legal & Trust */}
            <div className="flex flex-col gap-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">Legal &amp; Trust</span>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Privacy Policy
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Terms of Service
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Compliance Matrix
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                DPA &amp; GDPR
              </a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">
                Subprocessors
              </a>
            </div>
          </div>

          {/* Footer Sub-bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2025 Urban Furniture Technologies, Inc. All accounting metrics calculated in real-time. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Production Systems Normal
              </span>
              <span>256-bit TLS v1.3</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
