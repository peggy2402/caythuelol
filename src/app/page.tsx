'use client';

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

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <Navbar />

      <main className="relative">
        {/* Ambient Dark Canvas Background Texture & Dynamic Glows */}
        <div 
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" 
          style={{ backgroundImage: 'url("/noise.png")' }} 
        />
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-[800px] left-[-200px] w-[500px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute top-[1800px] right-[-200px] w-[600px] h-[600px] bg-cyan-600/10 blur-[160px] pointer-events-none rounded-full" />

        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. 12-Game Esports Hub */}
        <EsportsGamesGrid />

        {/* 3. Live Interactive Rank Calculator & Core Platform Guarantees */}
        <LiveRankCalculator />

        {/* 4. VIP Membership & Escrow Guarantee Banner */}
        <VipMembershipBanner />

        {/* 5. Social Proof & Verified Reviews */}
        <CustomerReviews />

        {/* 6. 2-Column Accordion FAQ */}
        <FaqAccordion />

        {/* 7. Meta Patch Notes & Esports Spotlight */}
        <MetaNewsSpotlight />
      </main>

      {/* Floating Feedback Trigger & Modal */}
      <FeedbackModal />

      {/* 8. Dark Luxury Gaming Footer */}
      <EsportsFooter />
    </div>
  );
}
