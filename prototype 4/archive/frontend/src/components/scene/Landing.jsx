import React from "react";
import { motion } from "framer-motion";
import { LANDING } from "@/constants/testIds";
import {
  ArrowUpRight,
  Bell,
  Sparkles,
  Compass,
  Flower,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";

/**
 * Landing — a real, standalone website page revealed AFTER the cinematic
 * yellow-light flash. Warm cream base, temple-aesthetic branding, proper
 * sections. This is not an overlay on the 3D scene.
 */

const NAV = [
  { label: "Sanctum", id: LANDING.navHome },
  { label: "Lore", id: LANDING.navAbout },
  { label: "Deities", id: LANDING.navDeities },
  { label: "Darshan", id: LANDING.navDarshan },
];

const RITUALS = [
  {
    icon: Sparkles,
    kicker: "01",
    title: "Guided Virtual Puja",
    body: "Perform arati and offer flowers with a priest, streamed live from the sanctum during auspicious hours.",
  },
  {
    icon: Compass,
    kicker: "02",
    title: "Cinematic Temple Tour",
    body: "Walk through carved corridors, hear the mridangam echo, and read the stone inscriptions in your language.",
  },
  {
    icon: Flower,
    kicker: "03",
    title: "Sankalpa & Prasadam",
    body: "Book an archana in your name and receive consecrated prasadam and sacred ash at your doorstep.",
  },
];

export default function Landing() {
  return (
    <div
      data-testid={LANDING.container}
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 15% 0%, #fbeed0 0%, #f6e2b4 20%, #efd193 45%, #d9b479 75%, #a67a3e 100%)",
      }}
    >
      {/* Subtle temple-arch background silhouette */}
      <div
        className="absolute inset-x-0 top-0 h-[70vh] pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1400 800'><g fill='%23392008'><path d='M700 60 L820 200 L820 720 L580 720 L580 200 Z'/><path d='M700 20 L860 180 L860 220 L540 220 L540 180 Z'/><rect x='620' y='260' width='160' height='40'/><rect x='620' y='330' width='160' height='40'/><rect x='620' y='400' width='160' height='40'/><rect x='620' y='470' width='160' height='40'/><rect x='680' y='540' width='40' height='180' rx='20'/></g></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center top",
          backgroundSize: "contain",
        }}
      />

      {/* Paper grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* NAV */}
      <header className="relative z-10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-8 lg:px-16 py-7">
          <div data-testid={LANDING.brand} className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #fff2cf, #c68b3e 65%, #5a2f0e)",
                boxShadow: "0 6px 20px rgba(139, 78, 22, 0.35)",
              }}
            >
              <span className="font-display text-[15px] text-[#3a1e08]">ॐ</span>
            </div>
            <div className="leading-none">
              <div className="font-display text-[15px] tracking-[0.35em] text-[#3a1e08]">
                TEMPLE
              </div>
              <div className="font-display text-[11px] tracking-[0.5em] text-[#8b4e16] mt-1">
                AI
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            {NAV.map((n) => (
              <a
                key={n.id}
                href="#"
                data-testid={n.id}
                className="font-display text-[11px] tracking-[0.35em] text-[#3a1e08]/80 hover:text-[#8b4e16] transition-colors"
              >
                {n.label.toUpperCase()}
              </a>
            ))}
          </nav>

          <button
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-[#3a1e08]/25 px-5 py-2.5 font-display text-[10px] tracking-[0.35em] text-[#3a1e08] hover:bg-[#3a1e08] hover:text-[#fbeed0] transition-colors"
          >
            SIGN IN
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6} />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 pt-16 lg:pt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="h-px w-10 bg-[#8b4e16]" />
              <span className="font-display text-[11px] tracking-[0.4em] text-[#8b4e16]">
                A LIVING SANCTUM
              </span>
            </motion.div>

            <motion.h1
              data-testid={LANDING.heroTitle}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[#2a1405] text-5xl sm:text-6xl lg:text-7xl leading-[1.02]"
            >
              You have entered
              <br />
              <span className="italic font-serif-body font-light text-[#8b4e16]">
                the sanctum between
              </span>
              <br />
              cloud and water.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 font-serif-body text-xl text-[#3a1e08]/85 leading-relaxed max-w-2xl"
            >
              A thousand-year gopuram, reborn as a cinematic sanctum you can visit
              from anywhere. Offer light, hear the bells, receive the priest&rsquo;s
              blessing — carried across cloud and glass into your home.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 flex flex-wrap items-center gap-6"
            >
              <button
                data-testid={LANDING.ctaDarshan}
                className="group relative rounded-full px-9 py-4 font-display text-[11px] tracking-[0.35em] text-[#fbeed0] transition-transform hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, #6b3410 0%, #3a1e08 100%)",
                  boxShadow:
                    "0 14px 40px -10px rgba(58,30,8,0.55), inset 0 1px 0 rgba(255,220,170,0.25)",
                }}
              >
                <span className="flex items-center gap-3">
                  BOOK A DARSHAN
                  <ArrowUpRight className="w-4 h-4" strokeWidth={1.6} />
                </span>
              </button>

              <button
                data-testid={LANDING.ctaExplore}
                className="group flex items-center gap-3 font-display text-[11px] tracking-[0.35em] text-[#3a1e08]/85 hover:text-[#8b4e16] transition-colors"
              >
                <span className="relative">
                  EXPLORE THE SANCTUM
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#8b4e16]/60 group-hover:bg-[#8b4e16] transition-colors" />
                </span>
              </button>
            </motion.div>
          </div>

          {/* Right — floating info card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4"
          >
            <div
              className="rounded-2xl p-7 border border-[#3a1e08]/15"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,246,222,0.7), rgba(255,232,190,0.55))",
                backdropFilter: "blur(8px)",
                boxShadow: "0 30px 60px -30px rgba(58,30,8,0.4)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-display text-[10px] tracking-[0.4em] text-[#8b4e16]">
                  TODAY&rsquo;S SANCTUM
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3a1e08] text-[#f4c988] px-2.5 py-1 font-display text-[9px] tracking-[0.3em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f4c988] animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="space-y-4">
                <Row icon={Clock} label="Suprabhata" value="05:30 IST" />
                <Row icon={Bell} label="Bells rung today" value="1,204" />
                <Row icon={Flower} label="Lamps offered" value="3,876" />
                <Row icon={MapPin} label="Locus" value="Dravida Bhūmi" />
              </div>
              <button className="mt-6 w-full rounded-full py-3 font-display text-[10px] tracking-[0.35em] text-[#3a1e08] border border-[#3a1e08]/25 hover:bg-[#3a1e08] hover:text-[#fbeed0] transition-colors">
                JOIN LIVE ARATI
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* RITUAL CARDS */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 pb-32">
        <div className="flex items-end justify-between mb-14">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-[#8b4e16]" />
              <span className="font-display text-[11px] tracking-[0.4em] text-[#8b4e16]">
                THREE OFFERINGS
              </span>
            </div>
            <h2 className="font-display text-[#2a1405] text-3xl sm:text-4xl lg:text-5xl leading-tight max-w-2xl">
              How the sanctum
              <br />
              <span className="italic font-serif-body font-light text-[#8b4e16]">
                reaches you.
              </span>
            </h2>
          </div>
          <a
            href="#"
            className="hidden md:inline-flex items-center gap-2 font-display text-[10px] tracking-[0.35em] text-[#3a1e08]/80 hover:text-[#8b4e16]"
          >
            ALL RITUALS <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.6} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {RITUALS.map((r, i) => (
            <motion.div
              key={i}
              data-testid={LANDING.featureCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + i * 0.12,
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative rounded-2xl p-7 border border-[#3a1e08]/15 overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,248,228,0.75), rgba(246,226,180,0.55))",
              }}
            >
              <div
                className="absolute -top-24 -right-16 w-64 h-64 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-70"
                style={{
                  background:
                    "radial-gradient(circle, #f4c988 0%, transparent 70%)",
                }}
              />
              <div className="relative flex items-center justify-between mb-8">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#3a1e08] text-[#f4c988]">
                  <r.icon className="w-5 h-5" strokeWidth={1.4} />
                </div>
                <span className="font-display text-[10px] tracking-[0.4em] text-[#8b4e16]">
                  {r.kicker}
                </span>
              </div>
              <div className="relative font-display text-2xl text-[#2a1405] mb-3">
                {r.title}
              </div>
              <p className="relative font-serif-body text-[16px] text-[#3a1e08]/80 leading-relaxed">
                {r.body}
              </p>
              <div className="relative mt-8 flex items-center gap-2 font-display text-[10px] tracking-[0.35em] text-[#8b4e16] group-hover:text-[#3a1e08] transition-colors">
                LEARN MORE
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={1.6} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer strip */}
      <footer className="relative z-10 border-t border-[#3a1e08]/15">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16 py-8 flex flex-wrap items-center justify-between gap-4">
          <span className="font-serif-body italic text-[15px] text-[#3a1e08]/75">
            Śubham astu &middot; May all be auspicious.
          </span>
          <span className="font-display text-[10px] tracking-[0.4em] text-[#3a1e08]/60">
            © TEMPLE AI &middot; MMXXVI
          </span>
        </div>
      </footer>
    </div>
  );
}

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon className="w-3.5 h-3.5 text-[#8b4e16]" strokeWidth={1.5} />
      <span className="font-serif-body italic text-[15px] text-[#3a1e08]/85">
        {label}
      </span>
    </div>
    <span className="font-display text-[12px] tracking-[0.15em] text-[#2a1405]">
      {value}
    </span>
  </div>
);
