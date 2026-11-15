// src/app/(dashboard)/booster/services/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Swords,
  Gamepad2,
  Crosshair,
  Shield,
  Trophy,
  Flame,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  X,
  Tag,
  Percent,
  Coins,
  Loader2,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { GAMES_CATALOG } from '@/lib/games';

const ICON_MAP: Record<string, LucideIcon> = {
  Swords,
  Gamepad2,
  Crosshair,
  Shield,
  Trophy,
  Flame,
};

export interface CustomService {
  id: string;
  gameCode: string;
  name: string;
  desc: string;
  pricingType: 'PER_UNIT' | 'FIXED';
  price: number;
  unitName?: string;
  depositPercent: number;
  requiredFields: string[];
  isActive: boolean;
}

export interface BoosterCoupon {
  code: string;
  discountPercent: number;
  isActive: boolean;
}

export default function BoosterServicesStudio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Booster Configuration State
  const [selectedGames, setSelectedGames] = useState<string[]>(['LOL']);
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [coupon, setCoupon] = useState<BoosterCoupon>({
    code: '',
    discountPercent: 10,
    isActive: false,
  });

  // Modal / Form state for Add/Edit Service
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CustomService>>({
    gameCode: 'LOL',
    name: '',
    desc: '',
    pricingType: 'PER_UNIT',
    price: 1000,
    unitName: 'Điểm LP',
    depositPercent: 30,
    requiredFields: ['current_rank', 'desired_rank', 'account_credentials'],
    isActive: true,
  });

  // Load current settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/boosters/services');
        if (res.ok) {
          const data = await res.json();
          const s = data.settings || {};

          if (Array.isArray(s.selectedGames) && s.selectedGames.length > 0) {
            setSelectedGames(s.selectedGames);
          } else {
            setSelectedGames(['LOL']);
          }

          if (Array.isArray(s.customServices) && s.customServices.length > 0) {
            setCustomServices(s.customServices);
          } else {
            // Seed with sensible defaults for LoL
            setCustomServices([
              {
                id: 'srv_rank_boost',
                gameCode: 'LOL',
                name: 'Cày Rank / Elo Thần Tốc',
                desc: 'Leo rank thần tốc từ Sắt đến Thách Đấu, đảm bảo KDA và winrate cao.',
                pricingType: 'FIXED',
                price: 50000,
                depositPercent: 100,
                requiredFields: ['current_rank', 'desired_rank', 'server', 'account_credentials'],
                isActive: true,
              },
              {
                id: 'srv_net_wins',
                gameCode: 'LOL',
                name: 'Cày Điểm LP Cao Thủ / Thách Đấu',
                desc: 'Tính phí theo điểm LP ròng đạt được (thường 1.000 VNĐ / điểm).',
                pricingType: 'PER_UNIT',
                price: 1000,
                unitName: 'Điểm LP',
                depositPercent: 30,
                requiredFields: ['current_rank', 'current_lp', 'target_lp', 'server', 'account_credentials'],
                isActive: true,
              },
              {
                id: 'srv_placements',
                gameCode: 'LOL',
                name: 'Phân Hạng Đầu Mùa (5 Trận)',
                desc: 'Đảm bảo thắng 4-5 trận đầu mùa giải để tối ưu hệ số MMR.',
                pricingType: 'FIXED',
                price: 150000,
                depositPercent: 100,
                requiredFields: ['prev_rank', 'server', 'account_credentials'],
                isActive: true,
              },
            ]);
          }

          if (s.coupon) {
            setCoupon(s.coupon);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save changes to backend
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        selectedGames,
        customServices,
        coupon,
        enabledServices: customServices.filter((s) => s.isActive).map((s) => s.name),
      };

      const res = await fetch('/api/boosters/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Không thể lưu cài đặt');
      toast.success('Đã lưu cấu hình dịch vụ và mã khuyến mãi thành công');
    } catch {
      toast.error('Có lỗi xảy ra khi lưu cài đặt.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Game selection
  const handleToggleGame = (gameId: string) => {
    const code = gameId.toUpperCase();
    if (selectedGames.includes(code)) {
      if (selectedGames.length === 1) {
        toast.warning('Bạn cần chọn ít nhất một tựa game');
        return;
      }
      setSelectedGames(selectedGames.filter((g) => g !== code));
    } else {
      setSelectedGames([...selectedGames, code]);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = (gameCode = 'LOL') => {
    setEditingServiceId(null);
    setFormData({
      id: `srv_${Date.now()}`,
      gameCode: gameCode.toUpperCase(),
      name: '',
      desc: '',
      pricingType: 'PER_UNIT',
      price: 1000,
      unitName: 'Điểm LP',
      depositPercent: 30,
      requiredFields: ['current_rank', 'desired_rank', 'account_credentials'],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (service: CustomService) => {
    setEditingServiceId(service.id);
    setFormData({ ...service });
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Vui lòng nhập tên dịch vụ');
      return;
    }

    if (editingServiceId) {
      setCustomServices(
        customServices.map((s) =>
          s.id === editingServiceId ? ({ ...s, ...formData } as CustomService) : s
        )
      );
      toast.success('Đã cập nhật dịch vụ');
    } else {
      const newSvc: CustomService = {
        id: `srv_${Date.now()}`,
        gameCode: (formData.gameCode || 'LOL').toUpperCase(),
        name: formData.name.trim(),
        desc: formData.desc || '',
        pricingType: formData.pricingType || 'PER_UNIT',
        price: Number(formData.price) || 1000,
        unitName: formData.unitName || 'Điểm LP',
        depositPercent: Number(formData.depositPercent) || 30,
        requiredFields: formData.requiredFields || ['account_credentials'],
        isActive: formData.isActive ?? true,
      };
      setCustomServices([...customServices, newSvc]);
      toast.success('Đã thêm dịch vụ mới');
    }

    setIsModalOpen(false);
  };

  // Delete Service
  const handleDeleteService = (id: string) => {
    setCustomServices(customServices.filter((s) => s.id !== id));
    toast.success('Đã xoá dịch vụ');
  };

  // Toggle Service Active Status
  const handleToggleServiceActive = (id: string) => {
    setCustomServices(
      customServices.map((s) =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-6 pb-20 px-4 sm:px-6 text-white font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Studio Dịch Vụ & Bảng Giá
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              Booster Studio
            </span>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            Tự do cấu hình các tựa game, tự đặt tên dịch vụ, định giá theo điểm hoặc trọn gói, và quản lý mã khuyến mãi riêng.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>Lưu toàn bộ thay đổi</span>
        </button>
      </div>

      <div className="space-y-10">
        {/* SECTION 1: LỰA CHỌN TỰA GAME CÓ THỂ CÀY */}
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gamepad2 size={18} className="text-blue-400" />
                <span>1. Tựa game bạn có thể cày</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bật các game bạn nhận đơn. Khách hàng sẽ thấy bạn trong danh sách tuyển thủ của tựa game đó.
              </p>
            </div>
            <span className="text-xs text-zinc-400 font-semibold">
              Đã chọn: {selectedGames.length} game
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {GAMES_CATALOG.map((game) => {
              const isSelected = selectedGames.includes(game.id.toUpperCase());
              const GameIcon = ICON_MAP[game.iconName] || Gamepad2;

              return (
                <div
                  key={game.id}
                  onClick={() => handleToggleGame(game.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg border ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <GameIcon size={16} />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{game.name}</div>
                      <div className="text-[10px] text-zinc-500">{game.shortName}</div>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={12} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: BỔ SUNG CÁC DỊCH VỤ TỰ ĐẶT TÊN (CRUD) */}
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Swords size={18} className="text-red-400" />
                <span>2. Danh sách dịch vụ bạn cung cấp ({customServices.length})</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tự đặt tên dịch vụ, cấu hình đơn giá theo điểm (ví dụ 1.000 VNĐ / điểm LP), tiền cọc và thông tin yêu cầu.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal('LOL')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition-all shrink-0 self-start sm:self-center"
            >
              <Plus size={15} />
              <span>Thêm Dịch Vụ Mới</span>
            </button>
          </div>

          {customServices.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
              <p className="text-zinc-500 text-sm">Bạn chưa tạo dịch vụ nào.</p>
              <button
                type="button"
                onClick={() => handleOpenAddModal('LOL')}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors"
              >
                Tạo dịch vụ đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customServices.map((svc) => {
                const gameDef = GAMES_CATALOG.find((g) => g.id.toUpperCase() === svc.gameCode.toUpperCase());
                return (
                  <div
                    key={svc.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      svc.isActive
                        ? 'bg-zinc-950/70 border-white/10 shadow-md hover:border-zinc-700'
                        : 'bg-zinc-950/30 border-dashed border-zinc-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
                          {gameDef?.shortName || svc.gameCode}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleServiceActive(svc.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              svc.isActive
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                            }`}
                          >
                            {svc.isActive ? 'Đang bật' : 'Đã tắt'}
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">{svc.name}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                        {svc.desc || 'Chưa có mô tả chi tiết.'}
                      </p>

                      <div className="bg-zinc-900/80 rounded-lg p-2.5 space-y-1 text-xs border border-white/5 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Mức giá:</span>
                          <span className="font-bold text-emerald-400">
                            {svc.pricingType === 'PER_UNIT'
                              ? `${svc.price.toLocaleString('vi-VN')} đ / ${svc.unitName || 'điểm'}`
                              : `${svc.price.toLocaleString('vi-VN')} đ (Trọn gói)`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Tiền cọc:</span>
                          <span className="font-semibold text-amber-400">
                            {svc.depositPercent}%
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-500">
                        Yêu cầu:{' '}
                        <span className="text-zinc-400">
                          {svc.requiredFields?.length || 0} trường thông tin
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(svc)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
                      >
                        <Edit2 size={13} />
                        <span>Chỉnh sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(svc.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                        title="Xoá dịch vụ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: MÃ KHUYẾN MÃI CỦA BOOSTER */}
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Percent size={18} className="text-purple-400" />
                <span>3. Mã khuyến mãi riêng của Booster</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tạo mã voucher để khách hàng nhập khi thanh toán. Mã sẽ tự động giảm giá cho tất cả dịch vụ của bạn.
              </p>
            </div>

            {/* Toggle Gạt Switch ON / OFF Chuẩn UI/UX */}
            <label className="flex items-center gap-3 cursor-pointer select-none self-start sm:self-auto bg-zinc-950/80 hover:bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 transition-colors">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className={`w-2 h-2 rounded-full transition-all ${
                    coupon.isActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-zinc-600'
                  }`}
                />
                <span className={coupon.isActive ? 'text-emerald-400' : 'text-zinc-400'}>
                  {coupon.isActive ? 'Đang kích hoạt' : 'Đang tắt'}
                </span>
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={coupon.isActive}
                onClick={() => setCoupon({ ...coupon, isActive: !coupon.isActive })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  coupon.isActive
                    ? 'bg-emerald-600 shadow-sm shadow-emerald-600/50'
                    : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    coupon.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl transition-opacity duration-200 ${
              coupon.isActive ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5 uppercase">
                Mã Khuyến Mãi (Code)
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Ví dụ: PRO10, VIP20"
                  value={coupon.code}
                  onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase().trim() })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-mono uppercase focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5 uppercase">
                Phần trăm giảm giá (% KM)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={coupon.discountPercent}
                  onChange={(e) => setCoupon({ ...coupon, discountPercent: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:border-blue-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD/EDIT SERVICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base">
                {editingServiceId ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Game selection */}
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Tựa Game</label>
                <select
                  value={formData.gameCode}
                  onChange={(e) => setFormData({ ...formData, gameCode: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  {GAMES_CATALOG.map((g) => (
                    <option key={g.id} value={g.id.toUpperCase()}>
                      {g.name} ({g.shortName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Name */}
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Tên Dịch Vụ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cày Rank Thần Tốc, Cày Điểm LP Cao Thủ..."
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Pricing Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Cách tính giá</label>
                  <select
                    value={formData.pricingType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricingType: e.target.value as 'PER_UNIT' | 'FIXED',
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="PER_UNIT">Theo điểm / trận (VD: 1.000đ/LP)</option>
                    <option value="FIXED">Giá cố định trọn gói</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">
                    {formData.pricingType === 'PER_UNIT' ? 'Đơn giá (VNĐ / đơn vị)' : 'Giá cố định (VNĐ)'}
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={formData.price || 1000}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {formData.pricingType === 'PER_UNIT' && (
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Tên đơn vị tính</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Điểm LP, Trận thắng, Sao, Cấp..."
                    value={formData.unitName || ''}
                    onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Deposit percent */}
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">
                  % Tiền cọc (Áp dụng cho dịch vụ tính theo điểm hoặc cọc trước)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={formData.depositPercent || 30}
                    onChange={(e) => setFormData({ ...formData, depositPercent: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-bold text-amber-400">
                    {formData.depositPercent}%
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Mô tả dịch vụ</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả quyền lợi, cam kết tốc độ hoặc quy định của dịch vụ..."
                  value={formData.desc || ''}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Required Form Fields */}
              <div>
                <label className="text-zinc-400 font-semibold block mb-1.5">
                  Thông tin yêu cầu khách hàng cung cấp khi đặt đơn
                </label>
                <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                  {[
                    { key: 'current_rank', label: 'Rank hiện tại' },
                    { key: 'desired_rank', label: 'Rank mong muốn' },
                    { key: 'server', label: 'Máy chủ / Server' },
                    { key: 'account_credentials', label: 'Tài khoản & Mật khẩu in-game' },
                    { key: 'riot_id', label: 'Riot ID / In-game Name' },
                    { key: 'extra_options', label: 'Tùy chọn bổ sung (Duo, Tốc độ, VPN)' },
                  ].map((f) => {
                    const checked = formData.requiredFields?.includes(f.key) ?? false;
                    return (
                      <label key={f.key} className="flex items-center gap-2 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const cur = formData.requiredFields || [];
                            const updated = checked
                              ? cur.filter((k) => k !== f.key)
                              : [...cur, f.key];
                            setFormData({ ...formData, requiredFields: updated });
                          }}
                          className="rounded border-zinc-700"
                        />
                        <span>{f.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  {editingServiceId ? 'Cập nhật' : 'Thêm Dịch Vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
