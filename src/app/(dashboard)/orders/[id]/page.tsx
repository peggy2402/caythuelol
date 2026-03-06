'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { Shield, Loader2, Swords, CheckCircle2, Wallet, Star, Flag, ChevronUp, ChevronDown, AlertTriangle, X } from 'lucide-react';
import ChatWindow from '@/components/chat/ChatWindow';

interface OrderDetails {
  _id: string;
  status: string;
  serviceType: string;
  details: {
    current_rank: string;
    desired_rank: string;
    server: string;
    account_username: string;
    [key: string]: any;
  };
  pricing: {
    total_amount: number;
    deposit_amount?: number;
    final_amount?: number;
    settlement_status?: 'PENDING' | 'CUSTOMER_OWES' | 'REFUND_NEEDED' | 'SETTLED';
  };
  payment?: {
    deposit_paid: boolean;
  };
  createdAt: string;
  // New fields
  match_history?: Array<{
    match_id?: string;
    mode: string;
    champion: string;
    result: 'WIN' | 'LOSS';
    lp_change: number;
    reason?: string;
  }>;
  rating?: {
    stars: number;
    comment?: string;
  };
  dispute?: any;
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Unwrap params (Next.js 15/14 pattern)
  const { t } = useLanguage();
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  

  // Booster Complete Modal State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [actualResultInput, setActualResultInput] = useState('');

  // Rating Modal
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Dispute Modal
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Lấy thông tin user hiện tại từ localStorage (để xác định tin nhắn của mình)
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  // Fetch Order & Messages
  const fetchData = async () => {
    try {

      // 2. Fetch Order Details (Tạm thời dùng API list và filter vì chưa có API get single order)
      // Trong thực tế bạn nên tạo thêm API GET /api/orders/[id]
      const orderRes = await fetch('/api/orders'); 
      const orderData = await orderRes.json();
      if (orderRes.ok) {
        // Tìm đơn hàng trong danh sách trả về (Available hoặc MyOrders)
        const allOrders = [...(orderData.orders || []), ...(orderData.availableOrders || []), ...(orderData.myOrders || [])];
        const found = allOrders.find((o: any) => o._id === id);
        if (found) setOrder(found);
      }

    } catch (error) {
      console.error(error);
      toast.error(t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [id]);


  const handlePayRemaining = async () => {
    if (!confirm('Xác nhận thanh toán phần còn thiếu?')) return;
    setLoading(true);
    try {
        const res = await fetch(`/api/orders/${id}/pay-remaining`, {
            method: 'POST'
        });
        const data = await res.json();
        if (res.ok) {
            toast.success('Thanh toán thành công!');
            fetchData();
        } else {
            toast.error(data.error || 'Thanh toán thất bại');
        }
    } catch (e) { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  };

  const handleCompleteOrder = async () => {
    if (!actualResultInput) return toast.error('Vui lòng nhập kết quả thực tế');
    if (!confirm('Xác nhận hoàn thành đơn hàng? Hành động này không thể hoàn tác.')) return;

    setLoading(true);
    try {
        const resultValue = parseInt(actualResultInput);
        const payload = order?.details.calc_mode === 'BY_LP' 
            ? { lpGained: resultValue } 
            : { gamesWon: resultValue };

        const res = await fetch(`/api/orders/${id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actualResult: payload }),
        });
        const data = await res.json();
        if (res.ok) {
            toast.success('Đã hoàn thành đơn hàng!');
            setIsCompleteModalOpen(false);
            fetchData();
        } else {
            toast.error(data.error || 'Thao tác thất bại');
        }
    } catch (e) { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  };

  const handleRateOrder = async () => {
    setLoading(true);
    try {
        const res = await fetch(`/api/orders/${id}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stars: ratingStars, comment: ratingComment }),
        });
        if (res.ok) {
            toast.success('Đánh giá thành công!');
            setIsRatingModalOpen(false);
            fetchData();
        } else toast.error('Lỗi đánh giá');
    } catch (e) { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  };

  const handleDispute = async () => {
    if (!disputeReason) return toast.error('Vui lòng nhập lý do khiếu nại');
    setLoading(true);
    try {
        const res = await fetch(`/api/orders/${id}/dispute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: disputeReason }),
        });
        if (res.ok) {
            toast.success('Đã gửi khiếu nại. Admin sẽ xem xét.');
            setIsDisputeModalOpen(false);
            fetchData();
        } else toast.error('Lỗi gửi khiếu nại');
    } catch (e) { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (!order) return <div className="text-center py-20 text-zinc-500">Order not found</div>;

  const isBooster = currentUser?.role === 'BOOSTER';
  const chatTitle = isBooster ? 'Trao đổi với Khách hàng' : t('chatTitle');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative pb-20">
      {/* Left Column: Order Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              {t('orderDetails')} <span className="text-zinc-500 text-sm font-normal">#{order._id.slice(-6).toUpperCase()}</span>
            </h2>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm"
            >
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDetails ? 'Thu gọn' : 'Xem thêm'}
            </button>
          </div>
          
          {/* Basic Info (Always Visible) */}
          <div className="space-y-3 mb-4">
             <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Trạng thái:</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                  order.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {order.status}
                </span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Tiến độ:</span>
                <span className="text-white font-medium text-sm">
                    {order.details.current_rank || order.details.current_level || 'N/A'} 
                    {' ➔ '} 
                    {order.details.desired_rank || order.details.desired_level || 'N/A'}
                </span>
             </div>

             {/* Booster Action: Complete Order */}
             {isBooster && order.status === 'IN_PROGRESS' && (
                <button 
                    onClick={() => setIsCompleteModalOpen(true)}
                    className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <CheckCircle2 className="w-4 h-4" /> Hoàn thành đơn
                </button>
             )}

             {/* Customer Actions: Rate & Dispute */}
             {!isBooster && order.status === 'COMPLETED' && !order.rating && (
                <button onClick={() => setIsRatingModalOpen(true)} className="w-full mt-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <Star className="w-4 h-4" /> Đánh giá Booster
                </button>
             )}
             
             {!isBooster && (order.status === 'COMPLETED' || order.status === 'IN_PROGRESS') && !order.dispute && (
                <button onClick={() => setIsDisputeModalOpen(true)} className="w-full mt-2 py-2 text-zinc-500 hover:text-red-400 text-xs flex items-center justify-center gap-1 transition-colors">
                    <Flag className="w-3 h-3" /> Khiếu nại đơn hàng
                </button>
             )}
             {order.dispute && (
                <div className="mt-2 text-center text-xs text-red-400 font-bold border border-red-500/20 bg-red-500/10 p-2 rounded">Đang có khiếu nại: {order.dispute.status}</div>
             )}
          </div>

          {/* Detailed Info (Collapsible) */}
          {showDetails && (
            <div className="space-y-3 pt-4 border-t border-zinc-800 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500 text-xs">Mã đơn:</span>
                    <span className="text-zinc-300 text-xs font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500 text-xs">Dịch vụ:</span>
                    <span className="text-blue-400 text-xs font-bold">{order.serviceType}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500 text-xs">Server:</span>
                    <span className="text-zinc-300 text-xs">{order.details.server}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500 text-xs">Tài khoản Game:</span>
                    <span className="text-zinc-300 text-xs font-mono">{order.details.account_username}</span>
                </div>
                
                <div className="bg-zinc-950 p-3 rounded-lg mt-2 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Tổng tiền:</span>
                        <span className="text-white font-bold">{order.pricing.total_amount.toLocaleString()} đ</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Đã cọc:</span>
                        <span className="text-green-400 font-bold">{order.pricing.deposit_amount?.toLocaleString() || 0} đ</span>
                    </div>
                </div>
            </div>
          )}

          {/* Settlement Status (For Net Wins) */}
          {order.pricing.settlement_status && order.pricing.settlement_status !== 'PENDING' && (
            <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-yellow-500" /> Quyết toán đơn hàng
                </h3>
                
                {order.pricing.settlement_status === 'CUSTOMER_OWES' && (
                    <div className="space-y-3">
                        <div className="text-sm text-zinc-400">
                            Bạn cần thanh toán thêm: <span className="text-red-400 font-bold">{(order.pricing.final_amount! - (order.pricing.deposit_amount || 0)).toLocaleString()} đ</span>
                        </div>
                        {!isBooster && (
                            <button 
                                onClick={handlePayRemaining}
                                className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm transition-colors"
                            >
                                Thanh toán ngay
                            </button>
                        )}
                    </div>
                )}

                {order.pricing.settlement_status === 'REFUND_NEEDED' && (
                    <div className="text-sm text-zinc-400">
                        Bạn sẽ được hoàn lại: <span className="text-green-400 font-bold">{((order.pricing.deposit_amount || 0) - order.pricing.final_amount!).toLocaleString()} đ</span>
                        <p className="text-xs text-zinc-500 mt-1">Hệ thống sẽ xử lý hoàn tiền trong 24h.</p>
                    </div>
                )}

                {order.pricing.settlement_status === 'SETTLED' && (
                    <div className="text-sm text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Đơn hàng đã quyết toán xong.
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Match History Tracking (New Feature) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Swords className="w-5 h-5 text-red-500" />
                Tiến độ trận đấu
            </h2>
            
            {order.match_history && order.match_history.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50">
                            <tr>
                                <th className="px-3 py-2">Tướng</th>
                                <th className="px-3 py-2">Kết quả</th>
                                <th className="px-3 py-2">LP</th>
                                <th className="px-3 py-2">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {order.match_history.map((match, idx) => (
                                <tr key={idx} className="hover:bg-zinc-800/30">
                                    <td className="px-3 py-2 font-medium text-white">{match.champion}</td>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            match.result === 'WIN' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {match.result}
                                        </span>
                                    </td>
                                    <td className={`px-3 py-2 font-bold ${match.lp_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {match.lp_change > 0 ? '+' : ''}{match.lp_change}
                                    </td>
                                    <td className="px-3 py-2 text-zinc-500 text-xs truncate max-w-[100px]" title={match.reason}>
                                        {match.reason || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
                    Chưa có trận đấu nào được cập nhật.
                </div>
            )}
        </div>
      </div>

      {/* Floating Chat Window */}
      <ChatWindow 
        orderId={id} 
        currentUser={currentUser} 
        title={chatTitle} 
      />

      {/* Complete Order Modal */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Xác nhận kết quả</h3>
                    <button onClick={() => setIsCompleteModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            {order.details.calc_mode === 'BY_LP' ? 'Tổng số LP đã cày được:' : 'Tổng số trận đã thắng:'}
                        </label>
                        <input 
                            type="number" 
                            value={actualResultInput}
                            onChange={(e) => setActualResultInput(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                            placeholder={order.details.calc_mode === 'BY_LP' ? 'VD: 85' : 'VD: 5'}
                            autoFocus
                        />
                    </div>
                    
                    <button onClick={handleCompleteOrder} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors">
                        Xác nhận hoàn thành
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Rating Modal */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-white mb-4">Đánh giá dịch vụ</h3>
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setRatingStars(star)} className="focus:outline-none transition-transform hover:scale-110">
                            <Star className={`w-8 h-8 ${star <= ratingStars ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-600'}`} />
                        </button>
                    ))}
                </div>
                <textarea 
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm mb-4 focus:border-yellow-500 outline-none"
                    placeholder="Nhập nhận xét của bạn..."
                    rows={3}
                />
                <div className="flex gap-3">
                    <button onClick={() => setIsRatingModalOpen(false)} className="flex-1 py-2 bg-zinc-800 text-white rounded-lg">Hủy</button>
                    <button onClick={handleRateOrder} className="flex-1 py-2 bg-yellow-600 text-black font-bold rounded-lg">Gửi đánh giá</button>
                </div>
            </div>
        </div>
      )}

      {/* Dispute Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Khiếu nại đơn hàng</h3>
                <p className="text-zinc-400 text-sm mb-4">Hãy mô tả chi tiết vấn đề. Admin sẽ vào cuộc để giải quyết.</p>
                
                <textarea 
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm mb-4 focus:border-red-500 outline-none"
                    placeholder="Lý do khiếu nại (VD: Booster thái độ, không hoàn thành đúng hạn...)"
                    rows={4}
                />
                
                <div className="flex gap-3">
                    <button onClick={() => setIsDisputeModalOpen(false)} className="flex-1 py-2 bg-zinc-800 text-white rounded-lg">Hủy</button>
                    <button onClick={handleDispute} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg">Gửi khiếu nại</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
