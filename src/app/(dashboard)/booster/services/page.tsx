'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { Loader2, Save, Settings2, Trophy, Zap, Swords, ChevronDown, ChevronUp } from 'lucide-react';

interface RankData {
  _id: string;
  gameCode: string;
  tier: string;
  division: string | null;
  order: number;
}

export default function BoosterServicesPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Config State
  const [rankPrices, setRankPrices] = useState<Record<string, number>>({});
  const [lpModifiers, setLpModifiers] = useState({
    high: -30, // 17+
    medium: -10, // 15-17
    low: 0 // 14-
  });
  const [queueModifiers, setQueueModifiers] = useState({
    SOLO_DUO: 0,
    FLEX: -10,
    TFT: 0
  });

  // Dynamic Data from DB
  const [ranks, setRanks] = useState<RankData[]>([]);
  const [tiersOrder, setTiersOrder] = useState<string[]>([]);

  // UI State
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({
    'IRON': true, 'BRONZE': true, 'SILVER': true, 'GOLD': true // Default expand low elo
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/boosters/services');
      if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch settings');
      }
      const data = await res.json();
      
      // Set Ranks from DB
      if (data.ranks) {
        setRanks(data.ranks);
        const uniqueTiers = Array.from(new Set(data.ranks.map((r: RankData) => r.tier)));
        setTiersOrder(uniqueTiers as string[]);
      }

      // Set Settings from User Config
      const settings = data.settings || {};
      if (settings) {
        if (settings.rankPrices) setRankPrices(settings.rankPrices);
        if (settings.lpModifiers) setLpModifiers(settings.lpModifiers);
        if (settings.queueModifiers) setQueueModifiers(settings.queueModifiers);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/boosters/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rankPrices,
          lpModifiers,
          queueModifiers
        }),
      });
      
      if (res.ok) {
        toast.success('Cập nhật thành công!');
        // Reload data to confirm save
        fetchData();
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (key: string, value: string) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setRankPrices(prev => ({ ...prev, [key]: numValue }));
  };

  const toggleTier = (tier: string) => {
    setExpandedTiers(prev => ({ ...prev, [tier]: !prev[tier] }));
  };

  // Group ranks helper
  const getRanksByTier = (tier: string) => {
    return ranks.filter(r => r.tier === tier).sort((a, b) => a.order - b.order);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{t('manageServices')}</h1>
          <p className="text-zinc-400 text-sm">{t('manageServicesDesc')}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu thay đổi
        </button>
      </div>

      {/* 1. RANK BOOST CONFIG */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-blue-400">
          <Trophy className="w-6 h-6" />
          <h2>Cấu hình giá Rank Boost (LOL)</h2>
        </div>

        <div className="grid gap-4">
          {tiersOrder.map((tier) => {
            const ranksInTier = getRanksByTier(tier);
            if (!ranksInTier) return null;
            const isExpanded = expandedTiers[tier];

            return (
              <div key={tier} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleTier(tier)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Placeholder for Rank Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border border-white/10 ${
                      tier === 'IRON' ? 'bg-zinc-700 text-zinc-400' :
                      tier === 'BRONZE' ? 'bg-orange-900 text-orange-400' :
                      tier === 'SILVER' ? 'bg-slate-400 text-slate-900' :
                      tier === 'GOLD' ? 'bg-yellow-600 text-yellow-100' :
                      tier === 'PLATINUM' ? 'bg-teal-600 text-teal-100' :
                      tier === 'EMERALD' ? 'bg-emerald-600 text-emerald-100' :
                      tier === 'DIAMOND' ? 'bg-blue-400 text-blue-900' :
                      'bg-purple-600 text-purple-100'
                    }`}>
                      {tier[0]}
                    </div>
                    <span className="font-bold text-white">{tier}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </button>

                {isExpanded && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                    {ranksInTier.map((rank) => {
                      // Key format: TIER_DIVISION (e.g., IRON_IV) or TIER_NA (e.g., MASTER_NA)
                      const displayKey = rank.division ? `${rank.tier} ${rank.division}` : rank.tier;
                      const configKey = `${rank.tier}_${rank.division || 'NA'}`; // Consistent key format

                      return (
                        <div key={configKey} className="space-y-1.5">
                          <label className="text-xs font-medium text-zinc-500">{displayKey}</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={rankPrices[configKey] ? rankPrices[configKey].toLocaleString() : ''}
                              onChange={(e) => handlePriceChange(configKey, e.target.value)}
                              placeholder="0"
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none pr-8"
                            />
                            <span className="absolute right-3 top-2 text-xs text-zinc-600">đ</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. LP GAIN MODIFIERS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-yellow-400">
          <Zap className="w-6 h-6" />
          <h2>Điểm cộng mỗi ván (LP Gain)</h2>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Từ 17+ LP (Good MMR)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={lpModifiers.high}
                onChange={(e) => setLpModifiers({...lpModifiers, high: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-yellow-500 outline-none"
              />
              <span className="text-zinc-500">%</span>
            </div>
            <p className="text-xs text-zinc-600">Thường giảm giá vì leo nhanh.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">15 - 17 LP (Normal)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={lpModifiers.medium}
                onChange={(e) => setLpModifiers({...lpModifiers, medium: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-yellow-500 outline-none"
              />
              <span className="text-zinc-500">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Dưới 14 LP (Bad MMR)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={lpModifiers.low}
                onChange={(e) => setLpModifiers({...lpModifiers, low: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-yellow-500 outline-none"
              />
              <span className="text-zinc-500">%</span>
            </div>
            <p className="text-xs text-zinc-600">Thường tăng giá hoặc giữ nguyên.</p>
          </div>
        </div>
      </div>

      {/* 3. QUEUE TYPE MODIFIERS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-purple-400">
          <Swords className="w-6 h-6" />
          <h2>Chế độ chơi (Queue Type)</h2>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Đơn / Đôi (Solo/Duo)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={queueModifiers.SOLO_DUO}
                onChange={(e) => setQueueModifiers({...queueModifiers, SOLO_DUO: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
              <span className="text-zinc-500">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Linh Hoạt (Flex)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={queueModifiers.FLEX}
                onChange={(e) => setQueueModifiers({...queueModifiers, FLEX: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
              <span className="text-zinc-500">%</span>
            </div>
            <p className="text-xs text-zinc-600">Thường dễ hơn Solo/Duo.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Đấu Trường Chân Lý (TFT)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={queueModifiers.TFT}
                onChange={(e) => setQueueModifiers({...queueModifiers, TFT: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
              <span className="text-zinc-500">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
