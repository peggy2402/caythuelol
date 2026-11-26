'use client';
import BarLoader from '@/components/ui/BarLoader';

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
  LayoutGrid,
  List,
  CheckCircle2,
  ShieldCheck,
  FolderOpen,
  Globe,
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
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD');

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
      totalOrders: 0,
      recentOrders: 0,
      activeBoosters: 0,
      averageRating: 0,
      totalReviews: 0,
      isNew: false,
    },
  });

  // Hợp nhất metrics thông minh từ Backend Database thực tế
  const enrichGamesWithMetrics = (
    list: GameDefinition[],
    realMetricsMap: Record<string, any> = {},
  ): GameDefinition[] => {
    return list.map((g) => {
      const original = GAMES_CATALOG.find((cat) => cat.id.toLowerCase() === g.id.toLowerCase());

      // Lấy chỉ số thực tế từ Database theo id, shortName hoặc code
      const keysToTry = [g.id, g.shortName, (g as any).code]
        .filter(Boolean)
        .map((k) => String(k).toUpperCase());
      const dbKey = keysToTry.find((k) => realMetricsMap[k] !== undefined);
      const dbMetrics = dbKey ? realMetricsMap[dbKey] : null;

      // Xóa bỏ hoàn toàn mock data cũ (như 18 đơn, 7 mới) nếu có trong cache localStorage
      const prevTotal = g.metrics?.totalOrders;
      const isOldMockData = prevTotal === 18 && g.metrics?.recentOrders === 7;

      const metrics: GameMetrics = {
        totalOrders: dbMetrics?.totalOrders ?? (isOldMockData ? 0 : g.metrics?.totalOrders || 0),
        recentOrders: dbMetrics?.recentOrders ?? (isOldMockData ? 0 : g.metrics?.recentOrders || 0),
        activeBoosters: dbMetrics?.activeBoosters ?? (isOldMockData ? 0 : g.metrics?.activeBoosters || 0),
        averageRating: dbMetrics?.averageRating ?? (isOldMockData ? 0 : g.metrics?.averageRating || 0),
        totalReviews: dbMetrics?.totalReviews ?? (isOldMockData ? 0 : g.metrics?.totalReviews || 0),
        isNew: g.metrics?.isNew ?? false,
      };

      return {
        ...g,
        badgeMode: g.badgeMode || 'AUTO',
        metrics,
        banner: g.banner || original?.banner || `/images/games/${g.id}-card.jpg`,
        bannerUrl: g.bannerUrl || original?.bannerUrl,
      };
    });
  };

  // Tải danh sách game (từ Backend Settings, Database Metrics hoặc localStorage)
  useEffect(() => {
    loadGamesCatalog();
  }, []);

  const loadGamesCatalog = async () => {
    setLoading(true);
    try {
      let loadedList: GameDefinition[] | null = null;
      let realMetricsMap: Record<string, any> = {};

      // 1. Tải chỉ số thống kê thực tế từ DB (Order, Reviews, Boosters)
      try {
        const metricsRes = await apiFetch<any>('/admin/games-metrics');
        if (metricsRes && typeof metricsRes === 'object') {
          realMetricsMap = metricsRes.data || metricsRes;
        }
      } catch {
        // Backend offline / not configured
      }

      // 2. Tải danh mục cấu hình games
      try {
        const res = await apiFetch<any>('/admin/settings');
        const settingsList = res?.data || res || [];
        if (Array.isArray(settingsList)) {
          const gameSetting = settingsList.find((s: any) => s.key === 'GAMES_CATALOG_CONFIG');
          if (gameSetting && gameSetting.value) {
            const parsed = typeof gameSetting.value === 'string' ? JSON.parse(gameSetting.value) : gameSetting.value;
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedList = parsed;
            }
          }
        }
      } catch {
        // Fallback offline / not configured
      }

      if (!loadedList) {
        loadedList = getStoredGamesCatalog();
      }

      const enriched = enrichGamesWithMetrics(loadedList, realMetricsMap);
      setGames(enriched);
      saveStoredGamesCatalog(enriched);
    } catch (err) {
      console.error('Lỗi khi tải cấu hình games:', err);
      const fallback = enrichGamesWithMetrics(GAMES_CATALOG);
      setGames(fallback);
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
      const resetList = enrichGamesWithMetrics(GAMES_CATALOG);
      setGames(resetList);
      handleSaveAll(resetList);
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
          badgeMode: 'MANUAL' as const,
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
        totalOrders: 0,
        recentOrders: 0,
        activeBoosters: 0,
        averageRating: 0,
        totalReviews: 0,
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
        totalOrders: 0,
        recentOrders: 0,
        activeBoosters: 0,
        averageRating: 0,
        totalReviews: 0,
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
    return <BarLoader className="min-h-[60vh]" label="Đang tải cấu hình game..." />;
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Cấu Hình Tựa Game (Game Catalog)
            </h1>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Quản lý tựa game theo định dạng <span className="text-cyan-300 font-semibold">Card List Cyber Esports</span> trực quan,
            tự động xếp nhãn Badge theo số liệu thực tế (HOT, Xu hướng, Đề xuất, Phổ biến, Mới) và tinh chỉnh thứ tự hiển thị linh hoạt.
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
            <span>Thêm Game Mới</span>
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
              Hệ thống xếp nhãn Badge tự động theo chất lượng thực tế:
            </span>
            <p className="text-zinc-400 leading-relaxed">
              <strong className="text-rose-400">HOT</strong> (Đơn nhiều + Boosters đông + Vote 5 sao) •{' '}
              <strong className="text-purple-400">Đề xuất</strong> (Chất lượng 5 sao uy tín) •{' '}
              <strong className="text-amber-400">Xu hướng</strong> (Đơn tăng nhanh) •{' '}
              <strong className="text-sky-400">Phổ biến</strong> (Khách đặt liên tục) •{' '}
              <strong className="text-emerald-400">Mới</strong> (Game mới ra mắt).
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 self-end sm:self-center text-[11px] font-mono text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
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

      {/* 4. Filter & Search Toolbar with View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0c0e14] border border-zinc-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo tên game, mã viết tắt (LMHT, CS2), slug..."
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

          {/* Nút chuyển đổi View: Card List vs Compact Table */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setViewMode('CARD')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'CARD'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
                }`}
              title="Dạng Card List Cao Cấp"
            >
              <LayoutGrid size={14} />
              <span>Card List</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'TABLE'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
                }`}
              title="Dạng Bảng Truyền Thống"
            >
              <List size={14} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Content: CARD LIST VIEW (MẶC ĐỊNH & CAO CẤP) */}
      {viewMode === 'CARD' ? (
        <div className="space-y-3.5">
          {filteredGames.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-[#0c0e14] rounded-2xl border border-zinc-800">
              <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              Không tìm thấy tựa game nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredGames.map((game, idx) => {
              const resolved = resolveGameBadge(game);
              const isAuto = game.badgeMode !== 'MANUAL';
              const m = game.metrics;

              return (
                <div
                  key={game.id}
                  className="group relative rounded-2xl bg-[#0c0e14] border border-zinc-800/80 hover:border-cyan-500/50 p-4 sm:p-5 transition-all duration-300 shadow-lg overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Background Artwork Ambient (Fades on Right Side) */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 overflow-hidden pointer-events-none opacity-15 group-hover:opacity-30 transition-opacity">
                    {game.bannerUrl || game.banner ? (
                      <Image
                        src={game.bannerUrl || game.banner}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover object-right"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e14] via-[#0c0e14]/70 to-transparent" />
                  </div>

                  {/* Left Block: Thứ tự điều hướng + Ảnh đại diện + Tên Game */}
                  <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-[280px]">
                    {/* Bảng Nút Thứ Tự to bản & dễ bấm */}
                    <div className="flex flex-col items-center gap-1 p-1 rounded-xl bg-zinc-950/80 border border-zinc-800/80 shrink-0">
                      <button
                        onClick={() => handleMoveOrder(idx, 'UP')}
                        disabled={idx === 0}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 active:scale-90 transition-all flex items-center justify-center text-zinc-300 disabled:opacity-20 disabled:pointer-events-none shadow-sm"
                        title="Di chuyển lên trước"
                      >
                        <ArrowUp size={14} className="stroke-[2.5]" />
                      </button>

                      <span className="text-[11px] font-mono font-black text-cyan-400 px-1">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>

                      <button
                        onClick={() => handleMoveOrder(idx, 'DOWN')}
                        disabled={idx === filteredGames.length - 1}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 active:scale-90 transition-all flex items-center justify-center text-zinc-300 disabled:opacity-20 disabled:pointer-events-none shadow-sm"
                        title="Di chuyển xuống sau"
                      >
                        <ArrowDown size={14} className="stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Thumbnail Artwork Game */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden relative shrink-0 shadow-inner flex items-center justify-center">
                      {game.bannerUrl || game.banner ? (
                        <Image
                          src={game.bannerUrl || game.banner}
                          alt={game.name}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Gamepad2 className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>

                    {/* Tên Game & Tag */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                          {game.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono font-black text-cyan-300 tracking-wider">
                          {game.shortName}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        slug: <span className="text-zinc-300">{game.id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Center Block: Badge & Chỉ Số Thực Tế (Metrics) */}
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1 lg:max-w-xl">
                    {/* Badge & Chế độ Auto/Manual */}
                    <div className="space-y-1.5 shrink-0">
                      <div className="flex items-center gap-2">
                        {resolved.badge ? (
                          <span
                            title={resolved.reason}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-md ${resolved.badge === 'HOT'
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
                          <span className="text-xs text-zinc-500 italic">Không gắn nhãn</span>
                        )}

                        <button
                          onClick={() => handleToggleBadgeMode(game.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${isAuto
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          title={
                            isAuto
                              ? 'Đang tính toán tự động theo số liệu. Bấm để chuyển sang gán thủ công.'
                              : 'Đang gán thủ công. Bấm để bật tính tự động.'
                          }
                        >
                          {isAuto ? '⚡ Auto' : '⚙️ Manual'}
                        </button>
                      </div>

                      {/* Dropdown chỉnh nhãn nếu ở chế độ Manual */}
                      {!isAuto && (
                        <select
                          value={game.badge || ''}
                          onChange={(e) =>
                            handleChangeBadge(game.id, e.target.value as GameBadge | '')
                          }
                          className="w-36 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                        >
                          {BADGE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-zinc-950">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Các Chips Thống Kê Số Liệu Thực Tế */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className="px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Tổng đơn</span>
                        <span className="font-bold text-white text-xs">{m?.totalOrders || 0} đơn</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Đơn gần đây</span>
                        <span className="font-bold text-cyan-300 text-xs">
                          {m?.recentOrders && m.recentOrders > 0 ? `+${m.recentOrders} mới` : '0 mới'}
                        </span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Đánh giá</span>
                        {m?.totalReviews && m.totalReviews > 0 ? (
                          <span className="font-bold text-amber-400 text-xs flex items-center gap-0.5">
                            <Star size={11} className="fill-amber-400" />
                            {(m.averageRating || 0).toFixed(1)}★ ({m.totalReviews})
                          </span>
                        ) : (
                          <span className="font-semibold text-zinc-500 text-xs">Chưa có</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Block: Trạng thái & Thao tác */}
                  <div className="relative z-10 flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800/60">
                    {/* Nút Trạng thái Active */}
                    <button
                      onClick={() => handleToggleActive(game.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-sm ${game.active !== false
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                        }`}
                    >
                      {game.active !== false ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Đang Hiển Thị</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={13} />
                          <span>Tạm Ẩn</span>
                        </>
                      )}
                    </button>

                    {/* Nút Sửa & Xóa */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(game)}
                        className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition shadow-sm"
                        title="Chỉnh sửa thông tin & số liệu"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition shadow-sm"
                        title="Xóa game"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TABLE VIEW PHỤ TRỢ (Nếu muốn tra cứu nhanh) */
        <div className="rounded-2xl border border-zinc-800/80 bg-[#0c0e14] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/70 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-36 text-center">Thứ Tự</th>
                  <th className="py-3.5 px-4 w-64">Tựa Game</th>
                  <th className="py-3.5 px-4 w-60">Nhãn Badge</th>
                  <th className="py-3.5 px-4">Ảnh Banner</th>
                  <th className="py-3.5 px-4 w-32 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 w-28 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredGames.map((game, idx) => {
                  const resolved = resolveGameBadge(game);
                  return (
                    <tr key={game.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleMoveOrder(idx, 'UP')}
                            disabled={idx === 0}
                            className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-cyan-400 disabled:opacity-20"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <span className="font-mono text-xs font-bold text-cyan-400 px-1">
                            #{idx + 1}
                          </span>
                          <button
                            onClick={() => handleMoveOrder(idx, 'DOWN')}
                            disabled={idx === filteredGames.length - 1}
                            className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-cyan-400 disabled:opacity-20"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{game.name}</div>
                        <div className="text-xs text-zinc-500 font-mono">{game.shortName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-cyan-300">
                          {resolved.badge || 'Không nhãn'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-zinc-400 truncate max-w-xs">
                        {game.bannerUrl || game.banner}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${game.active !== false
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-400'
                            }`}
                        >
                          {game.active !== false ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(game)}
                          className="p-1.5 text-zinc-400 hover:text-cyan-300"
                        >
                          <Edit size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Modal Thêm / Chỉnh Sửa Game & Số Liệu Tính Badge */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl rounded-3xl bg-[#0e1017] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden max-h-[92vh] flex flex-col">
              {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/90 shrink-0">
                    <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5">
                      <Gamepad2 className="w-5 h-5 text-cyan-400" />
                      {editingGame ? `Chỉnh Sửa: ${editingGame.name}` : 'Thêm Tựa Game Mới'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Body */}
                    <form onSubmit={handleModalSubmit} className="p-6 overflow-y-auto custom-dark-scrollbar space-y-5 flex-1">
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
                              Điểm vote trung bình (0-5★):
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min={0}
                              max={5}
                              value={formData.metrics?.averageRating ?? 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  metrics: {
                                    ...formData.metrics!,
                                    averageRating: parseFloat(e.target.value) || 0,
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
