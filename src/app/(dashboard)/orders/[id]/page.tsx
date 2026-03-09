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
  Play, CheckSquare, Lock, Flag, Swords, Trophy, Save, Crosshair, ArrowLeft, Search, RefreshCw
} from 'lucide-react';
import { Pencil, Trash2, X, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ChatWindow from '@/components/chat/ChatWindow';
import { motion, AnimatePresence } from 'framer-motion';

const DDRAGON_VER = '16.5.1'; // Phiên bản DDragon mới nhất (có thể cập nhật động nếu cần)

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const router = useRouter();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'INFO' | 'PROGRESS'>('INFO');
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [ingameName, setIngameName] = useState('');
  const [isUpdatingIngame, setIsUpdatingIngame] = useState(false);

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
        // Fetch Order Info
        fetch(`/api/orders/${id}`).then(res => res.json()).then(data => {
            if (data.success) {
                setOrder((prev: any) => ({ ...prev, ...data.order }));
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

  // Fetch Order & Messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderRes = await fetch(`/api/orders/${id}`);

        if (!orderRes.ok) throw new Error('Failed to load order');
        
        const orderData = await orderRes.json();

        setOrder(orderData.order);
        if (orderData.order?.details?.ingame_name) {
            setIngameName(orderData.order.details.ingame_name);
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

  // Socket.io Integration
  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit('join_order', id);

    const handleOrderUpdate = (updatedData: any) => {
        console.log('Socket Order Update:', updatedData);
        setOrder((prev: any) => ({ ...prev, ...updatedData }));
    };

    socket.on('order_updated', handleOrderUpdate);

    return () => {
      socket.off('order_updated', handleOrderUpdate);
      socket.emit('leave_order', id);
    };
  }, [id]);

  const handleUpdateStatus = (status: string) => {
    const executeUpdate = async () => {
        try {
            const endpoint = status === 'COMPLETED' 
                ? `/api/orders/${id}/complete` 
                : `/api/orders/${id}/status`;
                
            const method = status === 'COMPLETED' ? 'POST' : 'PATCH';
            const body = status === 'COMPLETED' ? {} : { status };

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success('Cập nhật trạng thái thành công');
                setOrder((prev: any) => ({ ...prev, status }));
                // Reload page to refresh data
                // window.location.reload(); // No need to reload if we use socket
                socket.emit('update_order', { room: id, data: { status } });
            } else {
                const err = await res.json();
                toast.error(err.error || 'Lỗi cập nhật');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        }
    };

    toast('Xác nhận thay đổi', {
        description: `Bạn có chắc chắn muốn chuyển trạng thái thành ${status}?`,
        action: { label: 'Đồng ý', onClick: executeUpdate },
        cancel: { label: 'Hủy', onClick: () => {} }
    });
  };

  const processConfirmCompletion = async () => {
    try {
        const res = await fetch(`/api/orders/${id}/confirm`, { method: 'POST' });
        if (res.ok) {
            toast.success('Đã xác nhận hoàn thành!');
            // Cập nhật UI ngay lập tức: Ẩn nút, đổi trạng thái (nếu cần thiết kế riêng)
            // Tuy nhiên, logic backend confirm xong thường giữ status COMPLETED hoặc đổi sang SETTLED
            // Ở đây ta reload để đồng bộ dữ liệu mới nhất (ví dụ settlement_status)
            window.location.reload();
        }
    } catch (e) { toast.error('Lỗi kết nối'); }
  };

  const handleConfirmCompletion = () => {
      toast('🎉 Xác nhận hoàn thành đơn hàng?', {
          description: 'Bạn xác nhận đã nhận được kết quả như mong muốn? Tiền sẽ được giải ngân cho Booster ngay lập tức.',
          action: { label: 'Xác nhận & Trả tiền', onClick: processConfirmCompletion },
          cancel: { label: 'Hủy', onClick: () => {} }
      });
  };

  const handleDispute = async () => {
      if (!disputeReason.trim()) return toast.error('Vui lòng nhập lý do');
      try {
          const res = await fetch(`/api/orders/${id}/dispute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: disputeReason })
          });
          if (res.ok) { toast.success('Đã gửi khiếu nại'); window.location.reload(); }
          else { toast.error('Lỗi gửi khiếu nại'); }
      } catch (e) { toast.error('Lỗi kết nối'); }
  };

  const handlePayRemaining = async () => {
      if (!confirm('Thanh toán phần còn lại của đơn hàng?')) return;
      try {
          const res = await fetch(`/api/orders/${id}/pay-remaining`, { method: 'POST' });
          if (res.ok) {
              toast.success('Thanh toán thành công!');
              window.location.reload();
          } else {
              const err = await res.json();
              toast.error(err.error || 'Lỗi thanh toán');
          }
      } catch (e) {
          toast.error('Lỗi kết nối');
      }
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

          const res = await fetch(`/api/orders/${id}/matches`, {
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
              socket.emit('update_order', { room: id, data: { match_history: data.match_history, details: data.details } });
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
          const res = await fetch(`/api/orders/${id}/matches?matchId=${matchId}`, { method: 'DELETE' });
          if (res.ok) {
              const data = await res.json();
              setOrder((prev: any) => ({ ...prev, match_history: data.match_history }));
              toast.success('Đã xóa trận đấu');
              socket.emit('update_order', { room: id, data: { match_history: data.match_history } });
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
          const res = await fetch(`/api/orders/${id}/details`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ingame_name: ingameName })
          });
          if (res.ok) {
              const data = await res.json();
              toast.success('Cập nhật Ingame thành công');
              setOrder((prev: any) => ({ ...prev, details: data.details }));
              // Real-time broadcast
              socket.emit('update_order', { room: id, data: { details: data.details } });
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

          const queue = ['SOLO', 'SOLO_DUO'].includes(order.details.queueType) ? 'RANKED_SOLO_5x5' : 'RANKED_FLEX_SR';
          const league = data.leagues.find((l: any) => l.queueType === queue);

          if (league) {
              setLiveLeagueInfo(league);
              
              // Tự động lưu vào DB luôn
              const updateBody = {
                  ingame_name: data.gameName ? `${data.gameName}#${data.tagLine}` : nameToCheck,
                  current_rank: `${league.tier} ${league.rank}`,
                  current_lp: league.leaguePoints
              };

              // Gọi API update details (tái sử dụng logic update)
              await fetch(`/api/orders/${id}/details`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateBody) });
              
              toast.success(`Đã cập nhật & Lưu: ${league.tier} ${league.rank} - ${league.leaguePoints} LP`);
              
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
          PAID: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      };
      const style = styles[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
      
      return (
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border tracking-wider ${style}`}>
              {status === 'COMPLETED' ? 'HOÀN THÀNH' : status.replace('_', ' ')}
          </span>
      );
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 pt-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!order) return <div className="min-h-screen bg-zinc-950 pt-24 text-center text-zinc-500">Đơn hàng không tồn tại</div>;

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
  const rolesOption = activeOptions.find(([k]) => k === 'roles');
  
  const simpleOptions = activeOptions.filter(([k, v]) => {
      if (k === 'schedule' && Array.isArray(v)) return false; // Nếu là mảng lịch -> ẩn khỏi list đơn giản
      if (k === 'roles' && Array.isArray(v)) return false;    // Nếu là mảng roles -> ẩn khỏi list đơn giản
      return true;
  });

  const optionLabels: Record<string, string> = {
      express: 'Cày siêu tốc',
      duo: 'Chơi cùng Booster',
      streaming: 'Streaming',
      specificChamps: 'Tướng chỉ định',
      schedule: 'Đặt lịch',
      priority: 'Ưu tiên',
      roles: 'Vị trí'
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
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-zinc-500 text-xs font-mono">ORDER ID</span>
                            <span className="bg-zinc-800 text-white text-xs px-2 py-0.5 rounded font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            {order.serviceType.replace('_', ' ')}
                        </h2>
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                            <Clock size={12} /> {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </p>
                    </div>
                    <StatusBadge status={order.status} />
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-2">
                    {isBooster && order.status === 'APPROVED' && (
                        <button onClick={() => handleUpdateStatus('IN_PROGRESS')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <Play className="w-4 h-4" /> Bắt đầu cày
                        </button>
                    )}
                    {isBooster && order.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleUpdateStatus('COMPLETED')} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <CheckSquare className="w-4 h-4" /> Báo cáo hoàn thành
                        </button>
                    )}
                    {isCustomer && order.pricing.settlement_status === 'CUSTOMER_OWES' && (
                        <button onClick={handlePayRemaining} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <CreditCard className="w-4 h-4" /> Thanh toán phần còn lại
                        </button>
                    )}
                    {isCustomer && order.status === 'COMPLETED' && order.pricing.settlement_status !== 'SETTLED' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={handleConfirmCompletion} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <CheckCircle2 className="w-4 h-4" /> Xác nhận hoàn thành
                            </button>
                            <button onClick={() => setIsDisputeModalOpen(true)} className="w-full sm:w-auto px-4 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <Flag className="w-4 h-4" /> Khiếu nại
                            </button>
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
                            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl animate-in fade-in duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-yellow-500" /> Hồ sơ Game & Rank
                                    </h3>
                                    {/* Nút Refresh cho cả Customer và Booster (khi không nhập liệu) */}
                                    {order.details.ingame_name && (
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

                                {/* Info Display */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-black text-white">
                                                {liveLeagueInfo ? `${liveLeagueInfo.tier} ${liveLeagueInfo.rank}` : order.details.current_rank}
                                            </div>
                                            <div className="text-sm text-blue-400 font-bold">
                                                {liveLeagueInfo ? liveLeagueInfo.leaguePoints : order.details.current_lp} LP
                                            </div>
                                        </div>
                                        {liveLeagueInfo && (
                                            <div className="text-right text-xs text-zinc-400 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
                                                <div>Thắng: <span className="text-green-400 font-bold">{liveLeagueInfo.wins}</span></div>
                                                <div>Thua: <span className="text-red-400 font-bold">{liveLeagueInfo.losses}</span></div>
                                                <div>Tỉ lệ: <span className="text-white">{Math.round((liveLeagueInfo.wins / (liveLeagueInfo.wins + liveLeagueInfo.losses)) * 100)}%</span></div>
                                            </div>
                                        )}
                                    </div>

                                {/* Booster Input Area */}
                                {isBooster && ['IN_PROGRESS', 'APPROVED'].includes(order.status) && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800">
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
                                    <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                                        <span className="text-xs text-zinc-500">Ingame:</span>
                                        <span className="text-sm font-medium text-white font-mono">{order.details.ingame_name || 'Chưa cập nhật'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Account Info */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Tài khoản Game</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                                    <div>
                                        <span className="text-xs text-zinc-500 block">Tài khoản</span>
                                        <span className="font-mono text-white">{order.details.account_username}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-500 block">Mật khẩu</span>
                                        <span className="font-mono text-white flex items-center gap-2">
                                            {isBooster ? order.details.account_password : '••••••••'}
                                            {!isBooster && <Lock className="w-3 h-3 text-zinc-600" />}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-500 block">Server</span>
                                        <span className="text-white">{order.details.server}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-500 block">Chế độ</span>
                                        <span className="text-white">{['SOLO', 'SOLO_DUO'].includes(order.details.queueType) ? 'Đơn / Đôi' : order.details.queueType === 'FLEX' ? 'Linh Hoạt' : order.details.queueType || 'Mặc định'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Service Info */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2"><Trophy className="w-4 h-4" /> Dịch vụ</h3>
                                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Loại dịch vụ:</span>
                                        <span className="text-white font-medium">{order.serviceType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Mục tiêu:</span>
                                        <span className="text-blue-400 font-bold">
                                            {order.details.current_rank || order.details.current_level} ➜ {order.details.desired_rank || order.details.desired_level}
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
                                                {rolesOption && Array.isArray(rolesOption[1]) && rolesOption[1].length > 0 && (
                                                    <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                                                        <span className="text-zinc-500 text-xs block mb-2 flex items-center gap-1.5 font-medium">
                                                            <Crosshair size={12} /> Vị trí đi đường:
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {rolesOption[1].map((role: string) => (
                                                                <span key={role} className="text-xs font-bold px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
                                                                    {role}
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

                            {/* Payment Info */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Thanh toán</h3>
                                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Tổng giá trị:</span>
                                        <span className="text-white font-bold">{order.pricing.total_amount.toLocaleString()} đ</span>
                                    </div>
                                    {order.pricing.deposit_amount < order.pricing.total_amount ? (
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Đã cọc:</span>
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

      {/* Floating Chat Window */}
      <ChatWindow 
        orderId={id} 
        currentUser={user} 
        partner={partner} 
        trigger="side" 
      />

      {/* Dispute Modal */}
      {isDisputeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-6 h-6 text-red-500" /> Khiếu nại đơn hàng</h3>
                  <textarea 
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white mb-4 h-32" 
                      placeholder="Mô tả vấn đề của bạn..." 
                      value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
                  />
                  <div className="flex gap-3 justify-end">
                      <button onClick={() => setIsDisputeModalOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Hủy</button>
                      <button onClick={handleDispute} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold">Gửi khiếu nại</button>
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

                        const TeamBlock = ({ teamId, players, color, title }: any) => (
                            <div className="space-y-3">
                                <div className={`flex justify-between items-center pb-2 border-b ${color === 'blue' ? 'border-blue-500/30' : 'border-red-500/30'}`}>
                                    <span className={`font-bold ${color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>{title}</span>
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
                                                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/champion/${p.championName}.png`} 
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
                                                            {itemId > 0 && <img src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/item/${itemId}.png`} alt="Item" className="w-full h-full object-cover" />}
                                                        </div>
                                                    ))}
                                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-800 border overflow-hidden ml-1 shrink-0 ${isMe ? 'border-yellow-500/30' : 'border-zinc-700'}`}>
                                                        {p.item6 > 0 && <img src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/item/${p.item6}.png`} alt="Trinket" className="w-full h-full object-cover" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        );

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
