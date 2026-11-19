// src/app/(dashboard)/orders/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { socket } from '@/lib/socket';
import { 
  Loader2, CheckCircle2, AlertCircle, Clock, 
  Shield, DollarSign, CreditCard,
  Play, CheckSquare, Lock, Flag, Swords, Trophy, Save, Crosshair, ArrowLeft, Search, RefreshCw, AlertTriangle, XCircle
} from 'lucide-react';
import { Pencil, Trash2, X, Plus, Eye, EyeOff, History, ArrowUpRight, ArrowDownLeft, Star, User, Award, Gamepad2, ExternalLink, ChevronsUpDown, Globe } from 'lucide-react';
import { toast } from 'sonner';
import ChatWindow from '@/components/chat/ChatWindow';
import { motion, AnimatePresence } from 'framer-motion';
import NetWinsOrderView from '@/components/orders/NetWinsOrderView';
import RankBoostOrderView from '@/components/orders/RankBoostOrderView';
import PromotionOrderView from '@/components/orders/PromotionOrderView';
import PlacementsOrderView from '@/components/orders/PlacementsOrderView';
import MasteryOrderView from '@/components/orders/MasteryOrderView';
import LevelingOrderView from '@/components/orders/LevelingOrderView';
import OnBetOrderView from '@/components/orders/OnBetOrderView';
import CoachingOrderView from '@/components/orders/CoachingOrderView';
import SettlementModal from '@/components/orders/SettlementModal';
import RatingModal from '@/components/orders/RatingModal';
import { GAMES_CATALOG, GameDefinition } from '@/lib/games';
import ServerSelectModal from '@/components/ServerSelectModal';
import { getServerByCode } from '@/lib/servers';
import { getBoosterOrderValue } from '@/lib/orderPricing';
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
function formatServiceName(serviceType?: string) {
  if (!serviceType) return 'Dịch vụ Cày Thuê';
  const slug = serviceType.toLowerCase().replace(/_/g, '-');
  switch (slug) {
    case 'rank-boost':
      return 'Cày Rank / Elo';
    case 'net-wins':
      return 'Cày Rank Cao Cấp';
    case 'placements':
      return 'Phân Hạng Đầu Mùa';
    case 'champion-mastery':
      return 'Thông Thạo Tướng';
    case 'leveling':
      return 'Cày Cấp Độ';
    case 'coaching':
      return 'Huấn Luyện Coaching 1-1';
    default:
      return serviceType.replace(/_/g, ' ');
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
  
  // UI States
  const [activeTab, setActiveTab] = useState<'INFO' | 'PROGRESS'>('INFO');
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
  const [isFetchingRiot, setIsFetchingRiot] = useState(false);
  const [liveLeagueInfo, setLiveLeagueInfo] = useState<any>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isCheckingRank, setIsCheckingRank] = useState(false);
  const [fetchedMatchData, setFetchedMatchData] = useState<any>(null);
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<any>(null);

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
      setIsAddingMatch(true);
      try {
          const method = editingMatchId ? 'PUT' : 'POST';
          const body = {
              ...matchForm,
              matchId: editingMatchId, // Only for PUT
              leagueInfo: liveLeagueInfo,
              detail: fetchedMatchData, // Gửi chi tiết trận đấu lấy từ Riot
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

  const handleDeleteMatch = async (matchId: string) => {
      if (!confirm('Bạn có chắc chắn muốn xóa trận đấu này?')) return;
      try {
          const res = await fetch(`/api/orders/${order._id}/matches?matchId=${matchId}`, { method: 'DELETE' });
          if (res.ok) {
              const data = await res.json();
              setOrder((prev: any) => ({ ...prev, match_history: data.match_history }));
              toast.success('Đã xóa trận đấu');
              socket.emit('update_order', { room: order._id, data: { match_history: data.match_history } });
          } else { toast.error('Lỗi xóa trận đấu'); }
      } catch (e) { toast.error('Lỗi kết nối'); }
  };

  const handleCancelEdit = () => {
      setMatchForm({ mode: 'Rank Đơn/Đôi', champion: '', result: 'WIN', lp_change: '', reason: '' });
      setEditingMatchId(null);
      setFetchedMatchData(null);
      setRiotMatchId('');
      setIsMatchModalOpen(false);
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

  // Hàm check Rank và Lưu (Dùng chung cho cả nút Check & Lưu của Booster và nút Refresh)
  const handleCheckAndSaveRank = async () => {
      // Ưu tiên lấy từ input state (nếu booster đang nhập), nếu không thì lấy từ order details
      const nameToCheck = (ingameName && ingameName.trim()) || order.details.ingame_name || order.details.account_username;
      
      if (!nameToCheck) return toast.error('Vui lòng nhập tên Ingame');

      setIsCheckingRank(true);
      try {
          const res = await fetch('/api/riot/player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ server: order.details.server, name: nameToCheck.trim() })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          const isSoloOrder = ['SOLO', 'SOLO_DUO'].includes(order.details.queueType);
          const primaryQueue = isSoloOrder ? 'RANKED_SOLO_5x5' : 'RANKED_FLEX_SR';
          const secondaryQueue = isSoloOrder ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5';
          
          let league = data.leagues.find((l: any) => l.queueType === primaryQueue);
          let usedSecondary = false;

          // If primary queue rank not found, try finding secondary
          if (!league) {
              league = data.leagues.find((l: any) => l.queueType === secondaryQueue);
              if (league) {
                  usedSecondary = true;
              }
          }

          if (league) {
              setLiveLeagueInfo(league);
              
              // Tự động lưu vào DB luôn
              const updateBody = {
                  ingame_name: data.gameName ? `${data.gameName}#${data.tagLine}` : nameToCheck,
                  current_rank: `${league.tier} ${league.rank}`,
                  current_lp: league.leaguePoints
              };

              // Gọi API update details (tái sử dụng logic update)
              await fetch(`/api/orders/${order._id}/details`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateBody) });
              
              if (usedSecondary) {
                  toast.warning(`Không tìm thấy rank cho chế độ đã chọn. Đã cập nhật theo rank ${league.queueType === 'RANKED_SOLO_5x5' ? 'Đơn/Đôi' : 'Linh Hoạt'}.`);
              } else {
                  toast.success(`Đã cập nhật & Lưu: ${league.tier} ${league.rank} - ${league.leaguePoints} LP`);
              }
              
              // Cập nhật UI local (để hiển thị ngay lập tức)
              setOrder((prev: any) => ({ 
                  ...prev, 
                  details: { ...prev.details, ...updateBody } 
              }));
              
              // Nếu là Booster đang nhập, update luôn state input cho khớp
              if (data.gameName) setIngameName(`${data.gameName}#${data.tagLine}`);

          } else {
              toast.error('Chưa có thông tin Rank cho chế độ này');
          }
      } catch (e: any) { toast.error(e.message || 'Lỗi kiểm tra'); }
      finally { setIsCheckingRank(false); }
  };

  const handleFetchRiotMatch = async () => {
      if (!riotMatchId.trim()) return toast.error('Vui lòng nhập ID trận đấu (VD: VN2_123456)');
      setIsFetchingRiot(true);
      try {
          const res = await fetch('/api/riot/match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  matchId: riotMatchId.trim(),
                  server: order.details.server, // Gửi server để API tự thêm prefix (VN2, KR...)
                  targetName: order.details.ingame_name || order.details.account_username // Gửi tên để tìm PUUID
              })
          });
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.error);
          
          const participant = data.participant;
          const leagueInfo = data.leagueInfo;
          setFetchedMatchData(data.match); // Lưu lại full data để gửi khi save
          
          if (participant) {
              let calculatedLpChange = '';
              
              // Tự động tính LP Change nếu có dữ liệu League
              if (leagueInfo) {
                  const currentLpInOrder = parseInt(order.details.current_lp || '0');
                  const realLp = leagueInfo.leaguePoints;
                  const diff = realLp - currentLpInOrder;
                  
                  setLiveLeagueInfo(leagueInfo); // Lưu lại để gửi khi submit
                  
                  // Chỉ điền nếu chênh lệch hợp lý (tránh trường hợp mới lên hạng/rớt hạng làm âm quá lớn)
                  if (Math.abs(diff) < 100) {
                      calculatedLpChange = diff.toString();
                  }
                  toast.info(`Rank hiện tại: ${leagueInfo.tier} ${leagueInfo.rank} - ${realLp} LP`);
              }

              setMatchForm(prev => ({
                  ...prev,
                  champion: participant.championName,
                  result: participant.win ? 'WIN' : 'LOSS',
                  lp_change: calculatedLpChange,
                  reason: `KDA: ${participant.kills}/${participant.deaths}/${participant.assists}`
              }));
              toast.success('Đã lấy thông tin trận đấu!');
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
      const styles: Record<string, string> = {
          COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]',
          IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] animate-pulse',
          APPROVED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          DISPUTED: 'bg-red-500/10 text-red-400 border-red-500/20',
          PAID: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
      const style = styles[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700';

      if (status === 'PAID') {
        const hasBooster = !!order?.boosterId;
        return (
          <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase border tracking-wider bg-amber-500/10 text-amber-400 border-amber-500/30 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
            {hasBooster ? 'ĐANG CHỜ BOOSTER' : 'ĐANG CHỜ TUYỂN THỦ'}
          </span>
        );
      }
      
      return (
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border tracking-wider ${style}`}>
              {status === 'COMPLETED' ? 'HOÀN THÀNH' : status.replace('_', ' ')}
          </span>
      );
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 pt-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-24 px-4 flex flex-col items-center justify-center gap-4 text-center">
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

  // Tách riêng các tùy chọn phức tạp (Mảng) và đơn giản (Boolean)
  const scheduleOption = activeOptions.find(([k]) => k === 'schedule');
  const rolesOption = activeOptions.find(([k]) => k === 'roles' || k === 'specificRole');
  
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
  const isDisputeExpired =
    isCustomer &&
    order.status === 'COMPLETED' &&
    completedTimeMs !== null &&
    Date.now() - completedTimeMs > TWENTY_FOUR_HOURS_MS;

  const isRatingExpired = order.status === 'COMPLETED' && (new Date().getTime() - new Date(order.updatedAt).getTime() > SEVEN_DAYS_MS);
  const canRate = isCustomer && order.status === 'COMPLETED' && !order.rating && !isRatingExpired;

  const simpleOptions = activeOptions.filter(([k, v]) => {
      if (k === 'schedule' && Array.isArray(v)) return false; // Nếu là mảng lịch -> ẩn khỏi list đơn giản
      if ((k === 'roles' || k === 'specificRole') && Array.isArray(v)) return false; // Nếu là mảng roles -> ẩn khỏi list đơn giản
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
    <div className="min-h-screen bg-zinc-950 text-white font-sans pt-24 pb-10 px-4">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-6">
          <Link 
            href={user?.role === 'BOOSTER' ? '/booster/my-orders' : user?.role === 'ADMIN' ? '/admin/orders' : '/orders'}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
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
                    const serviceName = formatServiceName(order.serviceType || order.snapshot?.serviceSlug);

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
                                <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1.5">
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
                    {isBooster && order.status === 'IN_PROGRESS' && order.serviceType !== 'NET_WINS' && (
                        <button onClick={() => handleUpdateStatus('COMPLETED')} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
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
                            <div className="space-y-1.5">
                                <button onClick={() => setIsDisputeModalOpen(true)} className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/20">
                                    <AlertTriangle className="w-4 h-4" /> Báo lỗi / Có vấn đề
                                </button>
                                {isCustomer && order.status === 'COMPLETED' && disputeDeadline && (
                                    <p className="text-[11px] text-zinc-500 text-center">
                                        Chỉ được khiếu nại trong vòng 24h kể từ khi hoàn thành (đến {disputeDeadline.toLocaleString('vi-VN')}). Sau 24h tiền sẽ hoàn toàn thuộc về Booster.
                                    </p>
                                )}
                            </div>
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
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

                                        {/* Rank Progression Display */}
                                        <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <span className="text-xs text-zinc-500 block mb-1">Tiến độ rank mục tiêu:</span>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xl sm:text-2xl font-black text-white">
                                                        {liveLeagueInfo ? `${liveLeagueInfo.tier} ${liveLeagueInfo.rank}` : (order.details?.current_rank || 'Khởi điểm')}
                                                    </span>
                                                    {order.details?.desired_rank && (
                                                        <>
                                                            <span className="text-blue-400 font-bold text-lg">&rarr;</span>
                                                            <span className="text-xl sm:text-2xl font-black text-cyan-300">
                                                                {order.details.desired_rank}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs text-blue-400 font-bold mt-1">
                                                    {liveLeagueInfo ? `${liveLeagueInfo.leaguePoints} LP` : order.details?.current_lp ? `${order.details.current_lp} LP` : order.details?.steps_count ? `${order.details.steps_count} Bậc Rank` : ''}
                                                </div>
                                            </div>

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
                                                    * Nhập tên ingame chính xác để hệ thống tự động lấy Rank và LP từ Riot.
                                                </p>
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
                                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                                        order.boosterId.booster_info.isReady
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
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Loại dịch vụ:</span>
                                        <span className="text-white font-medium">{order.serviceType.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Mục tiêu:</span>
                                        <span className="text-blue-400 font-bold text-right">
                                            {(() => {
                                                if (order.serviceType === 'NET_WINS') {
                                                    return order.details.calc_mode === 'BY_GAMES' 
                                                        ? `+${order.details.num_games} Trận thắng (${order.details.current_rank || order.details.rank})`
                                                        : `${order.details.start_lp ?? order.details.current_lp} LP ➜ ${order.details.target_lp} LP (${order.details.current_rank || order.details.rank})`;
                                                }
                                                if (order.serviceType === 'PLACEMENTS') {
                                                    return `${order.details.num_games} Trận (Rank cũ: ${order.details.prev_rank})`;
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
                                                return `${order.details.current_rank || order.details.current_level} ➜ ${order.details.desired_rank || order.details.desired_level}`;
                                            })()}
                                        </span>
                                    </div>
                                    {/* Extra Options */}
                                    {activeOptions.length > 0 && (
                                        <div className="pt-3 border-t border-zinc-800">
                                            <span className="text-zinc-500 block mb-2 text-xs font-bold uppercase tracking-wider">Tùy chọn thêm:</span>
                                            
                                            <div className="space-y-3">
                                                {/* 1. Các tùy chọn đơn giản (Badges) */}
                                                {simpleOptions.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {simpleOptions.map(([key, val]) => (
                                                            <span key={key} className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 font-medium">
                                                                {optionLabels[key] || key}
                                                                {Array.isArray(val) && typeof val[0] !== 'object' ? `: ${val.join(', ')}` : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 2. Vị trí (Roles Block) */}
                                                {rolesOption && (
                                                    <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                                                        <span className="text-zinc-400 text-xs block mb-2 flex items-center gap-1.5 font-medium">
                                                            <Crosshair size={12} className="text-blue-400" /> Tùy chọn vị trí / đường:
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(Array.isArray(rolesOption[1]) ? rolesOption[1] : [rolesOption[1]]).map((role: any) => (
                                                                <span key={String(role)} className="text-xs font-bold px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-300">
                                                                    {String(role)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 3. Lịch cấm (Schedule Block) */}
                                                {scheduleOption && Array.isArray(scheduleOption[1]) && scheduleOption[1].length > 0 && (
                                                    <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                                                        <span className="text-red-400 text-xs block mb-2 flex items-center gap-1.5 font-medium">
                                                            <Clock size={12} /> Khung giờ nghỉ (Cấm chơi):
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {scheduleOption[1].map((w: any, idx: number) => (
                                                                <span key={idx} className="text-xs font-bold px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md flex items-center gap-1.5">
                                                                    {w.start} - {w.end}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">{isBooster ? 'Giá trị đơn hàng nhận được:' : 'Tổng thanh toán:'}</span>
                                        <span className="text-white font-bold">
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
                                            <span className="text-yellow-400 font-bold">{order.pricing.deposit_amount.toLocaleString()} đ</span>
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
                                                                     tx.metadata?.description || tx.type}
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
                                        <div className="flex items-center gap-2 text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={18} className={i < order.rating.stars ? "fill-current" : "text-zinc-700"} />
                                            ))}
                                            <span className="text-white font-bold ml-2">
                                                {order.rating.stars === 5 ? 'Tuyệt vời' : order.rating.stars === 4 ? 'Rất tốt' : order.rating.stars === 3 ? 'Bình thường' : order.rating.stars === 2 ? 'Tệ' : 'Rất tệ'}
                                            </span>
                                        </div>
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
                                                    {/* Eye Button */}
                                                    {match.detail ? (
                                                        <button 
                                                            onClick={() => setSelectedMatchDetail(match.detail)} 
                                                            className="p-2 bg-zinc-900 hover:bg-blue-600 hover:text-white text-blue-400 rounded-lg transition-colors border border-zinc-800" 
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    ) : (
                                                        <div className="p-2 text-zinc-700 border border-zinc-800 rounded-lg cursor-not-allowed">
                                                            <Eye size={16} />
                                                        </div>
                                                    )}

                                                    {/* Edit/Delete Buttons (Booster Only) */}
                                                    {isBooster && order.status === 'IN_PROGRESS' && (
                                                        <>
                                                            <button onClick={() => handleEditMatch(match)} className="p-2 bg-zinc-900 hover:bg-yellow-600 hover:text-white text-zinc-400 rounded-lg transition-colors border border-zinc-800" title="Sửa">
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button onClick={() => handleDeleteMatch(match._id)} className="p-2 bg-zinc-900 hover:bg-red-600 hover:text-white text-zinc-400 rounded-lg transition-colors border border-zinc-800" title="Xóa">
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
                            {isBooster && order.status === 'IN_PROGRESS' && (
                                <button 
                                    onClick={() => {
                                        setMatchForm({ mode: 'Rank Đơn/Đôi', champion: '', result: 'WIN', lp_change: '', reason: '' });
                                        setEditingMatchId(null);
                                        setIsMatchModalOpen(true);
                                    }}
                                    className="w-full py-3 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:text-white hover:border-zinc-600 hover:bg-zinc-900 transition-all flex items-center justify-center gap-2 font-bold"
                                >
                                    <Plus className="w-5 h-5" /> Thêm trận đấu mới
                                </button>
                            )}
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
                          <span className="text-lg shrink-0">{getServerByCode(editAccountForm.server)?.flag}</span>
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
        <DialogContent className="sm:max-w-[440px] bg-zinc-950 border border-white/10 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
                statusModal.targetStatus === 'IN_PROGRESS'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/10'
                  : statusModal.targetStatus === 'COMPLETED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/10'
              }`}
            >
              {statusModal.targetStatus === 'IN_PROGRESS' ? (
                <Play className="w-7 h-7 fill-blue-400/20" />
              ) : statusModal.targetStatus === 'COMPLETED' ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>

            <DialogTitle className="text-lg font-bold text-white">
              {statusModal.targetStatus === 'IN_PROGRESS'
                ? 'Xác nhận Bắt đầu cày'
                : statusModal.targetStatus === 'COMPLETED'
                ? 'Xác nhận Báo cáo hoàn thành'
                : 'Xác nhận thay đổi trạng thái'}
            </DialogTitle>

            <DialogDescription className="text-xs text-zinc-400 leading-relaxed max-w-[340px]">
              {statusModal.targetStatus === 'IN_PROGRESS'
                ? 'Sau khi bắt đầu cày, trạng thái đơn sẽ chuyển sang "Đang thực hiện". Khách hàng sẽ nhận được thông báo để theo dõi tiến độ.'
                : statusModal.targetStatus === 'COMPLETED'
                ? 'Bạn xác nhận đã đạt mục tiêu đơn hàng. Đơn sẽ chuyển sang trạng thái "Hoàn thành" để tiến hành nghiệm thu và quyết toán.'
                : `Bạn có chắc chắn muốn chuyển trạng thái đơn hàng sang "${statusModal.targetStatus}"?`}
            </DialogDescription>
          </DialogHeader>

          {/* Chi tiết đơn tóm tắt */}
          {order && (
            <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-3.5 space-y-2 my-2 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-white">
                  #{order.orderCode || order._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Dịch vụ:</span>
                <span className="font-semibold text-blue-300">
                  {order.snapshot?.gameCode || 'Game'} • {order.serviceType}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Trạng thái mới:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    statusModal.targetStatus === 'IN_PROGRESS'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : statusModal.targetStatus === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {statusModal.targetStatus === 'IN_PROGRESS'
                    ? 'Đang thực hiện'
                    : statusModal.targetStatus === 'COMPLETED'
                    ? 'Hoàn thành'
                    : statusModal.targetStatus}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 sm:space-x-0">
            <button
              type="button"
              disabled={statusModal.loading}
              onClick={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={statusModal.loading}
              onClick={executeStatusUpdate}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                statusModal.targetStatus === 'IN_PROGRESS'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
                  : statusModal.targetStatus === 'COMPLETED'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
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
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Bắt đầu ngay</span>
                </>
              ) : statusModal.targetStatus === 'COMPLETED' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác nhận hoàn thành</span>
                </>
              ) : (
                <span>Đồng ý</span>
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
                    <button onClick={handleCancelEdit} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                </div>
                
                {/* Riot Match Fetcher (Only for new matches) */}
                {!editingMatchId && (
                    <div className="flex flex-col sm:flex-row gap-2 mb-6">
                        <input type="text" placeholder="Nhập Match ID (VD: 123456 hoặc VN2_123456)" className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono" value={riotMatchId} onChange={e => setRiotMatchId(e.target.value)} />
                        <button onClick={handleFetchRiotMatch} disabled={isFetchingRiot} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto">
                            {isFetchingRiot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Lấy Info
                        </button>
                    </div>
                )}

                <form onSubmit={handleSaveMatch} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Tướng (VD: Lee Sin)" className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white" value={matchForm.champion} onChange={e => setMatchForm({...matchForm, champion: e.target.value})} required />
                        <select className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white" value={matchForm.result} onChange={e => setMatchForm({...matchForm, result: e.target.value})}>
                            <option value="WIN">Thắng (Win)</option>
                            <option value="LOSS">Thua (Loss)</option>
                        </select>
                    </div>
                    <input type="number" placeholder="Điểm (+/- LP)" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white" value={matchForm.lp_change} onChange={e => setMatchForm({...matchForm, lp_change: e.target.value})} required />
                    <input type="text" placeholder="Ghi chú (Tùy chọn)" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white" value={matchForm.reason} onChange={e => setMatchForm({...matchForm, reason: e.target.value})} />
                    
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
                    <button onClick={() => setSelectedMatchDetail(null)} className="text-zinc-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="overflow-y-auto p-4 md:p-6 space-y-6">
                    {(() => {
                        const teams = calculateTeamStats(selectedMatchDetail.info.participants);
                        const blueTeam = selectedMatchDetail.info.participants.filter((p: any) => p.teamId === 100);
                        const redTeam = selectedMatchDetail.info.participants.filter((p: any) => p.teamId === 200);
                        
                        // Xác định tên người chơi để highlight (dựa trên Ingame hoặc Account)
                        const targetName = (order.details.ingame_name || order.details.account_username || '').toLowerCase().replace(/\s/g, '').replace('#', '');

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
                                        {teams[teamId].kills} / <span className="text-red-400">{teams[teamId].deaths}</span> / {teams[teamId].assists}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {players.map((p: any, idx: number) => {
                                        // Logic so sánh tên để tìm "Tôi"
                                        const pName = (p.riotIdGameName || p.summonerName || '').toLowerCase().replace(/\s/g, '');
                                        const pTag = (p.riotIdTagline || '').toLowerCase();
                                        const fullName = pName + pTag;
                                        const isMe = targetName && (fullName.includes(targetName) || targetName.includes(pName));

                                        return (
                                        <div key={idx} className={`flex gap-3 p-3 rounded-xl border transition-colors ${isMe ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900'}`}>
                                            {/* Left: Avatar (Big) */}
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

                                            {/* Right: Info Column */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                                                {/* Top Row: Name & KDA */}
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

                                                {/* Bottom Row: Items */}
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
                                    )})}
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
                    })()}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
