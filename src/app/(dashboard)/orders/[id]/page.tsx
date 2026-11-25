// src/app/(dashboard)/orders/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { socket } from '@/lib/socket';
import { getLaneMeta } from '@/lib/lanes';
import {
  Loader2, CheckCircle2, AlertCircle, Clock,
  Shield, DollarSign, CreditCard,
  Play, CheckSquare, Lock, Flag, Swords, Trophy, Save, Crosshair, ArrowLeft, Search, RefreshCw, AlertTriangle, XCircle, Zap
} from 'lucide-react';
import { Pencil, Trash2, X, Plus, Eye, EyeOff, History, ArrowUpRight, ArrowDownLeft, Star, User, Award, Gamepad2, ExternalLink, ChevronsUpDown, Globe } from 'lucide-react';
import { Pencil, Trash2, X, Plus, Eye, EyeOff, History, ArrowUpRight, ArrowDownLeft, Star, User, Award, Gamepad2, ExternalLink, ChevronsUpDown, Globe, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ChatWindow from '@/components/chat/ChatWindow';
import { motion, AnimatePresence } from 'framer-motion';
import NetWinsOrderView from '@/components/orders/NetWinsOrderView';
import RankBoostOrderView from '@/components/orders/RankBoostOrderView';
import PromotionOrderView from '@/components/orders/PromotionOrderView';
import PlacementsOrderView from '@/components/orders/PlacementsOrderView';
import MatchesOrderView from '@/components/orders/MatchesOrderView';
import MasteryOrderView from '@/components/orders/MasteryOrderView';
import LevelingOrderView from '@/components/orders/LevelingOrderView';
import OnBetOrderView from '@/components/orders/OnBetOrderView';
import CoachingOrderView from '@/components/orders/CoachingOrderView';
import SettlementModal from '@/components/orders/SettlementModal';
import RatingModal from '@/components/orders/RatingModal';
import { GAMES_CATALOG, GameDefinition } from '@/lib/games';
import ServerSelectModal from '@/components/ServerSelectModal';
import ServerFlag from '@/components/ServerFlag';
import { getServerByCode } from '@/lib/servers';
import { getBoosterOrderValue, getBoosterDepositValue } from '@/lib/orderPricing';
import { getOrderStatusInfo, formatServiceNameVi } from '@/lib/orderStatus';
import { formatRankDisplayVi, LOL_QUEUE_NAMES, getLolQueueName } from '@/lib/riotRanks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Helper lấy metadata tựa game
function getGameMeta(gameCode?: string) {
  const code = (gameCode || 'LOL').toUpperCase();
  const game = GAMES_CATALOG.find((g: GameDefinition) => g.id.toUpperCase() === code);
  if (game) {
    return {
      name: game.name,
      shortName: game.shortName,
      accentColor: game.accentColor || '#06b6d4',
    };
  }
  return {
    name: code,
    shortName: code,
    accentColor: '#3b82f6',
  };
}

// Helper format tên dịch vụ thân thiện
function formatServiceName(serviceType?: string, details?: any) {
  return formatServiceNameVi(serviceType, details);
}

// Helper làm gọn thông tin chi tiết trận đấu (loại bỏ challenges hàng trăm KB của Riot để tránh lỗi 413 Payload Too Large)
function sanitizeMatchDetailClient(detail: any) {
  if (!detail || typeof detail !== 'object') return null;
  try {
    if (detail.info && Array.isArray(detail.info.participants)) {
      return {
        metadata: detail.metadata || null,
        info: {
          gameCreation: detail.info.gameCreation,
          gameDuration: detail.info.gameDuration,
          gameEndTimestamp: detail.info.gameEndTimestamp,
          gameId: detail.info.gameId,
          gameMode: detail.info.gameMode,
          gameType: detail.info.gameType,
          gameVersion: detail.info.gameVersion,
          mapId: detail.info.mapId,
          queueId: detail.info.queueId,
          teams: detail.info.teams,
          participants: detail.info.participants.map((p: any) => ({
            teamId: p.teamId,
            win: p.win,
            championName: p.championName,
            champLevel: p.champLevel,
            riotIdGameName: p.riotIdGameName,
            summonerName: p.summonerName,
            riotIdTagline: p.riotIdTagline,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            item0: p.item0,
            item1: p.item1,
            item2: p.item2,
            item3: p.item3,
            item4: p.item4,
            item5: p.item5,
            item6: p.item6,
            totalDamageDealtToChampions: p.totalDamageDealtToChampions,
            goldEarned: p.goldEarned,
            totalMinionsKilled: p.totalMinionsKilled,
            neutralMinionsKilled: p.neutralMinionsKilled,
          })),
        },
      };
    }
    return detail;
  } catch {
    return detail;
  }
}

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

        // Tự động lưu vào DB luôn
        const updateBody = {
          ingame_name: formattedName,
          current_rank: formattedRank,
          current_lp: league.leaguePoints ?? 0
        };

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

        toast.success(`Đã cập nhật: ${formattedRank} - ${league.leaguePoints ?? 0} ${rankUnit} (${targetQueueName})`);

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

  // Helper tính KDA
  const calculateKDA = (k: number, d: number, a: number) => {
    return ((k + a) / Math.max(1, d)).toFixed(1);
  };

  // Helper tính Team KDA
  const calculateTeamStats = (participants: any[]) => {
    const teams: Record<number, { kills: number, deaths: number, assists: number }> = { 100: { kills: 0, deaths: 0, assists: 0 }, 200: { kills: 0, deaths: 0, assists: 0 } };
    participants.forEach(p => {
      if (teams[p.teamId]) { teams[p.teamId].kills += p.kills; teams[p.teamId].deaths += p.deaths; teams[p.teamId].assists += p.assists; }
    });
    return teams;
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
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
            href={user?.role === 'BOOSTER' ? '/booster/my-orders' : user?.role === 'ADMIN' ? '/admin/orders' : '/orders'}
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {(() => {
              const gameCode = order.snapshot?.gameCode || order.details?.game || 'LOL';
              const gameMeta = getGameMeta(gameCode);
              const serviceName = formatServiceName(order.serviceType || order.snapshot?.serviceSlug, order.details);

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
                          <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                          <span>Máy chủ: <strong className="text-zinc-300">{order.details.server}</strong></span>
                        </>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              );
            })()}

            {/* Dispute Deadline Card (UI chuẩn theo ảnh 2) */}
            {order.status === 'COMPLETED' && disputeDeadline && (
              <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-md space-y-3 relative z-10">
                {/* Title */}
                <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
                  <span>Thời hạn gửi khiếu nại</span>
                </div>

                {/* Content: Hạn cuối + Thời gian + Badge đếm ngược */}
                <div className="space-y-1">
                  <div className="text-xs text-zinc-400 font-medium">Hạn cuối</div>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                      {(() => {
                        const h = disputeDeadline.getHours();
                        const period = h < 6 ? 'Rạng sáng' : h < 12 ? 'Sáng' : h < 18 ? 'Chiều' : 'Tối';
                        return `${format(disputeDeadline, 'HH:mm:ss')} (${period}) • ${format(disputeDeadline, 'dd/MM/yyyy')}`;
                      })()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${disputeRemainingMs > 0
                        ? 'bg-amber-950/50 border-amber-900/60 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}>
                      {formatDisputeCountdown(disputeRemainingMs)}
                    </span>
                  </div>
                </div>

                {/* Footer description */}
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  Nếu chưa hài lòng hoặc gặp vấn đề với dịch vụ, đừng ngần ngại gửi khiếu nại để LeoRank hỗ trợ bạn nhé!
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-3">
              {/* Khi đơn đang chờ tuyển thủ nhận (PAID hoặc PENDING_PAYMENT) và người xem là Customer */}
              {isCustomer && ['PENDING_PAYMENT', 'PAID'].includes(order.status) && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-bold text-amber-200">Đơn hàng đang chờ Tuyển thủ nhận việc trên Sàn</p>
                      <p className="text-xs text-amber-300/80 mt-0.5">Bạn có thể chỉnh sửa thông tin tài khoản hoặc hủy đơn để nhận lại 100% tiền cọc về ví bất kỳ lúc nào.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsEditAccountModalOpen(true)}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-zinc-700 text-sm shadow-md"
                    >
                      <Pencil className="w-4 h-4 text-blue-400" /> Chỉnh sửa thông tin tài khoản
                    </button>
                    <button
                      onClick={() => setIsCancelModalOpen(true)}
                      className="w-full py-3 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/30 text-sm shadow-md"
                    >
                      <XCircle className="w-4 h-4 text-red-500" /> Hủy đơn hàng (Hoàn 100% tiền)
                    </button>
                  </div>
                </div>
              )}

              {isBooster && order.status === 'APPROVED' && (
                <button onClick={() => handleUpdateStatus('IN_PROGRESS')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <Play className="w-4 h-4" /> Bắt đầu cày
                </button>
              )}
              {isBooster && order.status === 'IN_PROGRESS' && (
                <button onClick={() => handleUpdateStatus('COMPLETED')} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20">
                  <CheckSquare className="w-4 h-4" /> Báo cáo hoàn thành
                </button>
              )}

              {/* Nút báo lỗi chung CHỈ hiển thị khi đơn đã có tuyển thủ nhận việc hoặc hoàn thành (Customer trong vòng 24h) */}
              {['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status) && (
                isDisputeExpired ? (
                  <div className="w-full py-3 px-4 bg-zinc-900/60 text-zinc-400 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-zinc-800 text-center">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Đã quá thời hạn 24h khiếu nại — Số tiền đơn hàng đã thuộc hoàn toàn về Booster.</span>
                  </div>
                ) : (
                  <button onClick={() => setIsDisputeModalOpen(true)} className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/20">
                    <AlertTriangle className="w-4 h-4" /> Báo lỗi / Có vấn đề
                  </button>
                )
              )}

              {/* Nút Đánh giá Booster */}
              {canRate && (
                <button onClick={() => setIsRatingModalOpen(true)} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-600/20">
                  <Star className="w-4 h-4 fill-current" /> Đánh giá Booster
                </button>
              )}

              {/* Thông báo quá hạn đánh giá */}
              {isCustomer && order.status === 'COMPLETED' && !order.rating && isRatingExpired && (
                <div className="w-full py-3 bg-zinc-900/50 text-zinc-500 font-medium rounded-xl flex items-center justify-center gap-2 border border-zinc-800">
                  <Clock className="w-4 h-4" /> Đã hết hạn đánh giá (Quá 7 ngày)
                </div>
              )}
            </div>
          </div>

          {/* TABS: Info vs Progress */}
          <div id="order-tabs-container" className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg scroll-mt-24">
            <div className="flex border-b border-zinc-800">
              <button onClick={() => setActiveTab('INFO')} className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'INFO' ? 'bg-zinc-800/50 text-white border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30'}`}>
                Thông tin đơn hàng
              </button>
              <button onClick={() => setActiveTab('PROGRESS')} className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'PROGRESS' ? 'bg-zinc-800/50 text-white border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30'}`}>
                Tiến độ & Trận đấu
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'INFO' ? (
                <div className="space-y-6">
                  {/* Unified Game Profile & Rank Status Block */}
                  {(() => {
                    const gameCode = order.snapshot?.gameCode || order.details?.game || 'LOL';
                    const gameMeta = getGameMeta(gameCode);
                    const serviceName = formatServiceName(order.serviceType || order.snapshot?.serviceSlug);

                    return (
                      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl animate-in fade-in duration-300 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <h3 className="text-sm font-bold text-zinc-300 uppercase">
                              Hồ sơ Game & Lộ trình Cày Rank
                            </h3>
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-bold uppercase border"
                              style={{
                                backgroundColor: `${gameMeta.accentColor}15`,
                                color: gameMeta.accentColor,
                                borderColor: `${gameMeta.accentColor}30`,
                              }}
                            >
                              {gameMeta.name}
                            </span>
                          </div>

                          {order.details?.ingame_name && (
                            <button
                              onClick={handleCheckAndSaveRank}
                              disabled={isCheckingRank}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                              title="Làm mới Rank từ Riot"
                            >
                              {isCheckingRank ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            </button>
                          )}
                        </div>

                        {/* Rank / Match Progression Display */}
                        <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {(order.serviceType === 'MATCHES' || order.details?.is_matches) ? (
                            <div>
                              <span className="text-xs text-zinc-500 block mb-1">Mục tiêu cày trận:</span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xl sm:text-2xl font-black text-white">
                                  Cày {order.details?.match_count || order.details?.matches || 1} Trận
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  {order.details?.queue_type === 'FLEX' ? 'Linh Hoạt (Flex)' : 'Đơn / Đôi'}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 mt-1">
                                Tiến độ hiện tại: <span className="text-emerald-400 font-bold font-mono">{order.match_history?.length || 0}</span> / <span className="font-bold font-mono">{order.details?.match_count || order.details?.matches || 1}</span> trận (Chỉ tính số lượng trận)
                              </div>
                            </div>
                          ) : (order.serviceType === 'PLACEMENTS' || order.details?.is_placements) ? (
                            <div>
                              <span className="text-xs text-zinc-500 block mb-1">Mục tiêu phân hạng:</span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xl sm:text-2xl font-black text-white">
                                  {order.details?.placement_matches || order.details?.matches || 5} Trận Phân Hạng
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Rank cũ: {formatRankDisplayVi(order.details?.previous_rank_label || order.details?.previous_season_rank || 'Chưa có')}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 mt-1">
                                Tiến độ hiện tại: <span className="text-emerald-400 font-bold font-mono">{order.match_history?.length || 0}</span> / <span className="font-bold font-mono">{order.details?.placement_matches || order.details?.matches || 5}</span> trận phân hạng
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs text-zinc-500 block mb-1">Tiến độ rank mục tiêu:</span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xl sm:text-2xl font-black text-white">
                                  {formatRankDisplayVi(
                                    liveLeagueInfo
                                      ? (['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(liveLeagueInfo.tier?.toUpperCase())
                                        ? liveLeagueInfo.tier
                                        : `${liveLeagueInfo.tier} ${liveLeagueInfo.rank || ''}`.trim())
                                      : (order.details?.current_rank || order.details?.segment_label || (order.details?.is_point_boost ? 'Cao Thủ' : 'Khởi điểm'))
                                  )}
                                </span>
                                {(order.details?.desired_rank || order.details?.is_point_boost) && (
                                  <>
                                    <span className="text-blue-400 font-bold text-lg">&rarr;</span>
                                    <span className="text-xl sm:text-2xl font-black text-cyan-300">
                                      {order.details?.desired_rank
                                        ? formatRankDisplayVi(order.details.desired_rank)
                                        : `${order.details?.segment_label || 'Cao Thủ'} (${order.details?.desired_points ?? order.details?.target_points ?? 0} ${order.details?.unit || 'LP'})`
                                      }
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="text-xs text-blue-400 font-bold mt-1">
                                {liveLeagueInfo
                                  ? `${liveLeagueInfo.leaguePoints ?? 0} LP`
                                  : order.details?.is_point_boost
                                    ? `${order.details?.current_points ?? 0} / ${order.details?.desired_points ?? order.details?.target_points ?? 0} ${order.details?.unit || 'LP'} (+${order.details?.gained_points ?? 0} ${order.details?.unit || 'LP'})`
                                    : (order.details?.current_lp !== undefined && order.details?.current_lp !== null)
                                      ? `${order.details.current_lp} LP`
                                      : order.details?.steps_count
                                        ? `${order.details.steps_count} Bậc Rank`
                                        : ''
                                }
                              </div>
                            </div>
                          )}

                          {liveLeagueInfo && (
                            <div className="text-right text-xs text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                              <div>Thắng: <span className="text-green-400 font-bold">{liveLeagueInfo.wins}</span></div>
                              <div>Thua: <span className="text-red-400 font-bold">{liveLeagueInfo.losses}</span></div>
                              <div>Tỉ lệ: <span className="text-white">{Math.round((liveLeagueInfo.wins / (liveLeagueInfo.wins + liveLeagueInfo.losses)) * 100)}%</span></div>
                            </div>
                          )}
                        </div>

                        {/* Booster Input Area */}
                        {isBooster && ['IN_PROGRESS', 'APPROVED'].includes(order.status) && (
                          <div className="pt-3 border-t border-zinc-800">
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Cập nhật Ingame & Check Rank</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={ingameName}
                                onChange={(e) => setIngameName(e.target.value)}
                                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                placeholder="Tên Ingame#Tag..."
                              />
                              <button
                                onClick={handleCheckAndSaveRank}
                                disabled={isCheckingRank}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap w-full sm:w-auto"
                              >
                                {isCheckingRank ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kiểm tra'}
                              </button>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2">
                              * Nhập tên ingame chính xác để hệ thống tự động lấy Rank và {(order.snapshot?.gameCode || order.details?.game || order.details?.gameCode || '').toUpperCase().includes('VAL') ? 'RR' : 'LP'} từ {(order.snapshot?.gameCode || order.details?.game || order.details?.gameCode || '').toUpperCase().includes('VAL') ? 'Valorant' : 'Riot Games'}.
                            </p>

                            {/* Danh sách các bậc xếp hạng tìm thấy */}
                            {availableLeagues.length > 0 && (
                              <div className="mt-3 p-3 bg-zinc-900/90 rounded-xl border border-zinc-800/80 space-y-2">
                                <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                                  <span>⚡</span> Bậc xếp hạng tìm thấy:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {availableLeagues.map((l: any, idx: number) => {
                                    const isVal = (order.snapshot?.gameCode || order.details?.game || order.details?.gameCode || '').toUpperCase().includes('VAL');
                                    const isSolo = l.queueType === 'RANKED_SOLO_5x5';
                                    const isCompVal = l.queueType === 'COMPETITIVE';
                                    const queueLabel = isCompVal ? 'Competitive' : (isSolo ? 'Đơn / Đôi' : 'Linh Hoạt');
                                    const isApex = ['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(l.tier?.toUpperCase());
                                    const tierVi = formatRankDisplayVi(l.tier);
                                    const rankText = isApex ? tierVi : `${tierVi} ${l.rank || ''}`.trim();
                                    const isSelected = liveLeagueInfo?.queueType === l.queueType;
                                    const unit = isVal ? 'RR' : 'LP';
                                    const icon = isCompVal ? '🎯' : (isSolo ? '👑' : '🛡️');

                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => applySelectedLeague(l)}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all border ${isSelected
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/40 shadow-sm'
                                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                                          }`}
                                      >
                                        <span className="text-base">{icon}</span>
                                        <div className="text-left">
                                          <div className="text-[10px] text-zinc-400 font-medium">{queueLabel}</div>
                                          <div className="font-bold text-white text-xs">{rankText} <span className="text-cyan-400 font-normal">({l.leaguePoints ?? 0} {unit})</span></div>
                                        </div>
                                        {l.wins > 0 && (
                                          <span className="text-[10px] text-zinc-500 border-l border-zinc-800 pl-2">
                                            {l.wins}W {l.losses > 0 ? `/ ${l.losses}L` : ''}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Customer View of Ingame Name */}
                        {!isBooster && (
                          <div className="pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Tên Ingame:</span>
                            <span className="font-medium text-white font-mono bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                              {order.details?.ingame_name || 'Chưa cập nhật'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Booster Info */}
                  {!isBooster && (
                    <div>
                      <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-400" /> Thông tin Tuyển thủ (Booster)
                      </h3>
                      {order.boosterId ? (
                        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700 flex items-center justify-center">
                                {order.boosterId.profile?.avatar ? (
                                  <img
                                    src={order.boosterId.profile.avatar}
                                    alt={order.boosterId.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 text-zinc-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white text-base truncate">
                                    {boosterProfile?.displayName || order.boosterId.username}
                                  </span>
                                  <span className="text-xs text-zinc-500 font-mono">
                                    @{order.boosterId.username}
                                  </span>
                                  {order.boosterId.booster_info?.isReady !== undefined && (
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${order.boosterId.booster_info.isReady
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                        }`}
                                    >
                                      {order.boosterId.booster_info.isReady ? 'Đang sẵn sàng' : 'Tạm nghỉ'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                                    {Number(boosterProfile?.rating ?? order.boosterId.booster_info?.rating ?? 5).toFixed(1)}
                                  </span>
                                  <span>
                                    {boosterProfile?.completedOrders ?? order.boosterId.booster_info?.completed_orders ?? 0} đơn hoàn thành
                                  </span>
                                  {order.boosterId.booster_info?.ingame_name && (
                                    <span className="text-zinc-300">
                                      In-game: <strong className="font-mono text-white">{order.boosterId.booster_info.ingame_name}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Link
                              href={`/b/${order.boosterId.username}`}
                              target="_blank"
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors shrink-0"
                            >
                              <span>Xem hồ sơ</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>

                          {(boosterProfile?.bio || order.boosterId.booster_info?.bio) && (
                            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/70 p-3 rounded-lg border border-white/5">
                              {boosterProfile?.bio || order.boosterId.booster_info?.bio}
                            </p>
                          )}

                          {/* Chi tiết liên hệ & thông tin game của Booster */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-zinc-800/80">
                            {order.boosterId.email && (
                              <div>
                                <span className="text-zinc-500 block">Email liên hệ</span>
                                <span className="text-zinc-200 font-medium">{order.boosterId.email}</span>
                              </div>
                            )}
                            {order.boosterId.profile?.discord_id && (
                              <div>
                                <span className="text-zinc-500 block">Discord ID</span>
                                <span className="text-zinc-200 font-mono">{order.boosterId.profile.discord_id}</span>
                              </div>
                            )}
                            {order.boosterId.phoneNumber && (
                              <div>
                                <span className="text-zinc-500 block">Số điện thoại</span>
                                <a
                                  href={`tel:${order.boosterId.phoneNumber}`}
                                  className="text-emerald-400 hover:underline font-mono font-semibold"
                                >
                                  {order.boosterId.phoneNumber}
                                </a>
                              </div>
                            )}
                            {order.boosterId.phoneNumber && (() => {
                              const cleanPhone = String(order.boosterId.phoneNumber).replace(/[^\d+]/g, '');
                              return (
                                <div>
                                  <span className="text-zinc-500 block">Số điện thoại</span>
                                  {isCustomer ? (
                                    <>
                                      {/* Mobile (Customer): chỉ hiển thị icon Phone, bấm vào tự mở ứng dụng gọi điện nhập sẵn SĐT */}
                                      <a
                                        href={`tel:${cleanPhone}`}
                                        aria-label="Gọi điện cho Booster"
                                        title="Gọi điện cho Booster"
                                        className="inline-flex md:hidden items-center justify-center w-10 h-10 mt-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-500/35 text-emerald-400 transition-all shadow-sm shadow-emerald-500/10"
                                      >
                                        <Phone className="w-5 h-5" />
                                      </a>
                                      {/* Desktop (Customer): giữ nguyên hiển thị số điện thoại */}
                                      <span className="hidden md:inline-block text-emerald-400 font-mono font-semibold">
                                        {order.boosterId.phoneNumber}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-emerald-400 font-mono font-semibold">
                                      {order.boosterId.phoneNumber}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                            {order.boosterId.profile?.facebook_url && (
                              <div>
                                <span className="text-zinc-500 block">Facebook cá nhân</span>
                                <a
                                  href={order.boosterId.profile.facebook_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline font-medium inline-flex items-center gap-1 break-all"
                                >
                                  <span>{order.boosterId.profile.facebook_url}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              </div>
                            )}
                            {(boosterProfile?.services?.length > 0 || order.boosterId.booster_info?.services?.length > 0) && (
                              <div className="sm:col-span-2">
                                <span className="text-zinc-500 block mb-1.5">Dịch vụ cung cấp</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {(boosterProfile?.services || order.boosterId.booster_info?.services || []).map((svc: string) => (
                                    <span
                                      key={svc}
                                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-medium"
                                    >
                                      {svc.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Danh sách Game & Rank sở trường */}
                          {Array.isArray(boosterProfile?.games) && boosterProfile.games.length > 0 && (
                            <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
                              <div className="text-xs text-zinc-500 font-semibold flex items-center gap-1.5">
                                <Gamepad2 className="w-3.5 h-3.5 text-blue-400" /> Hồ sơ Game & Rank sở trường
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {boosterProfile.games.map((g: any, idx: number) => (
                                  <div
                                    key={`${g.gameCode}-${idx}`}
                                    className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 text-xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="font-bold text-white">{g.gameCode}</span>
                                      {Array.isArray(g.servers) && g.servers.length > 0 && (
                                        <span className="text-zinc-400">
                                          Server: <strong className="text-zinc-200">{g.servers.join(', ')}</strong>
                                        </span>
                                      )}
                                    </div>
                                    {Array.isArray(g.ranks) && g.ranks.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {g.ranks.map((r: string) => (
                                          <span
                                            key={r}
                                            className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold"
                                          >
                                            {r}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {(g.roles?.length > 0 || g.champions?.length > 0) && (
                                      <div className="text-[11px] text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                                        {g.roles?.length > 0 && (
                                          <span>Vị trí: <strong className="text-zinc-200">{g.roles.join(', ')}</strong></span>
                                        )}
                                        {g.champions?.length > 0 && (
                                          <span>Tướng tủ: <strong className="text-zinc-200">{g.champions.slice(0, 6).join(', ')}</strong></span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-zinc-950 p-4 rounded-xl border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                          <span className="font-medium">Tuyển thủ: <strong className="text-amber-200">Đang tìm kiếm...</strong> (Đơn hàng đang chờ tuyển thủ tiếp nhận trên sàn)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account Info */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" /> Tài khoản Game
                      </h3>
                      {isCustomer && ['PENDING_PAYMENT', 'PAID'].includes(order.status) && (
                        <button
                          onClick={() => setIsEditAccountModalOpen(true)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 hover:underline"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                        </button>
                      )}
                    </div>

                    {(() => {
                      const username = order.details?.account_info?.username || order.details?.account_username || order.account_credentials?.username || 'Chưa cập nhật';
                      const rawPassword = order.details?.account_info?.password || order.details?.account_password || order.account_credentials?.password || '';
                      const platform = order.details?.account_info?.platform || order.details?.account_type || order.account_credentials?.platform || 'RIOT';

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                          <div>
                            <span className="text-xs text-zinc-500 block">Nền tảng / Loại tài khoản</span>
                            <span className="font-medium text-white uppercase">{platform}</span>
                          </div>
                          <div>
                            <span className="text-xs text-zinc-500 block">Tên tài khoản / Đăng nhập</span>
                            <span className="font-mono text-cyan-300 font-bold text-sm">{username}</span>
                          </div>
                          <div>
                            <span className="text-xs text-zinc-500 block">Mật khẩu</span>
                            <div className="font-mono text-white flex items-center gap-2">
                              <span>{showPassword ? (rawPassword || '••••••••') : '••••••••'}</span>
                              {rawPassword ? (
                                <button
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
                                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              ) : (
                                <Lock className="w-3 h-3 text-zinc-600" />
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-zinc-500 block">Máy chủ (Server)</span>
                            <span className="text-white font-medium">{order.details?.server || 'Mặc định'}</span>
                          </div>
                          <div>
                            <span className="text-xs text-zinc-500 block">Chế độ</span>
                            <span className="text-white">{['SOLO', 'SOLO_DUO'].includes(order.details?.queue_type || order.details?.queueType) ? 'Đơn / Đôi' : (order.details?.queue_type || order.details?.queueType) === 'FLEX' ? 'Linh Hoạt' : (order.details?.queue_type || order.details?.queueType) || 'Mặc định'}</span>
                          </div>
                          {order.details?.note && (
                            <div className="md:col-span-2 pt-2 border-t border-zinc-900">
                              <span className="text-xs text-zinc-500 block">Ghi chú</span>
                              <p className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-white/5 mt-1">{order.details.note}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Service Info */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2"><Trophy className="w-4 h-4" /> Dịch vụ</h3>
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Loại dịch vụ:</span>
                        <span className="text-white font-bold">
                          {formatServiceName(order.serviceType || order.snapshot?.serviceSlug, order.details)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Mục tiêu:</span>
                        <span className="text-blue-400 font-bold text-right">
                          {(() => {
                            if (order.serviceType === 'MATCHES' || order.details?.is_matches) {
                              const queue = order.details?.queue_type === 'FLEX' ? 'Linh hoạt' : 'Đơn / Đôi';
                              const count = order.details?.match_count || order.details?.matches || order.details?.steps_count || order.details?.num_games || 1;
                              return `Cày ${count} trận (${queue})`;
                            }
                            if (order.serviceType === 'PLACEMENTS' || order.details?.is_placements) {
                              const queue = order.details?.queue_type === 'FLEX' ? 'Linh hoạt' : 'Đơn / Đôi';
                              const count = order.details?.placement_matches || order.details?.matches || order.details?.steps_count || order.details?.num_games || 5;
                              const prevRank = order.details?.previous_rank_label || formatRankDisplayVi(order.details?.previous_season_rank || order.details?.prev_rank) || 'Chưa có';
                              return `Cày ${count} trận (${queue} • Mùa trước: ${prevRank})`;
                            }
                            if (order.serviceType === 'NET_WINS') {
                              const isPointBoost = Boolean(order.details?.is_point_boost || order.details?.calc_mode === 'BY_LP' || order.details?.segment);
                              const unit = order.details?.unit || 'LP';
                              const segmentLabel = order.details?.segment_label || (order.details?.segment ? formatRankDisplayVi(order.details.segment) : null);
                              const rankLabel = segmentLabel || formatRankDisplayVi(order.details?.current_rank || order.details?.rank) || 'Khởi điểm';

                              if (isPointBoost) {
                                const start = order.details?.start_lp ?? order.details?.current_points ?? order.details?.current_lp ?? 0;
                                const target = order.details?.target_lp ?? order.details?.desired_points ?? order.details?.target_points ?? (start + (order.details?.gained_points || 0));
                                return `${start} ${unit} ➜ ${target} ${unit} (${rankLabel})`;
                              }

                              return order.details?.calc_mode === 'BY_GAMES' || order.details?.num_games
                                ? `+${order.details?.num_games || 0} Trận thắng (${rankLabel})`
                                : `${order.details?.start_lp ?? order.details?.current_lp ?? 0} LP ➜ ${order.details?.target_lp ?? 0} LP (${rankLabel})`;
                            }
                            if (order.serviceType === 'MASTERY') {
                              return `${order.details.champion} (Lv.${order.details.current_mastery} ➜ Lv.${order.details.desired_mastery})`;
                            }
                            if (order.serviceType === 'ONBET') {
                              return `${order.details.game_count} Trận (${order.details.rank_label})`;
                            }
                            if (order.serviceType === 'COACHING') {
                              return `${order.details.coaching_type} (${order.details.hours} Giờ)`;
                            }
                            // Default (Rank Boost, Leveling, Promotion)
                            const curr = order.details.current_rank ? formatRankDisplayVi(order.details.current_rank) : order.details.current_level;
                            const des = order.details.desired_rank ? formatRankDisplayVi(order.details.desired_rank) : order.details.desired_level;
                            return `${curr} ➜ ${des}`;
                          })()}
                        </span>
                      </div>
                      {/* Vị trí / Đường chỉ định (Hiển thị cân đối 2 bên kèm Logo / Tên đường) */}
                      {hasSpecificRole && (
                        <div className="flex justify-between items-start pt-3 border-t border-zinc-800 gap-3">
                          <span className="text-zinc-500 shrink-0">Vị trí / Đường:</span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {extractedRoles.length > 0 ? (
                              extractedRoles.map((roleId: string) => {
                                const meta = getLaneMeta(roleId, order.game);
                                return (
                                  <span
                                    key={roleId}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 font-bold text-xs shadow-sm"
                                  >
                                    {meta.image && (
                                      <Image
                                        src={meta.image}
                                        alt={meta.name}
                                        width={16}
                                        height={16}
                                        className="w-4 h-4 object-contain"
                                      />
                                    )}
                                    <span>{meta.name}</span>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 font-bold text-xs shadow-sm">
                                <Image
                                  src="/images/lane-aov/random-lane.png"
                                  alt="Đường Bất Kỳ"
                                  width={16}
                                  height={16}
                                  className="w-4 h-4 object-contain"
                                />
                                <span>Đường Bất Kỳ (Linh hoạt)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Các tùy chọn mở rộng khác (Cày siêu tốc, Duo, Stream, Đặt lịch) */}
                      {simpleOptions.length > 0 && (
                        <div className="flex justify-between items-center pt-2.5 border-t border-zinc-800 gap-3">
                          <span className="text-zinc-500 shrink-0">Tùy chọn khác:</span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {simpleOptions.map(([key, val]) => (
                              <span key={key} className="px-2.5 py-1 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-300 font-medium">
                                {optionLabels[key] || key}
                                {Array.isArray(val) && typeof val[0] !== 'object' ? `: ${val.join(', ')}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Khung giờ nghỉ (Schedule Block) nếu có */}
                      {scheduleOption && Array.isArray(scheduleOption[1]) && scheduleOption[1].length > 0 && (
                        <div className="pt-2.5 border-t border-zinc-800">
                          <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/15">
                            <span className="text-red-400 text-xs block mb-2 flex items-center gap-1.5 font-bold">
                              <Clock size={12} /> Khung giờ nghỉ (Cấm tuyển thủ chơi):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {scheduleOption[1].map((w: any, idx: number) => (
                                <span key={idx} className="text-xs font-bold px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/25 rounded-lg flex items-center gap-1.5">
                                  {w.start} - {w.end}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NET WINS SPECIAL VIEW */}
                  {order.serviceType === 'NET_WINS' && (
                    <NetWinsOrderView
                      order={order}
                      isBooster={isBooster}
                      isCustomer={isCustomer}
                      onPayRemaining={handleOpenPayModal}
                      onRefund={handleOpenRefundModal}
                    />
                  )}

                  {/* RANK BOOST SPECIAL VIEW (NEW) */}
                  {order.serviceType === 'RANK_BOOST' && (
                    <RankBoostOrderView order={order} />
                  )}

                  {/* PROMOTION SPECIAL VIEW */}
                  {order.serviceType === 'PROMOTION' && (
                    <PromotionOrderView order={order} />
                  )}

                  {/* PLACEMENTS SPECIAL VIEW */}
                  {order.serviceType === 'PLACEMENTS' && (
                    <PlacementsOrderView order={order} />
                  )}

                  {/* MATCHES SPECIAL VIEW (CÀY THEO SỐ TRẬN) */}
                  {(order.serviceType === 'MATCHES' || order.details?.is_matches) && (
                    <MatchesOrderView order={order} isBooster={isBooster} />
                  )}

                  {/* MASTERY SPECIAL VIEW */}
                  {order.serviceType === 'MASTERY' && (
                    <MasteryOrderView order={order} />
                  )}

                  {/* LEVELING SPECIAL VIEW */}
                  {order.serviceType === 'LEVELING' && (
                    <LevelingOrderView order={order} />
                  )}

                  {/* ONBET SPECIAL VIEW */}
                  {order.serviceType === 'ONBET' && (
                    <OnBetOrderView order={order} />
                  )}

                  {/* COACHING SPECIAL VIEW */}
                  {order.serviceType === 'COACHING' && (
                    <CoachingOrderView
                      order={order}
                      isBooster={isBooster}
                      vodLink={vodLink}
                      setVodLink={setVodLink}
                      onUpdateVodLink={handleUpdateVodLink}
                      isUpdatingVod={isUpdatingVod}
                    />
                  )}

                  {/* Payment Info */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Thanh toán</h3>
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-sm">
                      {Boolean(isBooster && (order.pricing?.funding_source === 'PLATFORM' || (order.pricing?.platform_subsidy && Number(order.pricing.platform_subsidy) > 0))) && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 mb-2">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <CheckCircle2 size={14} className="shrink-0" />
                            <span>Voucher do Hệ thống LeoRank tài trợ 100%</span>
                          </div>
                          <p className="text-zinc-400 leading-relaxed text-[11px]">
                            Khách hàng sử dụng voucher tri ân <b className="text-white font-mono">{order.pricing?.coupon_code || ''}</b> ({Number(order.pricing?.platform_subsidy || order.pricing?.discount_amount || 0).toLocaleString()} đ). Khoản này được Sàn tài trợ bù đủ, thu nhập của bạn được <b className="text-emerald-400">bảo toàn trọn vẹn 100%</b> theo giá niêm yết!
                          </p>
                        </div>
                      )}

                      {Boolean(isBooster && (order.pricing?.listed_price || order.pricing?.original_price) && order.pricing?.discount_amount && Number(order.pricing.discount_amount) > 0) && (
                        <>
                          <div className="flex justify-between text-xs text-zinc-400">
                            <span>Giá niêm yết dịch vụ:</span>
                            <span className="font-mono text-zinc-300">
                              {(Number(order.pricing.listed_price || order.pricing.original_price)).toLocaleString()} đ
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-emerald-400">
                            <span>Voucher giảm giá (Khách dùng):</span>
                            <span className="font-mono">
                              -{Number(order.pricing.discount_amount).toLocaleString()} đ {order.pricing.funding_source === 'PLATFORM' ? '(Sàn bù 100%)' : ''}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60">
                        <span className="text-zinc-400">{isBooster ? 'Thu nhập thực nhận của bạn:' : 'Tổng thanh toán:'}</span>
                        <span className={`text-base font-bold ${isBooster ? 'text-emerald-400' : 'text-white'}`}>
                          {(isBooster
                            ? getBoosterOrderValue(order.pricing)
                            : order.pricing.total_amount
                          ).toLocaleString()} đ
                        </span>
                      </div>
                      {order.pricing.deposit_amount < order.pricing.total_amount ? (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">
                            {['NET_WINS', 'ONBET'].includes(order.serviceType)
                              ? `Đã cọc (${Math.round((order.pricing.deposit_amount / order.pricing.total_amount) * 100)}%):`
                              : 'Đã cọc:'}
                          </span>
                          <span className="text-yellow-400 font-bold">
                            {(isBooster
                              ? getBoosterDepositValue(order.pricing)
                              : order.pricing.deposit_amount
                            ).toLocaleString()} đ
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Trạng thái:</span>
                          <span className="text-green-400 font-bold">Đã thanh toán 100%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transaction History (New Section) */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2"><History className="w-4 h-4" /> Lịch sử giao dịch</h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                      {transactions.length > 0 ? (
                        <div className="divide-y divide-zinc-800">
                          {transactions.map((tx: any) => {
                            // Logic hiển thị dấu và màu sắc (FIX lỗi +- hiển thị cùng lúc)
                            // Trong DB: Payment là âm (-), Deposit/Refund là dương (+)
                            const isPositive = tx.amount > 0;
                            const amountDisplay = isPositive
                              ? `+${tx.amount.toLocaleString()} đ`
                              : `${tx.amount.toLocaleString()} đ`; // Số âm đã có dấu -

                            const isPayment = ['PAYMENT_HOLD', 'PAYMENT_RELEASE', 'WITHDRAWAL'].includes(tx.type);

                            return (
                              <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-zinc-900/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {isPositive ? <ArrowDownLeft className={`w-4 h-4 text-green-500`} /> : <ArrowUpRight className={`w-4 h-4 text-red-500`} />}
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-white">
                                      {tx.type === 'PAYMENT_HOLD' ? (
                                        (order.pricing?.deposit_percent && order.pricing.deposit_percent < 100)
                                          ? `Thanh toán cọc (${order.pricing.deposit_percent}%)`
                                          : 'Thanh toán đơn hàng (100% Escrow)'
                                      ) :
                                        tx.type === 'PAYMENT_RELEASE' ? 'Thanh toán bổ sung' :
                                          tx.type === 'REFUND' ? 'Hoàn tiền vào ví' :
                                            tx.type === 'TIP_SENT' ? 'Gửi tiền Tip cho Booster' :
                                              tx.type === 'TIP_RECEIVED' ? 'Nhận tiền Tip từ khách hàng' :
                                                (tx.description && !tx.description.startsWith('BankAPINotify') ? tx.description : (tx.type === 'DEPOSIT' ? 'Nạp tiền vào tài khoản' : tx.type))}
                                    </div>
                                    <div className="text-xs text-zinc-500">{new Date(tx.createdAt).toLocaleString('vi-VN')}</div>
                                  </div>
                                </div>
                                <div className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                  {amountDisplay}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-zinc-500 text-sm">Chưa có giao dịch nào được ghi nhận.</div>
                      )}
                    </div>
                  </div>

                  {/* Hiển thị chi tiết Đánh giá (Nếu đã đánh giá) */}
                  {order.rating && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> Đánh giá của bạn</h3>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                        {(() => {
                          const stars = typeof order.rating.stars === 'number'
                            ? order.rating.stars
                            : typeof order.rating.rating === 'number'
                              ? order.rating.rating
                              : 5;
                          const label = stars === 5 ? 'Tuyệt vời' : stars === 4 ? 'Rất tốt' : stars === 3 ? 'Bình thường' : stars === 2 ? 'Tệ' : 'Rất tệ';
                          return (
                            <div className="flex items-center gap-2 text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={18} className={i < stars ? "fill-current" : "text-zinc-700"} />
                              ))}
                              <span className="text-white font-bold ml-2">
                                {label}
                              </span>
                            </div>
                          );
                        })()}
                        {(order.rating.comment || order.review) && (
                          <div className="p-3 bg-zinc-900 rounded-lg text-sm text-zinc-300 italic border border-zinc-800 break-words whitespace-pre-wrap">
                            "{order.rating.comment || order.review}"
                          </div>
                        )}
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Gửi lúc: {new Date(order.rating.createdAt || order.updatedAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Match History List */}
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {order.match_history?.length > 0 ? (
                        order.match_history.map((match: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl gap-4"
                          >
                            {/* Left: Result Image & Basic Info */}
                            <div className="flex items-start gap-4">
                              <div className={`w-16 h-16 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0`}>
                                <img
                                  src={match.result === 'WIN' ? '/images/victory.png' : '/images/defeat.png'}
                                  alt={match.result}
                                  className="w-10 h-10 sm:w-8 sm:h-8 object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-base sm:text-sm font-bold text-white truncate">{match.champion}</div>
                                <div className="text-xs text-zinc-400 mb-1">Chế độ: {match.mode}</div>
                                <div className="text-[10px] text-zinc-500">{new Date(match.timestamp).toLocaleString('vi-VN')}</div>
                                {match.reason && <div className="text-xs text-zinc-400 mt-1 italic line-clamp-1">{match.reason}</div>}
                              </div>
                            </div>

                            {/* Right: Stats & Actions */}
                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-4 sm:gap-1 border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
                              {/* LP Change */}
                              <div className={`text-lg sm:text-base font-black ${match.lp_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {match.lp_change > 0 ? '+' : ''}{match.lp_change} <span className="text-xs font-normal text-zinc-500">LP</span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                {/* Eye Button: Hiển thị nếu có detail HOẶC có riotMatchId */}
                                {(match.detail || match.riotMatchId) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleViewMatchDetail(match)}
                                    disabled={loadingDetailMatchId === (match.match_id || match.riotMatchId)}
                                    className="p-2 bg-zinc-900 hover:bg-blue-600 hover:text-white text-blue-400 rounded-lg transition-colors border border-zinc-800 cursor-pointer disabled:opacity-50"
                                    title="Xem chi tiết trận đấu"
                                  >
                                    {loadingDetailMatchId === (match.match_id || match.riotMatchId) ? (
                                      <Loader2 size={16} className="animate-spin text-blue-400" />
                                    ) : (
                                      <Eye size={16} />
                                    )}
                                  </button>
                                ) : (
                                  <div className="p-2 text-zinc-700 border border-zinc-800 rounded-lg cursor-not-allowed" title="Trận đấu nhập thủ công không có dữ liệu Riot / Valorant">
                                    <Eye size={16} />
                                  </div>
                                )}

                                {/* Edit/Delete Buttons (Booster Only) */}
                                {isBooster && order.status === 'IN_PROGRESS' && (
                                  <>
                                    <button onClick={() => handleEditMatch(match)} className="p-2 bg-zinc-900 hover:bg-yellow-600 hover:text-white text-zinc-400 rounded-lg transition-colors border border-zinc-800" title="Sửa">
                                      <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handlePromptDeleteMatch(match)} className="p-2 bg-zinc-900 hover:bg-rose-600 hover:text-white text-zinc-400 rounded-lg transition-colors border border-zinc-800 cursor-pointer" title="Xóa trận đấu">
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-xl"
                        >
                          Chưa có trận đấu nào được cập nhật.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Add Match Form (Booster Only) */}
                  {isBooster && order.status === 'IN_PROGRESS' && (() => {
                    const isMatchesCheck = order.serviceType === 'MATCHES' || order.details?.is_matches;
                    const isPlacementsCheck = order.serviceType === 'PLACEMENTS' || order.details?.is_placements;
                    const maxAllowed = (isMatchesCheck || isPlacementsCheck)
                      ? Number(order.details?.match_count || order.details?.placement_matches || order.details?.matches || order.details?.steps_count || order.details?.num_games || (isMatchesCheck ? 10 : 5))
                      : null;
                    const currentProgress = isMatchesCheck
                      ? (order.match_history || []).filter((m: any) => m.result === 'WIN').length
                      : (order.match_history?.length || 0);
                    const isLimitReached = maxAllowed !== null && currentProgress >= maxAllowed;

                    if (isLimitReached) {
                      return (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 mt-2 shadow-lg shadow-emerald-500/5">
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                          <div className="text-xs">
                            <p className="font-bold text-emerald-400 text-sm">
                              {isMatchesCheck
                                ? `Đã đạt đủ ${currentProgress}/${maxAllowed} trận thắng theo cam kết đơn hàng!`
                                : `Đã cập nhật đủ ${currentProgress}/${maxAllowed} trận theo yêu cầu đơn hàng!`}
                            </p>
                            <p className="text-zinc-400 mt-0.5">Tiến độ trận đấu đã đủ số lượng. Bạn có thể chỉnh sửa các trận đã lưu hoặc nhấn &quot;Báo cáo hoàn thành&quot;.</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsBatchModalOpen(true)}
                          className="w-full py-3 bg-gradient-to-r from-blue-600/25 via-blue-600/15 to-indigo-600/25 border border-blue-500/40 hover:border-blue-400 rounded-xl text-blue-300 hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
                        >
                          <Zap className="w-4 h-4 text-blue-400" /> Nhập nhanh danh sách (Paste)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMatchForm({ mode: 'Rank Đơn/Đôi', champion: '', result: 'WIN', lp_change: '', reason: '' });
                            setEditingMatchId(null);
                            setIsMatchModalOpen(true);
                          }}
                          className="w-full py-3 border-2 border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/60 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-sm cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Thêm thủ công 1 trận
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Chat Window - CHỈ HIỂN THỊ KHI ĐÃ CÓ BOOSTER NHẬN ĐƠN */}
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
                : (user?.role === 'ADMIN' || user?.role === 'STAFF' ? 'ADMIN' : undefined)
          }
          orderContext={{
            serviceType: order.serviceType,
            details: order.details,
          }}
          trigger="side"
        />
      )}

      {/* Modal Hủy Đơn Hàng & Hoàn 100% Tiền */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Xác nhận Hủy Đơn Hàng</h3>
                <p className="text-xs text-zinc-400">Hoàn tiền 100% ngay lập tức vào Ví tài khoản</p>
              </div>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 mb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Mã đơn hàng:</span>
                <span className="font-mono text-cyan-300 font-bold">#{order.orderCode || order._id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Số tiền hoàn trả:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {((order.pricing?.deposit_amount ?? order.pricing?.total_amount) || 0).toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Hình thức hoàn:</span>
                <span className="text-zinc-300 font-medium">Cộng trực tiếp vào số dư ví</span>
              </div>
            </div>

            <div className="space-y-1.5 mb-6">
              <label className="text-xs font-semibold text-zinc-400 block">Lý do hủy đơn (tùy chọn):</label>
              <textarea
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:border-red-500 outline-none h-24"
                placeholder="Ví dụ: Đổi ý, muốn đặt gói cày khác, bận công việc..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                disabled={isSubmittingCancel}
              >
                Đóng
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isSubmittingCancel}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/30"
              >
                {isSubmittingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận hủy & Hoàn tiền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Thông Tin Tài Khoản */}
      {isEditAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Chỉnh sửa tài khoản Game</h3>
                  <p className="text-xs text-zinc-400">Cập nhật ID, mật khẩu hoặc ghi chú cho Tuyển thủ</p>
                </div>
              </div>
              <button onClick={() => setIsEditAccountModalOpen(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Tên đăng nhập / ID:</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-blue-500 outline-none"
                    value={editAccountForm.username}
                    onChange={e => setEditAccountForm({ ...editAccountForm, username: e.target.value })}
                    placeholder="Username..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Mật khẩu game:</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-blue-500 outline-none"
                    value={editAccountForm.password}
                    onChange={e => setEditAccountForm({ ...editAccountForm, password: e.target.value })}
                    placeholder="Mật khẩu..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Nền tảng:</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 outline-none uppercase"
                    value={editAccountForm.platform}
                    onChange={e => setEditAccountForm({ ...editAccountForm, platform: e.target.value })}
                    placeholder="Riot / Steam / Garena..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5 flex items-center justify-between">
                    <span>Máy chủ (Server):</span>
                    <span
                      onClick={() => setIsServerModalOpen(true)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Chọn từ danh sách
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsServerModalOpen(true)}
                    className="w-full bg-zinc-950 border border-zinc-700 hover:border-zinc-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 outline-none flex items-center justify-between transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getServerByCode(editAccountForm.server) ? (
                        <>
                          <ServerFlag code={getServerByCode(editAccountForm.server)?.code} size="sm" />
                          <span className="font-semibold text-white truncate">{getServerByCode(editAccountForm.server)?.name}</span>
                          <span className="text-[11px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-white/5 font-mono shrink-0">
                            {getServerByCode(editAccountForm.server)?.code}
                          </span>
                        </>
                      ) : editAccountForm.server ? (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-zinc-400" />
                          <span className="font-mono text-white font-bold">{editAccountForm.server}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Globe className="w-4 h-4 text-zinc-500" />
                          <span>Chọn máy chủ (VN, SEA, KR...)...</span>
                        </div>
                      )}
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0 ml-2 transition-colors" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Ghi chú thêm cho Tuyển thủ:</label>
                <textarea
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none h-20"
                  value={editAccountForm.note}
                  onChange={e => setEditAccountForm({ ...editAccountForm, note: e.target.value })}
                  placeholder="Ví dụ: Chỉ cày sau 23h đêm, không tiêu Tinh Hoa Lam..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setIsEditAccountModalOpen(false)}
                className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                disabled={isSubmittingEditAccount}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveAccount}
                disabled={isSubmittingEditAccount}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/25"
              >
                {isSubmittingEditAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Select Modal for Edit Account */}
      <ServerSelectModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        selectedServer={editAccountForm.server}
        onSelectServer={(code) => setEditAccountForm((prev) => ({ ...prev, server: code }))}
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

      {/* Centered Modal: Xác nhận thay đổi trạng thái đơn hàng */}
      <Dialog
        open={statusModal.isOpen}
        onOpenChange={(open) => {
          if (!statusModal.loading) {
            setStatusModal((prev) => ({ ...prev, isOpen: open }));
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] bg-[#0c101a] border border-zinc-800/80 text-white p-5 sm:p-6 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl space-y-4">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl relative transition-all ${statusModal.targetStatus === 'IN_PROGRESS'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/20 ring-4 ring-blue-500/10'
                  : statusModal.targetStatus === 'COMPLETED'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20 ring-4 ring-emerald-500/10'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/20 ring-4 ring-amber-500/10'
                }`}
            >
              {statusModal.targetStatus === 'IN_PROGRESS' ? (
                <Play className="w-8 h-8 fill-blue-400 ml-1 drop-shadow-md" />
              ) : statusModal.targetStatus === 'COMPLETED' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
            </div>

            <DialogTitle className="text-lg sm:text-xl font-black text-white tracking-tight">
              {statusModal.targetStatus === 'IN_PROGRESS'
                ? 'Xác nhận Bắt đầu cày'
                : statusModal.targetStatus === 'COMPLETED'
                  ? 'Xác nhận Báo cáo hoàn thành'
                  : 'Xác nhận thay đổi trạng thái'}
            </DialogTitle>

            <DialogDescription className="text-xs text-zinc-400 leading-relaxed max-w-[340px] text-center">
              {statusModal.targetStatus === 'IN_PROGRESS' || statusModal.targetStatus === 'IN_PROCESS'
                ? 'Sau khi bắt đầu cày, trạng thái đơn sẽ chuyển sang "Đang cày...". Khách hàng sẽ nhận được thông báo để theo dõi tiến độ.'
                : statusModal.targetStatus === 'COMPLETED'
                  ? 'Bạn xác nhận đã đạt mục tiêu đơn hàng. Đơn sẽ chuyển sang trạng thái "Hoàn thành" để tiến hành nghiệm thu và quyết toán.'
                  : `Bạn có chắc chắn muốn chuyển trạng thái đơn hàng sang "${getOrderStatusInfo(statusModal.targetStatus).label}"?`}
            </DialogDescription>
          </DialogHeader>

          {/* Chi tiết đơn tóm tắt */}
          {order && (
            <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 space-y-2.5 my-1 text-xs shadow-inner">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-400">Mã đơn hàng:</span>
                <span className="font-mono font-extrabold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                  #{order.orderCode || order._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-400">Dịch vụ:</span>
                <span className="font-bold text-blue-400 text-right truncate max-w-[220px]">
                  {getGameMeta(order.snapshot?.gameCode || order.details?.game || 'LOL').name} • {formatServiceName(order.serviceType || order.snapshot?.serviceSlug, order.details)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-400">Mục tiêu:</span>
                <span className="font-bold text-white text-right">
                  {(() => {
                    if (order.serviceType === 'MATCHES' || order.details?.is_matches) {
                      const count = order.details?.match_count || order.details?.matches || order.details?.steps_count || order.details?.num_games || 1;
                      const queue = order.details?.queue_type === 'FLEX' ? 'Linh hoạt' : 'Đơn / Đôi';
                      return `Cày ${count} trận (${queue})`;
                    }
                    if (order.serviceType === 'PLACEMENTS' || order.details?.is_placements) {
                      const count = order.details?.placement_matches || order.details?.matches || order.details?.steps_count || 5;
                      return `${count} trận phân hạng`;
                    }
                    if (order.serviceType === 'NET_WINS') {
                      return order.details?.num_games ? `+${order.details.num_games} Trận thắng` : `${order.details?.target_lp || 0} LP`;
                    }
                    const curr = order.details?.current_rank ? formatRankDisplayVi(order.details.current_rank) : order.details?.current_level;
                    const des = order.details?.desired_rank ? formatRankDisplayVi(order.details?.desired_rank) : order.details?.desired_level;
                    if (curr && des) return `${curr} ➜ ${des}`;
                    return curr || des || 'Theo yêu cầu';
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300 pt-2 border-t border-zinc-800/80">
                <span className="text-zinc-400">Trạng thái mới:</span>
                <span
                  className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full text-[11px] border ${statusModal.targetStatus === 'IN_PROGRESS'
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : statusModal.targetStatus === 'COMPLETED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusModal.targetStatus === 'IN_PROGRESS'
                        ? 'bg-blue-400 animate-pulse'
                        : 'bg-emerald-400'
                      }`}
                  />
                  {getOrderStatusInfo(statusModal.targetStatus).label}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons - Clean 2-column grid on both mobile & desktop */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80 w-full">
            <button
              type="button"
              disabled={statusModal.loading}
              onClick={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
              className="w-full py-2.5 sm:py-3 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center active:scale-95"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={statusModal.loading}
              onClick={executeStatusUpdate}
              className={`w-full py-2.5 sm:py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 ${statusModal.targetStatus === 'IN_PROGRESS'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30 ring-1 ring-blue-400/40'
                  : statusModal.targetStatus === 'COMPLETED'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
            >
              {statusModal.loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : statusModal.targetStatus === 'IN_PROGRESS' ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                  <span>Bắt đầu ngay</span>
                </>
              ) : statusModal.targetStatus === 'COMPLETED' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác nhận</span>
                </>
              ) : (
                <span>Đồng ý</span>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Centered Modal: Xác nhận xóa trận đấu */}
      <Dialog
        open={deleteMatchModal.isOpen}
        onOpenChange={(open) => {
          if (!deleteMatchModal.loading) {
            setDeleteMatchModal((prev) => ({ ...prev, isOpen: open }));
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] bg-zinc-950 border border-white/10 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/10">
              <Trash2 className="w-7 h-7" />
            </div>

            <DialogTitle className="text-lg font-bold text-white">
              Xác nhận xóa trận đấu
            </DialogTitle>

            <DialogDescription className="text-xs text-zinc-400 leading-relaxed max-w-[320px]">
              Bạn có chắc chắn muốn xóa trận đấu này khỏi lịch sử cày rank? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          {/* Tóm tắt thông tin trận đấu cần xóa */}
          {deleteMatchModal.matchInfo && (
            <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-3.5 space-y-2 my-2 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Chế độ:</span>
                <span className="font-medium text-white">
                  {deleteMatchModal.matchInfo.mode || 'Rank Đơn/Đôi'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Tướng:</span>
                <span className="font-semibold text-blue-300">
                  {deleteMatchModal.matchInfo.champion || 'Chưa rõ'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Kết quả:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${deleteMatchModal.matchInfo.result === 'WIN'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                >
                  {deleteMatchModal.matchInfo.result === 'WIN' ? 'Thắng (Win)' : 'Thua (Loss)'}
                </span>
              </div>
              {deleteMatchModal.matchInfo.lp_change !== undefined && deleteMatchModal.matchInfo.lp_change !== '' && (
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">Điểm LP:</span>
                  <span
                    className={`font-mono font-bold ${Number(deleteMatchModal.matchInfo.lp_change) >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                      }`}
                  >
                    {Number(deleteMatchModal.matchInfo.lp_change) > 0
                      ? `+${deleteMatchModal.matchInfo.lp_change}`
                      : deleteMatchModal.matchInfo.lp_change}{' '}
                    LP
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 sm:space-x-0">
            <button
              type="button"
              disabled={deleteMatchModal.loading}
              onClick={() => setDeleteMatchModal((prev) => ({ ...prev, isOpen: false }))}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteMatchModal.loading}
              onClick={handleConfirmDeleteMatch}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {deleteMatchModal.loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác nhận xóa</span>
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Centered Modal: Nhập nhanh hàng loạt trận đấu */}
      <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col bg-zinc-950 border border-white/10 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Nhập nhanh danh sách trận đấu
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Dán chuỗi Match ID kèm điểm LP để hệ thống tự động nhận diện và cập nhật
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
            {/* Quick Helper Button: Điền trận gần nhất */}
            {(() => {
              const rawQueue = String(order?.details?.queueType || order?.details?.queue_type || order?.serviceType || '').toUpperCase();
              const isFlex = rawQueue.includes('FLEX') || rawQueue.includes('LINH');
              const queueLabel = isFlex ? 'Linh Hoạt' : 'Đơn / Đôi';

              if (recentMatches.length === 0) return null;

              return (
                <div className="flex items-center justify-between bg-zinc-900/60 border border-white/5 rounded-xl p-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Có <strong>{recentMatches.length}</strong> trận {queueLabel} gần nhất:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleText = recentMatches.slice(0, 5).map(id => `${id} +20`).join('\n');
                      handleParseBatchText(sampleText);
                    }}
                    className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Dán nhanh {Math.min(5, recentMatches.length)} trận
                  </button>
                </div>
              );
            })()}

            {/* Textarea dán dữ liệu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Dán danh sách trận (Mỗi trận 1 dòng):</span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {(order.snapshot?.gameCode || order.details?.game || order.details?.gameCode || '').toUpperCase().includes('VAL')
                    ? 'Định dạng: MatchID [+/-RR]'
                    : 'Định dạng: MatchID [+/-LP]'}
                </span>
              </label>
              <textarea
                rows={5}
                value={batchInputText}
                onChange={(e) => handleParseBatchText(e.target.value)}
                placeholder={(order.snapshot?.gameCode || order.details?.game || order.details?.gameCode || '').toUpperCase().includes('VAL')
                  ? `ba7a9a92-be79-494e-bdad-483131edb85c +18\nba7a9a92-be79-494e-bdad-483131edb85c -14`
                  : `VN2_1640656388 +25\nVN2_1640608730 -14\nVN2_1640571634 +20\nVN2_1640492570 +21\nVN2_1640449961 -16`}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              />
            </div>

            {/* Parsed Preview Table */}
            {parsedBatchMatches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Xem trước ({parsedBatchMatches.length} trận):</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                      {parsedBatchMatches.filter(m => m.result === 'WIN').length} Thắng
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                      {parsedBatchMatches.filter(m => m.result === 'LOSS').length} Thua
                    </span>
                    <span className="font-mono text-zinc-400 text-[11px]">
                      Tổng:{' '}
                      <strong className={parsedBatchMatches.reduce((acc, m) => acc + m.lp_change, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {parsedBatchMatches.reduce((acc, m) => acc + m.lp_change, 0) >= 0 ? '+' : ''}
                        {parsedBatchMatches.reduce((acc, m) => acc + m.lp_change, 0)} {(order.snapshot?.gameCode || order.details?.game || order.details?.gameCode || '').toUpperCase().includes('VAL') ? 'RR' : 'LP'}
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isFetchingRiotBatch}
                    onClick={handleAutoFetchRiotForBatch}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isFetchingRiotBatch ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang kéo trận...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3 h-3" />
                        <span>{(order.snapshot?.gameCode || order.details?.game || order.details?.gameCode || '').toUpperCase().includes('VAL') ? 'Lấy KDA & Agent' : 'Lấy KDA & Tướng'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-zinc-900/70 border border-white/5 rounded-xl max-h-48 overflow-y-auto divide-y divide-white/5">
                  {parsedBatchMatches.map((m, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-white/[0.02]">
                      <div className="flex items-center gap-2.5">
                        <span className="text-zinc-500 font-mono text-[11px] w-4">{idx + 1}.</span>
                        <div>
                          <div className="font-mono font-bold text-white text-xs">{m.matchId}</div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                            {m.champion && <span className="text-blue-300 font-semibold">{m.champion}</span>}
                            {m.reason && <span className="text-zinc-500">• {m.reason}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${m.result === 'WIN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                          {m.result === 'WIN' ? 'Thắng' : 'Thua'}
                        </span>
                        <span className={`font-mono font-bold text-xs w-16 text-right ${m.lp_change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                          {m.lp_change > 0 ? `+${m.lp_change}` : m.lp_change} {(order.snapshot?.gameCode || order.details?.game || order.details?.gameCode || '').toUpperCase().includes('VAL') ? 'RR' : 'LP'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setParsedBatchMatches(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          title="Xóa trận này khỏi danh sách dán"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 sm:space-x-0">
            <button
              type="button"
              disabled={isSubmittingBatch}
              onClick={() => {
                setIsBatchModalOpen(false);
                setBatchInputText('');
                setParsedBatchMatches([]);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSubmittingBatch || parsedBatchMatches.length === 0}
              onClick={handleSaveBatchMatches}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingBatch ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu tất cả ({parsedBatchMatches.length} trận)</span>
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-6 h-6 text-red-500" /> Báo lỗi / Khiếu nại</h3>
            <textarea
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white mb-4 h-32"
              placeholder="Mô tả vấn đề của bạn (VD: Tài khoản sai mật khẩu, bị khóa, Booster vi phạm...)"
              value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsDisputeModalOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Hủy</button>
              <button onClick={handleDispute} disabled={isSubmittingDispute} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center justify-center w-32 disabled:opacity-50">
                {isSubmittingDispute
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : 'Gửi yêu cầu'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Update Modal */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-blue-500" />
                {editingMatchId ? 'Chỉnh sửa trận đấu' : 'Cập nhật trận đấu'}
              </h3>
              <button onClick={handleCancelEdit} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>

            {/* Riot Match Fetcher (Only for new matches) */}
            {!editingMatchId && (
              <div className="space-y-2 mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder={(order?.snapshot?.gameCode || order?.details?.game || order?.details?.gameCode || '').toUpperCase().includes('VAL') ? "Nhập Match ID Valorant (VD: ba7a9a92-be79-494e-bdad-483131edb85c)" : "Nhập Match ID (VD: 1640656388 hoặc VN2_1640656388)"}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                    value={riotMatchId}
                    onChange={e => setRiotMatchId(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleFetchRiotMatch}
                    disabled={isFetchingRiot}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isFetchingRiot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Lấy Info
                  </button>
                </div>

                {(() => {
                  const rawQueue = String(order?.details?.queueType || order?.details?.queue_type || order?.serviceType || '').toUpperCase();
                  const isFlex = rawQueue.includes('FLEX') || rawQueue.includes('LINH');
                  const queueBadge = isFlex ? 'Linh Hoạt' : 'Đơn / Đôi';

                  return (
                    <div className="bg-zinc-950/80 border border-white/5 rounded-xl p-2.5 space-y-1.5">
                      <div className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-zinc-200">
                          <History className="w-3.5 h-3.5 text-blue-400" />
                          Trận đấu gần đây ({queueBadge}): <strong className="text-blue-400">{recentMatches.length}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={fetchRecentMatchesForOrder}
                            title="Tải lại danh sách trận từ Riot"
                            className="text-zinc-400 hover:text-blue-400 transition-colors p-0.5 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] text-zinc-500">Bấm để tự điền</span>
                        </div>
                      </div>
                      {recentMatches.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {recentMatches.slice(0, 10).map((mId) => (
                            <button
                              key={mId}
                              type="button"
                              onClick={() => setRiotMatchId(mId)}
                              className={`text-[11px] font-mono px-2 py-1 rounded border transition-colors cursor-pointer ${riotMatchId === mId
                                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 font-bold'
                                  : 'bg-zinc-900 text-zinc-300 border-white/5 hover:border-blue-500/30 hover:text-white'
                                }`}
                            >
                              {mId}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-zinc-500 py-0.5 italic flex items-center justify-between">
                          <span>Chưa có trận {queueBadge} gần đây của tài khoản này.</span>
                          <button
                            type="button"
                            onClick={fetchRecentMatchesForOrder}
                            className="text-blue-400 hover:underline text-[10px] cursor-pointer"
                          >
                            Quét lại
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <form onSubmit={handleSaveMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Tướng (VD: Lee Sin)" className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white" value={matchForm.champion} onChange={e => setMatchForm({ ...matchForm, champion: e.target.value })} required />
                <select className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white" value={matchForm.result} onChange={e => setMatchForm({ ...matchForm, result: e.target.value })}>
                  <option value="WIN">Thắng (Win)</option>
                  <option value="LOSS">Thua (Loss)</option>
                </select>
              </div>
              <input type="number" placeholder="Điểm (+/- LP)" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white" value={matchForm.lp_change} onChange={e => setMatchForm({ ...matchForm, lp_change: e.target.value })} required />
              <input type="text" placeholder="Ghi chú (Tùy chọn)" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white" value={matchForm.reason} onChange={e => setMatchForm({ ...matchForm, reason: e.target.value })} />

              <button type="submit" disabled={isAddingMatch} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                {isAddingMatch ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingMatchId ? 'Lưu thay đổi' : 'Thêm trận đấu')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Match Detail Popup (Eye Icon) */}
      {selectedMatchDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-yellow-500" /> Chi tiết trận đấu
              </h3>
              <button onClick={() => setSelectedMatchDetail(null)} className="text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto p-4 md:p-6 space-y-6">
              {(() => {
                // Xác định tên người chơi để highlight
                const targetName = (order.details.ingame_name || order.details.account_username || '').toLowerCase().replace(/\s/g, '').replace('#', '');

                // TRƯỜNG HỢP 1: TRẬN ĐẤU VALORANT (HenrikDev format)
                if (selectedMatchDetail.players?.all_players) {
                  const allPlayers = selectedMatchDetail.players.all_players;
                  const bluePlayers = allPlayers.filter((p: any) => p.team?.toLowerCase() === 'blue');
                  const redPlayers = allPlayers.filter((p: any) => p.team?.toLowerCase() === 'red');
                  const blueWon = selectedMatchDetail.teams?.blue?.has_won;
                  const redWon = selectedMatchDetail.teams?.red?.has_won;
                  const blueRounds = selectedMatchDetail.teams?.blue?.rounds_won ?? 0;
                  const redRounds = selectedMatchDetail.teams?.red?.rounds_won ?? 0;

                  const ValTeamBlock = ({ players, color, title, won, rounds }: any) => (
                    <div className="space-y-3">
                      <div className={`flex justify-between items-center pb-2 border-b ${color === 'blue' ? 'border-blue-500/30' : 'border-red-500/30'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>{title}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${won ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {won ? 'Chiến Thắng' : 'Thất Bại'} ({rounds} Rounds)
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {players.map((p: any, idx: number) => {
                          const pFull = `${p.name || ''}#${p.tag || ''}`.toLowerCase().replace(/\s/g, '');
                          const isMe = targetName && (pFull.includes(targetName) || targetName.includes(p.name?.toLowerCase()));
                          const agentIcon = p.assets?.agent?.small || p.assets?.agent?.bust || '';

                          return (
                            <div key={idx} className={`flex gap-3 p-3 rounded-xl border transition-colors ${isMe ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900'}`}>
                              <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 flex items-center justify-center">
                                {agentIcon ? (
                                  <img src={agentIcon} alt={p.character} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-zinc-400">{p.character?.slice(0, 2)}</span>
                                )}
                                <div className="absolute bottom-0 right-0 bg-black/80 text-[9px] text-white px-1 rounded-tl font-mono">
                                  {p.level || p.character}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                                <div className="flex justify-between items-start">
                                  <div className="min-w-0 pr-2">
                                    <div className={`text-sm font-bold truncate ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                                      {p.name}#{p.tag} {isMe && '(Tôi)'}
                                    </div>
                                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                      <span className="font-semibold text-blue-300">{p.character}</span>
                                      {p.currenttier_patched && <span className="text-zinc-500">• {p.currenttier_patched}</span>}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className={`text-sm font-mono font-bold ${isMe ? 'text-yellow-200' : 'text-white'}`}>
                                      {p.stats?.kills}/<span className="text-red-400">{p.stats?.deaths}</span>/{p.stats?.assists}
                                    </div>
                                    <div className="text-[10px] font-bold text-zinc-500">
                                      {calculateKDA(p.stats?.kills ?? 0, p.stats?.deaths ?? 0, p.stats?.assists ?? 0)} KDA • {p.stats?.score} pts
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                        <div>Map: <span className="text-white font-bold">{selectedMatchDetail.metadata?.map}</span> • Mode: <span className="text-cyan-400 font-bold">{selectedMatchDetail.metadata?.mode}</span></div>
                        <div>Thời gian: <span className="text-white font-mono">{Math.floor((selectedMatchDetail.metadata?.game_length || 0) / 60)} phút</span></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ValTeamBlock players={bluePlayers} color="blue" title="Blue Team" won={blueWon} rounds={blueRounds} />
                        <ValTeamBlock players={redPlayers} color="red" title="Red Team" won={redWon} rounds={redRounds} />
                      </div>
                    </div>
                  );
                }

                // TRƯỜNG HỢP 2: TRẬN ĐẤU LEAGUE OF LEGENDS (Riot format)
                if (selectedMatchDetail.info?.participants) {
                  const teams = calculateTeamStats(selectedMatchDetail.info.participants);
                  const blueTeam = selectedMatchDetail.info.participants.filter((p: any) => p.teamId === 100);
                  const redTeam = selectedMatchDetail.info.participants.filter((p: any) => p.teamId === 200);

                  const TeamBlock = ({ teamId, players, color, title }: any) => {
                    const isWin = players.length > 0 ? players[0].win : false;
                    return (
                      <div className="space-y-3">
                        <div className={`flex justify-between items-center pb-2 border-b ${color === 'blue' ? 'border-blue-500/30' : 'border-red-500/30'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>{title}</span>
                            {players.length > 0 && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${isWin ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {isWin ? 'Chiến Thắng' : 'Thất Bại'}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-mono text-white">
                            {teams[teamId]?.kills ?? 0} / <span className="text-red-400">{teams[teamId]?.deaths ?? 0}</span> / {teams[teamId]?.assists ?? 0}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {players.map((p: any, idx: number) => {
                            const pName = (p.riotIdGameName || p.summonerName || '').toLowerCase().replace(/\s/g, '');
                            const pTag = (p.riotIdTagline || '').toLowerCase();
                            const fullName = pName + pTag;
                            const isMe = targetName && (fullName.includes(targetName) || targetName.includes(pName));

                            return (
                              <div key={idx} className={`flex gap-3 p-3 rounded-xl border transition-colors ${isMe ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900'}`}>
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
                                  <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/${dDragonVersion}/img/champion/${p.championName}.png`}
                                    alt={p.championName}
                                    className={`w-full h-full rounded-lg object-cover border ${isMe ? 'border-yellow-500' : 'border-zinc-700'}`}
                                  />
                                  <div className="absolute bottom-0 right-0 bg-black/80 text-[10px] text-white px-1 rounded-tl border-t border-l border-zinc-700 font-mono">
                                    {p.champLevel}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                                  <div className="flex justify-between items-start">
                                    <div className="min-w-0 pr-2">
                                      <div className={`text-sm font-bold truncate leading-tight ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                                        {p.riotIdGameName || p.summonerName} {isMe && '(Tôi)'}
                                      </div>
                                      <div className="text-[10px] text-zinc-500 truncate leading-tight">
                                        {p.championName}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className={`text-sm font-mono font-bold leading-tight ${isMe ? 'text-yellow-200' : 'text-white'}`}>
                                        {p.kills}/<span className="text-red-400">{p.deaths}</span>/{p.assists}
                                      </div>
                                      <div className="text-[10px] font-bold text-zinc-500 leading-tight">
                                        {calculateKDA(p.kills, p.deaths, p.assists)} KDA
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                    {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5].map((itemId, i) => (
                                      <div key={i} className={`w-6 h-6 sm:w-7 sm:h-7 rounded bg-zinc-800 border overflow-hidden shrink-0 ${isMe ? 'border-yellow-500/30' : 'border-zinc-700'}`}>
                                        {itemId > 0 && <img src={`https://ddragon.leagueoflegends.com/cdn/${dDragonVersion}/img/item/${itemId}.png`} alt="Item" className="w-full h-full object-cover" />}
                                      </div>
                                    ))}
                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-800 border overflow-hidden ml-1 shrink-0 ${isMe ? 'border-yellow-500/30' : 'border-zinc-700'}`}>
                                      {p.item6 > 0 && <img src={`https://ddragon.leagueoflegends.com/cdn/${dDragonVersion}/img/item/${p.item6}.png`} alt="Trinket" className="w-full h-full object-cover" />}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <TeamBlock teamId={100} players={blueTeam} color="blue" title="Blue Team" />
                      <TeamBlock teamId={200} players={redTeam} color="red" title="Red Team" />
                    </div>
                  );
                }

                // Fallback: Nếu không đúng cấu trúc chi tiết
                return (
                  <div className="text-center py-12 text-zinc-400 space-y-2">
                    <p className="font-bold text-white text-base">Thông tin tổng quan trận đấu</p>
                    <p className="text-xs text-zinc-500">Mã trận: {selectedMatchDetail.matchId || 'Không xác định'}</p>
                    <pre className="text-left text-xs bg-zinc-900 p-4 rounded-xl border border-zinc-800 overflow-x-auto text-zinc-300 font-mono mt-4">
                      {JSON.stringify(selectedMatchDetail, null, 2)}
                    </pre>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
