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
  Play, CheckSquare, Lock, Flag, Swords, Trophy, Save, Crosshair, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import ChatWindow from '@/components/chat/ChatWindow';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleAddMatch = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch(`/api/orders/${id}/matches`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(matchForm)
          });
          if (res.ok) {
              toast.success('Đã cập nhật trận đấu');
              const data = await res.json();
              setOrder((prev: any) => ({ ...prev, match_history: data.match_history }));
              setMatchForm({ mode: 'Rank Đơn', champion: '', result: 'WIN', lp_change: '', reason: '' });
              toast.success('Đã thêm trận đấu mới');
              
              // Real-time broadcast
              socket.emit('update_order', { room: id, data: { match_history: data.match_history } });
          }
      } catch (e) { toast.error('Lỗi cập nhật'); }
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
                        <div className="flex gap-2">
                            <button onClick={handleConfirmCompletion} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <CheckCircle2 className="w-4 h-4" /> Xác nhận hoàn thành
                            </button>
                            <button onClick={() => setIsDisputeModalOpen(true)} className="px-4 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
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
                            {/* Ingame Name Update (For Booster in Progress) */}
                            {isBooster && order.status === 'IN_PROGRESS' && (
                                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-blue-400 uppercase mb-1 block">Cập nhật Tên Ingame</label>
                                        <input 
                                            type="text" 
                                            value={ingameName}
                                            onChange={(e) => setIngameName(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                            placeholder="Nhập tên nhân vật trong game..."
                                        />
                                    </div>
                                    <button 
                                        onClick={handleUpdateIngame} 
                                        disabled={isUpdatingIngame}
                                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUpdatingIngame ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    </button>
                                </div>
                            )}

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
                                    <div>
                                        <span className="text-xs text-zinc-500 block">Ingame (Nếu có)</span>
                                        <span className="text-white font-medium text-blue-300">{order.details.ingame_name || 'Chưa cập nhật'}</span>
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
                                            className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${match.result === 'WIN' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'}`}>
                                                    <img 
                                                        src={match.result === 'WIN' ? '/images/victory.png' : '/images/defeat.png'} 
                                                        alt={match.result} 
                                                        className="w-300 h-300 object-contain"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{match.champion} <span className="text-zinc-500 font-normal">({match.mode})</span></div>
                                                    <div className="text-xs text-zinc-500">{new Date(match.timestamp).toLocaleString('vi-VN')}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold ${match.lp_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {match.lp_change > 0 ? '+' : ''}{match.lp_change} LP
                                                </div>
                                                {match.reason && <div className="text-xs text-zinc-500">{match.reason}</div>}
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
                                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                    <h4 className="font-bold text-white mb-3 flex items-center gap-2"><Swords className="w-4 h-4" /> Cập nhật trận đấu</h4>
                                    <form onSubmit={handleAddMatch} className="grid grid-cols-2 gap-3">
                                        <input type="text" placeholder="Tướng (VD: Lee Sin)" className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" value={matchForm.champion} onChange={e => setMatchForm({...matchForm, champion: e.target.value})} required />
                                        <select className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" value={matchForm.result} onChange={e => setMatchForm({...matchForm, result: e.target.value})}>
                                            <option value="WIN">Thắng (Win)</option>
                                            <option value="LOSS">Thua (Loss)</option>
                                        </select>
                                        <input type="number" placeholder="Điểm (+/- LP)" className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" value={matchForm.lp_change} onChange={e => setMatchForm({...matchForm, lp_change: e.target.value})} required />
                                        <input type="text" placeholder="Ghi chú (Tùy chọn)" className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" value={matchForm.reason} onChange={e => setMatchForm({...matchForm, reason: e.target.value})} />
                                        <button type="submit" className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors">Thêm trận đấu</button>
                                    </form>
                                </div>
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
    </div>
  );
}
