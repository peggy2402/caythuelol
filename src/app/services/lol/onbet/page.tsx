// src/app/services/lol/onbet/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Banknote, Info, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AccountInfo from '@/components/services/lol/AccountInfo';
import PaymentSummary from '@/components/services/lol/PaymentSummary';

// Bảng giá phần thưởng cố định
const ONBET_REWARDS: Record<string, Record<number, number>> = {
  'IRON_BRONZE': { 50: 100000, 150: 200000, 300: 400000 },
  'SILVER': { 50: 150000, 150: 300000, 300: 500000 },
  'GOLD': { 50: 200000, 150: 400000, 300: 600000 },
  'PLATINUM': { 50: 250000, 150: 500000, 300: 800000 },
  'EMERALD': { 50: 300000, 150: 800000, 300: 1200000 },
  'DIAMOND': { 50: 350000, 150: 900000, 300: 1500000 },
  'MASTER': { 50: 500000, 150: 1000000, 300: 2000000 },
  'GRANDMASTER': { 50: 1000000, 150: 2000000, 300: 5000000 },
  'CHALLENGER_FLEX': { 50: 2000000, 150: 3000000, 300: 8000000 },
  'CHALLENGER_SOLO': { 50: 4000000, 200: 10000000 }
};

const ONBET_RANKS = [
    { id: 'IRON_BRONZE', label: 'Sắt / Đồng' },
    { id: 'SILVER', label: 'Bạc' },
    { id: 'GOLD', label: 'Vàng' },
    { id: 'PLATINUM', label: 'Bạch Kim' },
    { id: 'EMERALD', label: 'Lục Bảo' },
    { id: 'DIAMOND', label: 'Kim Cương' },
    { id: 'MASTER', label: 'Cao Thủ' },
    { id: 'GRANDMASTER', label: 'Đại Cao Thủ' },
    { id: 'CHALLENGER_FLEX', label: 'Thách Đấu (Flex Top 100)' },
    { id: 'CHALLENGER_SOLO', label: 'Thách Đấu (Solo Top 100)' },
];

function OnbetContent() {
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');

  // --- STATE ---
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  
  // Service State
  const [selectedRank, setSelectedRank] = useState('GOLD');
  const [gameCount, setGameCount] = useState(50);

  // Account Info State
  const [accountType, setAccountType] = useState('RIOT');
  const [gameUsername, setGameUsername] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [selectedServer, setSelectedServer] = useState('');

  // Collapsible Sections
  const [openSections, setOpenSections] = useState({
    service: true, account: true
  });
  const toggleSection = (section: keyof typeof openSections) => { setOpenSections(prev => ({ ...prev, [section]: !prev[section] })); };

  // --- REGISTRATION PERIOD LOGIC ---
  const today = new Date();
  const isRegistrationOpen = today.getDate() <= 7;

  // 1. Fetch Platform Fee
  useEffect(() => {
    fetch('/api/settings/platform-fee').then(res => res.json()).then(data => setPlatformFee(data.fee || 0));
  }, []);

  // 2. Fetch Booster Config
  useEffect(() => {
    if (!boosterId) { setBoosterConfig(null); return; }
    const fetchBoosterData = async () => {
        setLoadingConfig(true);
        try {
            const res = await fetch(`/api/boosters/${boosterId}`);
            const data = await res.json();
            if (data.booster) {
                setBoosterConfig(data.booster);
                setSelectedServer(data.booster.booster_info?.service_settings?.servers?.[0] || '');
            }
        } catch (error) { console.error(error); } 
        finally { setLoadingConfig(false); }
    };
    fetchBoosterData();
  }, [boosterId]);

  // --- PRICING LOGIC ---
  const priceDetails = useMemo(() => {
    // Lấy phần thưởng từ bảng cố định
    const reward = ONBET_REWARDS[selectedRank]?.[gameCount] || 0;
    
    // Lấy tỉ lệ cọc từ Booster (Mặc định 50%)
    const boosterPercent = boosterConfig?.booster_info?.service_settings?.onbetPricePercent || 50;
    
    // Giá dịch vụ = Phần thưởng * Tỉ lệ cọc
    const base = reward * (boosterPercent / 100);

    // Platform Fee
    const platformFeeValue = base * (platformFee / 100);

    // Total
    const total = base + platformFeeValue;

    return {
        basePrice: base,
        totalPrice: Math.max(0, Math.round(total)),
        platformFeeValue,
        optionDetails: [],
        depositAmount: 0,
        rewardValue: reward,
        boosterPercent
    };
  }, [boosterConfig, selectedRank, gameCount, platformFee]);

  const isAccountValid = useMemo(() => {
    return gameUsername.trim().length >= 3 && gamePassword.trim().length >= 3;
  }, [gameUsername, gamePassword]);

  // Lấy danh sách số trận khả dụng cho Rank đang chọn
  const availableGameCounts = useMemo(() => {
      return Object.keys(ONBET_REWARDS[selectedRank] || {}).map(Number).sort((a, b) => a - b);
  }, [selectedRank]);

  // Reset game count khi đổi rank nếu số trận hiện tại không khả dụng
  useEffect(() => {
      if (!availableGameCounts.includes(gameCount)) {
          setGameCount(availableGameCounts[0]);
      }
  }, [selectedRank, availableGameCounts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 pb-48 lg:pb-0">
            {/* Service Config */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between p-6 cursor-pointer" onClick={() => toggleSection('service')}>
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-blue-500/10 rounded-lg text-blue-400 font-bold">1</span>
                        <span>Thông tin dịch vụ</span>
                    </h3>
                    <div className="flex items-center gap-4">
                        {loadingConfig && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                        <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${openSections.service ? 'rotate-180' : ''}`} />
                    </div>
                </div>
                <AnimatePresence>
                    {openSections.service && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 pt-0 space-y-6">
                                {/* Rank Selection */}
                                <div>
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-3 block">Chọn Rank hiện tại</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {ONBET_RANKS.map((rank) => (
                                            <button
                                                disabled={!isRegistrationOpen}
                                                key={rank.id}
                                                onClick={() => setSelectedRank(rank.id)}
                                                className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                                                    selectedRank === rank.id 
                                                        ? 'bg-green-600/20 border-green-500 text-green-400' 
                                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-800'
                                                }`}
                                            >
                                                {rank.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Game Count Selection */}
                                <div>
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-3 block">Số trận cần cày</label>
                                    <div className="flex gap-3">
                                        {availableGameCounts.map((count) => (
                                            <button
                                                disabled={!isRegistrationOpen}
                                                key={count}
                                                onClick={() => setGameCount(count)}
                                                className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                                                    gameCount === count 
                                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-800'
                                                }`}
                                            >
                                                {count} Trận
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className={`p-4 rounded-xl flex gap-3 border ${isRegistrationOpen ? 'bg-blue-900/10 border-blue-500/20' : 'bg-red-900/20 border-red-500/30'}`}>
                                    <Info className={`w-5 h-5 shrink-0 mt-0.5 ${isRegistrationOpen ? 'text-blue-400' : 'text-red-400'}`} />
                                    <div className={`text-sm space-y-1 ${isRegistrationOpen ? 'text-blue-200' : 'text-red-200'}`}>
                                        {isRegistrationOpen ? (
                                            <>
                                                <p>
                                                1. Vui lòng liên hệ telegram{' '}
                                                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-semibold">
                                                    @hotro8on
                                                </span>{' '}
                                                để đăng ký sự kiện. Sau khi đăng kí xong hãy quay trở lại hệ thống của chúng tôi để thuê nhé!
                                                </p>
                                            </>
                                        ) : (
                                            <p><strong>Thời gian đăng ký đã kết thúc.</strong> Dịch vụ sẽ mở lại vào ngày 1 đến ngày 7 của tháng sau. Vui lòng quay lại sau!</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Account Info */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between p-6 cursor-pointer" onClick={() => toggleSection('account')}>
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-blue-500/10 rounded-lg text-blue-400 font-bold">2</span>
                        <span>Thông tin tài khoản</span>
                    </h3>
                    <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${openSections.account ? 'rotate-180' : ''}`} />
                </div>
                <AnimatePresence>
                    {openSections.account && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 pt-0">
                                <AccountInfo 
                                    accountType={accountType} setAccountType={setAccountType}
                                    server={selectedServer} setServer={setSelectedServer}
                                    username={gameUsername} setUsername={setGameUsername}
                                    password={gamePassword} setPassword={setGamePassword}
                                    servers={boosterConfig?.booster_info?.service_settings?.servers}
                                    disabled={!boosterId}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Right Column */}
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:sticky lg:top-24 lg:col-span-1 lg:h-fit">
            <PaymentSummary
                boosterConfig={boosterConfig}
                boosterId={boosterId}
                priceDetails={priceDetails}
                platformFee={platformFee}
                isValid={isAccountValid && isRegistrationOpen}
                validationMessage={!isAccountValid ? "Vui lòng nhập đầy đủ thông tin tài khoản." : !isRegistrationOpen ? "Đã hết thời gian đăng ký tháng này." : undefined}
                serviceType="ONBET"
                details={{
                    rank_label: ONBET_RANKS.find(r => r.id === selectedRank)?.label,
                    game_count: gameCount,
                    reward_value: priceDetails?.rewardValue,
                    server: selectedServer,
                    account_username: gameUsername,
                    account_password: gamePassword
                }}
                options={{}}
            >
                {/* Service Specific Breakdown Content */}
                <>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Dịch vụ:</span>
                        <span className="text-white font-medium">Cày Rank Sự Kiện</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Rank:</span>
                        <span className="text-white font-medium">{ONBET_RANKS.find(r => r.id === selectedRank)?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Số trận:</span>
                        <span className="text-white font-medium">{gameCount} trận</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-zinc-400">Phần thưởng bạn sẽ nhận được là:</span>
                            <span className="text-green-400 font-bold">{priceDetails?.rewardValue.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Tỉ lệ thanh toán ({priceDetails?.boosterPercent}%):</span>
                            <span className="text-white font-medium">{priceDetails?.basePrice.toLocaleString('vi-VN')} đ</span>
                        </div>
                    </div>
                </>
            </PaymentSummary>
        </div>
    </div>
  );
}

export default function OnbetPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <OnbetContent />
    </Suspense>
  );
}
