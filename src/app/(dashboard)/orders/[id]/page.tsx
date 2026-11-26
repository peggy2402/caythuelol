// src/app/(dashboard)/orders/[id]/page.tsx
'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { socket } from '@/lib/socket';
import {
  Loader2,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import ChatWindow from '@/components/chat/ChatWindow';
import SettlementModal from '@/components/orders/SettlementModal';
import RatingModal from '@/components/orders/RatingModal';
import ServerSelectModal from '@/components/ServerSelectModal';
import { getOrderStatusInfo } from '@/lib/orderStatus';
import { formatRankDisplayVi, getLolQueueName } from '@/lib/riotRanks';

// Extracted Sub-components and Helpers
import {
  getGameMeta,
  formatServiceName,
  sanitizeMatchDetailClient,
  formatBoosterServiceLabel,
} from './components/orderHelpers';
import CancelOrderModal from './components/CancelOrderModal';
import EditAccountModal from './components/EditAccountModal';
import StatusConfirmModal from './components/StatusConfirmModal';
import DeleteMatchModal from './components/DeleteMatchModal';
import BatchMatchModal from './components/BatchMatchModal';
import DisputeModal from './components/DisputeModal';
import MatchFormModal from './components/MatchFormModal';
import MatchDetailModal from './components/MatchDetailModal';
import OrderDisputeBanner from './components/OrderDisputeBanner';
import OrderBoosterCard from './components/OrderBoosterCard';
import OrderAccountCard from './components/OrderAccountCard';
import OrderServiceCard from './components/OrderServiceCard';
import OrderPaymentCard from './components/OrderPaymentCard';
import OrderMatchHistoryList from './components/OrderMatchHistoryList';
import { OrderGameProgressCard } from './components/OrderGameProgressCard';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [boosterProfile, setBoosterProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [dDragonVersion, setDDragonVersion] = useState('16.5.1'); // Phiên bản dự phòng

  // Countdown Timer cho thời hạn Khiếu nại 24h
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatDisputeCountdown = (ms: number) => {
    if (ms <= 0) return 'Đã hết hạn khiếu nại';
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `Còn ${h} giờ ${m} phút`;
    }
    if (m > 0) {
      return `Còn ${m} phút ${s} giây`;
    }
    return `Còn ${s} giây`;
  };

  // UI States
  const [activeTab, setActiveTab] = useState<'INFO' | 'PROGRESS'>('INFO');

  // State đóng/mở từng game trong thẻ "Hồ sơ Game & Dịch vụ cung cấp"
  const [collapsedGames, setCollapsedGames] = useState<Record<string, boolean>>({});
  const toggleGameCollapse = (gameCode: string) => {
    setCollapsedGames((prev) => ({
      ...prev,
      [gameCode]: !prev[gameCode],
    }));
  };

  // Tổng hợp danh sách Game và Dịch vụ cung cấp tương ứng của Tuyển thủ
  const boosterGamesWithServices = useMemo(() => {
    if (!order?.boosterId && !boosterProfile) return [];

    const profileGames = Array.isArray(boosterProfile?.games) ? boosterProfile.games : [];
    const selectedGames = Array.isArray(order?.boosterId?.booster_info?.service_settings?.selectedGames)
      ? order.boosterId.booster_info.service_settings.selectedGames
      : [];
    const customServices = Array.isArray(order?.boosterId?.booster_info?.service_settings?.customServices)
      ? order.boosterId.booster_info.service_settings.customServices
      : [];

    const rawFlatServices = [
      ...(Array.isArray(boosterProfile?.services) ? boosterProfile.services : []),
      ...(Array.isArray(order?.boosterId?.booster_info?.services) ? order.boosterId.booster_info.services : []),
      ...(Array.isArray(order?.boosterId?.booster_info?.service_settings?.enabledServices)
        ? order.boosterId.booster_info.service_settings.enabledServices
        : []),
    ];

    const gameCodesMap = new Map<
      string,
      {
        gameCode: string;
        servers: string[];
        ranks?: string[];
        roles?: string[];
        champions?: string[];
        services: Array<{ slug: string; name: string }>;
      }
    >();

    // 1. Nạp từ profileGames
    profileGames.forEach((g: any) => {
      const code = (g.gameCode || 'LOL').toUpperCase();
      if (!gameCodesMap.has(code)) {
        gameCodesMap.set(code, {
          gameCode: code,
          servers: Array.isArray(g.servers) && g.servers.length > 0 ? g.servers : ['VN'],
          ranks: g.ranks,
          roles: g.roles,
          champions: g.champions,
          services: [],
        });
      }
    });

    // 2. Nạp thêm từ selectedGames nếu chưa có
    selectedGames.forEach((g: string) => {
      const code = (g || '').toUpperCase();
      if (code && !gameCodesMap.has(code)) {
        gameCodesMap.set(code, {
          gameCode: code,
          servers: order?.boosterId?.booster_info?.service_settings?.servers || ['VN'],
          services: [],
        });
      }
    });

    // 3. Nạp thêm từ customServices nếu chưa có
    customServices.forEach((cs: any) => {
      const code = (cs.gameCode || cs.game || '').toUpperCase();
      if (code && !gameCodesMap.has(code)) {
        gameCodesMap.set(code, {
          gameCode: code,
          servers: ['VN'],
          services: [],
        });
      }
    });

    // 4. Nếu danh sách game trống, fallback theo game của đơn hàng hiện tại
    if (gameCodesMap.size === 0) {
      const defaultGame = (
        order?.snapshot?.gameCode ||
        order?.details?.game ||
        order?.details?.gameCode ||
        'LOL'
      ).toUpperCase();
      gameCodesMap.set(defaultGame, {
        gameCode: defaultGame,
        servers: ['VN'],
        services: [],
      });
    }

    // 5. Gắn danh sách dịch vụ chi tiết cho từng game
    for (const [code, gameEntry] of gameCodesMap.entries()) {
      const serviceList: Array<{ slug: string; name: string }> = [];
      const addedLabels = new Set<string>();

      // Lấy customServices thuộc game này
      const activeCustom = customServices.filter(
        (cs: any) => cs.isActive !== false && (cs.gameCode || cs.game || '').toUpperCase() === code
      );

      if (activeCustom.length > 0) {
        activeCustom.forEach((cs: any) => {
          const slug = cs.slug || cs.id;
          const label = formatBoosterServiceLabel(code, slug, cs.name);
          if (!addedLabels.has(label)) {
            addedLabels.add(label);
            serviceList.push({ slug, name: label });
          }
        });
      }

      // Nếu chưa có customServices riêng của game này, phân bổ từ flatServices
      if (serviceList.length === 0 && rawFlatServices.length > 0) {
        rawFlatServices.forEach((s: string) => {
          const cleanSlug = s.trim().toLowerCase();
          const label = formatBoosterServiceLabel(code, cleanSlug);
          if (!addedLabels.has(label)) {
            addedLabels.add(label);
            serviceList.push({ slug: cleanSlug, name: label });
          }
        });
      }

      // Nếu vẫn trống, fallback các dịch vụ cơ bản của game này
      if (serviceList.length === 0) {
        const defaultSlugs =
          code === 'VALORANT' ? ['rank-boost', 'placements'] : ['rank-boost', 'net-wins', 'matches'];
        defaultSlugs.forEach((slug) => {
          const label = formatBoosterServiceLabel(code, slug);
          if (!addedLabels.has(label)) {
            addedLabels.add(label);
            serviceList.push({ slug, name: label });
          }
        });
      }

      gameEntry.services = serviceList;
    }

    return Array.from(gameCodesMap.values());
  }, [order, boosterProfile]);

  // Lắng nghe sự kiện chuyển Tab từ Chat hoặc thẻ báo cáo tiến độ
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      const target = e?.detail || 'PROGRESS';
      if (target === 'PROGRESS' || target === 'INFO') {
        setActiveTab(target);
      }
    };
    window.addEventListener('switch-order-tab', handleSwitchTab);
    return () => window.removeEventListener('switch-order-tab', handleSwitchTab);
  }, []);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [ingameName, setIngameName] = useState('');

  // Cancel Order Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Edit Account Modal State
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [editAccountForm, setEditAccountForm] = useState({
    username: '',
    password: '',
    platform: 'Riot',
    server: 'VN',
    note: '',
  });
  const [isSubmittingEditAccount, setIsSubmittingEditAccount] = useState(false);
  const [isUpdatingIngame, setIsUpdatingIngame] = useState(false);

  // Settlement Modal State
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementMode, setSettlementMode] = useState<'PAY' | 'REFUND'>('PAY');
  const [settleAmount, setSettleAmount] = useState(0);
  const [isProcessingSettlement, setIsProcessingSettlement] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  // Status Change Confirmation Modal State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    targetStatus: string;
    loading: boolean;
  }>({
    isOpen: false,
    targetStatus: '',
    loading: false,
  });

  // Delete Match Confirmation Modal State
  const [deleteMatchModal, setDeleteMatchModal] = useState<{
    isOpen: boolean;
    matchId: string | null;
    matchInfo?: {
      mode?: string;
      champion?: string;
      result?: string;
      lp_change?: number | string;
    } | null;
    loading: boolean;
  }>({
    isOpen: false,
    matchId: null,
    matchInfo: null,
    loading: false,
  });

  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);

  // Coaching VOD state
  const [vodLink, setVodLink] = useState('');
  const [isUpdatingVod, setIsUpdatingVod] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Match Update State
  const [matchForm, setMatchForm] = useState({
    mode: 'Rank Đơn/Đôi', champion: '', result: 'WIN', lp_change: '', reason: ''
  });
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [riotMatchId, setRiotMatchId] = useState('');
  const [recentMatches, setRecentMatches] = useState<string[]>([]);
  const [isFetchingRiot, setIsFetchingRiot] = useState(false);
  const [liveLeagueInfo, setLiveLeagueInfo] = useState<any>(null);
  const [availableLeagues, setAvailableLeagues] = useState<any[]>([]);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isCheckingRank, setIsCheckingRank] = useState(false);
  const [fetchedMatchData, setFetchedMatchData] = useState<any>(null);
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<any>(null);
  const [loadingDetailMatchId, setLoadingDetailMatchId] = useState<string | null>(null);

  // Batch Matches State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchInputText, setBatchInputText] = useState('');
  const [parsedBatchMatches, setParsedBatchMatches] = useState<Array<{
    matchId: string;
    lp_change: number;
    result: 'WIN' | 'LOSS';
    champion?: string;
    reason?: string;
    detail?: any;
  }>>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [isFetchingRiotBatch, setIsFetchingRiotBatch] = useState(false);

  // --- POLLING FALLBACK (Cứ 5s tải lại data 1 lần để chắc chắn cập nhật) ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (!id) return;
      fetch(`/api/orders/${id}`).then(res => res.json()).then(data => {
        if (data.success && data.order) {
          setOrder((prev: any) => ({ ...prev, ...data.order }));
          if (data.order.orderCode && id !== data.order.orderCode) {
            window.history.replaceState(null, '', `/orders/${data.order.orderCode}`);
          }
        }
      });
    }, 5000); // 5 giây

    return () => clearInterval(interval);
  }, [id]);

  // Load User
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  // Tải danh sách trận gần nhất theo đúng chế độ chơi của đơn hàng (Đơn/Đôi hoặc Linh Hoạt)
  const fetchRecentMatchesForOrder = async () => {
    const nameToCheck = (ingameName && ingameName.trim()) || order?.details?.ingame_name || order?.details?.account_username;
    if (!nameToCheck || !order?._id) return;

    const orderGame = (order?.snapshot?.gameCode || order?.details?.game || order?.details?.gameCode || 'LOL').toUpperCase();
    const isValorant = orderGame.includes('VAL');
    const rawQueue = String(order?.details?.queueType || order?.details?.queue_type || order?.serviceType || '').toUpperCase();
    const isFlexOrder = rawQueue.includes('FLEX') || rawQueue.includes('LINH');

    try {
      const res = await fetch('/api/games/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: orderGame,
          server: order.details?.server || (isValorant ? 'ap' : 'VN'),
          name: nameToCheck.trim(),
          queueType: isFlexOrder ? 'FLEX' : 'SOLO_DUO',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recentMatches)) {
          setRecentMatches(data.recentMatches);
        }
      }
    } catch (e) { }
  };

  // Tự động tải trận gần nhất khớp chế độ khi mở modal thêm trận
  useEffect(() => {
    if ((isMatchModalOpen || isBatchModalOpen) && recentMatches.length === 0) {
      fetchRecentMatchesForOrder();
    }
  }, [isMatchModalOpen, isBatchModalOpen]);

  // Tự động lấy phiên bản DDragon mới nhất
  useEffect(() => {
    const fetchDDragonVersion = async () => {
      try {
        const cachedVersion = localStorage.getItem('ddragon_version');
        const cacheTime = localStorage.getItem('ddragon_version_time');
        const now = new Date().getTime();

        if (cachedVersion && cacheTime && (now - parseInt(cacheTime) < 3600000)) {
          setDDragonVersion(cachedVersion);
          return;
        }

        const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await res.json();
        if (versions && versions.length > 0) {
          setDDragonVersion(versions[0]);
          localStorage.setItem('ddragon_version', versions[0]);
          localStorage.setItem('ddragon_version_time', now.toString());
        }
      } catch (error) { console.error("Lỗi tải phiên bản DDragon, dùng bản dự phòng.", error); }
    };
    fetchDDragonVersion();
  }, []);

  // Fetch Order & Messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderRes = await fetch(`/api/orders/${id}`);
        if (!orderRes.ok) throw new Error('Failed to load order');

        const orderData = await orderRes.json();
        setOrder(orderData.order);
        setBoosterProfile(orderData.boosterProfile || null);

        // Tự động cập nhật URL theo mã đơn orderCode
        if (orderData.order?.orderCode && id !== orderData.order.orderCode) {
          window.history.replaceState(null, '', `/orders/${orderData.order.orderCode}`);
        }

        // Điền form sửa tài khoản
        setEditAccountForm({
          username: orderData.order?.details?.account_info?.username || orderData.order?.details?.account_username || orderData.order?.account_credentials?.username || '',
          password: orderData.order?.details?.account_info?.password || orderData.order?.details?.account_password || orderData.order?.account_credentials?.password || '',
          platform: orderData.order?.details?.account_info?.platform || orderData.order?.details?.account_type || 'Riot',
          server: orderData.order?.details?.server || 'VN',
          note: orderData.order?.details?.note || '',
        });

        if (orderData.order?.details?.ingame_name) {
          setIngameName(orderData.order.details.ingame_name);
        }
        if (orderData.order?.details?.vod_link) {
          setVodLink(orderData.order.details.vod_link);
        }

        const txnRes = await fetch(`/api/transactions?orderId=${orderData.order._id}`);
        if (txnRes.ok) {
          const txnData = await txnRes.json();
          setTransactions(txnData.transactions || []);
        }

      } catch (error) {
        console.error(error);
        toast.error('Lỗi tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handler Hủy đơn hàng và hoàn 100% tiền vào ví
  const handleCancelOrder = async () => {
    if (!order) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch(`/api/orders/${order.orderCode || order._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || 'Khách hàng tự hủy trước khi tuyển thủ nhận đơn' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Đã hủy đơn hàng và hoàn 100% tiền vào ví!');
        setIsCancelModalOpen(false);
        setOrder((prev: any) => ({ ...prev, status: 'CANCELLED' }));
        // Cập nhật số dư ví trong localStorage nếu có
        const newBalance = data.balance;
        if (newBalance !== undefined) {
          const currentStoredUser = JSON.parse(localStorage.getItem('user') || '{}');
          currentStoredUser.wallet_balance = newBalance;
          localStorage.setItem('user', JSON.stringify(currentStoredUser));
          if (user) {
            setUser({ ...user, wallet_balance: newBalance });
          }
        }
        // Phát sự kiện toàn cục để Header / Navbar / Layout cập nhật tức thì số dư không cần F5
        window.dispatchEvent(new Event('user-updated'));
        window.dispatchEvent(new CustomEvent('wallet_update', { detail: { balance: newBalance } }));
      } else {
        toast.error(data.message || data.error || 'Lỗi khi hủy đơn hàng');
      }
    } catch (e) {
      toast.error('Lỗi kết nối khi hủy đơn');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Handler Cập nhật tài khoản game
  const handleSaveAccount = async () => {
    if (!order) return;
    setIsSubmittingEditAccount(true);
    try {
      const res = await fetch(`/api/orders/${order.orderCode || order._id}/account`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAccountForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Cập nhật tài khoản game thành công!');
        setIsEditAccountModalOpen(false);
        setOrder((prev: any) => ({
          ...prev,
          details: {
            ...prev.details,
            account_info: data.account_info || {
              username: editAccountForm.username,
              password: editAccountForm.password,
              platform: editAccountForm.platform,
            },
            server: editAccountForm.server,
            note: editAccountForm.note,
          },
        }));
      } else {
        toast.error(data.message || data.error || 'Lỗi khi cập nhật tài khoản');
      }
    } catch (e) {
      toast.error('Lỗi kết nối khi cập nhật tài khoản');
    } finally {
      setIsSubmittingEditAccount(false);
    }
  };

  // Socket.io Integration
  useEffect(() => {
    if (!order?._id) return;
    if (!socket.connected) socket.connect();

    socket.emit('join_order', order._id);

    const handleOrderUpdate = (updatedData: any) => {
      console.log('Socket Order Update:', updatedData);
      setOrder((prev: any) => ({ ...prev, ...updatedData }));
    };

    socket.on('order_updated', handleOrderUpdate);

    return () => {
      socket.off('order_updated', handleOrderUpdate);
      socket.emit('leave_order', order._id);
    };
  }, [order?._id]);

  const handleUpdateStatus = (status: string) => {
    setStatusModal({
      isOpen: true,
      targetStatus: status,
      loading: false,
    });
  };

  const executeStatusUpdate = async () => {
    const status = statusModal.targetStatus;
    if (!status || !order?._id) return;

    setStatusModal((prev) => ({ ...prev, loading: true }));
    try {
      const endpoint = status === 'COMPLETED'
        ? `/api/orders/${order._id}/complete`
        : `/api/orders/${order._id}/status`;

      const method = status === 'COMPLETED' ? 'POST' : 'PATCH';
      const body = status === 'COMPLETED' ? {} : { status };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(status === 'IN_PROGRESS' ? 'Đã bắt đầu cày đơn hàng!' : 'Đã báo cáo hoàn thành đơn hàng!');
        setOrder((prev: any) => ({ ...prev, status }));
        socket.emit('update_order', { room: order._id, data: { status } });
        setStatusModal({ isOpen: false, targetStatus: '', loading: false });
      } else {
        const err = await res.json();
        toast.error(err.error || err.message || 'Lỗi cập nhật');
        setStatusModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDispute = async () => {
    if (order.rating) {
      toast.error('Đơn hàng đã được nghiệm thu và đánh giá. Cổng khiếu nại đã đóng.');
      setIsDisputeModalOpen(false);
      return;
    }
    if (!disputeReason.trim()) return toast.error('Vui lòng nhập lý do');
    setIsSubmittingDispute(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason })
      });
      if (res.ok) {
        toast.success('Đã gửi khiếu nại');
        window.location.reload();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi gửi khiếu nại');
      }
    } catch (e) { toast.error('Lỗi kết nối'); } finally { setIsSubmittingDispute(false); }
  };

  const handleOpenPayModal = (amount: number) => {
    setSettlementMode('PAY');
    setSettleAmount(amount);
    setIsSettlementModalOpen(true);
  };

  const handleOpenRefundModal = (amount: number) => {
    setSettlementMode('REFUND');
    setSettleAmount(amount);
    setIsSettlementModalOpen(true);
  };

  const handleConfirmSettlement = async () => {
    setIsProcessingSettlement(true);
    try {
      const endpoint = settlementMode === 'PAY'
        ? `/api/orders/${order._id}/settle`
        : `/api/orders/${order._id}/refund`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settlementMode === 'PAY' ? { amount: settleAmount } : {})
      });

      if (res.ok) {
        toast.success(settlementMode === 'PAY' ? 'Thanh toán thành công!' : 'Hoàn tiền thành công!');
        setIsSettlementModalOpen(false);
        window.location.reload();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Có lỗi xảy ra');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    } finally {
      setIsProcessingSettlement(false);
    }
  };

  const handleUpdateVodLink = async () => {
    if (!vodLink.trim()) return toast.error('Vui lòng nhập link VOD');
    setIsUpdatingVod(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vod_link: vodLink })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Cập nhật link VOD thành công');
        setOrder((prev: any) => ({ ...prev, details: data.details }));
        socket.emit('update_order', { room: order._id, data: { details: data.details } });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi cập nhật');
      }
    } catch (e) { toast.error('Lỗi kết nối'); }
    finally { setIsUpdatingVod(false); }
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderGame = (order?.snapshot?.gameCode || order?.details?.game || order?.details?.gameCode || 'LOL').toUpperCase();
    const isValorant = orderGame.includes('VAL');
    const rawQueue = String(order?.details?.queueType || order?.details?.queue_type || order?.serviceType || '').toUpperCase();
    const isFlexOrder = rawQueue.includes('FLEX') || rawQueue.includes('LINH');
    const isSoloDuoOrder = !isFlexOrder;

    // Giới hạn số trận đấu đối với Cày Theo Số Trận Thắng (tính theo trận Thắng) hoặc Phân Hạng Đầu Mùa (tính tổng trận)
    const isMatchesService = order?.serviceType === 'MATCHES' || order?.details?.is_matches;
    const isPlacementsService = order?.serviceType === 'PLACEMENTS' || order?.details?.is_placements;
    if (!editingMatchId && (isMatchesService || isPlacementsService)) {
      const maxAllowed = Number(order?.details?.match_count || order?.details?.placement_matches || order?.details?.matches || order?.details?.steps_count || order?.details?.num_games || (isMatchesService ? 10 : 5));
      if (isMatchesService) {
        const currentWins = (order?.match_history || []).filter((m: any) => m.result === 'WIN').length;
        if (currentWins >= maxAllowed) {
          toast.error(`Đơn hàng đã đạt đủ ${currentWins}/${maxAllowed} trận thắng theo cam kết. Bạn có thể báo cáo hoàn thành!`);
          return;
        }
      } else {
        const currentCount = order?.match_history?.length || 0;
        if (currentCount >= maxAllowed) {
          toast.error(`Đơn hàng đã cập nhật đủ ${currentCount}/${maxAllowed} trận theo yêu cầu. Không thể thêm trận vượt quá giới hạn!`);
          return;
        }
      }
    }

    // Validate Queue trước khi lưu nếu có dữ liệu chi tiết
    if (!editingMatchId && fetchedMatchData) {
      if (!isValorant && fetchedMatchData.info?.queueId !== undefined) {
        const matchQueueId = Number(fetchedMatchData.info.queueId);
        if (isSoloDuoOrder && matchQueueId !== 420) {
          toast.error(`Vui lòng điền đúng ID trận đấu thuộc Chế độ Đơn / Đôi! (Trận đấu này thuộc ${getLolQueueName(matchQueueId)})`);
          return;
        }
        if (isFlexOrder && matchQueueId !== 440) {
          toast.error(`Vui lòng điền đúng ID trận đấu thuộc Chế độ Linh hoạt! (Trận đấu này thuộc ${getLolQueueName(matchQueueId)})`);
          return;
        }
      }
      if (isValorant) {
        const mode = (fetchedMatchData.metadata?.mode || fetchedMatchData.mode || '').toLowerCase();
        if (mode && mode !== 'competitive') {
          toast.error(`Vui lòng điền đúng ID trận đấu thuộc Chế độ Xếp Hạng (Competitive)!`);
          return;
        }
      }
    }

    setIsAddingMatch(true);
    try {
      const method = editingMatchId ? 'PUT' : 'POST';
      const body = {
        ...matchForm,
        matchId: editingMatchId, // Only for PUT
        leagueInfo: liveLeagueInfo,
        detail: sanitizeMatchDetailClient(fetchedMatchData), // Gửi chi tiết trận đấu đã làm gọn siêu nhẹ
        riotMatchId // Gửi ID trận đấu
      };

      const res = await fetch(`/api/orders/${order._id}/matches`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setOrder((prev: any) => ({ ...prev, match_history: data.match_history }));
        setMatchForm({ mode: 'Rank Đơn/Đôi', champion: '', result: 'WIN', lp_change: '', reason: '' });
        setEditingMatchId(null);
        toast.success(editingMatchId ? 'Đã cập nhật trận đấu' : 'Đã thêm trận đấu mới');
        setIsMatchModalOpen(false); // Đóng modal sau khi lưu thành công
        setLiveLeagueInfo(null); // Reset live info
        setFetchedMatchData(null);
        setRiotMatchId('');

        // Real-time broadcast
        socket.emit('update_order', { room: order._id, data: { match_history: data.match_history, details: data.details } });
      }
    } catch (e) { toast.error('Lỗi cập nhật'); }
    finally { setIsAddingMatch(false); }
  };

  const handleEditMatch = (match: any) => {
    setMatchForm({
      mode: match.mode || 'Rank Đơn/Đôi',
      champion: match.champion,
      result: match.result,
      lp_change: match.lp_change?.toString() || '',
      reason: match.reason || ''
    });
    setEditingMatchId(match._id);
    setFetchedMatchData(match.detail); // Load existing detail if any
    setRiotMatchId(match.riotMatchId || '');
    setIsMatchModalOpen(true); // Mở modal thay vì scroll
  };

  const handlePromptDeleteMatch = (match: any) => {
    setDeleteMatchModal({
      isOpen: true,
      matchId: match._id || match.match_id,
      matchInfo: {
        mode: match.mode,
        champion: match.champion,
        result: match.result,
        lp_change: match.lp_change,
      },
      loading: false,
    });
  };

  const handleConfirmDeleteMatch = async () => {
    if (!deleteMatchModal.matchId) return;
    setDeleteMatchModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/orders/${order._id}/matches?matchId=${deleteMatchModal.matchId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setOrder((prev: any) => ({ ...prev, match_history: data.match_history }));
        toast.success('Đã xóa trận đấu thành công');
        socket.emit('update_order', { room: order._id, data: { match_history: data.match_history } });
        setDeleteMatchModal({ isOpen: false, matchId: null, matchInfo: null, loading: false });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || err.message || 'Lỗi xóa trận đấu');
      }
    } catch (e) { toast.error('Lỗi kết nối'); }
    finally { setDeleteMatchModal((prev) => ({ ...prev, loading: false })); }
  };

  const handleCancelEdit = () => {
    setMatchForm({ mode: 'Rank Đơn/Đôi', champion: '', result: 'WIN', lp_change: '', reason: '' });
    setEditingMatchId(null);
    setFetchedMatchData(null);
    setRiotMatchId('');
    setIsMatchModalOpen(false);
  };

  // Parser xử lý chuỗi dán danh sách trận đấu (Tự động deduplicate loại bỏ ID trùng lặp)
  const handleParseBatchText = (text: string) => {
    setBatchInputText(text);
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: Array<{
      matchId: string;
      lp_change: number;
      result: 'WIN' | 'LOSS';
      champion?: string;
      reason?: string;
      detail?: any;
    }> = [];
    const seenMatchIds = new Set<string>();
    let duplicateCount = 0;

    for (const line of lines) {
      const tokens = line.split(/[\s,\t]+/).map((t) => t.trim()).filter(Boolean);
      if (tokens.length === 0) continue;

      let matchId = '';
      let lp = 0;
      let foundLp = false;

      for (const token of tokens) {
        const isLolMatch = /^[A-Za-z0-9]+_\d+$/.test(token) || /^\d{8,14}$/.test(token);
        const isValMatch = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(token) || /^[0-9a-fA-F]{32}$/.test(token);

        if (!matchId && (isLolMatch || isValMatch)) {
          matchId = token.includes('_') || isValMatch ? token : `VN2_${token}`;
        } else if (!foundLp && /^[+-]?\d+$/.test(token)) {
          lp = parseInt(token, 10);
          foundLp = true;
        }
      }

      if (matchId) {
        if (seenMatchIds.has(matchId)) {
          duplicateCount++;
          continue; // Tự động loại bỏ ID trùng lặp
        }
        seenMatchIds.add(matchId);

        parsed.push({
          matchId,
          lp_change: lp,
          result: lp < 0 ? 'LOSS' : 'WIN',
          champion: '',
          reason: `Match: ${matchId}`,
        });
      }
    }

    setParsedBatchMatches(parsed);
    if (duplicateCount > 0) {
      toast.info(`Đã tự động loại bỏ ${duplicateCount} ID trận đấu bị trùng lặp.`);
    }
  };

  // Tự động kéo thông tin Tướng / Đặc vụ & KDA cho tất cả các trận
  const handleAutoFetchRiotForBatch = async () => {
    if (parsedBatchMatches.length === 0) return toast.warning('Chưa có trận đấu nào để tra cứu');
    setIsFetchingRiotBatch(true);
    try {
      const orderGame = (order?.snapshot?.gameCode || order?.details?.game || order?.details?.gameCode || 'LOL').toUpperCase();
      const isValorant = orderGame.includes('VAL');
      const server = order.details?.server || (isValorant ? 'ap' : 'VN');
      const targetName = order.details?.ingame_name || order.details?.account_username || ingameName;

      const updated = await Promise.all(
        parsedBatchMatches.map(async (m) => {
          try {
            const res = await fetch('/api/games/match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ game: orderGame, matchId: m.matchId, server, targetName }),
            });
            if (res.ok) {
              const data = await res.json();
              const p = data.participant;
              return {
                ...m,
                champion: p?.championName || m.champion || (isValorant ? 'Valorant Agent' : 'League Champion'),
                result: p ? (p.win ? 'WIN' : 'LOSS') : m.result,
                reason: p ? `KDA: ${p.kills}/${p.deaths}/${p.assists}${p.score ? ` (${p.score} pts)` : ''}` : m.reason,
                detail: sanitizeMatchDetailClient(data.match),
              };
            }
          } catch (e) { }
          return m;
        })
      );

      setParsedBatchMatches(updated);
      toast.success(`Đã tải thông tin ${isValorant ? 'Đặc vụ & KDA từ Valorant' : 'Tướng & KDA từ Riot Games'}!`);
    } catch (e) {
      toast.error('Lỗi khi tải thông tin trận đấu');
    } finally {
      setIsFetchingRiotBatch(false);
    }
  };

  // Lưu danh sách trận hàng loạt vào đơn hàng (tự động fetch KDA & Detail nếu chưa có)
  const handleSaveBatchMatches = async () => {
    if (parsedBatchMatches.length === 0) return toast.warning('Danh sách trận đấu đang trống');
    setIsSubmittingBatch(true);
    try {
      const orderGame = (order?.snapshot?.gameCode || order?.details?.game || order?.details?.gameCode || 'LOL').toUpperCase();
      const isValorant = orderGame.includes('VAL');
      const server = order.details?.server || (isValorant ? 'ap' : 'VN');
      const targetName = order.details?.ingame_name || order.details?.account_username || ingameName;

      const rawQueue = String(order?.details?.queueType || order?.details?.queue_type || order?.serviceType || '').toUpperCase();
      const isFlexOrder = rawQueue.includes('FLEX') || rawQueue.includes('LINH');
      const isSoloDuoOrder = !isFlexOrder;

      const invalidQueueMatches: { matchId: string; queueName: string }[] = [];

      // Tự động kéo KDA & Detail cho bất kỳ trận nào chưa có trước khi lưu
      const matchesToSave = await Promise.all(
        parsedBatchMatches.map(async (m) => {
          let detail = m.detail;
          let champion = m.champion;
          let result = m.result;
          let reason = m.reason;

          if (!detail || !champion) {
            try {
              const res = await fetch('/api/games/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game: orderGame, matchId: m.matchId, server, targetName }),
              });
              if (res.ok) {
                const data = await res.json();
                const p = data.participant;
                detail = data.match || null;
                champion = p?.championName || m.champion || (isValorant ? 'Valorant Agent' : 'League Champion');
                result = p ? (p.win ? 'WIN' : 'LOSS') : m.result;
                reason = p ? `KDA: ${p.kills}/${p.deaths}/${p.assists}${p.score ? ` (${p.score} pts)` : ''}` : m.reason;
              }
            } catch (e) { }
          }

          // Kiểm tra tính hợp lệ của chế độ trận đấu
          if (!isValorant && detail?.info?.queueId !== undefined) {
            const qId = Number(detail.info.queueId);
            if (isSoloDuoOrder && qId !== 420) {
              invalidQueueMatches.push({ matchId: m.matchId, queueName: getLolQueueName(qId) });
            } else if (isFlexOrder && qId !== 440) {
              invalidQueueMatches.push({ matchId: m.matchId, queueName: getLolQueueName(qId) });
            }
          }

          return {
            ...m,
            riotMatchId: m.matchId,
            champion,
            result,
            reason,
            detail: sanitizeMatchDetailClient(detail),
          };
        })
      );

      if (invalidQueueMatches.length > 0) {
        toast.error(
          `Vui lòng điền đúng ID trận đấu thuộc ${isSoloDuoOrder ? 'Chế độ Đơn / Đôi' : 'Chế độ Linh hoạt'}! Phát hiện ${invalidQueueMatches.length} trận sai chế độ: ${invalidQueueMatches.map(x => `${x.matchId} (${x.queueName})`).join(', ')}`,
          { duration: 8000 }
        );
        setIsSubmittingBatch(false);
        return;
      }

      // Giới hạn số trận đấu đối với Cày Theo Số Trận Thắng (tính theo trận Thắng) hoặc Phân Hạng Đầu Mùa (tính tổng trận)
      const isMatchesBatch = order?.serviceType === 'MATCHES' || order?.details?.is_matches;
      const isPlacementsBatch = order?.serviceType === 'PLACEMENTS' || order?.details?.is_placements;
      if (isMatchesBatch || isPlacementsBatch) {
        const maxAllowed = Number(order?.details?.match_count || order?.details?.placement_matches || order?.details?.matches || order?.details?.steps_count || order?.details?.num_games || (isMatchesBatch ? 10 : 5));
        if (isMatchesBatch) {
          const currentWins = (order?.match_history || []).filter((m: any) => m.result === 'WIN').length;
          if (currentWins >= maxAllowed) {
            toast.error(`Đơn hàng đã đạt đủ ${maxAllowed}/${maxAllowed} trận thắng! Không cần thêm trận mới.`);
            setIsSubmittingBatch(false);
            return;
          }
        } else {
          const currentCount = order?.match_history?.length || 0;
          const remaining = maxAllowed - currentCount;
          if (remaining <= 0) {
            toast.error(`Đơn hàng đã cập nhật đủ ${maxAllowed}/${maxAllowed} trận! Không thể thêm trận mới.`);
            setIsSubmittingBatch(false);
            return;
          }
          if (matchesToSave.length > remaining) {
            toast.error(`Đơn hàng chỉ còn thiếu ${remaining} trận nữa là đủ ${maxAllowed} trận. Bạn đang chọn nhập ${matchesToSave.length} trận!`);
            setIsSubmittingBatch(false);
            return;
          }
        }
      }

      const res = await fetch(`/api/orders/${order._id}/matches/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: matchesToSave }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder((prev: any) => ({
          ...prev,
          match_history: data.match_history,
          details: data.details || prev.details,
        }));
        toast.success(data.message || `Đã thêm thành công ${matchesToSave.length} trận đấu!`);
        socket.emit('update_order', {
          room: order._id,
          data: { match_history: data.match_history, details: data.details },
        });
        setIsBatchModalOpen(false);
        setBatchInputText('');
        setParsedBatchMatches([]);
      } else {
        toast.error(data.message || data.error || 'Lỗi lưu danh sách trận');
      }
    } catch (e: any) {
      toast.error(e.message || 'Lỗi kết nối khi lưu danh sách trận');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Xem chi tiết trận đấu (mở ngay nếu đã có detail, hoặc tự động fetch on-the-fly nếu chưa có)
  const handleViewMatchDetail = async (match: any) => {
    if (match.detail) {
      setSelectedMatchDetail(match.detail);
      return;
    }

    const matchIdToFetch = (match.riotMatchId || match.match_id || '').trim();
    if (!matchIdToFetch) {
      return toast.warning('Trận đấu này không có Match ID để tra cứu chi tiết');
    }

    setLoadingDetailMatchId(match.match_id || matchIdToFetch);
    try {
      const orderGame = (order?.snapshot?.gameCode || order?.details?.game || order?.details?.gameCode || 'LOL').toUpperCase();
      const isValorant = orderGame.includes('VAL');
      const server = order.details?.server || (isValorant ? 'ap' : 'VN');
      const targetName = order.details?.ingame_name || order.details?.account_username || ingameName;

      const res = await fetch('/api/games/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: orderGame,
          matchId: matchIdToFetch,
          server,
          targetName,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Không thể lấy thông tin chi tiết trận đấu');
      }

      const data = await res.json();
      if (!data.match) {
        throw new Error('Không tìm thấy dữ liệu chi tiết của trận đấu');
      }

      // Cập nhật lại vào local state để lần sau bấm mắt xem là hiện ngay
      setOrder((prev: any) => {
        if (!prev?.match_history) return prev;
        const updated = prev.match_history.map((m: any) => {
          if ((m.match_id && m.match_id === match.match_id) || m.riotMatchId === matchIdToFetch) {
            return { ...m, detail: data.match };
          }
          return m;
        });
        return { ...prev, match_history: updated };
      });

      setSelectedMatchDetail(data.match);
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi tải chi tiết trận đấu');
    } finally {
      setLoadingDetailMatchId(null);
    }
  };

  const handleUpdateIngame = async () => {
    setIsUpdatingIngame(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingame_name: ingameName })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Cập nhật Ingame thành công');
        setOrder((prev: any) => ({ ...prev, details: data.details }));
        // Real-time broadcast
        socket.emit('update_order', { room: order._id, data: { details: data.details } });
      } else {
        toast.error('Lỗi cập nhật');
      }
    } catch (e) { toast.error('Lỗi kết nối'); }
    finally { setIsUpdatingIngame(false); }
  };

  // Áp dụng và lưu bậc Rank được chọn từ danh sách Leagues của Riot
  const applySelectedLeague = async (league: any, playerTag?: string) => {
    if (!order?._id) return;
    const isApexTier = ['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(league.tier?.toUpperCase());
    const tierVi = formatRankDisplayVi(league.tier);
    const formattedRank = isApexTier ? tierVi : `${tierVi}${league.rank ? ' ' + league.rank : ''}`;
    const nameToSave = playerTag || (ingameName && ingameName.trim()) || order.details?.ingame_name || order.details?.account_username;

    const updateBody = {
      ingame_name: nameToSave,
      current_rank: formattedRank,
      current_lp: league.leaguePoints ?? 0
    };

    setLiveLeagueInfo(league);

    try {
      const patchRes = await fetch(`/api/orders/${order._id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody)
      });
      if (!patchRes.ok) {
        const patchErr = await patchRes.json().catch(() => ({}));
        throw new Error(patchErr.message || 'Lỗi khi lưu thông tin Rank vào đơn hàng');
      }

      toast.success(`Đã áp dụng: ${formattedRank} - ${league.leaguePoints ?? 0} LP (${league.queueType === 'RANKED_SOLO_5x5' ? 'Đơn/Đôi' : league.queueType === 'COMPETITIVE' ? 'Competitive' : 'Linh Hoạt'})`);

      // Cập nhật UI local
      setOrder((prev: any) => ({
        ...prev,
        details: { ...prev.details, ...updateBody }
      }));

      // Real-time broadcast
      socket.emit('update_order', { room: order._id, data: { details: { ...order.details, ...updateBody } } });
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu bậc Rank');
    }
  };

  // Hàm check Rank và Lưu (Dùng chung cho cả nút Check & Lưu của Booster và nút Refresh)
  const handleCheckAndSaveRank = async () => {
    // Ưu tiên lấy từ input state (nếu booster đang nhập), nếu không thì lấy từ order details
    const nameToCheck = (ingameName && ingameName.trim()) || order.details.ingame_name || order.details.account_username;

    if (!nameToCheck) return toast.error('Vui lòng nhập tên Ingame');

    const orderGame = (order?.snapshot?.gameCode || order?.details?.game || order?.details?.gameCode || 'LOL').toUpperCase();
    const isValorant = orderGame.includes('VAL');

    const rawQueue = String(order.details?.queueType || order.details?.queue_type || order.serviceType || '').toUpperCase();
    const isFlexOrder = rawQueue.includes('FLEX') || rawQueue.includes('LINH');
    const targetQueue = isValorant ? 'COMPETITIVE' : (isFlexOrder ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5');
    const targetQueueName = isValorant ? 'Competitive' : (isFlexOrder ? 'Linh Hoạt' : 'Đơn / Đôi');

    setIsCheckingRank(true);
    try {
      const res = await fetch('/api/games/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: orderGame,
          server: order.details?.server || (isValorant ? 'ap' : 'VN'),
          name: nameToCheck.trim(),
          queueType: isFlexOrder ? 'FLEX' : 'SOLO_DUO'
        })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        let errMsg = data.error || data.message || data.mockReason || 'Lỗi kiểm tra thông tin người chơi';
        if (errMsg.includes('RIOT_API_KEY') || errMsg.includes('developer.riotgames.com') || errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('Unauthorized')) {
          errMsg = 'Hệ thống đang bận. Vui lòng thử lại sau!';
        }
        throw new Error(errMsg);
      }

      if (data.isMock) {
        const mockMsg = (data.mockReason?.includes('RIOT_API_KEY') || data.mockReason?.includes('developer.riotgames.com'))
          ? 'Hệ thống đang bận. Vui lòng thử lại sau!'
          : (data.mockReason || 'Chưa kết nối API thật');
        toast.warning(`Chế độ giả lập (Mock): ${mockMsg}`);
      }

      // Lọc nghiêm ngặt: Chỉ lấy đúng rank khớp với chế độ của đơn hàng mà khách hàng đã chọn
      const matchedLeagues = Array.isArray(data.leagues)
        ? data.leagues.filter((l: any) => l.queueType === targetQueue)
        : [];

      setAvailableLeagues(matchedLeagues);

      const league = matchedLeagues[0];

      if (league) {
        setLiveLeagueInfo(league);

        const isApexTier = ['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(league.tier?.toUpperCase());
        const tierVi = formatRankDisplayVi(league.tier);
        const formattedRank = isApexTier ? tierVi : `${tierVi}${league.rank ? ' ' + league.rank : ''}`;
        const formattedName = data.gameName ? `${data.gameName}#${data.tagLine}` : nameToCheck;
        const rankUnit = isValorant ? 'RR' : 'LP';
        const isPlacements = order?.serviceType === 'PLACEMENTS' || order?.details?.is_placements;

        // Tự động lưu vào DB luôn
        // ĐỐI VỚI ĐƠN PHÂN HẠNG: Không tự động đè current_rank (vì current_rank là Rank Tạm Tính sau từng trận phân hạng)
        const updateBody: any = {
          ingame_name: formattedName,
        };

        if (!isPlacements) {
          updateBody.current_rank = formattedRank;
          updateBody.current_lp = league.leaguePoints ?? 0;
        }

        // Gọi API update details
        const patchRes = await fetch(`/api/orders/${order._id}/details`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateBody)
        });
        if (!patchRes.ok) {
          const patchErr = await patchRes.json().catch(() => ({}));
          throw new Error(patchErr.message || 'Lỗi khi lưu thông tin Rank vào đơn hàng');
        }

        if (isPlacements) {
          toast.success(`Đã lưu Ingame: ${formattedName}. Rank trên Riot: ${formattedRank} (Tham khảo). Đối với đơn Phân Hạng, vui lòng chỉnh Rank Tạm Tính theo từng trận!`);
        } else {
          toast.success(`Đã cập nhật: ${formattedRank} - ${league.leaguePoints ?? 0} ${rankUnit} (${targetQueueName})`);
        }

        // Cập nhật UI local (để hiển thị ngay lập tức)
        setOrder((prev: any) => ({
          ...prev,
          details: { ...prev.details, ...updateBody }
        }));

        if (Array.isArray(data.recentMatches) && data.recentMatches.length > 0) {
          setRecentMatches(data.recentMatches);
        }

        // Real-time broadcast
        socket.emit('update_order', { room: order._id, data: { details: { ...order.details, ...updateBody } } });
      } else {
        toast.warning(`Tài khoản chưa có bậc xếp hạng ở chế độ ${targetQueueName}.`);
      }

      // Nếu là Booster đang nhập, update luôn state input cho khớp
      if (data.gameName) setIngameName(`${data.gameName}#${data.tagLine}`);
    } catch (e: any) { toast.error(e.message || 'Lỗi kiểm tra'); }
    finally { setIsCheckingRank(false); }
  };

  const handleFetchRiotMatch = async () => {
    const orderGame = (order?.snapshot?.gameCode || order?.details?.game || order?.details?.gameCode || 'LOL').toUpperCase();
    const isValorant = orderGame.includes('VAL');

    if (!riotMatchId.trim()) return toast.error(`Vui lòng nhập ID trận đấu (VD: ${isValorant ? 'ba7a9a92-be79-494e-bdad-483131edb85c' : 'VN2_123456'})`);
    setIsFetchingRiot(true);
    try {
      const res = await fetch('/api/games/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: orderGame,
          matchId: riotMatchId.trim(),
          server: order.details?.server || (isValorant ? 'ap' : 'VN'),
          targetName: order.details?.ingame_name || order.details?.account_username || ingameName
        })
      });
      const data = await res.json();

      if (!res.ok) {
        let errMsg = data.error || data.message || 'Lỗi lấy thông tin trận đấu';
        if (errMsg.includes('RIOT_API_KEY') || errMsg.includes('developer.riotgames.com') || errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('Unauthorized')) {
          errMsg = 'Hệ thống đang bận. Vui lòng thử lại sau!';
        }
        throw new Error(errMsg);
      }

      // VALIDATE QUEUE MODE: Kiểm tra khớp chế độ Đơn / Đôi hoặc Linh Hoạt
      const rawQueue = String(order?.details?.queueType || order?.details?.queue_type || order?.serviceType || '').toUpperCase();
      const isFlexOrder = rawQueue.includes('FLEX') || rawQueue.includes('LINH');
      const isSoloDuoOrder = !isFlexOrder;

      if (!isValorant && data.match?.info?.queueId !== undefined) {
        const matchQueueId = Number(data.match.info.queueId);
        const actualQueueName = getLolQueueName(matchQueueId);

        if (isSoloDuoOrder && matchQueueId !== 420) {
          setFetchedMatchData(null);
          toast.error(
            `Vui lòng điền đúng ID trận đấu thuộc Chế độ Đơn / Đôi! (Trận đấu ${riotMatchId.trim()} thuộc ${actualQueueName})`,
            { duration: 7000 }
          );
          return;
        }

        if (isFlexOrder && matchQueueId !== 440) {
          setFetchedMatchData(null);
          toast.error(
            `Vui lòng điền đúng ID trận đấu thuộc Chế độ Linh hoạt! (Trận đấu ${riotMatchId.trim()} thuộc ${actualQueueName})`,
            { duration: 7000 }
          );
          return;
        }
      }

      if (isValorant) {
        const mode = (data.match?.metadata?.mode || data.match?.mode || '').toLowerCase();
        if (mode && mode !== 'competitive') {
          setFetchedMatchData(null);
          toast.error(
            `Vui lòng điền đúng ID trận đấu thuộc Chế độ Xếp Hạng (Competitive)! (Trận đấu này là ${data.match?.metadata?.mode || 'không phải Xếp Hạng'})`,
            { duration: 7000 }
          );
          return;
        }
      }

      const participant = data.participant;
      const leagueInfo = data.leagueInfo;
      setFetchedMatchData(data.match); // Lưu lại full data để gửi khi save

      if (participant) {
        let calculatedLpChange = '';

        // Tự động tính LP Change nếu có dữ liệu League
        if (leagueInfo && leagueInfo.leaguePoints !== undefined && leagueInfo.leaguePoints !== 0) {
          const currentLpInOrder = parseInt(order.details.current_lp || '0');
          const realLp = leagueInfo.leaguePoints;
          const diff = realLp - currentLpInOrder;

          setLiveLeagueInfo(leagueInfo); // Lưu lại để gửi khi submit

          // Chỉ điền nếu chênh lệch hợp lý
          if (Math.abs(diff) < 100) {
            calculatedLpChange = diff.toString();
          }
          toast.info(`Rank hiện tại: ${leagueInfo.tier} ${leagueInfo.rank || ''} - ${realLp} ${isValorant ? 'RR' : 'LP'}`);
        }

        setMatchForm(prev => ({
          ...prev,
          champion: participant.championName || (isValorant ? 'Agent' : 'Champion'),
          result: participant.win ? 'WIN' : 'LOSS',
          lp_change: calculatedLpChange,
          reason: `KDA: ${participant.kills}/${participant.deaths}/${participant.assists}${participant.score ? ` (${participant.score} pts)` : ''}`
        }));
        toast.success(`Đã lấy thông tin trận đấu (${isValorant ? 'Valorant' : 'Riot'})!`);
      } else {
        toast.warning('Không tìm thấy người chơi. Hãy chắc chắn bạn đã cập nhật Tên Ingame đúng.');
      }
    } catch (e: any) { toast.error(e.message || 'Lỗi lấy thông tin trận đấu'); }
    finally { setIsFetchingRiot(false); }
  };


  // --- UI COMPONENTS ---
  const StatusBadge = ({ status }: { status: string }) => {
    const hasBooster = !!order?.boosterId;
    const statusInfo = getOrderStatusInfo(status, hasBooster);

    if (status === 'PAID') {
      return (
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border tracking-wider inline-flex items-center gap-1.5 ${statusInfo.style}`}>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
          {statusInfo.label}
        </span>
      );
    }

    if (status === 'IN_PROGRESS' || status === 'IN_PROCESS') {
      return (
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border tracking-wider inline-flex items-center gap-1.5 ${statusInfo.style}`}>
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
          {statusInfo.label}
        </span>
      );
    }

    return (
      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border tracking-wider ${statusInfo.style}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) return <BarLoader className="py-24" />;
  if (!order) {
    return (
      <div className="py-20 px-4 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-zinc-400 text-base">Đơn hàng không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <Link
          href={user?.role === 'BOOSTER' ? '/booster/my-orders' : user?.role === 'ADMIN' ? '/admin/orders' : '/orders'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const isBooster = user?.role === 'BOOSTER';
  const isCustomer = user?.role === 'CUSTOMER';
  const partner = isCustomer ? order.boosterId : order.customerId;

  // Lọc các tùy chọn đã được kích hoạt (true hoặc mảng có phần tử)
  const activeOptions = order.options
    ? Object.entries(order.options as Record<string, any>).filter(([_, val]) => {
      if (Array.isArray(val)) return val.length > 0;
      return !!val;
    })
    : [];

  // Trích xuất danh sách Vị trí / Đường chỉ định
  const extractedRoles: string[] = (() => {
    const raw =
      order.options?.roles ||
      order.options?.selectedRoles ||
      order.details?.roles ||
      order.details?.selectedRoles ||
      order.details?.addons?.roles ||
      order.details?.addons?.selectedRoles ||
      order.details?.service_data?.roles;
    if (Array.isArray(raw) && raw.length > 0) return raw.map(String);
    if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
    return [];
  })();

  const hasSpecificRole = Boolean(
    order.options?.specificRole ||
    order.details?.addons?.specificRole ||
    order.details?.specificRole ||
    extractedRoles.length > 0
  );

  // Tách riêng các tùy chọn phức tạp (Mảng) và đơn giản (Boolean)
  const scheduleOption = activeOptions.find(([k]) => k === 'schedule');
  const rolesOption = activeOptions.find(([k]) => k === 'roles' || k === 'selectedRoles' || k === 'specificRole');

  // Kiểm tra giới hạn 7 ngày đánh giá & 24 giờ khiếu nại sau khi đơn hoàn thành
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const completedEntry = Array.isArray(order.timeline)
    ? [...order.timeline].reverse().find((t: any) => t.status === 'COMPLETED')
    : null;
  const completedTimeMs =
    order.status === 'COMPLETED'
      ? new Date(order.completedAt || completedEntry?.timestamp || order.updatedAt).getTime()
      : null;
  const disputeDeadline = completedTimeMs ? new Date(completedTimeMs + TWENTY_FOUR_HOURS_MS) : null;
  const disputeRemainingMs = disputeDeadline ? Math.max(0, disputeDeadline.getTime() - currentTime) : 0;
  const isDisputeExpired =
    isCustomer &&
    order.status === 'COMPLETED' &&
    completedTimeMs !== null &&
    disputeRemainingMs <= 0;

  const isRatingExpired = order.status === 'COMPLETED' && (new Date().getTime() - new Date(order.updatedAt).getTime() > SEVEN_DAYS_MS);
  const canRate = isCustomer && order.status === 'COMPLETED' && !order.rating && !isRatingExpired;

  const simpleOptions = activeOptions.filter(([k, v]) => {
    if (k === 'schedule' && Array.isArray(v)) return false; // Nếu là mảng lịch -> ẩn khỏi list đơn giản
    if (k === 'roles' || k === 'selectedRoles' || k === 'specificRole' || k === 'rolesDisplay') return false; // Vị trí hiển thị hàng riêng biệt
    return true;
  });

  const optionLabels: Record<string, string> = {
    specificRole: 'Tùy chọn vị trí / đường',
    roles: 'Tùy chọn vị trí / đường',
    specificChamps: 'Tùy chọn tướng tủ',
    champions: 'Tướng chỉ định',
    schedule: 'Khung giờ chơi / cấm chơi',
    livestream: 'Phát trực tiếp (Livestream)',
    streaming: 'Phát trực tiếp (Livestream)',
    flash: 'Vị trí Tốc Biến (Flash)',
    flashPosition: 'Vị trí Tốc Biến (Flash)',
    duo: 'Duo cùng Tuyển thủ',
    express: 'Cày siêu tốc (Ưu tiên)',
    priority: 'Cày ưu tiên hoàn thành',
    coaching: 'Kèm riêng 1-1',
  };

  return (
    <div className="w-full text-white font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Link
            href={
              user?.role === 'BOOSTER'
                ? '/booster/my-orders'
                : user?.role === 'ADMIN'
                ? '/admin/orders'
                : '/orders'
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách đơn hàng
          </Link>
        </div>

        {/* Left Column: Order Info */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {(() => {
              const gameCode = order.snapshot?.gameCode || order.details?.game || 'LOL';
              const gameMeta = getGameMeta(gameCode);
              const serviceName = formatServiceName(
                order.serviceType || order.snapshot?.serviceSlug,
                order.details
              );

              return (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border shadow-sm"
                        style={{
                          backgroundColor: `${gameMeta.accentColor}15`,
                          color: gameMeta.accentColor,
                          borderColor: `${gameMeta.accentColor}40`,
                        }}
                      >
                        {gameMeta.shortName}
                      </span>
                      <span className="text-zinc-500 text-xs font-mono">ORDER CODE</span>
                      <span className="bg-zinc-800 text-cyan-300 text-xs px-2.5 py-0.5 rounded font-mono font-bold border border-zinc-700">
                        #{order.orderCode || order._id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                      {serviceName}
                    </h2>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Clock size={12} /> {new Date(order.createdAt).toLocaleString('vi-VN')}
                      {order.details?.server && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-zinc-600" />
                          <span>
                            Máy chủ: <strong className="text-zinc-300">{order.details.server}</strong>
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              );
            })()}

            <OrderDisputeBanner
              order={order}
              isCustomer={isCustomer}
              isBooster={isBooster}
              disputeDeadline={disputeDeadline}
              disputeRemainingMs={disputeRemainingMs}
              formatDisputeCountdown={formatDisputeCountdown}
              isDisputeExpired={isDisputeExpired}
              canRate={canRate}
              isRatingExpired={isRatingExpired}
              onOpenEditAccount={() => setIsEditAccountModalOpen(true)}
              onOpenCancelModal={() => setIsCancelModalOpen(true)}
              onOpenDisputeModal={() => setIsDisputeModalOpen(true)}
              onOpenRatingModal={() => setIsRatingModalOpen(true)}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>

          {/* TABS: Info vs Progress */}
          <div
            id="order-tabs-container"
            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg scroll-mt-24"
          >
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('INFO')}
                className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === 'INFO'
                    ? 'bg-zinc-800/50 text-white border-blue-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                Thông tin đơn hàng
              </button>
              <button
                onClick={() => setActiveTab('PROGRESS')}
                className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === 'PROGRESS'
                    ? 'bg-zinc-800/50 text-white border-blue-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                Tiến độ & Trận đấu
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'INFO' ? (
                <div className="space-y-6">
                  <OrderGameProgressCard
                    order={order}
                    liveLeagueInfo={liveLeagueInfo}
                    isBooster={isBooster}
                    ingameName={ingameName}
                    setIngameName={setIngameName}
                    handleCheckAndSaveRank={handleCheckAndSaveRank}
                    isCheckingRank={isCheckingRank}
                    availableLeagues={availableLeagues}
                    applySelectedLeague={applySelectedLeague}
                  />

                  <OrderBoosterCard
                    order={order}
                    isBooster={isBooster}
                    isCustomer={isCustomer}
                    boosterProfile={boosterProfile}
                    boosterGamesWithServices={boosterGamesWithServices}
                    collapsedGames={collapsedGames}
                    toggleGameCollapse={toggleGameCollapse}
                  />

                  <OrderAccountCard
                    order={order}
                    isCustomer={isCustomer}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    onOpenEditAccount={() => setIsEditAccountModalOpen(true)}
                  />

                  <OrderServiceCard
                    order={order}
                    isBooster={isBooster}
                    isCustomer={isCustomer}
                    vodLink={vodLink}
                    setVodLink={setVodLink}
                    onUpdateVodLink={handleUpdateVodLink}
                    isUpdatingVod={isUpdatingVod}
                  />

                  <OrderPaymentCard
                    order={order}
                    isBooster={isBooster}
                    transactions={transactions}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <OrderMatchHistoryList
                    order={order}
                    isBooster={isBooster}
                    loadingDetailMatchId={loadingDetailMatchId}
                    onViewMatchDetail={handleViewMatchDetail}
                    onEditMatch={handleEditMatch}
                    onPromptDeleteMatch={handlePromptDeleteMatch}
                    onOpenBatchModal={() => setIsBatchModalOpen(true)}
                    onOpenAddMatchModal={() => {
                      setMatchForm({
                        mode: 'Rank Đơn/Đôi',
                        champion: '',
                        result: 'WIN',
                        lp_change: '',
                        reason: '',
                      });
                      setEditingMatchId(null);
                      setIsMatchModalOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Window */}
      {order.boosterId && (
        <ChatWindow
          orderId={order.orderCode || order._id}
          currentUser={user}
          partner={partner}
          orderRole={
            (order.customerId?._id || order.customerId) === user?._id
              ? 'CUSTOMER'
              : (order.boosterId?._id || order.boosterId) === user?._id
              ? 'BOOSTER'
              : user?.role === 'ADMIN' || user?.role === 'STAFF'
              ? 'ADMIN'
              : undefined
          }
          orderContext={{
            serviceType: order.serviceType,
            details: order.details,
          }}
          trigger="side"
        />
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        order={order}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        isSubmittingCancel={isSubmittingCancel}
        onConfirmCancel={handleCancelOrder}
      />

      {/* Edit Account Modal */}
      <EditAccountModal
        isOpen={isEditAccountModalOpen}
        onClose={() => setIsEditAccountModalOpen(false)}
        form={editAccountForm}
        setForm={setEditAccountForm}
        onOpenServerModal={() => setIsServerModalOpen(true)}
        isSubmitting={isSubmittingEditAccount}
        onSave={handleSaveAccount}
      />

      {/* Modal Chọn Server */}
      <ServerSelectModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        selectedServer={editAccountForm.server}
        onSelectServer={(code: string) => setEditAccountForm((prev) => ({ ...prev, server: code }))}
      />

      {/* Unified Settlement Modal */}
      <SettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        mode={settlementMode}
        amount={settleAmount}
        walletBalance={user?.wallet_balance || 0}
        onConfirm={handleConfirmSettlement}
        isLoading={isProcessingSettlement}
      />

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        orderId={order._id}
        onSuccess={() => window.location.reload()}
      />

      {/* Status Confirm Modal */}
      <StatusConfirmModal
        statusModal={statusModal}
        setStatusModal={setStatusModal}
        order={order}
        onConfirm={executeStatusUpdate}
      />

      {/* Delete Match Modal */}
      <DeleteMatchModal
        deleteMatchModal={deleteMatchModal}
        setDeleteMatchModal={setDeleteMatchModal}
        onConfirmDelete={handleConfirmDeleteMatch}
      />

      {/* Batch Match Modal */}
      <BatchMatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        order={order}
        recentMatches={recentMatches}
        batchInputText={batchInputText}
        onParseBatchText={handleParseBatchText}
        parsedBatchMatches={parsedBatchMatches}
        setParsedBatchMatches={setParsedBatchMatches}
        isFetchingRiotBatch={isFetchingRiotBatch}
        onAutoFetchRiotForBatch={handleAutoFetchRiotForBatch}
        isSubmittingBatch={isSubmittingBatch}
        onSaveBatchMatches={handleSaveBatchMatches}
      />

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        disputeReason={disputeReason}
        setDisputeReason={setDisputeReason}
        isSubmittingDispute={isSubmittingDispute}
        onConfirmDispute={handleDispute}
      />

      {/* Match Form Modal */}
      <MatchFormModal
        isOpen={isMatchModalOpen}
        onClose={handleCancelEdit}
        editingMatchId={editingMatchId}
        order={order}
        riotMatchId={riotMatchId}
        setRiotMatchId={setRiotMatchId}
        isFetchingRiot={isFetchingRiot}
        onFetchRiotMatch={handleFetchRiotMatch}
        recentMatches={recentMatches}
        onRefreshRecentMatches={fetchRecentMatchesForOrder}
        matchForm={matchForm}
        setMatchForm={setMatchForm}
        isAddingMatch={isAddingMatch}
        onSaveMatch={handleSaveMatch}
      />

      {/* Match Detail Modal */}
      <MatchDetailModal
        selectedMatchDetail={selectedMatchDetail}
        onClose={() => setSelectedMatchDetail(null)}
        order={order}
        dDragonVersion={dDragonVersion}
      />
    </div>
  );
}
