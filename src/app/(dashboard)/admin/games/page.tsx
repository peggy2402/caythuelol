'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Flame,
  Sparkles,
  ThumbsUp,
  Award,
  TrendingUp,
  ExternalLink,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Layers,
  Image as ImageIcon,
  Loader2,
  Cpu,
  BarChart3,
  Sliders,
  Star,
  Users,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  GAMES_CATALOG,
  getStoredGamesCatalog,
  saveStoredGamesCatalog,
  resetStoredGamesCatalog,
  resolveGameBadge,
  type GameDefinition,
  type GameBadge,
  type GameMetrics,
} from '@/lib/games';
import { apiFetch } from '@/lib/api';

const BADGE_OPTIONS: { value: GameBadge | ''; label: string; icon: any; color: string }[] = [
  { value: '', label: 'Không gắn nhãn', icon: null, color: 'text-zinc-400' },
  { value: 'HOT', label: 'HOT (Nhiều đơn + Boosters + Vote cao)', icon: Flame, color: 'text-rose-400' },
  { value: 'Đề xuất', label: 'ĐỀ XUẤT (Chất lượng cao, 5 sao uy tín)', icon: Award, color: 'text-purple-400' },
  { value: 'Xu hướng', label: 'XU HƯỚNG (Nhiều đơn tăng nhanh)', icon: TrendingUp, color: 'text-amber-400' },
  { value: 'Phổ Biến', label: 'PHỔ BIẾN (Khách đặt liên tục)', icon: ThumbsUp, color: 'text-sky-400' },
  { value: 'Mới', label: 'MỚI (Tựa game mới ra mắt)', icon: Sparkles, color: 'text-emerald-400' },
];

export default function AdminGamesManagementPage() {
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [badgeFilter, setBadgeFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameDefinition | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<GameDefinition>>({
    id: '',
    name: '',
    shortName: '',
    desc: '',
    bannerUrl: '',
    banner: '',
    badge: undefined,
    badgeMode: 'AUTO',
    active: true,
    gradient: 'from-blue-600 to-cyan-600',
    accentColor: 'text-blue-400',
    iconName: 'Gamepad2',
    metrics: {
      totalOrders: 10,
      recentOrders: 5,
      activeBoosters: 4,
      averageRating: 4.8,
      totalReviews: 6,
      isNew: false,
    },
  });

  // Tải danh sách game (từ Backend Settings hoặc localStorage)
  useEffect(() => {
    loadGamesCatalog();
  }, []);

  const loadGamesCatalog = async () => {
    setLoading(true);
    try {
      let loadedFromBackend = false;
      try {
        const res = await apiFetch<any>('/admin/settings');
        const settingsList = res?.data || res || [];
        if (Array.isArray(settingsList)) {
          const gameSetting = settingsList.find((s: any) => s.key === 'GAMES_CATALOG_CONFIG');
          if (gameSetting && gameSetting.value) {
            const parsed = typeof gameSetting.value === 'string' ? JSON.parse(gameSetting.value) : gameSetting.value;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setGames(parsed);
              saveStoredGamesCatalog(parsed);
              loadedFromBackend = true;
            }
          }
        }
      } catch {
        // Backend settings endpoint might not have the key yet or offline
      }

      if (!loadedFromBackend) {
        const stored = getStoredGamesCatalog();
        setGames(stored);
      }
    } catch (err) {
      console.error('Lỗi khi tải cấu hình games:', err);
      setGames(GAMES_CATALOG);
    } finally {
      setLoading(false);
    }
  };

  // Lưu cấu hình lên cả Backend và Local
  const handleSaveAll = async (catalogToSave = games) => {
    setSaving(true);
    try {
      saveStoredGamesCatalog(catalogToSave);

      try {
        await apiFetch('/admin/settings', {
          method: 'POST',
          body: JSON.stringify({
            key: 'GAMES_CATALOG_CONFIG',
            value: catalogToSave,
            description: 'Danh mục cấu hình các tựa Game cày thuê được quản lý bởi Staff/Admin',
          }),
        });
      } catch (backendErr) {
        console.warn('Lưu lên backend chưa hoàn tất, đã lưu cache trình duyệt an toàn:', backendErr);
      }

      toast.success('Đã lưu cấu hình tựa game thành công! Khách hàng sẽ thấy thay đổi ngay lập tức.');
    } catch (err: any) {
      toast.error('Có lỗi xảy ra: ' + (err.message || 'Không thể lưu'));
    } finally {
      setSaving(false);
    }
  };

  // Khôi phục mặc định
  const handleResetDefault = () => {
    if (confirm('Bạn có chắc chắn muốn khôi phục danh mục Game về mặc định ban đầu không?')) {
      resetStoredGamesCatalog();
      setGames([...GAMES_CATALOG]);
      handleSaveAll([...GAMES_CATALOG]);
      toast.info('Đã khôi phục danh mục game về mặc định!');
    }
  };

  // Toggle trạng thái Active trực tiếp
  const handleToggleActive = (gameId: string) => {
    const updated = games.map((g) => (g.id === gameId ? { ...g, active: !g.active } : g));
    setGames(updated);
    saveStoredGamesCatalog(updated);
    toast.success('Đã thay đổi trạng thái tựa game');
  };

  // Toggle Chế độ Badge (AUTO <-> MANUAL)
  const handleToggleBadgeMode = (gameId: string) => {
    const updated = games.map((g) => {
      if (g.id !== gameId) return g;
      const nextMode: 'AUTO' | 'MANUAL' = g.badgeMode === 'MANUAL' ? 'AUTO' : 'MANUAL';
      return { ...g, badgeMode: nextMode };
    });
    setGames(updated);
    saveStoredGamesCatalog(updated);
    toast.success('Đã chuyển đổi chế độ gắn nhãn Badge');
  };

  // Thay đổi badge thủ công
  const handleChangeBadge = (gameId: string, newBadge: GameBadge | '') => {
    const updated = games.map((g) =>
      g.id === gameId
        ? {
            ...g,
            badge: newBadge ? newBadge : undefined,
            badgeMode: 'MANUAL' as const, // Khi Staff chọn thủ công, tự động chuyển sang MANUAL
          }
        : g
    );
    setGames(updated);
    saveStoredGamesCatalog(updated);
    toast.success('Đã cập nhật nhãn Badge thủ công');
  };

  // Đổi thứ tự ưu tiên (Di chuyển Lên / Xuống)
  const handleMoveOrder = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= games.length) return;

    const newGames = [...games];
    const temp = newGames[index];
    newGames[index] = newGames[targetIndex];
    newGames[targetIndex] = temp;

    setGames(newGames);
    saveStoredGamesCatalog(newGames);
  };

  // Mở modal Thêm mới
  const handleOpenAdd = () => {
    setEditingGame(null);
    setFormData({
      id: '',
      name: '',
      shortName: '',
      desc: '',
      bannerUrl: '',
      banner: '/images/games/lol-card.jpg',
      badge: undefined,
      badgeMode: 'AUTO',
      active: true,
      gradient: 'from-blue-600 to-cyan-600',
      accentColor: 'text-blue-400',
      iconName: 'Gamepad2',
      metrics: {
        totalOrders: 15,
        recentOrders: 8,
        activeBoosters: 5,
        averageRating: 4.85,
        totalReviews: 10,
        isNew: true,
        createdAt: new Date().toISOString(),
      },
      standardRanks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master'],
      standardServers: [{ code: 'VN', name: 'Việt Nam' }, { code: 'SEA', name: 'Đông Nam Á' }],
      defaultServices: [],
    });
    setIsModalOpen(true);
  };

  // Mở modal Sửa
  const handleOpenEdit = (game: GameDefinition) => {
    setEditingGame(game);
    setFormData({
      ...game,
      badgeMode: game.badgeMode || 'AUTO',
      metrics: game.metrics || {
        totalOrders: 20,
        recentOrders: 8,
        activeBoosters: 6,
        averageRating: 4.8,
        totalReviews: 12,
        isNew: false,
      },
    });
    setIsModalOpen(true);
  };

  // Xóa game khỏi danh mục
  const handleDeleteGame = (gameId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tựa game này khỏi danh mục?')) {
      const updated = games.filter((g) => g.id !== gameId);
      setGames(updated);
      saveStoredGamesCatalog(updated);
      toast.success('Đã xóa game thành công');
    }
  };

  // Submit Modal Form
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.id?.trim()) {
      toast.error('Vui lòng nhập Tên game và Mã Slug!');
      return;
    }

    const cleanId = formData.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    if (editingGame) {
      // Sửa
      const updated = games.map((g) =>
        g.id === editingGame.id
          ? ({
              ...g,
              ...formData,
              id: cleanId,
              shortName: formData.shortName?.trim() || formData.name?.trim().slice(0, 6) || '',
              banner: formData.banner?.trim() || `/images/games/${cleanId}-card.jpg`,
            } as GameDefinition)
          : g
      );
      setGames(updated);
      saveStoredGamesCatalog(updated);
      toast.success(`Đã cập nhật thông tin game ${formData.name}`);
    } else {
      // Thêm mới
      if (games.some((g) => g.id.toLowerCase() === cleanId)) {
        toast.error(`Mã slug "${cleanId}" đã tồn tại! Vui lòng chọn slug khác.`);
        return;
      }
      const newGame: GameDefinition = {
        id: cleanId,
        name: formData.name.trim(),
        shortName: formData.shortName?.trim() || formData.name.trim().slice(0, 6),
        desc: formData.desc?.trim() || `Dịch vụ cày thuê và nâng bậc xếp hạng ${formData.name}`,
        iconName: formData.iconName || 'Gamepad2',
        gradient: formData.gradient || 'from-cyan-600 to-blue-600',
        accentColor: formData.accentColor || 'text-cyan-400',
        banner: formData.banner?.trim() || `/images/games/${cleanId}-card.jpg`,
        bannerUrl: formData.bannerUrl?.trim() || undefined,
        badge: formData.badge || undefined,
        badgeMode: formData.badgeMode || 'AUTO',
        metrics: formData.metrics,
        active: formData.active ?? true,
        standardRanks: formData.standardRanks || ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
        standardServers: formData.standardServers || [{ code: 'VN', name: 'Việt Nam' }],
        defaultServices: formData.defaultServices || [],
      };
      const updated = [newGame, ...games];
      setGames(updated);
      saveStoredGamesCatalog(updated);
      toast.success(`Đã thêm tựa game mới: ${newGame.name}`);
    }

    setIsModalOpen(false);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = games.length;
    const active = games.filter((g) => g.active !== false).length;
    const inactive = total - active;
    const badged = games.filter((g) => {
      const res = resolveGameBadge(g);
      return Boolean(res.badge);
    }).length;
    return { total, active, inactive, badged };
  }, [games]);

  // Danh sách sau khi lọc & tìm kiếm
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.shortName.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'ACTIVE' && g.active === false) return false;
      if (statusFilter === 'INACTIVE' && g.active !== false) return false;

      if (badgeFilter !== 'ALL') {
        const res = resolveGameBadge(g);
        if (badgeFilter === 'NONE' && res.badge) return false;
        if (badgeFilter !== 'NONE' && res.badge !== badgeFilter) return false;
      }

      return true;
    });
  }, [games, searchTerm, statusFilter, badgeFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <p className="text-zinc-400 text-sm">Đang tải cấu hình game...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Cấu Hình Tựa Game (Game Catalog)
            </h1>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Quản lý tựa game và cơ chế tính nhãn <span className="text-cyan-300 font-semibold">Badge Tự Động</span> dựa trên
            số liệu thực tế (Nhiều đơn, Nhiều Booster, Tỉ lệ vote cao...) phản ánh chân thực chất lượng dịch vụ LEORANK.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-xs font-semibold shadow-sm"
            title="Khôi phục danh mục gốc"
          >
            <RotateCcw className="w-4 h-4 text-zinc-400" />
            <span>Mặc Định</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-black transition text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Game</span>
          </button>

          <button
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition text-xs font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Đang lưu...' : 'Lưu Hệ Thống'}</span>
          </button>
        </div>
      </div>

      {/* 2. Mechanism Explainer Alert Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-zinc-900/40 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-300">
        <div className="flex items-start gap-2.5">
          <Cpu className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-cyan-300 uppercase tracking-wide">
              Thuật toán tính toán Badge tự động dựa trên số liệu thực tế:
            </span>
            <p className="text-zinc-400 leading-relaxed">
              <strong className="text-rose-400">HOT</strong> (Đơn nhiều + Boosters đông + Vote 5 sao) •{' '}
              <strong className="text-amber-400">Xu hướng</strong> (Đơn tăng mạnh) •{' '}
              <strong className="text-purple-400">Đề xuất</strong> (Chất lượng cao, đánh giá uy tín) •{' '}
              <strong className="text-sky-400">Phổ biến</strong> (Khách đặt liên tục) •{' '}
              <strong className="text-emerald-400">Mới</strong> (Game mới ra mắt).
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 self-end sm:self-center text-[11px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
          Chế độ: Ưu tiên Tự Động (Auto-Calculated)
        </div>
      </div>

      {/* 3. Quick Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 shadow-md">
          <p className="text-xs font-medium text-zinc-400">Tổng Số Game</p>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 shadow-md">
          <p className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang Hoạt Động
          </p>
          <p className="text-2xl font-black text-white mt-1">{stats.active}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 shadow-md">
          <p className="text-xs font-medium text-zinc-400">Tạm Ẩn</p>
          <p className="text-2xl font-black text-zinc-400 mt-1">{stats.inactive}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-zinc-800/80 shadow-md">
          <p className="text-xs font-medium text-rose-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            Được Gắn Badge
          </p>
          <p className="text-2xl font-black text-white mt-1">{stats.badged}</p>
        </div>
      </div>

      {/* 4. Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0c0e14] border border-zinc-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo tên game, tên viết tắt (LMHT, CS2), slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Lọc Trạng thái */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã tạm ẩn</option>
          </select>

          {/* Lọc Badge */}
          <select
            value={badgeFilter}
            onChange={(e) => setBadgeFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tất cả nhãn Badge</option>
            <option value="NONE">Không có nhãn</option>
            <option value="HOT">HOT</option>
            <option value="Đề xuất">Đề xuất</option>
            <option value="Xu hướng">Xu hướng</option>
            <option value="Phổ Biến">Phổ Biến</option>
            <option value="Mới">Mới</option>
          </select>
        </div>
      </div>

      {/* 5. Games Table */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0c0e14] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/70 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-36 text-center">Thứ Tự (Ưu Tiên)</th>
                <th className="py-3.5 px-4 w-64">Tựa Game</th>
                <th className="py-3.5 px-4 w-60">Nhãn Badge & Số Liệu</th>
                <th className="py-3.5 px-4">Ảnh Banner (URL / Local)</th>
                <th className="py-3.5 px-4 w-32 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 w-28 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Không tìm thấy tựa game nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredGames.map((game, idx) => {
                  const resolved = resolveGameBadge(game);
                  const isAuto = game.badgeMode !== 'MANUAL';
                  const m = game.metrics;

                  return (
                    <tr
                      key={game.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Cột Thứ tự: Button to rõ ràng, dày dặn, dễ bấm */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 p-1 rounded-xl bg-zinc-950/70 border border-zinc-800/80 shadow-inner">
                          {/* Nút Lên: To, dày dặn */}
                          <button
                            onClick={() => handleMoveOrder(idx, 'UP')}
                            disabled={idx === 0}
                            className="w-8 h-8 rounded-lg bg-zinc-800/90 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center text-zinc-300 border border-zinc-700/80 shadow-sm"
                            title="Di chuyển lên trước"
                          >
                            <ArrowUp size={15} className="stroke-[2.5]" />
                          </button>

                          {/* Số thứ tự */}
                          <span className="w-8 text-center text-xs font-mono font-black text-cyan-400">
                            #{idx + 1}
                          </span>

                          {/* Nút Xuống: To, dày dặn */}
                          <button
                            onClick={() => handleMoveOrder(idx, 'DOWN')}
                            disabled={idx === filteredGames.length - 1}
                            className="w-8 h-8 rounded-lg bg-zinc-800/90 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center text-zinc-300 border border-zinc-700/80 shadow-sm"
                            title="Di chuyển xuống sau"
                          >
                            <ArrowDown size={15} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </td>

                      {/* Cột Tên & Tag */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 relative overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                            {game.bannerUrl || game.banner ? (
                              <Image
                                src={game.bannerUrl || game.banner}
                                alt={game.name}
                                fill
                                unoptimized
                                className="object-cover"
                                onError={(e) => {
                                  (e.target as any).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Gamepad2 className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white truncate text-sm">
                                {game.name}
                              </h3>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-cyan-300 font-bold border border-zinc-700">
                                {game.shortName}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                              slug: <span className="text-zinc-400">{game.id}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cột Nhãn Badge & Cơ chế tính toán */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            {resolved.badge ? (
                              <span
                                title={resolved.reason}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                                  resolved.badge === 'HOT'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20'
                                    : resolved.badge === 'Đề xuất'
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/20'
                                    : resolved.badge === 'Xu hướng'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20'
                                    : resolved.badge === 'Phổ Biến'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sky-500/20'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20'
                                }`}
                              >
                                {resolved.badge}
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-xs italic">Không nhãn</span>
                            )}

                            {/* Nút Toggle Chế độ Tự Động / Thủ Công */}
                            <button
                              onClick={() => handleToggleBadgeMode(game.id)}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition ${
                                isAuto
                                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                              title={
                                isAuto
                                  ? 'Đang tính toán tự động theo số liệu. Bấm để gán thủ công.'
                                  : 'Đang gán thủ công. Bấm để bật tính tự động.'
                              }
                            >
                              {isAuto ? '⚡ Auto' : '⚙️ Manual'}
                            </button>
                          </div>

                          {/* Dòng tóm tắt căn cứ số liệu thực tế */}
                          <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 flex-wrap">
                            {m ? (
                              <>
                                <span title="Tổng số đơn cày">{m.totalOrders} đơn</span>
                                <span>•</span>
                                <span title="Số Booster nhận cày">{m.activeBoosters} boosters</span>
                                <span>•</span>
                                <span title="Điểm vote trung bình" className="text-amber-400 font-semibold">
                                  {m.averageRating.toFixed(1)}★ ({m.totalReviews})
                                </span>
                              </>
                            ) : (
                              <span className="italic text-zinc-500">Chưa có số liệu metrics</span>
                            )}
                          </p>

                          {/* Nếu đang ở chế độ Manual, cho chọn nhãn override */}
                          {!isAuto && (
                            <select
                              value={game.badge || ''}
                              onChange={(e) =>
                                handleChangeBadge(game.id, e.target.value as GameBadge | '')
                              }
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                            >
                              {BADGE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-zinc-950">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Cột Banner Info */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 max-w-md">
                          {game.bannerUrl ? (
                            <div className="flex items-center gap-1.5 text-xs text-cyan-400 truncate">
                              <ExternalLink size={12} className="flex-shrink-0" />
                              <span className="truncate font-mono text-[11px]">{game.bannerUrl}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-zinc-500 italic">
                              Chưa cấu hình URL online
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-500 font-mono truncate">
                            Fallback: {game.banner}
                          </div>
                        </div>
                      </td>

                      {/* Cột Trạng thái */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(game.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition shadow-sm ${
                            game.active !== false
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                          }`}
                        >
                          {game.active !== false ? (
                            <>
                              <Eye size={12} />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} />
                              <span>Tạm ẩn</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Cột Thao tác */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(game)}
                            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition shadow-sm"
                            title="Chỉnh sửa thông tin & số liệu"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteGame(game.id)}
                            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition shadow-sm"
                            title="Xóa game"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal Thêm / Chỉnh Sửa Game & Số Liệu Tính Badge */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0c0e14] border border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
                {editingGame ? `Chỉnh Sửa: ${editingGame.name}` : 'Thêm Tựa Game Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleModalSubmit} className="p-6 overflow-y-auto space-y-5">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Tên Game <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. League of Legends"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Mã Định Danh (Slug) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g. lol, cs2, valorant"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Tên Viết Tắt (ShortName / Tag)
                  </label>
                  <input
                    type="text"
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="e.g. LMHT, CS2, VAL"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Chế Độ Gắn Nhãn (Badge Mode)
                  </label>
                  <select
                    value={formData.badgeMode || 'AUTO'}
                    onChange={(e: any) => setFormData({ ...formData, badgeMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="AUTO">⚡ Tự động tính theo Số Liệu Vận Hành</option>
                    <option value="MANUAL">⚙️ Gán thủ công (Chỉ định cứng)</option>
                  </select>
                </div>
              </div>

              {/* Phần số liệu thống kê để tính nhãn tự động */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-cyan-400" />
                    Số Liệu Vận Hành Nền Tảng (Dùng để tính Badge)
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Đơn vị: thời gian thực</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Tổng số đơn cày:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.metrics?.totalOrders ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metrics: {
                            ...formData.metrics!,
                            totalOrders: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Đơn mới gần đây (7-30 ngày):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.metrics?.recentOrders ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metrics: {
                            ...formData.metrics!,
                            recentOrders: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Boosters hoạt động:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.metrics?.activeBoosters ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metrics: {
                            ...formData.metrics!,
                            activeBoosters: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Điểm vote trung bình (1-5★):
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min={1}
                      max={5}
                      value={formData.metrics?.averageRating ?? 4.8}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metrics: {
                            ...formData.metrics!,
                            averageRating: parseFloat(e.target.value) || 4.8,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono text-amber-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Tổng lượt đánh giá:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.metrics?.totalReviews ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metrics: {
                            ...formData.metrics!,
                            totalReviews: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                      <input
                        type="checkbox"
                        checked={formData.metrics?.isNew ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metrics: {
                              ...formData.metrics!,
                              isNew: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded text-cyan-500 bg-zinc-900 border-zinc-700"
                      />
                      <span>Đánh dấu Game Mới</span>
                    </label>
                  </div>
                </div>

                {/* Kết quả tính thử badge ngay trong modal */}
                <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Kết quả xếp nhãn dự kiến:</span>
                  <div className="font-bold text-cyan-300">
                    {(() => {
                      const mockGame = { ...formData, active: true } as GameDefinition;
                      const res = resolveGameBadge(mockGame);
                      return res.badge ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px]">
                          {res.badge} ({res.reason})
                        </span>
                      ) : (
                        <span className="text-zinc-500">Chưa đạt ngưỡng nhãn</span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* URL Banner Online */}
              <div>
                <label className="block text-xs font-semibold text-cyan-300 mb-1 flex items-center justify-between">
                  <span>URL Ảnh Banner Trực Tuyến (Online CDN / Imgur / Cloudinary...)</span>
                  <span className="text-[11px] text-zinc-500 font-normal">Ưu tiên tải trước</span>
                </label>
                <input
                  type="url"
                  value={formData.bannerUrl || ''}
                  onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... hoặc link ảnh cdn"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-cyan-500/40 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Đường dẫn fallback local */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Đường Dẫn Fallback Local (Trong public/images/games/...)</span>
                  <span className="text-[11px] text-zinc-500 font-normal">Dùng khi mất mạng / link hỏng</span>
                </label>
                <input
                  type="text"
                  value={formData.banner || ''}
                  onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                  placeholder="/images/games/lol-card.jpg"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Live Preview Banner */}
              {(formData.bannerUrl || formData.banner) && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-cyan-400" />
                    Xem trước Ảnh Banner:
                  </p>
                  <div className="relative w-full h-28 rounded-lg overflow-hidden bg-zinc-900">
                    <Image
                      src={formData.bannerUrl || formData.banner || ''}
                      alt="Preview"
                      fill
                      unoptimized
                      className="object-cover"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                      {formData.shortName || formData.name || 'Preview'}
                    </div>
                  </div>
                </div>
              )}

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Mô Tả Ngắn Dịch Vụ
                </label>
                <textarea
                  rows={2}
                  value={formData.desc || ''}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  placeholder="Dịch vụ leo rank, cày chuỗi thắng..."
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Checkbox Active */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeGameCheck"
                  checked={formData.active !== false}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                />
                <label htmlFor="activeGameCheck" className="text-sm font-semibold text-zinc-200">
                  Kích hoạt hiển thị trên Sàn Dịch Vụ ngay bây giờ
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition text-sm font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-md hover:opacity-90 transition"
                >
                  {editingGame ? 'Cập Nhật Thay Đổi' : 'Thêm Tựa Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
