'use client';

import React, { useState, useEffect } from 'react';
import BoosterGameSelectorModal from '@/components/BoosterGameSelectorModal';
import BoosterReviewList from '@/components/BoosterReviewList';
import HireBoosterModal from '@/components/HireBoosterModal';

interface BoosterGameItem {
  gameCode: string;
  ranks?: string[];
  servers?: string[];
}

interface BoosterProfileRightSectionProps {
  boosterId: string;
  boosterUsername: string;
  boosterName: string;
  boosterAvatar?: string;
  boosterGames?: BoosterGameItem[];
  customServices?: any[];
  reviews?: any[];
}

export default function BoosterProfileRightSection({
  boosterId,
  boosterUsername,
  boosterName,
  boosterAvatar,
  boosterGames = [],
  customServices = [],
  reviews = [],
}: BoosterProfileRightSectionProps) {
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [selectedGameForHire, setSelectedGameForHire] = useState('LOL');

  // Lắng nghe sự kiện click nút "Thuê ngay" từ Header Actions
  useEffect(() => {
    const handleOpenModal = (event: any) => {
      const gameId = event?.detail?.gameId;
      if (gameId) {
        setSelectedGameForHire(gameId);
      }
      setIsHireModalOpen(true);
    };

    window.addEventListener('open-hire-booster-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-hire-booster-modal', handleOpenModal);
    };
  }, []);

  const handleSelectGame = (gameId: string) => {
    setSelectedGameForHire(gameId);
    setIsHireModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. TỰA GAME VÀ DỊCH VỤ CUNG CẤP (SHOWCASE NEON GLOW CỰC ĐẸP) */}
      <div className="bg-[#090d16]/80 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-10 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-rose-600/10 rounded-full blur-[80px] pointer-events-none" />

        <BoosterGameSelectorModal
          boosterUsername={boosterUsername}
          boosterName={boosterName}
          boosterAvatar={boosterAvatar}
          boosterGames={boosterGames}
          customServices={customServices}
          onSelectGameToHire={handleSelectGame}
        />
      </div>

      {/* 2. ĐÁNH GIÁ TỪ KHÁCH HÀNG (CHIỀU CAO CÂN ĐỐI, KHÔNG BỊ TRÀN DÀI) */}
      <BoosterReviewList reviews={reviews || []} />

      {/* 3. MODAL THUÊ BOOSTER CHUẨN XỊN */}
      <HireBoosterModal
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        boosterUsername={boosterUsername}
        boosterName={boosterName}
        boosterAvatar={boosterAvatar}
        boosterId={boosterId}
        boosterGames={boosterGames}
        customServices={customServices}
      />
    </div>
  );
}
