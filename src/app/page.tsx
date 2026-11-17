'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/home/HeroSection";
import EsportsGamesGrid from "@/components/home/EsportsGamesGrid";
import LiveRankCalculator from "@/components/home/LiveRankCalculator";
import VipMembershipBanner from "@/components/home/VipMembershipBanner";
import CustomerReviews from "@/components/home/CustomerReviews";
import FaqAccordion from "@/components/home/FaqAccordion";
import MetaNewsSpotlight from "@/components/home/MetaNewsSpotlight";
import FeedbackModal from "@/components/home/FeedbackModal";
import EsportsFooter from "@/components/home/EsportsFooter";

// Reusable Scroll-driven Section Reveal Wrapper
function ScrollSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.75,
        delay,
        ease: [0.22, 1, 0.36, 1], // Smooth custom cubic bezier
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax Scroll Tracking
  const { scrollYProgress } = useScroll();

  // Smooth Spring Physics for Top Scroll Progress Indicator
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // Deep Parallax Drift for Ambient Glow Backgrounds
  const yOrbTop = useTransform(scrollYProgress, [0, 1], [0, 280]);
  const yOrbMid = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const yOrbBot = useTransform(scrollYProgress, [0, 1], [0, 320]);
  const rotateOrb = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative"
    >
      {/* 1. Cyber Neon Scroll Progress Bar (Top Fixed) */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400 origin-left z-50 shadow-[0_0_15px_rgba(6,182,212,0.8)] pointer-events-none"
      />

      <Navbar />

      <main className="relative">
        {/* 2. Ambient Parallax Background Texture & Glowing Orbs */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
          style={{ backgroundImage: 'url("/noise.png")' }}
        />

        {/* Top Glowing Orb with Downward Parallax */}
        <motion.div
          style={{ y: yOrbTop, rotate: rotateOrb }}
          className="absolute top-[-160px] left-1/2 -translate-x-1/2 w-[1050px] h-[550px] bg-gradient-to-b from-cyan-600/18 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full"
        />

        {/* Middle Glowing Orb with Upward Parallax */}
        <motion.div
          style={{ y: yOrbMid }}
          className="absolute top-[900px] left-[-220px] w-[550px] h-[550px] bg-amber-500/12 blur-[160px] pointer-events-none rounded-full"
        />

        {/* Bottom Glowing Orb with Slow Parallax */}
        <motion.div
          style={{ y: yOrbBot }}
          className="absolute top-[2000px] right-[-220px] w-[650px] h-[650px] bg-cyan-600/12 blur-[170px] pointer-events-none rounded-full"
        />

        {/* 1. Hero Section (Parallax Native Entrance) */}
        <HeroSection />

        {/* 2. 18-Game Esports Hub (Staggered Wave Scroll Reveal) */}
        <ScrollSection>
          <EsportsGamesGrid />
        </ScrollSection>

        {/* 3. Live Interactive Rank Calculator */}
        <ScrollSection delay={0.05}>
          <LiveRankCalculator />
        </ScrollSection>

        {/* 4. VIP Membership & Escrow Guarantee Banner */}
        <ScrollSection delay={0.05}>
          <VipMembershipBanner />
        </ScrollSection>

        {/* 5. Social Proof & Verified Reviews */}
        <ScrollSection delay={0.05}>
          <CustomerReviews />
        </ScrollSection>

        {/* 6. 2-Column Accordion FAQ */}
        <ScrollSection delay={0.05}>
          <FaqAccordion />
        </ScrollSection>

        {/* 7. Meta Patch Notes & Esports Spotlight */}
        <ScrollSection delay={0.05}>
          <MetaNewsSpotlight />
        </ScrollSection>
      </main>

      {/* Floating Feedback Trigger & Modal */}
      <FeedbackModal />

      {/* 8. Dark Luxury Gaming Footer */}
      <EsportsFooter />
    </div>
  );
}
